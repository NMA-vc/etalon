import { chromium, type Browser, type Request as PwRequest } from 'playwright';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export interface ScanResult {
    score: number;
    grade: string;
    totalFindings: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    trackers: TrackerFound[];
    unknownDomains: UnknownDomain[];
    fullReport: Record<string, unknown>;
}

interface TrackerFound {
    vendor_id: string;
    name: string;
    category: string;
    domain: string;
    risk_score: number;
    gdpr_compliant: boolean;
}

interface UnknownDomain {
    domain: string;
    requests: number;
}

// Vendor database (embedded subset — top trackers for cloud scanning)
const KNOWN_TRACKERS: Record<string, { name: string; category: string; risk_score: number; gdpr_compliant: boolean }> = {
    'google-analytics.com': { name: 'Google Analytics', category: 'analytics', risk_score: 5, gdpr_compliant: true },
    'googletagmanager.com': { name: 'Google Tag Manager', category: 'tag-manager', risk_score: 4, gdpr_compliant: true },
    'googlesyndication.com': { name: 'Google Ads', category: 'advertising', risk_score: 7, gdpr_compliant: true },
    'doubleclick.net': { name: 'DoubleClick', category: 'advertising', risk_score: 8, gdpr_compliant: true },
    'facebook.net': { name: 'Facebook SDK', category: 'social', risk_score: 8, gdpr_compliant: false },
    'facebook.com': { name: 'Facebook', category: 'social', risk_score: 8, gdpr_compliant: false },
    'connect.facebook.net': { name: 'Facebook Pixel', category: 'advertising', risk_score: 9, gdpr_compliant: false },
    'hotjar.com': { name: 'Hotjar', category: 'analytics', risk_score: 6, gdpr_compliant: true },
    'fullstory.com': { name: 'FullStory', category: 'session-replay', risk_score: 7, gdpr_compliant: true },
    'clarity.ms': { name: 'Microsoft Clarity', category: 'session-replay', risk_score: 5, gdpr_compliant: true },
    'segment.io': { name: 'Segment', category: 'analytics', risk_score: 5, gdpr_compliant: true },
    'segment.com': { name: 'Segment', category: 'analytics', risk_score: 5, gdpr_compliant: true },
    'mixpanel.com': { name: 'Mixpanel', category: 'analytics', risk_score: 5, gdpr_compliant: true },
    'amplitude.com': { name: 'Amplitude', category: 'analytics', risk_score: 4, gdpr_compliant: true },
    'sentry.io': { name: 'Sentry', category: 'error-tracking', risk_score: 3, gdpr_compliant: true },
    'intercom.io': { name: 'Intercom', category: 'customer-support', risk_score: 5, gdpr_compliant: true },
    'intercomcdn.com': { name: 'Intercom CDN', category: 'customer-support', risk_score: 4, gdpr_compliant: true },
    'crisp.chat': { name: 'Crisp', category: 'customer-support', risk_score: 4, gdpr_compliant: true },
    'hubspot.com': { name: 'HubSpot', category: 'marketing', risk_score: 6, gdpr_compliant: true },
    'hs-scripts.com': { name: 'HubSpot Scripts', category: 'marketing', risk_score: 6, gdpr_compliant: true },
    'hsforms.com': { name: 'HubSpot Forms', category: 'marketing', risk_score: 5, gdpr_compliant: true },
    'tiktok.com': { name: 'TikTok Pixel', category: 'advertising', risk_score: 9, gdpr_compliant: false },
    'snap.licdn.com': { name: 'LinkedIn Insight', category: 'advertising', risk_score: 7, gdpr_compliant: true },
    'linkedin.com': { name: 'LinkedIn', category: 'social', risk_score: 6, gdpr_compliant: true },
    'twitter.com': { name: 'Twitter/X', category: 'social', risk_score: 7, gdpr_compliant: false },
    'x.com': { name: 'X', category: 'social', risk_score: 7, gdpr_compliant: false },
    'pinterest.com': { name: 'Pinterest', category: 'social', risk_score: 6, gdpr_compliant: true },
    'stripe.com': { name: 'Stripe', category: 'payment', risk_score: 2, gdpr_compliant: true },
    'js.stripe.com': { name: 'Stripe.js', category: 'payment', risk_score: 2, gdpr_compliant: true },
    'cloudflare.com': { name: 'Cloudflare', category: 'cdn', risk_score: 1, gdpr_compliant: true },
    'cdn.jsdelivr.net': { name: 'jsDelivr', category: 'cdn', risk_score: 1, gdpr_compliant: true },
    'unpkg.com': { name: 'unpkg', category: 'cdn', risk_score: 1, gdpr_compliant: true },
    'cookiebot.com': { name: 'Cookiebot', category: 'consent', risk_score: 2, gdpr_compliant: true },
    'onetrust.com': { name: 'OneTrust', category: 'consent', risk_score: 2, gdpr_compliant: true },
    'cookieinformation.com': { name: 'Cookie Information', category: 'consent', risk_score: 2, gdpr_compliant: true },
    'googleadservices.com': { name: 'Google Ads', category: 'advertising', risk_score: 8, gdpr_compliant: true },
    'google.com': { name: 'Google', category: 'infrastructure', risk_score: 3, gdpr_compliant: true },
    'gstatic.com': { name: 'Google Static', category: 'cdn', risk_score: 1, gdpr_compliant: true },
    'googleapis.com': { name: 'Google APIs', category: 'infrastructure', risk_score: 2, gdpr_compliant: true },
    'fonts.googleapis.com': { name: 'Google Fonts', category: 'cdn', risk_score: 3, gdpr_compliant: true },
    'recaptcha.net': { name: 'reCAPTCHA', category: 'security', risk_score: 4, gdpr_compliant: true },
    'hcaptcha.com': { name: 'hCaptcha', category: 'security', risk_score: 3, gdpr_compliant: true },
    'plausible.io': { name: 'Plausible', category: 'analytics', risk_score: 1, gdpr_compliant: true },
    'fathom.com': { name: 'Fathom', category: 'analytics', risk_score: 1, gdpr_compliant: true },
    'simpleanalytics.com': { name: 'Simple Analytics', category: 'analytics', risk_score: 1, gdpr_compliant: true },
};

function extractDomain(url: string): string | null {
    try {
        return new URL(url).hostname;
    } catch {
        return null;
    }
}

function getBaseDomain(hostname: string): string {
    const parts = hostname.split('.');
    if (parts.length <= 2) return hostname;
    return parts.slice(-2).join('.');
}

function isFirstParty(requestDomain: string, siteDomain: string): boolean {
    return getBaseDomain(requestDomain) === getBaseDomain(siteDomain);
}

function lookupTracker(domain: string): typeof KNOWN_TRACKERS[string] | null {
    // Direct match
    if (KNOWN_TRACKERS[domain]) return KNOWN_TRACKERS[domain];
    // Base domain match
    const base = getBaseDomain(domain);
    if (KNOWN_TRACKERS[base]) return KNOWN_TRACKERS[base];
    // Walk up subdomains
    const parts = domain.split('.');
    for (let i = 1; i < parts.length - 1; i++) {
        const sub = parts.slice(i).join('.');
        if (KNOWN_TRACKERS[sub]) return KNOWN_TRACKERS[sub];
    }
    return null;
}

function calculateGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    if (score >= 40) return 'D';
    return 'F';
}

// ─── SSRF Protection ──────────────────────────────────────────────

const BLOCKED_IP_RANGES = [
    /^127\./, // Loopback
    /^10\./, // RFC1918 Class A
    /^172\.(1[6-9]|2[0-9]|3[01])\./, // RFC1918 Class B
    /^192\.168\./, // RFC1918 Class C
    /^169\.254\./, // Link-local / cloud metadata
    /^0\./, // Current network
    /^::1$/, // IPv6 loopback
    /^fc00:/, // IPv6 unique local
    /^fe80:/, // IPv6 link-local
];

async function validateScanUrl(url: string): Promise<void> {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        throw new Error(`Invalid URL: ${url}`);
    }

    // Only allow http(s)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error(`Blocked protocol: ${parsed.protocol}`);
    }

    // Resolve hostname to IP and check against blocklist
    const hostname = parsed.hostname;
    let ip: string;

    if (isIP(hostname)) {
        ip = hostname;
    } else {
        try {
            const result = await lookup(hostname);
            ip = result.address;
        } catch {
            throw new Error(`Cannot resolve hostname: ${hostname}`);
        }
    }

    for (const range of BLOCKED_IP_RANGES) {
        if (range.test(ip)) {
            throw new Error(`Blocked: URL resolves to private/reserved IP (${ip})`);
        }
    }
}

// ─── Scanner ──────────────────────────────────────────────────────

export async function runScan(url: string): Promise<ScanResult> {
    // SSRF check: reject private/internal targets
    await validateScanUrl(url);

    let browser: Browser | null = null;

    try {
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
            ignoreHTTPSErrors: true,
        });

        const page = await context.newPage();
        const siteDomain = extractDomain(url);
        if (!siteDomain) throw new Error(`Invalid URL: ${url}`);

        // Capture requests
        const requestsByDomain = new Map<string, number>();
        page.on('request', (req: PwRequest) => {
            const d = extractDomain(req.url());
            if (d && !isFirstParty(d, siteDomain)) {
                requestsByDomain.set(d, (requestsByDomain.get(d) || 0) + 1);
            }
        });

        // Navigate
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);

        // Scroll to trigger lazy loading
        await page.evaluate(async () => {
            for (let i = 0; i < 5; i++) {
                window.scrollBy(0, window.innerHeight);
                await new Promise(r => setTimeout(r, 500));
            }
            window.scrollTo(0, 0);
        });
        await page.waitForTimeout(1000);

        await context.close();

        // Classify
        const trackers: TrackerFound[] = [];
        const unknownDomains: UnknownDomain[] = [];

        for (const [domain, count] of requestsByDomain) {
            const tracker = lookupTracker(domain);
            if (tracker) {
                // Deduplicate by vendor name
                if (!trackers.some(t => t.name === tracker.name)) {
                    trackers.push({
                        vendor_id: domain.replace(/\./g, '-'),
                        name: tracker.name,
                        category: tracker.category,
                        domain,
                        risk_score: tracker.risk_score,
                        gdpr_compliant: tracker.gdpr_compliant,
                    });
                }
            } else {
                unknownDomains.push({ domain, requests: count });
            }
        }

        // Score: start at 100, deduct for issues
        let score = 100;
        for (const t of trackers) {
            score -= Math.max(1, Math.floor(t.risk_score * 1.5));
        }
        score -= unknownDomains.length * 3; // Unknown domains are potential risk
        score = Math.max(0, Math.min(100, score));
        const grade = calculateGrade(score);

        // Generate findings
        const findings = trackers.map(t => ({
            id: `tracker-${t.vendor_id}`,
            category: 'code',
            severity: t.risk_score >= 7 ? 'critical' : t.risk_score >= 5 ? 'high' : t.risk_score >= 3 ? 'medium' : 'low',
            title: `${t.name} tracker detected`,
            message: `Third-party tracker ${t.name} (${t.category}) found at ${t.domain}. ${t.gdpr_compliant ? 'GDPR compliant.' : 'Not GDPR compliant — requires explicit consent.'}`,
            file: url,
            rule: `tracker-${t.category}`,
        }));

        for (const u of unknownDomains) {
            findings.push({
                id: `unknown-${u.domain.replace(/\./g, '-')}`,
                category: 'code',
                severity: 'medium',
                title: `Unknown third-party domain: ${u.domain}`,
                message: `${u.requests} request(s) to unrecognized domain ${u.domain}. This may be a tracker not in our database.`,
                file: url,
                rule: 'unknown-domain',
            });
        }

        const criticalCount = findings.filter(f => f.severity === 'critical').length;
        const highCount = findings.filter(f => f.severity === 'high').length;
        const mediumCount = findings.filter(f => f.severity === 'medium').length;
        const lowCount = findings.filter(f => f.severity === 'low').length;

        return {
            score,
            grade,
            totalFindings: findings.length,
            criticalCount,
            highCount,
            mediumCount,
            lowCount,
            trackers,
            unknownDomains,
            fullReport: {
                meta: { scanDate: new Date().toISOString(), url },
                findings,
                trackers,
                unknownDomains,
                score,
                grade,
            },
        };
    } finally {
        if (browser) await browser.close();
    }
}
