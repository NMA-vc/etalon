import { describe, it, expect } from 'vitest';
import { VendorRegistry } from '../vendor-registry.js';
import type { VendorDatabase } from '../types.js';

const testDb: VendorDatabase = {
    version: '1.0',
    last_updated: '2025-02-10T00:00:00Z',
    vendors: [
        {
            id: 'google-analytics',
            domains: ['google-analytics.com', 'www.google-analytics.com', 'ssl.google-analytics.com'],
            name: 'Google Analytics',
            company: 'Google LLC',
            category: 'analytics',
            gdpr_compliant: true,
            dpa_url: 'https://privacy.google.com/businesses/processorterms/',
            privacy_policy: 'https://policies.google.com/privacy',
            purpose: 'Web analytics and user behavior tracking',
            data_collected: ['IP address', 'cookies', 'page views', 'user agent'],
            retention_period: '26 months (configurable)',
            last_verified: '2025-01-15',
            risk_score: 3,
            alternatives: ['plausible', 'fathom', 'matomo'],
        },
        {
            id: 'facebook-pixel',
            domains: ['facebook.com', 'www.facebook.com', 'connect.facebook.net'],
            name: 'Facebook Pixel',
            company: 'Meta Platforms Inc.',
            category: 'advertising',
            gdpr_compliant: true,
            dpa_url: 'https://www.facebook.com/legal/terms/dataprocessing',
            privacy_policy: 'https://www.facebook.com/policy.php',
            purpose: 'Conversion tracking and retargeting',
            data_collected: ['cookies', 'IP address', 'browsing behavior'],
            risk_score: 7,
        },
        {
            id: 'sentry',
            domains: ['sentry.io', 'browser.sentry-cdn.com'],
            name: 'Sentry',
            company: 'Functional Software Inc.',
            category: 'error_tracking',
            gdpr_compliant: true,
            purpose: 'Error monitoring and crash reporting',
            data_collected: ['error data', 'user agent'],
            risk_score: 2,
        },
    ],
    categories: [
        {
            id: 'analytics',
            name: 'Analytics',
            description: 'Tools for measuring website traffic',
            risk_level: 'medium',
        },
        {
            id: 'advertising',
            name: 'Advertising',
            description: 'Ad networks and retargeting',
            risk_level: 'high',
        },
        {
            id: 'error_tracking',
            name: 'Error Tracking',
            description: 'Error monitoring tools',
            risk_level: 'low',
        },
    ],
};

describe('VendorRegistry', () => {
    const registry = VendorRegistry.fromDatabase(testDb);

    describe('lookupDomain', () => {
        it('finds vendor by exact domain', () => {
            const result = registry.lookupDomain('google-analytics.com');
            expect(result).not.toBeNull();
            expect(result!.id).toBe('google-analytics');
        });

        it('finds vendor by subdomain listed in domains', () => {
            const result = registry.lookupDomain('ssl.google-analytics.com');
            expect(result).not.toBeNull();
            expect(result!.id).toBe('google-analytics');
        });

        it('finds vendor by parent domain traversal', () => {
            const result = registry.lookupDomain('tracking.facebook.com');
            expect(result).not.toBeNull();
            expect(result!.id).toBe('facebook-pixel');
        });

        it('is case-insensitive', () => {
            const result = registry.lookupDomain('Google-Analytics.COM');
            expect(result).not.toBeNull();
            expect(result!.id).toBe('google-analytics');
        });

        it('returns null for unknown domain', () => {
            expect(registry.lookupDomain('unknown-tracker.com')).toBeNull();
        });

        it('accepts full URLs', () => {
            const result = registry.lookupDomain('https://www.google-analytics.com/analytics.js');
            expect(result).not.toBeNull();
            expect(result!.id).toBe('google-analytics');
        });

        it('returns null for data URIs', () => {
            expect(registry.lookupDomain('data:text/plain,hello')).toBeNull();
        });

        it('handles CDN domains', () => {
            const result = registry.lookupDomain('browser.sentry-cdn.com');
            expect(result).not.toBeNull();
            expect(result!.id).toBe('sentry');
        });
    });

    describe('getByCategory', () => {
        it('returns vendors in the analytics category', () => {
            const results = registry.getByCategory('analytics');
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe('google-analytics');
        });

        it('returns empty array for category with no vendors', () => {
            const results = registry.getByCategory('cdn');
            expect(results).toHaveLength(0);
        });
    });

    describe('getCompliant', () => {
        it('returns only GDPR-compliant vendors', () => {
            const results = registry.getCompliant();
            expect(results).toHaveLength(3);
            expect(results.every((v) => v.gdpr_compliant)).toBe(true);
        });
    });

    describe('getCategories', () => {
        it('returns all categories', () => {
            const cats = registry.getCategories();
            expect(cats).toHaveLength(3);
            expect(cats.map((c) => c.id)).toContain('analytics');
        });
    });

    describe('search', () => {
        it('searches by vendor name', () => {
            const results = registry.search('google');
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe('google-analytics');
        });

        it('searches by company name', () => {
            const results = registry.search('meta');
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe('facebook-pixel');
        });

        it('searches by vendor id', () => {
            const results = registry.search('sentry');
            expect(results).toHaveLength(1);
        });

        it('is case-insensitive', () => {
            const results = registry.search('GOOGLE');
            expect(results).toHaveLength(1);
        });

        it('returns empty for no match', () => {
            expect(registry.search('nonexistent')).toHaveLength(0);
        });
    });

    describe('getById', () => {
        it('returns vendor by ID', () => {
            const vendor = registry.getById('sentry');
            expect(vendor).not.toBeNull();
            expect(vendor!.name).toBe('Sentry');
        });

        it('returns null for unknown ID', () => {
            expect(registry.getById('nonexistent')).toBeNull();
        });
    });

    describe('getMetadata', () => {
        it('returns correct metadata', () => {
            const meta = registry.getMetadata();
            expect(meta.version).toBe('1.0');
            expect(meta.vendorCount).toBe(3);
            expect(meta.categoryCount).toBe(3);
            expect(meta.domainCount).toBe(8); // all domains across all vendors
        });
    });
});
