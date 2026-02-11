import { describe, it, expect } from 'vitest';
import { loadConfig, isAllowed } from '../config.js';
import { formatJson } from '../formatters/json.js';
import { formatSarif } from '../formatters/sarif.js';
import type { ScanReport } from '@etalon/core';

// ─── Config tests ──────────────────────────────────────────────

describe('loadConfig', () => {
    it('returns null when no config file exists', () => {
        const config = loadConfig('/tmp/nonexistent-dir-etalon');
        expect(config).toBeNull();
    });
});

describe('isAllowed', () => {
    it('matches by vendor_id', () => {
        const allowlist = [{ vendor_id: 'google-analytics', reason: 'OK' }];
        expect(isAllowed('google-analytics', 'analytics.google.com', allowlist)).toBe(true);
        expect(isAllowed('facebook-pixel', 'facebook.com', allowlist)).toBe(false);
    });

    it('matches by domain suffix', () => {
        const allowlist = [{ domain: 'cdn.shopify.com', reason: 'CDN' }];
        expect(isAllowed(undefined, 'cdn.shopify.com', allowlist)).toBe(true);
        expect(isAllowed(undefined, 'assets.cdn.shopify.com', allowlist)).toBe(true);
        expect(isAllowed(undefined, 'evil.com', allowlist)).toBe(false);
    });

    it('returns false for empty allowlist', () => {
        expect(isAllowed('google-analytics', 'ga.com', [])).toBe(false);
    });
});

// ─── Formatter tests ───────────────────────────────────────────

const mockReport: ScanReport = {
    meta: {
        etalonVersion: '1.0.0',
        scanDate: '2025-02-10T12:00:00Z',
        scanDurationMs: 4200,
        url: 'https://example.com',
        deep: false,
    },
    summary: {
        totalRequests: 50,
        thirdPartyRequests: 14,
        knownVendors: 3,
        unknownDomains: 2,
        highRisk: 1,
        mediumRisk: 1,
        lowRisk: 1,
    },
    vendors: [
        {
            vendor: {
                id: 'facebook-pixel',
                domains: ['facebook.com'],
                name: 'Facebook Pixel',
                company: 'Meta',
                category: 'advertising',
                gdpr_compliant: true,
                dpa_url: 'https://facebook.com/dpa',
                privacy_policy: 'https://facebook.com/privacy',
                purpose: 'Ad tracking',
                data_collected: ['cookies', 'IP address'],
                risk_score: 7,
                alternatives: [],
            },
            requests: [
                { url: 'https://facebook.com/tr', domain: 'facebook.com', method: 'GET', type: 'script', timestamp: '2025-02-10T12:00:01Z' },
            ],
        },
        {
            vendor: {
                id: 'google-analytics',
                domains: ['google-analytics.com'],
                name: 'Google Analytics',
                company: 'Google',
                category: 'analytics',
                gdpr_compliant: true,
                purpose: 'Analytics',
                data_collected: ['page views'],
                risk_score: 3,
                alternatives: ['plausible'],
            },
            requests: [
                { url: 'https://google-analytics.com/collect', domain: 'google-analytics.com', method: 'POST', type: 'xhr', timestamp: '2025-02-10T12:00:02Z' },
            ],
        },
        {
            vendor: {
                id: 'sentry',
                domains: ['sentry.io'],
                name: 'Sentry',
                company: 'Sentry',
                category: 'error_tracking',
                gdpr_compliant: true,
                purpose: 'Error tracking',
                data_collected: ['errors'],
                risk_score: 2,
            },
            requests: [
                { url: 'https://sentry.io/api', domain: 'sentry.io', method: 'POST', type: 'xhr', timestamp: '2025-02-10T12:00:03Z' },
            ],
        },
    ],
    unknown: [
        {
            domain: 'mystery-tracker.com',
            requests: [{ url: 'https://mystery-tracker.com/pixel', domain: 'mystery-tracker.com', method: 'GET', type: 'image', timestamp: '2025-02-10T12:00:04Z' }],
            suggestedAction: 'submit_for_review',
        },
    ],
    recommendations: [
        { type: 'high_risk_vendor', vendorId: 'facebook-pixel', message: 'Facebook Pixel is high risk' },
    ],
};

describe('formatJson', () => {
    it('produces valid JSON with expected structure', () => {
        const output = formatJson(mockReport);
        const parsed = JSON.parse(output);

        expect(parsed.meta.etalon_version).toBe('1.0.0');
        expect(parsed.meta.url).toBe('https://example.com');
        expect(parsed.summary.known_vendors).toBe(3);
        expect(parsed.summary.high_risk).toBe(1);
        expect(parsed.vendors).toHaveLength(3);
        expect(parsed.vendors[0].vendor_id).toBe('facebook-pixel');
        expect(parsed.vendors[0].risk_level).toBe('high');
        expect(parsed.vendors[1].risk_level).toBe('medium');
        expect(parsed.vendors[2].risk_level).toBe('low');
        expect(parsed.unknown).toHaveLength(1);
        expect(parsed.recommendations).toHaveLength(1);
    });

    it('includes request details', () => {
        const parsed = JSON.parse(formatJson(mockReport));
        expect(parsed.vendors[0].requests[0].url).toBe('https://facebook.com/tr');
        expect(parsed.vendors[0].requests[0].method).toBe('GET');
    });
});

describe('formatSarif', () => {
    it('produces valid SARIF 2.1.0', () => {
        const output = formatSarif(mockReport);
        const parsed = JSON.parse(output);

        expect(parsed.version).toBe('2.1.0');
        expect(parsed.$schema).toContain('sarif-schema-2.1.0');
        expect(parsed.runs).toHaveLength(1);
        expect(parsed.runs[0].tool.driver.name).toBe('ETALON');
    });

    it('includes high-risk findings as warnings', () => {
        const parsed = JSON.parse(formatSarif(mockReport));
        const results = parsed.runs[0].results;
        const highRisk = results.filter((r: Record<string, string>) => r.ruleId === 'high-risk-tracker');
        expect(highRisk).toHaveLength(1);
        expect(highRisk[0].level).toBe('warning');
        expect(highRisk[0].message.text).toContain('Facebook Pixel');
    });

    it('includes medium-risk findings as notes', () => {
        const parsed = JSON.parse(formatSarif(mockReport));
        const results = parsed.runs[0].results;
        const medRisk = results.filter((r: Record<string, string>) => r.ruleId === 'medium-risk-tracker');
        expect(medRisk).toHaveLength(1);
        expect(medRisk[0].level).toBe('note');
    });

    it('includes unknown domain findings', () => {
        const parsed = JSON.parse(formatSarif(mockReport));
        const results = parsed.runs[0].results;
        const unknown = results.filter((r: Record<string, string>) => r.ruleId === 'unknown-tracker');
        expect(unknown).toHaveLength(1);
        expect(unknown[0].message.text).toContain('mystery-tracker.com');
    });
});
