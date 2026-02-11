import { chromium, type Browser, type Page } from 'playwright';
import {
    VendorRegistry,
    extractDomain,
    isFirstParty,
    type NetworkRequest,
} from 'etalon-core';

// ─── Types ────────────────────────────────────────────────────────

export interface ConsentTracker {
    id: string;
    name: string;
    category: string;
    matchedDomain: string;
    firstSeenUrl: string;
}

export interface ConsentCheckResult {
    url: string;
    bannerDetected: boolean;
    bannerType: string | null;
    rejectButtonFound: boolean;
    rejectClicked: boolean;
    preConsentTrackers: ConsentTracker[];
    postRejectTrackers: ConsentTracker[];
    violations: ConsentViolation[];
    pass: boolean;
}

export interface ConsentViolation {
    vendor: string;
    vendorId: string;
    domain: string;
    phase: 'before-interaction' | 'after-reject';
    message: string;
}

// ─── CMP Selectors (common consent management platforms) ──────────

const CMP_SELECTORS = [
    // CookieBot
    { name: 'Cookiebot', banner: '#CybotCookiebotDialog', reject: '#CybotCookiebotDialogBodyButtonDecline, .CybotCookiebotDialogBodyButton[id*="decline"]' },
    // OneTrust
    { name: 'OneTrust', banner: '#onetrust-consent-sdk, .onetrust-pc-dark-filter', reject: '#onetrust-reject-all-handler, .ot-pc-refuse-all-handler' },
    // Didomi
    { name: 'Didomi', banner: '#didomi-popup, .didomi-popup-container', reject: '#didomi-notice-disagree-button, .didomi-components-button--disagree' },
    // Quantcast
    { name: 'Quantcast', banner: '.qc-cmp2-container, #qcCmpUi', reject: '.qc-cmp2-summary-buttons button[mode="secondary"], .qc-cmp2-footer button:first-child' },
    // Klaro
    { name: 'Klaro', banner: '.klaro .cookie-notice, .klaro .cm-app', reject: '.klaro .cn-decline, .klaro .cm-btn-decline' },
    // TrustArc
    { name: 'TrustArc', banner: '#truste-consent-track', reject: '#truste-consent-required' },
    // Generic selectors
    { name: 'Generic', banner: '[class*="cookie-banner"], [class*="cookie-consent"], [id*="cookie-banner"], [id*="cookie-consent"], [class*="gdpr"], [id*="gdpr"]', reject: 'button[class*="reject"], button[class*="decline"], button[class*="deny"], a[class*="reject"], a[class*="decline"]' },
    // Text-based (last resort)
    { name: 'Text-based', banner: '', reject: '' },
];

// Text patterns for reject buttons
const REJECT_TEXT_PATTERNS = [
    /reject\s*all/i, /decline\s*all/i, /refuse\s*all/i,
    /deny\s*all/i, /reject/i, /decline/i, /refuse/i,
    /nur\s*notwendige/i, // German: "only necessary"
    /refuser/i, // French
    /rifiuta/i, // Italian
    /rechazar/i, // Spanish
];

// ─── Consent Checker ──────────────────────────────────────────────

export async function checkConsent(url: string, options: { timeout?: number } = {}): Promise<ConsentCheckResult> {
    const timeout = options.timeout ?? 15000;
    const registry = VendorRegistry.load();
    const siteDomain = extractDomain(url);
    if (!siteDomain) throw new Error(`Invalid URL: ${url}`);

    const preConsentRequests: NetworkRequest[] = [];
    const postRejectRequests: NetworkRequest[] = [];
    let phase: 'pre-consent' | 'post-reject' = 'pre-consent';

    let browser: Browser | null = null;

    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
        });
        const page = await context.newPage();

        // Intercept network requests
        page.on('request', (request) => {
            const reqUrl = request.url();
            const domain = extractDomain(reqUrl);
            if (!domain || isFirstParty(domain, siteDomain)) return;

            const req: NetworkRequest = {
                url: reqUrl,
                method: request.method(),
                resourceType: request.resourceType(),
                domain,
            };

            if (phase === 'pre-consent') {
                preConsentRequests.push(req);
            } else {
                postRejectRequests.push(req);
            }
        });

        // Navigate
        await page.goto(url, { waitUntil: 'networkidle', timeout });
        await page.waitForTimeout(2000); // Extra settle time

        // Detect consent banner
        const { bannerDetected, bannerType, rejectSelector } = await detectBanner(page);

        // Try to click reject
        let rejectButtonFound = false;
        let rejectClicked = false;

        if (bannerDetected && rejectSelector) {
            rejectButtonFound = true;
            try {
                await page.click(rejectSelector, { timeout: 5000 });
                rejectClicked = true;
            } catch {
                rejectClicked = false;
            }
        }

        // If no selector-based reject, try text-based
        if (bannerDetected && !rejectClicked) {
            const result = await tryTextBasedReject(page);
            rejectButtonFound = rejectButtonFound || result.found;
            rejectClicked = result.clicked;
        }

        // Switch phase and wait for post-reject requests
        if (rejectClicked) {
            phase = 'post-reject';
            await page.waitForTimeout(3000);
        }

        // Classify trackers
        const preConsentTrackers = classifyTrackers(preConsentRequests, registry);
        const postRejectTrackers = classifyTrackers(postRejectRequests, registry);

        // Build violations
        const violations: ConsentViolation[] = [];

        for (const tracker of preConsentTrackers) {
            if (tracker.category === 'analytics' || tracker.category === 'advertising') {
                violations.push({
                    vendor: tracker.name,
                    vendorId: tracker.id,
                    domain: tracker.matchedDomain,
                    phase: 'before-interaction',
                    message: `${tracker.name} loaded BEFORE any consent interaction — violates GDPR Art. 6(1)(a)`,
                });
            }
        }

        for (const tracker of postRejectTrackers) {
            if (tracker.category === 'analytics' || tracker.category === 'advertising') {
                violations.push({
                    vendor: tracker.name,
                    vendorId: tracker.id,
                    domain: tracker.matchedDomain,
                    phase: 'after-reject',
                    message: `${tracker.name} still active AFTER consent rejection — consent mechanism is broken`,
                });
            }
        }

        return {
            url,
            bannerDetected,
            bannerType,
            rejectButtonFound,
            rejectClicked,
            preConsentTrackers,
            postRejectTrackers,
            violations,
            pass: violations.length === 0,
        };
    } finally {
        await browser?.close();
    }
}

// ─── Banner Detection ─────────────────────────────────────────────

async function detectBanner(page: Page): Promise<{
    bannerDetected: boolean;
    bannerType: string | null;
    rejectSelector: string | null;
}> {
    for (const cmp of CMP_SELECTORS) {
        if (!cmp.banner) continue;

        try {
            const banner = await page.$(cmp.banner);
            if (banner) {
                const isVisible = await banner.isVisible();
                if (isVisible) {
                    // Found a banner, try to find its reject button
                    let rejectSelector: string | null = null;
                    if (cmp.reject) {
                        const reject = await page.$(cmp.reject);
                        if (reject && await reject.isVisible()) {
                            rejectSelector = cmp.reject;
                        }
                    }
                    return { bannerDetected: true, bannerType: cmp.name, rejectSelector };
                }
            }
        } catch {
            // Selector didn't match, try next
        }
    }

    return { bannerDetected: false, bannerType: null, rejectSelector: null };
}

async function tryTextBasedReject(page: Page): Promise<{ found: boolean; clicked: boolean }> {
    try {
        const buttons = await page.$$('button, a[role="button"], [class*="btn"]');

        for (const button of buttons) {
            const text = await button.textContent();
            if (!text) continue;

            const matches = REJECT_TEXT_PATTERNS.some(p => p.test(text.trim()));
            if (matches && await button.isVisible()) {
                await button.click();
                return { found: true, clicked: true };
            }
        }
    } catch {
        // Ignore errors
    }
    return { found: false, clicked: false };
}

// ─── Tracker Classification ───────────────────────────────────────

function classifyTrackers(requests: NetworkRequest[], registry: VendorRegistry): ConsentTracker[] {
    const seen = new Set<string>();
    const trackers: ConsentTracker[] = [];

    for (const req of requests) {
        const vendor = registry.lookupDomain(req.domain);
        if (vendor && !seen.has(vendor.id)) {
            seen.add(vendor.id);
            trackers.push({
                id: vendor.id,
                name: vendor.name,
                category: vendor.category,
                matchedDomain: req.domain,
                firstSeenUrl: req.url,
            });
        }
    }

    return trackers;
}
