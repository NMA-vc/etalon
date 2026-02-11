// ─── Framework-Specific Detection Engine ──────────────────────────
//
// AST-like detection layer that understands framework patterns
// (React hooks, Next.js server components, Vue composition API)
// to reduce false positives vs pure regex matching.

import type { AuditFinding, StackInfo, FindingSeverity } from '../audit/types.js';

// ─── Types ────────────────────────────────────────────────────────

export interface DetectionResult {
    is_tracking: boolean;
    confidence: number; // 0-1
    framework_context: string;
    reason: string;
    adjusted_severity?: FindingSeverity;
}

export interface FrameworkDetector {
    name: string;
    frameworks: string[];
    detect: (code: string, filePath: string) => DetectionResult[];
}

// ─── React Detector ───────────────────────────────────────────────

const reactDetector: FrameworkDetector = {
    name: 'react',
    frameworks: ['react', 'nextjs'],
    detect: (code: string, filePath: string): DetectionResult[] => {
        const results: DetectionResult[] = [];

        // Detect trackers inside useEffect (client-side only)
        const useEffectBlocks = extractBlocks(code, /useEffect\s*\(\s*\(\)\s*=>\s*\{/g);
        for (const block of useEffectBlocks) {
            if (hasTrackerPattern(block.content)) {
                results.push({
                    is_tracking: true,
                    confidence: 0.9,
                    framework_context: 'useEffect hook — client-side only',
                    reason: 'Tracker initialization in useEffect runs on client without consent check',
                    adjusted_severity: 'high',
                });
            }
        }

        // Detect trackers in event handlers (onClick, onSubmit)
        const handlerMatches = code.matchAll(/(?:onClick|onSubmit|onChange)\s*=\s*\{[^}]*?(gtag|fbq|analytics\.track|mixpanel\.track|posthog\.capture)[^}]*\}/g);
        for (const match of handlerMatches) {
            results.push({
                is_tracking: true,
                confidence: 0.85,
                framework_context: `Event handler (${match[1]})`,
                reason: 'Tracker call in event handler — fires on user interaction without consent check',
                adjusted_severity: 'medium',
            });
        }

        // Detect Script component (Next.js)
        if (code.includes('<Script') || code.includes('next/script')) {
            const scriptMatches = code.matchAll(/<Script[^>]*src=["']([^"']+)["'][^>]*\/?>/g);
            for (const match of scriptMatches) {
                if (isTrackerUrl(match[1])) {
                    // Check for strategy
                    const hasStrategy = /strategy=["'](afterInteractive|lazyOnload|worker)["']/.test(
                        code.slice(Math.max(0, match.index! - 200), match.index! + match[0].length + 200)
                    );
                    results.push({
                        is_tracking: true,
                        confidence: 0.95,
                        framework_context: `Next.js Script component${hasStrategy ? ' (with strategy)' : ''}`,
                        reason: hasStrategy
                            ? 'Next.js Script with strategy still loads without consent check'
                            : 'Next.js Script loads tracker immediately',
                        adjusted_severity: hasStrategy ? 'medium' : 'high',
                    });
                }
            }
        }

        // Detect server component (safe — 'use server' or .server.ts)
        if (code.includes("'use server'") || filePath.includes('.server.')) {
            // If we found tracker patterns in server code, lower severity
            results.forEach(r => {
                r.confidence *= 0.3;
                r.reason += ' (server component — may not execute in browser)';
                r.adjusted_severity = 'info';
            });
        }

        // Safe: Consent check already present
        if (/consent|useConsent|cookieConsent|gdpr/i.test(code)) {
            const hasTrackers = results.some(r => r.is_tracking);
            if (hasTrackers) {
                results.push({
                    is_tracking: false,
                    confidence: 0.7,
                    framework_context: 'Consent check detected in same file',
                    reason: 'File appears to have consent management — may already be handled',
                });
            }
        }

        return results;
    },
};

// ─── Vue Detector ─────────────────────────────────────────────────

const vueDetector: FrameworkDetector = {
    name: 'vue',
    frameworks: ['vue', 'nuxt'],
    detect: (code: string, _filePath: string): DetectionResult[] => {
        const results: DetectionResult[] = [];

        // Detect trackers in onMounted (client-side)
        const mountedBlocks = extractBlocks(code, /onMounted\s*\(\s*(?:async\s*)?\(\)\s*=>\s*\{/g);
        for (const block of mountedBlocks) {
            if (hasTrackerPattern(block.content)) {
                results.push({
                    is_tracking: true,
                    confidence: 0.9,
                    framework_context: 'onMounted lifecycle — client-side',
                    reason: 'Tracker initialization in onMounted runs on client without consent check',
                    adjusted_severity: 'high',
                });
            }
        }

        // Detect trackers in template v-html (XSS + tracking risk)
        const vHtmlMatches = code.matchAll(/v-html=["']([^"']+)["']/g);
        for (const match of vHtmlMatches) {
            if (hasTrackerPattern(match[1])) {
                results.push({
                    is_tracking: true,
                    confidence: 0.8,
                    framework_context: 'v-html directive — unsafe HTML',
                    reason: 'Tracker code injected via v-html — both XSS and privacy risk',
                    adjusted_severity: 'critical',
                });
            }
        }

        // Nuxt plugins (client-side)
        if (code.includes('defineNuxtPlugin') || code.includes('nuxtApp.provide')) {
            if (hasTrackerPattern(code)) {
                results.push({
                    is_tracking: true,
                    confidence: 0.85,
                    framework_context: 'Nuxt plugin',
                    reason: 'Tracker in Nuxt plugin — loads globally without per-page consent',
                    adjusted_severity: 'high',
                });
            }
        }

        return results;
    },
};

// ─── Generic Detector ─────────────────────────────────────────────

const genericDetector: FrameworkDetector = {
    name: 'generic',
    frameworks: ['vanilla', 'express', 'fastify', 'none'],
    detect: (code: string, _filePath: string): DetectionResult[] => {
        const results: DetectionResult[] = [];

        // document.createElement('script') — dynamic tracking pixel
        const createScriptMatches = code.matchAll(/document\.createElement\s*\(\s*['"]script['"]\s*\)[^;]*src\s*=\s*["']([^"']+)["']/g);
        for (const match of createScriptMatches) {
            if (isTrackerUrl(match[1])) {
                results.push({
                    is_tracking: true,
                    confidence: 0.95,
                    framework_context: 'Dynamic script injection',
                    reason: 'Tracker injected via document.createElement without consent check',
                    adjusted_severity: 'high',
                });
            }
        }

        // Image pixel tracking
        const imgCreateMatches = code.matchAll(/new Image\(\)[^;]*src\s*=\s*["']([^"']+)["']/g);
        for (const match of imgCreateMatches) {
            if (isTrackerUrl(match[1])) {
                results.push({
                    is_tracking: true,
                    confidence: 0.9,
                    framework_context: 'Image tracking pixel',
                    reason: 'Tracker pixel created via new Image() without consent check',
                    adjusted_severity: 'high',
                });
            }
        }

        return results;
    },
};

// ─── Detection Engine ─────────────────────────────────────────────

const ALL_DETECTORS: FrameworkDetector[] = [
    reactDetector,
    vueDetector,
    genericDetector,
];

/**
 * Run framework-specific detection on code.
 * Chooses the appropriate detector based on the stack info.
 */
export function runFrameworkDetection(
    code: string,
    filePath: string,
    stack?: StackInfo,
): DetectionResult[] {
    const framework = stack?.framework || 'none';
    const results: DetectionResult[] = [];

    for (const detector of ALL_DETECTORS) {
        if (detector.frameworks.includes(framework) || detector.name === 'generic') {
            results.push(...detector.detect(code, filePath));
        }
    }

    return results;
}

/**
 * Check if framework detection suggests a finding should be suppressed.
 */
export function shouldSuppressFinding(
    finding: AuditFinding,
    code: string,
    stack?: StackInfo,
): boolean {
    const results = runFrameworkDetection(code, finding.file, stack);
    return results.some(r => !r.is_tracking && r.confidence > 0.6);
}

// ─── Helpers ──────────────────────────────────────────────────────

const TRACKER_URL_PATTERNS = [
    /googletagmanager\.com/,
    /google-analytics\.com/,
    /connect\.facebook\.net/,
    /static\.hotjar\.com/,
    /cdn\.segment\.com/,
    /cdn\.mxpnl\.com/,
    /cdn\.amplitude\.com/,
    /analytics\.tiktok\.com/,
    /snap\.licdn\.com/,
    /static\.ads-twitter\.com/,
    /clarity\.ms/,
    /fullstory\.com/,
    /cdn\.logrocket\.io/,
    /us\.posthog\.com/,
    /eu\.posthog\.com/,
];

function isTrackerUrl(url: string): boolean {
    return TRACKER_URL_PATTERNS.some(p => p.test(url));
}

const TRACKER_FUNCTION_PATTERNS = [
    /\bgtag\s*\(/, /\bfbq\s*\(/, /\bdataLayer\.push\s*\(/,
    /\banalytics\.track\s*\(/, /\bmixpanel\.track\s*\(/,
    /\bamplitude\.track\s*\(/, /\bposthog\.capture\s*\(/,
    /\bttq\.track\s*\(/, /\blintrk\s*\(/, /\btwq\s*\(/,
    /\bhj\s*\(/, /\bFS\.event\s*\(/, /\bLogRocket\.init\s*\(/,
    /\bclarity\s*\(/,
];

function hasTrackerPattern(code: string): boolean {
    return TRACKER_FUNCTION_PATTERNS.some(p => p.test(code));
}

interface CodeBlock {
    content: string;
    start: number;
    end: number;
}

function extractBlocks(code: string, pattern: RegExp): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    let match;

    while ((match = pattern.exec(code)) !== null) {
        const start = match.index;
        let depth = 0;
        let end = start;

        for (let i = match.index + match[0].length - 1; i < code.length; i++) {
            if (code[i] === '{') depth++;
            if (code[i] === '}') {
                depth--;
                if (depth === 0) {
                    end = i + 1;
                    break;
                }
            }
        }

        blocks.push({
            content: code.substring(start, end),
            start,
            end,
        });
    }

    return blocks;
}
