import type { AuditFinding } from './types.js';

// ─── GDPR Article Reference ───────────────────────────────────────

export interface GdprReference {
    article: string;
    title: string;
    url: string;
}

const GDPR_BASE = 'https://gdpr-info.eu/art-';

function art(article: string, title: string): GdprReference {
    const num = article.replace(/\(.*/, '');
    return { article, title, url: `${GDPR_BASE}${num}-gdpr/` };
}

// ─── Rule → GDPR Article Mapping ─────────────────────────────────

export const GDPR_RULE_MAP: Record<string, GdprReference[]> = {
    // ── Tracker detection ──────────────────────────────────
    'tracker-dependency': [
        art('6(1)(a)', 'Lawfulness — Consent'),
        art('7', 'Conditions for Consent'),
    ],
    'tracker-import': [
        art('6(1)(a)', 'Lawfulness — Consent'),
        art('7', 'Conditions for Consent'),
    ],
    'tracker-api-call': [
        art('6(1)(a)', 'Lawfulness — Consent'),
        art('5(1)(a)', 'Lawfulness, Fairness, Transparency'),
    ],
    'tracker-http-call': [
        art('6(1)(a)', 'Lawfulness — Consent'),
        art('5(1)(a)', 'Lawfulness, Fairness, Transparency'),
    ],
    'tracker-env-var': [
        art('6(1)(a)', 'Lawfulness — Consent'),
    ],
    'hardcoded-tracker': [
        art('6(1)(a)', 'Lawfulness — Consent'),
        art('25', 'Data Protection by Design and by Default'),
    ],
    'inline-tracker': [
        art('6(1)(a)', 'Lawfulness — Consent'),
        art('7', 'Conditions for Consent'),
    ],
    'tracker-middleware': [
        art('6(1)(a)', 'Lawfulness — Consent'),
        art('25', 'Data Protection by Design and by Default'),
    ],
    'unconditional-tracker': [
        art('6(1)(a)', 'Lawfulness — Consent'),
        art('7(1)', 'Demonstrable Consent'),
    ],
    'analytics-proxy': [
        art('5(1)(a)', 'Lawfulness, Fairness, Transparency'),
        art('25', 'Data Protection by Design and by Default'),
    ],

    // ── Server-side & CNAME ────────────────────────────────
    'server-side-tracking': [
        art('5(1)(a)', 'Lawfulness, Fairness, Transparency'),
        art('25', 'Data Protection by Design and by Default'),
        art('6(1)(a)', 'Lawfulness — Consent'),
    ],
    'cname-cloaking': [
        art('5(1)(a)', 'Lawfulness, Fairness, Transparency'),
        art('7(1)', 'Demonstrable Consent'),
        art('12', 'Transparent Information and Communication'),
        art('25', 'Data Protection by Design and by Default'),
    ],

    // ── PII & Data ─────────────────────────────────────────
    'pii-column': [
        art('5(1)(c)', 'Data Minimisation'),
        art('5(1)(e)', 'Storage Limitation'),
        art('32', 'Security of Processing'),
    ],
    'pii-field-type': [
        art('5(1)(c)', 'Data Minimisation'),
        art('25', 'Data Protection by Design and by Default'),
    ],
    'storage-pii': [
        art('5(1)(f)', 'Integrity and Confidentiality'),
        art('32', 'Security of Processing'),
    ],
    'logging-pii': [
        art('5(1)(f)', 'Integrity and Confidentiality'),
        art('5(1)(e)', 'Storage Limitation'),
    ],
    'no-retention-policy': [
        art('5(1)(e)', 'Storage Limitation'),
        art('13(2)(a)', 'Right to Information — Retention Period'),
    ],

    // ── Cookies ────────────────────────────────────────────
    'cookie-no-consent': [
        art('6(1)(a)', 'Lawfulness — Consent'),
        art('7', 'Conditions for Consent'),
    ],
    'cookie-insecure': [
        art('5(1)(f)', 'Integrity and Confidentiality'),
        art('32', 'Security of Processing'),
    ],
    'cookie-samesite': [
        art('5(1)(f)', 'Integrity and Confidentiality'),
        art('32', 'Security of Processing'),
    ],

    // ── Security / Config ──────────────────────────────────
    'missing-csp': [
        art('32', 'Security of Processing'),
    ],
    'csp-unsafe-inline': [
        art('32', 'Security of Processing'),
    ],
    'csp-unsafe-eval': [
        art('32', 'Security of Processing'),
    ],
    'cors-wildcard': [
        art('32', 'Security of Processing'),
    ],
    'cors-credentials-wildcard': [
        art('32', 'Security of Processing'),
        art('5(1)(f)', 'Integrity and Confidentiality'),
    ],
    'missing-security-headers': [
        art('32', 'Security of Processing'),
    ],
    'no-ssl': [
        art('32', 'Security of Processing'),
        art('5(1)(f)', 'Integrity and Confidentiality'),
    ],
    'debug-mode': [
        art('32', 'Security of Processing'),
        art('5(1)(f)', 'Integrity and Confidentiality'),
    ],
};

// ─── Enrichment ───────────────────────────────────────────────────

/**
 * Enrich findings with GDPR article references.
 */
export function enrichWithGdpr(findings: AuditFinding[]): AuditFinding[] {
    return findings.map(f => {
        const articles = GDPR_RULE_MAP[f.rule];
        if (articles && articles.length > 0) {
            return { ...f, gdprArticles: articles };
        }
        return f;
    });
}
