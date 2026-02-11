/**
 * Domain utility functions for URL parsing and domain matching.
 */

/**
 * Extract the hostname (domain) from a URL string.
 * Returns null for invalid URLs, data URIs, etc.
 */
export function extractDomain(url: string): string | null {
    try {
        // Skip non-HTTP(S) URLs
        if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('about:')) {
            return null;
        }

        const parsed = new URL(url);
        return parsed.hostname.toLowerCase();
    } catch {
        return null;
    }
}

/**
 * Get all parent domains of a given hostname.
 * e.g., "ssl.google-analytics.com" → ["google-analytics.com", "com"]
 * 
 * Stops at TLD level (single-label domains are excluded from results).
 */
export function getParentDomains(domain: string): string[] {
    const parts = domain.split('.');
    const parents: string[] = [];

    // Start from one level up, stop before TLD
    for (let i = 1; i < parts.length - 1; i++) {
        parents.push(parts.slice(i).join('.'));
    }

    return parents;
}

/**
 * Check if a request domain is first-party relative to the scanned site.
 * First-party means the domain is the same or a subdomain of the site domain.
 */
export function isFirstParty(requestDomain: string, siteDomain: string): boolean {
    const reqLower = requestDomain.toLowerCase();
    const siteLower = siteDomain.toLowerCase();

    // Exact match
    if (reqLower === siteLower) return true;

    // Subdomain of site (e.g., cdn.example.com is first-party for example.com)
    if (reqLower.endsWith('.' + siteLower)) return true;

    // Site is subdomain of request domain (e.g., example.com loading from cdn.example.com)
    // This shouldn't count as first-party, so we don't check the reverse.

    return false;
}

/**
 * Normalize a URL for consistent processing.
 * Adds https:// if no protocol is specified.
 */
export function normalizeUrl(url: string): string {
    let normalized = url.trim();

    if (!normalized.match(/^https?:\/\//i)) {
        normalized = 'https://' + normalized;
    }

    return normalized;
}
