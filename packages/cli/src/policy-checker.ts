import { chromium, type Browser, type Page } from 'playwright';
import {
    VendorRegistry,
    extractDomain,
    type DetectedVendor,
} from 'etalon-core';
import { scanSite } from './scanner.js';

// ─── Types ────────────────────────────────────────────────────────

export interface PolicyCheckResult {
    url: string;
    policyUrl: string | null;
    policyFound: boolean;
    mentionedVendors: PolicyVendorRef[];
    detectedVendors: PolicyVendorRef[];
    undisclosed: PolicyMismatch[];
    overclaimed: PolicyMismatch[];
    disclosed: PolicyMismatch[];
    disclosures: VendorDisclosure[];
    pass: boolean;
}

export interface VendorDisclosure {
    vendorId: string;
    vendorName: string;
    company: string;
    category: string;
    snippet: string;
    dataCollected: string[];
    privacyPolicyUrl?: string;
    dpaUrl?: string;
}

export interface PolicyVendorRef {
    vendorId: string;
    vendorName: string;
    category: string;
}

export interface PolicyMismatch {
    vendorId: string;
    vendorName: string;
    category: string;
    gdprCompliant: boolean;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    message: string;
}

// ─── Privacy Policy URL Patterns ──────────────────────────────────

const POLICY_PATH_PATTERNS = [
    /^\/privacy[-_]?policy/i,
    /^\/privacy/i,
    /^\/datenschutz/i,
    /^\/politique[-_]de[-_]confidentialite/i,
    /^\/informativa[-_]privacy/i,
    /^\/politica[-_]de[-_]privacidad/i,
    /^\/legal\/privacy/i,
    /^\/about\/privacy/i,
    /^\/cookie[-_]?policy/i,
];

const POLICY_LINK_TEXT_PATTERNS = [
    /privacy\s*policy/i,
    /privacy\s*notice/i,
    /privacy/i,
    /datenschutz/i,
    /cookie\s*policy/i,
    /data\s*protection/i,
    /politique\s*de\s*confidentialit[eé]/i,
];

// ─── Policy Page Discovery ───────────────────────────────────────

async function findPolicyPage(page: Page, siteUrl: string): Promise<string | null> {
    const siteDomain = extractDomain(siteUrl);
    if (!siteDomain) return null;

    // Strategy 1: Try common paths directly
    const baseUrl = new URL(siteUrl);
    const commonPaths = [
        '/privacy-policy', '/privacy', '/legal/privacy',
        '/datenschutz', '/cookie-policy', '/about/privacy',
    ];

    for (const path of commonPaths) {
        try {
            const testUrl = `${baseUrl.origin}${path}`;
            const response = await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
            if (response && response.status() >= 200 && response.status() < 400) {
                // Check if the page has meaningful content (not a 404 with 200 status)
                const bodyText = await page.evaluate(() => (globalThis as any).document.body?.innerText?.trim() ?? '');
                if (bodyText.length > 200) {
                    return testUrl;
                }
            }
        } catch {
            // Page not found, try next
        }
    }

    // Strategy 2: Go back to home page, look for links in footer
    try {
        await page.goto(siteUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(1000);

        const links = await page.$$eval('a[href]', (anchors) =>
            anchors.map((a) => ({
                href: a.getAttribute('href') ?? '',
                text: a.textContent?.trim() ?? '',
            }))
        );

        for (const link of links) {
            // Check href against path patterns
            try {
                const fullUrl = new URL(link.href, siteUrl);
                const matchesPath = POLICY_PATH_PATTERNS.some((p) => p.test(fullUrl.pathname));
                const matchesText = POLICY_LINK_TEXT_PATTERNS.some((p) => p.test(link.text));

                if (matchesPath || matchesText) {
                    // Verify it's same-origin or a known legal page host
                    if (fullUrl.hostname === baseUrl.hostname || fullUrl.hostname.includes('iubenda')) {
                        return fullUrl.href;
                    }
                }
            } catch {
                // Invalid URL, skip
            }
        }
    } catch {
        // Failed to navigate back
    }

    return null;
}

// ─── Policy Text Extraction ──────────────────────────────────────

async function extractPolicyText(page: Page, policyUrl: string): Promise<string> {
    await page.goto(policyUrl, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1000);

    const text = await page.evaluate(() => {
        // Remove scripts, styles, nav, header elements for cleaner text
        const doc = (globalThis as any).document;
        const elementsToRemove = doc.querySelectorAll('script, style, nav, header, footer, iframe');
        elementsToRemove.forEach((el: any) => el.remove());

        return doc.body?.innerText ?? '';
    });

    // Normalize whitespace
    return text.replace(/\s+/g, ' ').trim();
}

// ─── Vendor Matching in Policy Text ──────────────────────────────

function matchVendorsInPolicy(
    policyText: string,
    registry: VendorRegistry
): Set<string> {
    const mentionedIds = new Set<string>();
    const normalizedText = policyText.toLowerCase();

    for (const vendor of registry.getAllVendors()) {
        // Match by vendor name
        if (normalizedText.includes(vendor.name.toLowerCase())) {
            mentionedIds.add(vendor.id);
            continue;
        }

        // Match by company name
        if (normalizedText.includes(vendor.company.toLowerCase())) {
            mentionedIds.add(vendor.id);
            continue;
        }

        // Match by domain
        for (const domain of vendor.domains) {
            if (normalizedText.includes(domain.toLowerCase())) {
                mentionedIds.add(vendor.id);
                break;
            }
        }
    }

    return mentionedIds;
}

// ─── Cross-Reference Logic ───────────────────────────────────────

function severityForUndisclosed(category: string, gdprCompliant: boolean): PolicyMismatch['severity'] {
    // Advertising/social trackers that aren't GDPR compliant are critical
    if (!gdprCompliant) return 'critical';
    if (category === 'advertising' || category === 'social') return 'critical';
    if (category === 'analytics' || category === 'heatmaps' || category === 'ab_testing') return 'high';
    if (category === 'tag_manager' || category === 'chat') return 'medium';
    // CDN, payments, fonts, consent, security — lower risk if undisclosed
    return 'low';
}

function crossReference(
    mentionedVendorIds: Set<string>,
    detectedVendors: DetectedVendor[],
    registry: VendorRegistry
): {
    undisclosed: PolicyMismatch[];
    overclaimed: PolicyMismatch[];
    disclosed: PolicyMismatch[];
} {
    const undisclosed: PolicyMismatch[] = [];
    const overclaimed: PolicyMismatch[] = [];
    const disclosed: PolicyMismatch[] = [];

    const detectedIds = new Set(detectedVendors.map((v) => v.vendor.id));

    // Detected but not mentioned → undisclosed
    for (const dv of detectedVendors) {
        const v = dv.vendor;
        if (mentionedVendorIds.has(v.id)) {
            disclosed.push({
                vendorId: v.id,
                vendorName: v.name,
                category: v.category,
                gdprCompliant: v.gdpr_compliant,
                severity: 'info',
                message: `${v.name} is both detected on site and disclosed in privacy policy`,
            });
        } else {
            // Skip low-risk infrastructure (CDN, consent, security, payments, fonts)
            const skipCategories = ['cdn', 'consent', 'security', 'payments', 'fonts'];
            if (skipCategories.includes(v.category)) continue;

            const severity = severityForUndisclosed(v.category, v.gdpr_compliant);
            undisclosed.push({
                vendorId: v.id,
                vendorName: v.name,
                category: v.category,
                gdprCompliant: v.gdpr_compliant,
                severity,
                message: `${v.name} (${v.category}) detected on site but NOT disclosed in privacy policy`,
            });
        }
    }

    // Mentioned but not detected → overclaimed (informational)
    for (const vendorId of mentionedVendorIds) {
        if (!detectedIds.has(vendorId)) {
            const v = registry.getById(vendorId);
            if (v) {
                overclaimed.push({
                    vendorId: v.id,
                    vendorName: v.name,
                    category: v.category,
                    gdprCompliant: v.gdpr_compliant,
                    severity: 'info',
                    message: `${v.name} is mentioned in privacy policy but was not detected during scan`,
                });
            }
        }
    }

    // Sort undisclosed by severity
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    undisclosed.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return { undisclosed, overclaimed, disclosed };
}

// ─── Disclosure Snippet Generation ───────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
    analytics: 'website analytics',
    advertising: 'advertising and conversion tracking',
    social: 'social media integration',
    tag_manager: 'tag management',
    heatmaps: 'heatmap and session recording',
    ab_testing: 'A/B testing',
    error_tracking: 'error monitoring',
    chat: 'live chat and customer support',
    video: 'video embedding',
    cdn: 'content delivery',
    payments: 'payment processing',
    consent: 'cookie consent management',
    security: 'security',
    fonts: 'web fonts',
    other: 'third-party services',
};

function generateDisclosures(
    undisclosed: PolicyMismatch[],
    registry: VendorRegistry
): VendorDisclosure[] {
    const disclosures: VendorDisclosure[] = [];

    for (const mismatch of undisclosed) {
        const vendor = registry.getById(mismatch.vendorId);
        if (!vendor) continue;

        const categoryLabel = CATEGORY_LABELS[vendor.category] ?? vendor.category;
        const dataList = vendor.data_collected.length > 0
            ? vendor.data_collected.join(', ')
            : 'usage data';

        let snippet = `We use ${vendor.name}`;
        if (vendor.company && vendor.company !== vendor.name) {
            snippet += ` (provided by ${vendor.company})`;
        }
        snippet += ` for ${categoryLabel}.`;
        snippet += ` This service may collect ${dataList}.`;

        if (vendor.retention_period) {
            snippet += ` Data is retained for ${vendor.retention_period}.`;
        }

        if (!vendor.gdpr_compliant) {
            snippet += ` Please note that this service may transfer data outside the EU/EEA.`;
        }

        if (vendor.privacy_policy) {
            snippet += ` For more information, see ${vendor.company || vendor.name}'s privacy policy at ${vendor.privacy_policy}.`;
        }

        disclosures.push({
            vendorId: vendor.id,
            vendorName: vendor.name,
            company: vendor.company,
            category: vendor.category,
            snippet,
            dataCollected: vendor.data_collected,
            privacyPolicyUrl: vendor.privacy_policy,
            dpaUrl: vendor.dpa_url,
        });
    }

    return disclosures;
}

// ─── Main Orchestrator ───────────────────────────────────────────

export async function checkPolicy(
    url: string,
    options: { timeout?: number; policyUrl?: string } = {}
): Promise<PolicyCheckResult> {
    const timeout = options.timeout ?? 30000;
    const registry = VendorRegistry.load();

    // Step 1: Run network scan to detect actual trackers
    const scanReport = await scanSite(url, { timeout, deep: false });
    const detectedVendors = scanReport.vendors;

    // Step 2: Find and parse privacy policy
    let browser: Browser | null = null;

    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
        });
        const page = await context.newPage();

        // Find or use provided policy URL
        let policyUrl = options.policyUrl ?? null;
        if (!policyUrl) {
            policyUrl = await findPolicyPage(page, url);
        }

        if (!policyUrl) {
            // No policy found — everything detected is undisclosed
            const result = crossReference(new Set(), detectedVendors, registry);
            const disclosures = generateDisclosures(result.undisclosed, registry);
            return {
                url,
                policyUrl: null,
                policyFound: false,
                mentionedVendors: [],
                detectedVendors: detectedVendors.map((dv) => ({
                    vendorId: dv.vendor.id,
                    vendorName: dv.vendor.name,
                    category: dv.vendor.category,
                })),
                ...result,
                disclosures,
                pass: false,
            };
        }

        // Extract and analyze policy text
        const policyText = await extractPolicyText(page, policyUrl);
        const mentionedVendorIds = matchVendorsInPolicy(policyText, registry);

        // Cross-reference
        const result = crossReference(mentionedVendorIds, detectedVendors, registry);
        const disclosures = generateDisclosures(result.undisclosed, registry);

        const mentionedVendors: PolicyVendorRef[] = [];
        for (const id of mentionedVendorIds) {
            const v = registry.getById(id);
            if (v) {
                mentionedVendors.push({
                    vendorId: v.id,
                    vendorName: v.name,
                    category: v.category,
                });
            }
        }

        return {
            url,
            policyUrl,
            policyFound: true,
            mentionedVendors,
            detectedVendors: detectedVendors.map((dv) => ({
                vendorId: dv.vendor.id,
                vendorName: dv.vendor.name,
                category: dv.vendor.category,
            })),
            ...result,
            disclosures,
            pass: result.undisclosed.length === 0,
        };
    } finally {
        await browser?.close();
    }
}
