import type { AuditReport, AuditFinding, FindingSeverity } from './types.js';

/**
 * Format an AuditReport as SARIF 2.1.0.
 * Compatible with GitHub Code Scanning and other SARIF consumers.
 * Spec: https://sarifweb.azurewebsites.net/
 */
export function formatAuditSarif(report: AuditReport): string {
    const sarif = {
        $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
        version: '2.1.0' as const,
        runs: [
            {
                tool: {
                    driver: {
                        name: 'ETALON',
                        version: report.meta.etalonVersion,
                        informationUri: 'https://github.com/NMA-vc/etalon',
                        rules: generateRules(report.findings),
                    },
                },
                results: generateResults(report.findings),
            },
        ],
    };

    return JSON.stringify(sarif, null, 2);
}

// ─── SARIF Level Mapping ───────────────────────────────────────────

function toSarifLevel(severity: FindingSeverity): 'error' | 'warning' | 'note' {
    switch (severity) {
        case 'critical':
        case 'high':
            return 'error';
        case 'medium':
            return 'warning';
        case 'low':
        case 'info':
        default:
            return 'note';
    }
}

// ─── Rule Generation ───────────────────────────────────────────────

const RULE_DESCRIPTIONS: Record<string, string> = {
    'tracker-dependency': 'Third-party tracking SDK detected in dependencies',
    'tracker-import': 'Tracker SDK import found in source code',
    'tracker-api-call': 'Call to a tracker API function detected',
    'tracker-env-var': 'Tracker-related environment variable detected',
    'hardcoded-tracker': 'Hardcoded tracking pixel or script found',
    'cookie-no-consent': 'Cookie written without consent check',
    'storage-pii': 'PII stored in localStorage or sessionStorage',
    'pii-column': 'Potential PII stored in database column',
    'no-retention-policy': 'Database table with PII lacks a retention policy',
    'pii-no-encryption': 'PII column without encryption hint',
    'cookie-insecure': 'Cookie missing Secure flag',
    'cookie-httponly': 'Cookie missing HttpOnly flag',
    'cookie-samesite': 'Cookie missing SameSite attribute',
    'cors-wildcard': 'Overly permissive CORS configuration',
    'cors-credentials-wildcard': 'CORS credentials allowed with wildcard origin',
    'missing-csp': 'Missing Content-Security-Policy header',
    'csp-unsafe-inline': "CSP allows 'unsafe-inline'",
    'csp-unsafe-eval': "CSP allows 'unsafe-eval'",
    'debug-mode': 'Debug mode enabled in production',
    'logging-pii': 'PII detected in logging statements',
    'inline-tracker': 'Inline tracking script reference detected',
    'server-side-tracking': 'Server-side call to a tracking service endpoint',
    'cname-cloaking': 'CNAME cloaking detected — third-party tracker hidden behind first-party domain',
};

function generateRules(findings: AuditFinding[]) {
    const uniqueRules = new Set(findings.map((f) => f.rule));

    return Array.from(uniqueRules).map((rule) => ({
        id: rule,
        shortDescription: {
            text: RULE_DESCRIPTIONS[rule] ?? rule.replace(/[-_]/g, ' '),
        },
        helpUri: `https://github.com/NMA-vc/etalon/blob/main/docs/rules/${rule}.md`,
        defaultConfiguration: {
            level: toSarifLevel(
                findings.find((f) => f.rule === rule)?.severity ?? 'info',
            ),
        },
    }));
}

// ─── Result Generation ─────────────────────────────────────────────

function generateResults(findings: AuditFinding[]) {
    return findings.map((finding) => ({
        ruleId: finding.rule,
        level: toSarifLevel(finding.severity),
        message: { text: finding.message },
        locations: [
            {
                physicalLocation: {
                    artifactLocation: { uri: finding.file },
                    region: {
                        startLine: finding.line ?? 1,
                        startColumn: finding.column ?? 1,
                    },
                },
            },
        ],
        ...(finding.fix && {
            fixes: [
                {
                    description: { text: finding.fix },
                },
            ],
        }),
        properties: {
            category: finding.category,
            severity: finding.severity,
            ...(finding.vendorId && { vendorId: finding.vendorId }),
        },
    }));
}
