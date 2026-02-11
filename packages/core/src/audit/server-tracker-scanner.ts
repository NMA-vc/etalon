import { readFileSync } from 'node:fs';
import { relative, extname } from 'node:path';
import type { AuditFinding, StackInfo } from './types.js';

// ─── Tracker API Endpoints ─────────────────────────────────────────

interface TrackerEndpoint {
    pattern: RegExp;
    vendor: string;
    vendorId: string;
}

const TRACKER_ENDPOINTS: TrackerEndpoint[] = [
    { pattern: /https?:\/\/www\.google-analytics\.com\/collect/g, vendor: 'Google Analytics', vendorId: 'google-analytics' },
    { pattern: /https?:\/\/www\.google-analytics\.com\/g\/collect/g, vendor: 'Google Analytics 4', vendorId: 'google-analytics' },
    { pattern: /https?:\/\/graph\.facebook\.com\/[^'"`\s]*\/events/g, vendor: 'Facebook Conversions API', vendorId: 'facebook-pixel' },
    { pattern: /https?:\/\/api\.segment\.(io|com)/g, vendor: 'Segment', vendorId: 'segment' },
    { pattern: /https?:\/\/api\.mixpanel\.com/g, vendor: 'Mixpanel', vendorId: 'mixpanel' },
    { pattern: /https?:\/\/api2?\.amplitude\.com/g, vendor: 'Amplitude', vendorId: 'amplitude' },
    { pattern: /https?:\/\/analytics\.tiktok\.com/g, vendor: 'TikTok Pixel', vendorId: 'tiktok' },
    { pattern: /https?:\/\/tr\.snapchat\.com/g, vendor: 'Snapchat', vendorId: 'snapchat' },
    { pattern: /https?:\/\/ct\.pinterest\.com/g, vendor: 'Pinterest Tag', vendorId: 'pinterest' },
    { pattern: /https?:\/\/bat\.bing\.com/g, vendor: 'Microsoft UET', vendorId: 'bing' },
    { pattern: /https?:\/\/app\.posthog\.com\/capture/g, vendor: 'PostHog', vendorId: 'posthog' },
    { pattern: /https?:\/\/events\.launchdarkly\.com/g, vendor: 'LaunchDarkly', vendorId: 'launchdarkly' },
];

// Known tracker domains for HTTP client detection
const TRACKER_DOMAINS = [
    'google-analytics.com',
    'googletagmanager.com',
    'graph.facebook.com',
    'api.segment.io',
    'api.segment.com',
    'api.mixpanel.com',
    'api.amplitude.com',
    'api2.amplitude.com',
    'analytics.tiktok.com',
    'tr.snapchat.com',
    'ct.pinterest.com',
    'bat.bing.com',
    'app.posthog.com',
    'events.launchdarkly.com',
];

// File extensions to scan for server-side tracking
const SERVER_EXTENSIONS = new Set([
    '.js', '.ts', '.mjs', '.cjs',
    '.py',
    '.rs',
    '.rb',
    '.go',
    '.java',
    '.php',
]);

// ─── Scanner ───────────────────────────────────────────────────────

/**
 * Scan source files for server-side API calls to tracking service endpoints.
 * These requests bypass client-side privacy controls (ad blockers, consent banners).
 */
export function scanServerTracking(
    files: string[],
    baseDir: string,
    _stack: StackInfo,
): AuditFinding[] {
    const findings: AuditFinding[] = [];

    for (const filePath of files) {
        const ext = extname(filePath);
        if (!SERVER_EXTENSIONS.has(ext)) continue;

        let content: string;
        try {
            content = readFileSync(filePath, 'utf-8');
        } catch {
            continue;
        }

        const relPath = relative(baseDir, filePath);
        const lines = content.split('\n');

        // 1. Check for hardcoded tracker API URLs
        findings.push(...scanTrackerUrls(lines, relPath));

        // 2. Check HTTP client calls targeting tracker domains
        findings.push(...scanHttpCalls(lines, relPath));
    }

    return deduplicateByKey(findings);
}

// ─── URL Scanning ──────────────────────────────────────────────────

function scanTrackerUrls(lines: string[], filePath: string): AuditFinding[] {
    const findings: AuditFinding[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        for (const endpoint of TRACKER_ENDPOINTS) {
            // Reset lastIndex for global regex
            endpoint.pattern.lastIndex = 0;

            if (endpoint.pattern.test(line)) {
                findings.push({
                    id: `code-server-tracking-${filePath}-${i}`,
                    category: 'code',
                    severity: 'high',
                    title: `Server-side tracking: ${endpoint.vendor}`,
                    message: `Server-side API call to ${endpoint.vendor} detected. This bypasses browser privacy controls (ad blockers, consent banners).`,
                    file: filePath,
                    line: i + 1,
                    vendorId: endpoint.vendorId,
                    rule: 'server-side-tracking',
                    fix: 'Ensure explicit user consent before sending data. Consider a server-side consent check or privacy-friendly alternative.',
                });
            }
        }
    }

    return findings;
}

// ─── HTTP Client Scanning ──────────────────────────────────────────

// Patterns for HTTP client calls across languages
const HTTP_CALL_PATTERNS: RegExp[] = [
    // JS/TS: fetch, axios, got, node-fetch
    /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /axios\.(get|post|put|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /got\.(get|post|put|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
    // Python: requests, httpx, urllib
    /requests?\.(get|post|put|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /httpx\.(get|post|put|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
    // Rust: reqwest
    /\.(?:get|post|put|patch)\s*\(\s*"([^"]+)"/g,
    // Generic URL in string assignment
    /(?:url|endpoint|api_url|base_url)\s*=\s*['"`]([^'"`]+)['"`]/gi,
];

function scanHttpCalls(lines: string[], filePath: string): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const fullContent = lines.join('\n');

    for (const pattern of HTTP_CALL_PATTERNS) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(fullContent)) !== null) {
            // The URL is in the first or second capture group
            const url = match[2] ?? match[1];
            if (!url) continue;

            const matchedDomain = TRACKER_DOMAINS.find((d) => url.includes(d));
            if (!matchedDomain) continue;

            const lineNumber = fullContent.substring(0, match.index).split('\n').length;

            findings.push({
                id: `code-server-http-${filePath}-${lineNumber}`,
                category: 'code',
                severity: 'high',
                title: `HTTP call to tracker domain: ${matchedDomain}`,
                message: `Server-side HTTP request to ${matchedDomain} detected. This sends tracking data without user visibility.`,
                file: filePath,
                line: lineNumber,
                rule: 'server-side-tracking',
                fix: 'Verify user consent before sending data. Use a privacy proxy or first-party endpoint instead.',
            });
        }
    }

    return findings;
}

// ─── Deduplication ─────────────────────────────────────────────────

function deduplicateByKey(findings: AuditFinding[]): AuditFinding[] {
    const seen = new Set<string>();
    return findings.filter((f) => {
        const key = `${f.file}:${f.line}:${f.rule}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
