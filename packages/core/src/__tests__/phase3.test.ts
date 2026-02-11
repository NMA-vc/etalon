import { describe, it, expect } from 'vitest';

// ─── Feature 1: GDPR Article Mapping ──────────────────────────────

import { enrichWithGdpr, GDPR_RULE_MAP } from '../audit/gdpr-articles.js';
import type { AuditFinding } from '../audit/types.js';

describe('GDPR Article Mapping', () => {
    it('maps every known rule to at least one GDPR article', () => {
        const knownRules = [
            'tracker-dependency', 'tracker-import', 'tracker-api-call',
            'tracker-http-call', 'tracker-env-var', 'hardcoded-tracker',
            'inline-tracker', 'tracker-middleware', 'unconditional-tracker',
            'analytics-proxy', 'server-side-tracking', 'cname-cloaking',
            'pii-column', 'pii-field-type', 'storage-pii', 'logging-pii',
            'no-retention-policy', 'cookie-no-consent', 'cookie-insecure',
            'cookie-samesite', 'missing-csp', 'csp-unsafe-inline',
            'csp-unsafe-eval', 'cors-wildcard', 'cors-credentials-wildcard',
            'missing-security-headers', 'no-ssl', 'debug-mode',
        ];

        for (const rule of knownRules) {
            const articles = GDPR_RULE_MAP[rule];
            expect(articles, `Rule '${rule}' should map to GDPR articles`).toBeDefined();
            expect(articles.length).toBeGreaterThan(0);
            expect(articles[0].article).toBeTruthy();
            expect(articles[0].url).toContain('gdpr-info.eu');
        }
    });

    it('enriches findings with GDPR references', () => {
        const findings: AuditFinding[] = [
            {
                id: 'test-1', category: 'code', severity: 'high',
                title: 'Tracker', message: 'Found tracker', file: 'app.ts',
                rule: 'tracker-import',
            },
            {
                id: 'test-2', category: 'config', severity: 'low',
                title: 'Unknown rule', message: 'test', file: 'x.ts',
                rule: 'nonexistent-rule',
            },
        ];

        const enriched = enrichWithGdpr(findings);
        expect(enriched[0].gdprArticles).toBeDefined();
        expect(enriched[0].gdprArticles!.length).toBeGreaterThan(0);
        expect(enriched[0].gdprArticles![0].article).toBe('6(1)(a)');
        // Unknown rule should not have articles
        expect(enriched[1].gdprArticles).toBeUndefined();
    });
});

// ─── Feature 2: Compliance Score ──────────────────────────────────

import { calculateScore, gradeColor } from '../audit/scoring.js';
import type { AuditReport } from '../audit/types.js';

function makeReport(findings: Array<{ severity: string }>): AuditReport {
    return {
        meta: { etalonVersion: '1.0.0', auditDate: '', auditDurationMs: 0, directory: '.', stack: { languages: ['typescript'], framework: 'none', orm: 'none', packageManager: 'npm', detectedFiles: [] } },
        summary: { totalFindings: findings.length, critical: 0, high: 0, medium: 0, low: 0, info: 0, trackerSdksFound: 0, piiColumnsFound: 0, configIssues: 0 },
        findings: findings.map((f, i) => ({ id: `f${i}`, category: 'code' as const, severity: f.severity as any, title: '', message: '', file: '', rule: '' })),
        recommendations: [],
    };
}

describe('Compliance Score', () => {
    it('scores perfect with no findings', () => {
        const score = calculateScore(makeReport([]));
        expect(score.score).toBe(100);
        expect(score.grade).toBe('A');
    });

    it('deducts 25 points per critical finding', () => {
        const score = calculateScore(makeReport([{ severity: 'critical' }]));
        expect(score.score).toBe(75);
        expect(score.grade).toBe('B');
    });

    it('grades F for many critical findings', () => {
        const score = calculateScore(makeReport([
            { severity: 'critical' }, { severity: 'critical' },
            { severity: 'critical' }, { severity: 'critical' },
            { severity: 'critical' },
        ]));
        expect(score.score).toBe(0);
        expect(score.grade).toBe('F');
    });

    it('returns correct colors for each grade', () => {
        expect(gradeColor('A')).toBe('#4caf50');
        expect(gradeColor('F')).toBe('#f44336');
    });
});

// ─── Feature 5: Badge ─────────────────────────────────────────────

import { generateBadgeSvg, badgeMarkdown } from '../audit/badge.js';

describe('Compliance Badge', () => {
    it('generates valid SVG', () => {
        const svg = generateBadgeSvg({ score: 85, grade: 'B', breakdown: { critical: 0, high: 1, medium: 2, low: 0, info: 0 } });
        expect(svg).toContain('<svg');
        expect(svg).toContain('ETALON');
        expect(svg).toContain('B (85)');
    });

    it('generates markdown badge link', () => {
        const md = badgeMarkdown('NMA-vc', 'etalon');
        expect(md).toContain('etalon.nma.vc/badge/github/NMA-vc/etalon');
        expect(md).toContain('![');
    });
});

// ─── Feature 7: Auto-fixer ───────────────────────────────────────

import { generatePatches, fixableRules } from '../audit/auto-fixer.js';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Auto-fixer', () => {
    it('lists fixable rules', () => {
        const rules = fixableRules();
        expect(rules).toContain('cookie-samesite');
        expect(rules).toContain('csp-unsafe-eval');
    });

    it('generates a patch for csp-unsafe-eval', () => {
        const dir = join(tmpdir(), 'etalon-test-fix-' + Date.now());
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'app.js'), "res.setHeader('Content-Security-Policy', \"default-src 'self' 'unsafe-eval'\");");

        const findings: AuditFinding[] = [{
            id: 'fix-1', category: 'config', severity: 'high',
            title: 'CSP unsafe-eval', message: 'test', file: 'app.js',
            line: 1, rule: 'csp-unsafe-eval',
        }];

        const patches = generatePatches(findings, dir);
        expect(patches.length).toBe(1);
        expect(patches[0].newContent).not.toContain("'unsafe-eval'");
        expect(patches[0].description).toContain("'unsafe-eval'");

        rmSync(dir, { recursive: true });
    });
});

// ─── Feature 9: Plugin System ─────────────────────────────────────

import { loadCustomRules, scanWithCustomRules } from '../audit/plugin-loader.js';

describe('Plugin System', () => {
    it('loads custom rules from YAML files', () => {
        const dir = join(tmpdir(), 'etalon-test-plugin-' + Date.now());
        const rulesDir = join(dir, '.etalon', 'rules');
        mkdirSync(rulesDir, { recursive: true });

        writeFileSync(join(rulesDir, 'internal-tracker.yaml'), `
name: internal-tracker
description: Internal analytics endpoint
severity: medium
patterns:
  - regex: 'fetch.*\\/api\\/analytics'
    languages: [javascript, typescript]
    message: "Internal analytics endpoint — ensure consent"
gdpr_articles: ["6(1)(a)"]
`);

        const rules = loadCustomRules(dir);
        expect(rules.length).toBe(1);
        expect(rules[0].name).toBe('internal-tracker');
        expect(rules[0].severity).toBe('medium');

        rmSync(dir, { recursive: true });
    });

    it('scans files with custom rules and produces findings', () => {
        const dir = join(tmpdir(), 'etalon-test-plugin-scan-' + Date.now());
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'app.ts'), "fetch('/api/analytics', { method: 'POST' });");

        const rules = [{
            name: 'test-tracker',
            description: 'Test analytics',
            severity: 'medium' as const,
            patterns: [{ regex: 'fetch.*\\/api\\/analytics', message: 'Found internal tracker' }],
        }];

        const findings = scanWithCustomRules(['app.ts'], dir, rules);
        expect(findings.length).toBe(1);
        expect(findings[0].rule).toBe('custom/test-tracker');

        rmSync(dir, { recursive: true });
    });
});

// ─── Feature 10: Data Flow Analyzer ──────────────────────────────

import { analyzeDataFlow, toMermaid, toTextSummary } from '../audit/data-flow-analyzer.js';

describe('Data Flow Analyzer', () => {
    it('detects PII source → storage → sink flow', () => {
        const dir = join(tmpdir(), 'etalon-test-flow-' + Date.now());
        mkdirSync(dir, { recursive: true });

        // Source — req.body with email (matches SOURCE_PATTERNS)
        writeFileSync(join(dir, 'handler.ts'), `
            const email = req.body.email;
        `);

        // Storage — ORM Column() with email (matches STORAGE_PATTERNS)
        writeFileSync(join(dir, 'entity.ts'), `
            @Column('email')
            email: string;
        `);

        // Sink — tracker SDK with email (matches SINK_PATTERNS)
        writeFileSync(join(dir, 'track.ts'), `
            analytics.identify({ email: user.email });
        `);

        const flow = analyzeDataFlow(['handler.ts', 'entity.ts', 'track.ts'], dir);
        expect(flow.nodes.length).toBeGreaterThan(0);

        const sources = flow.nodes.filter(n => n.type === 'source');
        const storage = flow.nodes.filter(n => n.type === 'storage');
        const sinks = flow.nodes.filter(n => n.type === 'sink');

        expect(sources.length).toBeGreaterThan(0);
        expect(storage.length).toBeGreaterThan(0);
        expect(sinks.length).toBeGreaterThan(0);
        expect(flow.edges.length).toBeGreaterThan(0);

        rmSync(dir, { recursive: true });
    });

    it('produces valid Mermaid output', () => {
        const dir = join(tmpdir(), 'etalon-test-mermaid-' + Date.now());
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'app.ts'), "analytics.track({ email: 'test' });");

        const flow = analyzeDataFlow(['app.ts'], dir);
        const mermaid = toMermaid(flow);
        expect(mermaid).toContain('graph LR');

        rmSync(dir, { recursive: true });
    });

    it('produces text summary', () => {
        const flow = { nodes: [], edges: [] };
        const text = toTextSummary(flow);
        expect(text).toContain('No PII data flows detected');
    });
});
