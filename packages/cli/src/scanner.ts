import { chromium, type Browser, type Page, type Request } from 'playwright';
import {
    VendorRegistry,
    extractDomain,
    isFirstParty,
    type ScanReport,
    type NetworkRequest,
    type DetectedVendor,
    type UnknownDomain,
    type Recommendation,
} from '@etalon/core';

const ETALON_VERSION = '1.0.0';

export interface ScanOptions {
    deep?: boolean;
    timeout?: number;
    waitForNetworkIdle?: boolean;
    userAgent?: string;
    viewport?: { width: number; height: number };
    vendorDbPath?: string;
}

const DEFAULT_OPTIONS: Required<ScanOptions> = {
    deep: false,
    timeout: 30000,
    waitForNetworkIdle: true,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    vendorDbPath: '',
};

/**
 * Scan a website for third-party trackers.
 */
export async function scanSite(url: string, options: ScanOptions = {}): Promise<ScanReport> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();

    // Load vendor registry
    const registry = opts.vendorDbPath
        ? VendorRegistry.load(opts.vendorDbPath)
        : VendorRegistry.load();

    // Extract site domain for first-party filtering
    const siteDomain = extractDomain(url);
    if (!siteDomain) {
        throw new Error(`Invalid URL: ${url}`);
    }

    const capturedRequests: NetworkRequest[] = [];
    let browser: Browser | null = null;

    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: opts.userAgent,
            viewport: opts.viewport,
            ignoreHTTPSErrors: true,
        });

        const page = await context.newPage();

        // Capture all network requests
        page.on('request', (request: Request) => {
            const reqUrl = request.url();
            const domain = extractDomain(reqUrl);
            if (!domain) return;

            capturedRequests.push({
                url: reqUrl,
                domain,
                method: request.method(),
                type: request.resourceType(),
                timestamp: new Date().toISOString(),
            });
        });

        // Navigate to the page
        await page.goto(url, {
            waitUntil: opts.waitForNetworkIdle ? 'networkidle' : 'domcontentloaded',
            timeout: opts.timeout,
        });

        // Deep scan: scroll, interact, wait for lazy-loaded content
        if (opts.deep) {
            await performDeepScan(page, opts.timeout);
        }

        // Small wait for any final requests
        await page.waitForTimeout(1000);

        await context.close();
    } finally {
        if (browser) {
            await browser.close();
        }
    }

    const scanDurationMs = Date.now() - startTime;

    // Filter to third-party requests only
    const thirdPartyRequests = capturedRequests.filter(
        (req) => !isFirstParty(req.domain, siteDomain)
    );

    // Match against vendor registry
    const vendorMap = new Map<string, DetectedVendor>();
    const unknownMap = new Map<string, UnknownDomain>();

    for (const req of thirdPartyRequests) {
        const vendor = registry.lookupDomain(req.domain);

        if (vendor) {
            const existing = vendorMap.get(vendor.id);
            if (existing) {
                existing.requests.push(req);
            } else {
                vendorMap.set(vendor.id, { vendor, requests: [req] });
            }
        } else {
            const existing = unknownMap.get(req.domain);
            if (existing) {
                existing.requests.push(req);
            } else {
                unknownMap.set(req.domain, {
                    domain: req.domain,
                    requests: [req],
                    suggestedAction: 'submit_for_review',
                });
            }
        }
    }

    const vendors = Array.from(vendorMap.values());
    const unknown = Array.from(unknownMap.values());

    // Sort vendors by risk score (highest first)
    vendors.sort((a, b) => b.vendor.risk_score - a.vendor.risk_score);

    // Generate recommendations
    const recommendations = generateRecommendations(vendors, unknown);

    // Build summary
    const highRisk = vendors.filter((v) => v.vendor.risk_score >= 6).length;
    const mediumRisk = vendors.filter((v) => v.vendor.risk_score >= 3 && v.vendor.risk_score < 6).length;
    const lowRisk = vendors.filter((v) => v.vendor.risk_score < 3).length;

    return {
        meta: {
            etalonVersion: ETALON_VERSION,
            scanDate: new Date().toISOString(),
            scanDurationMs,
            url,
            deep: opts.deep ?? false,
        },
        summary: {
            totalRequests: capturedRequests.length,
            thirdPartyRequests: thirdPartyRequests.length,
            knownVendors: vendors.length,
            unknownDomains: unknown.length,
            highRisk,
            mediumRisk,
            lowRisk,
        },
        vendors,
        unknown,
        recommendations,
    };
}

/**
 * Deep scan: scroll the page, wait for lazy-loaded content.
 */
async function performDeepScan(page: Page, _timeout: number): Promise<void> {
    const scrollDelay = 500;
    const maxScrolls = 10;

    for (let i = 0; i < maxScrolls; i++) {
        await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
        });
        await page.waitForTimeout(scrollDelay);
    }

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));

    // Wait for any lazy-loaded content
    await page.waitForTimeout(2000);

    // Try to click cookie consent buttons (common patterns)
    const consentSelectors = [
        'button[id*="accept"]',
        'button[id*="consent"]',
        'button[class*="accept"]',
        'button[class*="consent"]',
        'a[id*="accept"]',
        '[data-testid*="accept"]',
        '[data-testid*="consent"]',
    ];

    for (const selector of consentSelectors) {
        try {
            const button = page.locator(selector).first();
            if (await button.isVisible({ timeout: 500 })) {
                await button.click();
                await page.waitForTimeout(1000);
                break;
            }
        } catch {
            // Ignore — consent button not found
        }
    }
}

/**
 * Generate actionable recommendations based on scan results.
 */
function generateRecommendations(
    vendors: DetectedVendor[],
    unknown: UnknownDomain[]
): Recommendation[] {
    const recs: Recommendation[] = [];

    // High-risk vendor alerts
    for (const v of vendors) {
        if (v.vendor.risk_score >= 6) {
            const altText = v.vendor.alternatives?.length
                ? ` Consider alternatives: ${v.vendor.alternatives.join(', ')}`
                : '';
            recs.push({
                type: 'high_risk_vendor',
                vendorId: v.vendor.id,
                message: `${v.vendor.name} is a high-risk tracker (score: ${v.vendor.risk_score}/10).${altText}`,
            });
        }

        // Missing DPA
        if (v.vendor.gdpr_compliant && !v.vendor.dpa_url && v.vendor.risk_score >= 3) {
            recs.push({
                type: 'missing_dpa',
                vendorId: v.vendor.id,
                message: `${v.vendor.name} is GDPR-compliant but no DPA URL is documented. Verify your Data Processing Agreement.`,
            });
        }

        // Suggest alternatives for medium+ risk
        if (v.vendor.risk_score >= 4 && v.vendor.alternatives?.length) {
            recs.push({
                type: 'consider_alternative',
                vendorId: v.vendor.id,
                message: `Consider privacy-friendly alternatives to ${v.vendor.name}: ${v.vendor.alternatives.join(', ')}`,
            });
        }
    }

    // Unknown trackers
    if (unknown.length > 0) {
        recs.push({
            type: 'unknown_tracker',
            message: `${unknown.length} unknown domain(s) detected. Review and submit to the ETALON registry if they are trackers.`,
        });
    }

    return recs;
}
