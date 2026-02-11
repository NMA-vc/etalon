import { readFileSync } from 'node:fs';
import { basename, relative, extname } from 'node:path';
import type { AuditFinding, StackInfo } from './types.js';

// ─── Known CNAME Cloaking Targets ──────────────────────────────────
// These are domains commonly used as CNAME targets for first-party tracking.
// When a site creates a CNAME like `metrics.mysite.com → t.tracker.com`,
// tracking bypasses ad blockers because requests appear first-party.

const CNAME_TRACKER_DOMAINS: { domain: string; vendor: string; vendorId: string }[] = [
    // Adobe / Omniture
    { domain: 'omtrdc.net', vendor: 'Adobe Analytics', vendorId: 'adobe-analytics' },
    { domain: '2o7.net', vendor: 'Adobe Analytics', vendorId: 'adobe-analytics' },
    { domain: 'sc.omtrdc.net', vendor: 'Adobe Analytics', vendorId: 'adobe-analytics' },
    // Eulerian
    { domain: 'eulerian.net', vendor: 'Eulerian', vendorId: 'eulerian' },
    // Criteo
    { domain: 'dnsdelegation.io', vendor: 'Criteo', vendorId: 'criteo' },
    { domain: 'criteo.com', vendor: 'Criteo', vendorId: 'criteo' },
    // AT Internet / Piano
    { domain: 'xiti.com', vendor: 'AT Internet', vendorId: 'at-internet' },
    { domain: 'ati-host.net', vendor: 'AT Internet', vendorId: 'at-internet' },
    // Segment
    { domain: 'cdn.segment.com', vendor: 'Segment', vendorId: 'segment' },
    { domain: 'api.segment.io', vendor: 'Segment', vendorId: 'segment' },
    // Mixpanel
    { domain: 'cdn.mxpnl.com', vendor: 'Mixpanel', vendorId: 'mixpanel' },
    { domain: 'api-js.mixpanel.com', vendor: 'Mixpanel', vendorId: 'mixpanel' },
    // Google Tag Manager server-side
    { domain: 'googletagmanager.com', vendor: 'Google Tag Manager', vendorId: 'google-tag-manager' },
    { domain: 'analytics.google.com', vendor: 'Google Analytics', vendorId: 'google-analytics' },
    // Amplitude
    { domain: 'cdn.amplitude.com', vendor: 'Amplitude', vendorId: 'amplitude' },
    { domain: 'api.amplitude.com', vendor: 'Amplitude', vendorId: 'amplitude' },
    // PostHog
    { domain: 'app.posthog.com', vendor: 'PostHog', vendorId: 'posthog' },
    // Hubspot
    { domain: 'js.hs-scripts.com', vendor: 'HubSpot', vendorId: 'hubspot' },
    { domain: 'track.hubspot.com', vendor: 'HubSpot', vendorId: 'hubspot' },
    // Plausible (self-hosted proxy patterns)
    { domain: 'plausible.io', vendor: 'Plausible', vendorId: 'plausible' },
    // Facebook / Meta
    { domain: 'connect.facebook.net', vendor: 'Facebook', vendorId: 'facebook-pixel' },
    { domain: 'graph.facebook.com', vendor: 'Facebook', vendorId: 'facebook-pixel' },
    // TikTok
    { domain: 'analytics.tiktok.com', vendor: 'TikTok', vendorId: 'tiktok' },
];

// ─── File Patterns to Scan ─────────────────────────────────────────

const DNS_CONFIG_FILES = new Set([
    'cloudflare.json',
    'dns-records.json',
    'vercel.json',
    'netlify.toml',
    '_redirects',
    '_headers',
]);

const IAC_EXTENSIONS = new Set(['.tf', '.json', '.yml', '.yaml', '.toml']);
const PROXY_CONFIG_FILES = new Set(['nginx.conf', 'httpd.conf', '.htaccess']);
const NEXTJS_CONFIG = new Set(['next.config.js', 'next.config.mjs', 'next.config.ts']);

// ─── Scanner ───────────────────────────────────────────────────────

/**
 * Scan for CNAME cloaking patterns across DNS configs, IaC, proxy configs,
 * and framework-level rewrites/proxies.
 */
export function scanCnameCloaking(
    files: string[],
    baseDir: string,
    _stack: StackInfo,
): AuditFinding[] {
    const findings: AuditFinding[] = [];

    for (const filePath of files) {
        const name = basename(filePath);
        const ext = extname(filePath);
        let content: string;

        try {
            content = readFileSync(filePath, 'utf-8');
        } catch {
            continue;
        }

        const relPath = relative(baseDir, filePath);

        // 1. DNS config files (Cloudflare, Vercel, Netlify)
        if (DNS_CONFIG_FILES.has(name)) {
            findings.push(...scanDnsConfig(content, relPath, name));
        }

        // 2. Infrastructure-as-code (Terraform, CloudFormation)
        if (IAC_EXTENSIONS.has(ext) && isInfraFile(filePath, content)) {
            findings.push(...scanIacFile(content, relPath, name));
        }

        // 3. Nginx / Apache proxy configs
        if (PROXY_CONFIG_FILES.has(name) || name.endsWith('.conf')) {
            findings.push(...scanProxyConfig(content, relPath));
        }

        // 4. Next.js rewrites/redirects
        if (NEXTJS_CONFIG.has(name) || name === 'vercel.json') {
            findings.push(...scanNextjsRewrites(content, relPath));
        }

        // 5. Express/Node proxy middleware
        if ((ext === '.js' || ext === '.ts' || ext === '.mjs') && isServerFile(name)) {
            findings.push(...scanExpressProxy(content, relPath));
        }
    }

    return dedup(findings);
}

// ─── DNS Config Scanning ───────────────────────────────────────────

function scanDnsConfig(content: string, filePath: string, _fileName: string): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const lines = content.split('\n');

    // Look for CNAME records pointing to tracker domains
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();

        if (!line.includes('cname')) continue;

        for (const tracker of CNAME_TRACKER_DOMAINS) {
            if (line.includes(tracker.domain.toLowerCase())) {
                findings.push(makeFinding(
                    filePath, i + 1, tracker,
                    `CNAME record pointing to ${tracker.vendor} (${tracker.domain}). This cloaks third-party tracking behind a first-party domain, bypassing ad blockers and consent mechanisms.`,
                ));
            }
        }
    }

    return findings;
}

// ─── Infrastructure-as-Code Scanning ───────────────────────────────

function isInfraFile(filePath: string, content: string): boolean {
    // Terraform
    if (filePath.endsWith('.tf')) return true;
    // CloudFormation
    if (content.includes('AWSTemplateFormatVersion') || content.includes('AWS::')) return true;
    // Pulumi
    if (content.includes('pulumi')) return true;
    // Check if it looks like a DNS/Route53 config
    if (content.includes('route53') || content.includes('dns_record') || content.includes('cloudflare_record')) return true;
    return false;
}

function scanIacFile(content: string, filePath: string, _fileName: string): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();

        // Look for CNAME type records
        const isCnameContext = line.includes('cname') ||
            line.includes('"type"') && lines.slice(Math.max(0, i - 3), i + 3).join(' ').toLowerCase().includes('cname');

        if (!isCnameContext) continue;

        // Check surrounding lines for tracker domains (CNAME value may be on adjacent line)
        const contextWindow = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 5)).join('\n').toLowerCase();

        for (const tracker of CNAME_TRACKER_DOMAINS) {
            if (contextWindow.includes(tracker.domain.toLowerCase())) {
                findings.push(makeFinding(
                    filePath, i + 1, tracker,
                    `Infrastructure-as-code CNAME record to ${tracker.vendor} (${tracker.domain}). This creates a DNS-level proxy to a third-party tracker.`,
                ));
            }
        }
    }

    return findings;
}

// ─── Proxy Config Scanning ─────────────────────────────────────────

function scanProxyConfig(content: string, filePath: string): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const lines = content.split('\n');

    // Nginx: proxy_pass, upstream
    // Apache: ProxyPass, ProxyPassReverse
    const proxyPatterns = [
        /proxy_pass\s+https?:\/\/([^\s;]+)/gi,
        /ProxyPass\s+\S+\s+https?:\/\/([^\s]+)/gi,
        /upstream\s+\w+\s*{[^}]*server\s+([^\s;]+)/gi,
    ];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        for (const pattern of proxyPatterns) {
            pattern.lastIndex = 0;
            const match = pattern.exec(line);
            if (!match) continue;

            const target = match[1].toLowerCase();

            for (const tracker of CNAME_TRACKER_DOMAINS) {
                if (target.includes(tracker.domain.toLowerCase())) {
                    findings.push(makeFinding(
                        filePath, i + 1, tracker,
                        `Reverse proxy to ${tracker.vendor} (${tracker.domain}). Proxying tracker requests through your server makes them appear first-party.`,
                    ));
                }
            }
        }
    }

    return findings;
}

// ─── Next.js / Vercel Rewrites ─────────────────────────────────────

function scanNextjsRewrites(content: string, filePath: string): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const lines = content.split('\n');

    // Match rewrite/redirect destination URLs
    // next.config.js: { source: '/proxy/:path*', destination: 'https://tracker.com/:path*' }
    // vercel.json: { "source": "/t/(.*)", "destination": "https://api.segment.io/$1" }
    const rewritePattern = /(?:destination|dest|to)\s*[:=]\s*['"`](https?:\/\/[^'"`]+)['"`]/gi;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        rewritePattern.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = rewritePattern.exec(line)) !== null) {
            const url = match[1].toLowerCase();

            for (const tracker of CNAME_TRACKER_DOMAINS) {
                if (url.includes(tracker.domain.toLowerCase())) {
                    findings.push(makeFinding(
                        filePath, i + 1, tracker,
                        `Rewrite/redirect rule proxying to ${tracker.vendor} (${tracker.domain}). This makes tracker requests appear first-party to the browser.`,
                    ));
                }
            }
        }
    }

    // Also check for common proxy patterns in Next.js config
    // e.g., rewrites() returning objects with tracker URLs
    const fullContent = content.toLowerCase();
    for (const tracker of CNAME_TRACKER_DOMAINS) {
        if (fullContent.includes(tracker.domain.toLowerCase()) &&
            (fullContent.includes('rewrites') || fullContent.includes('redirects'))) {
            // Find the line
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].toLowerCase().includes(tracker.domain.toLowerCase())) {
                    findings.push(makeFinding(
                        filePath, i + 1, tracker,
                        `Next.js/Vercel config references ${tracker.vendor} (${tracker.domain}) in a rewrites/redirects context. This proxies tracker traffic through your domain.`,
                    ));
                }
            }
        }
    }

    return findings;
}

// ─── Express / Node Proxy Middleware ───────────────────────────────

function isServerFile(name: string): boolean {
    const serverNames = ['server', 'app', 'proxy', 'middleware', 'api'];
    const lower = name.toLowerCase();
    return serverNames.some(s => lower.includes(s));
}

function scanExpressProxy(content: string, filePath: string): AuditFinding[] {
    const findings: AuditFinding[] = [];
    const lines = content.split('\n');

    // http-proxy-middleware: createProxyMiddleware({ target: 'https://tracker.com' })
    // express: app.use('/proxy', proxy({ target: 'https://tracker.com' }))
    const proxyPatterns = [
        /(?:target|changeOrigin|router)\s*[:=]\s*['"`](https?:\/\/[^'"`]+)['"`]/gi,
        /createProxyMiddleware\s*\(\s*(?:['"`]([^'"`]+)['"`]|{[^}]*target\s*:\s*['"`]([^'"`]+)['"`])/gi,
        /httpProxy\.createServer\s*\(\s*{[^}]*target\s*:\s*['"`](https?:\/\/[^'"`]+)['"`]/gi,
    ];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        for (const pattern of proxyPatterns) {
            pattern.lastIndex = 0;
            let match: RegExpExecArray | null;

            while ((match = pattern.exec(line)) !== null) {
                const url = (match[2] ?? match[1] ?? '').toLowerCase();
                if (!url) continue;

                for (const tracker of CNAME_TRACKER_DOMAINS) {
                    if (url.includes(tracker.domain.toLowerCase())) {
                        findings.push(makeFinding(
                            filePath, i + 1, tracker,
                            `Express/Node proxy middleware forwarding to ${tracker.vendor} (${tracker.domain}). This cloaks third-party tracking as first-party traffic.`,
                        ));
                    }
                }
            }
        }
    }

    return findings;
}

// ─── Helpers ───────────────────────────────────────────────────────

function makeFinding(
    file: string,
    line: number,
    tracker: { vendor: string; vendorId: string; domain: string },
    message: string,
): AuditFinding {
    return {
        id: `code-cname-cloaking-${file}-${line}`,
        category: 'code',
        severity: 'critical',
        title: `CNAME cloaking: ${tracker.vendor}`,
        message,
        file,
        line,
        vendorId: tracker.vendorId,
        rule: 'cname-cloaking',
        fix: 'Remove the CNAME/proxy that cloaks third-party tracking. Use a consent-gated client-side integration instead, or disclose the proxy in your privacy policy.',
    };
}

function dedup(findings: AuditFinding[]): AuditFinding[] {
    const seen = new Set<string>();
    return findings.filter(f => {
        const key = `${f.file}:${f.line}:${f.vendorId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
