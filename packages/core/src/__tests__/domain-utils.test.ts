import { describe, it, expect } from 'vitest';
import { extractDomain, getParentDomains, isFirstParty, normalizeUrl } from '../domain-utils.js';

describe('extractDomain', () => {
    it('extracts domain from a standard HTTPS URL', () => {
        expect(extractDomain('https://www.google-analytics.com/analytics.js')).toBe('www.google-analytics.com');
    });

    it('extracts domain from HTTP URL', () => {
        expect(extractDomain('http://example.com/page')).toBe('example.com');
    });

    it('lowercases the domain', () => {
        expect(extractDomain('https://WWW.Example.COM/path')).toBe('www.example.com');
    });

    it('returns null for data URIs', () => {
        expect(extractDomain('data:text/html,<h1>hello</h1>')).toBeNull();
    });

    it('returns null for blob URIs', () => {
        expect(extractDomain('blob:https://example.com/uuid')).toBeNull();
    });

    it('returns null for about URIs', () => {
        expect(extractDomain('about:blank')).toBeNull();
    });

    it('returns null for invalid strings', () => {
        expect(extractDomain('not a url')).toBeNull();
    });

    it('returns null for empty string', () => {
        expect(extractDomain('')).toBeNull();
    });

    it('handles URLs with ports', () => {
        expect(extractDomain('https://localhost:3000/api')).toBe('localhost');
    });

    it('handles URLs with authentication', () => {
        expect(extractDomain('https://user:pass@example.com/path')).toBe('example.com');
    });
});

describe('getParentDomains', () => {
    it('returns parent domains for a subdomain', () => {
        expect(getParentDomains('ssl.google-analytics.com')).toEqual(['google-analytics.com']);
    });

    it('returns multiple parent levels', () => {
        expect(getParentDomains('a.b.c.example.com')).toEqual([
            'b.c.example.com',
            'c.example.com',
            'example.com',
        ]);
    });

    it('returns empty array for a two-part domain', () => {
        expect(getParentDomains('example.com')).toEqual([]);
    });

    it('returns empty array for TLD', () => {
        expect(getParentDomains('com')).toEqual([]);
    });

    it('handles www prefix', () => {
        expect(getParentDomains('www.facebook.com')).toEqual(['facebook.com']);
    });
});

describe('isFirstParty', () => {
    it('matches exact domain', () => {
        expect(isFirstParty('example.com', 'example.com')).toBe(true);
    });

    it('matches subdomain as first-party', () => {
        expect(isFirstParty('cdn.example.com', 'example.com')).toBe(true);
    });

    it('matches deep subdomain as first-party', () => {
        expect(isFirstParty('a.b.c.example.com', 'example.com')).toBe(true);
    });

    it('rejects different domain', () => {
        expect(isFirstParty('google.com', 'example.com')).toBe(false);
    });

    it('rejects partial domain match', () => {
        expect(isFirstParty('badexample.com', 'example.com')).toBe(false);
    });

    it('is case-insensitive', () => {
        expect(isFirstParty('CDN.Example.COM', 'example.com')).toBe(true);
    });

    it('rejects reverse subdomain relationship', () => {
        expect(isFirstParty('example.com', 'cdn.example.com')).toBe(false);
    });
});

describe('normalizeUrl', () => {
    it('adds https:// to bare domain', () => {
        expect(normalizeUrl('example.com')).toBe('https://example.com');
    });

    it('preserves existing https://', () => {
        expect(normalizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('preserves existing http://', () => {
        expect(normalizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('trims whitespace', () => {
        expect(normalizeUrl('  example.com  ')).toBe('https://example.com');
    });
});
