import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { formatAuditSarif } from '../audit/sarif-formatter.js';
import { diffReports, shouldBlock } from '../audit/diff-analyzer.js';
import { isGitRepo } from '../audit/git-blame.js';
import { scanServerTracking } from '../audit/server-tracker-scanner.js';
import { scanCnameCloaking } from '../audit/cname-cloaking-scanner.js';
import type { AuditReport, AuditFinding, StackInfo } from '../audit/types.js';

// ─── Test Helpers ──────────────────────────────────────────────────

const FIXTURE_DIR = join(__dirname, '__fixtures_2b__');

function createFixture(path: string, content: string): string {
    const fullPath = join(FIXTURE_DIR, path);
    const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
    mkdirSync(dir, { recursive: true });
    writeFileSync(fullPath, content, 'utf-8');
    return fullPath;
}

function makeFinding(overrides: Partial<AuditFinding>): AuditFinding {
    return {
        id: 'test-id',
        category: 'code',
        severity: 'medium',
        title: 'Test finding',
        message: 'Test message',
        file: 'test.ts',
        line: 1,
        rule: 'test-rule',
        ...overrides,
    };
}

function makeReport(findings: AuditFinding[]): AuditReport {
    return {
        meta: {
            etalonVersion: '1.0.0',
            auditDate: new Date().toISOString(),
            auditDurationMs: 10,
            directory: './',
            stack: { languages: ['typescript'], framework: 'none', orm: 'none', packageManager: 'npm', detectedFiles: [] },
        },
        summary: {
            totalFindings: findings.length,
            critical: findings.filter(f => f.severity === 'critical').length,
            high: findings.filter(f => f.severity === 'high').length,
            medium: findings.filter(f => f.severity === 'medium').length,
            low: findings.filter(f => f.severity === 'low').length,
            info: findings.filter(f => f.severity === 'info').length,
            trackerSdksFound: 0,
            piiColumnsFound: 0,
            configIssues: 0,
        },
        findings,
        recommendations: [],
    };
}

beforeAll(() => mkdirSync(FIXTURE_DIR, { recursive: true }));
afterAll(() => rmSync(FIXTURE_DIR, { recursive: true, force: true }));

// ─── SARIF Formatter Tests ─────────────────────────────────────────

describe('SARIF Formatter', () => {
    it('should produce valid SARIF 2.1.0 structure', () => {
        const report = makeReport([
            makeFinding({ rule: 'tracker-import', severity: 'medium', vendorId: 'google-analytics' }),
        ]);

        const sarifJson = formatAuditSarif(report);
        const sarif = JSON.parse(sarifJson);

        expect(sarif.version).toBe('2.1.0');
        expect(sarif.$schema).toContain('sarif-schema-2.1.0');
        expect(sarif.runs).toHaveLength(1);
        expect(sarif.runs[0].tool.driver.name).toBe('ETALON');
    });

    it('should map findings to SARIF results', () => {
        const report = makeReport([
            makeFinding({ rule: 'cors-wildcard', severity: 'medium', file: 'server.js', line: 42, message: 'CORS *' }),
            makeFinding({ rule: 'pii-column', severity: 'high', file: 'schema.prisma', line: 10, message: 'Email PII' }),
        ]);

        const sarif = JSON.parse(formatAuditSarif(report));
        const results = sarif.runs[0].results;

        expect(results).toHaveLength(2);
        expect(results[0].ruleId).toBe('cors-wildcard');
        expect(results[0].level).toBe('warning');
        expect(results[1].ruleId).toBe('pii-column');
        expect(results[1].level).toBe('error');
    });

    it('should generate unique rules from findings', () => {
        const report = makeReport([
            makeFinding({ rule: 'cookie-samesite' }),
            makeFinding({ rule: 'cookie-samesite', file: 'other.js', line: 5 }),
            makeFinding({ rule: 'cors-wildcard' }),
        ]);

        const sarif = JSON.parse(formatAuditSarif(report));
        const rules = sarif.runs[0].tool.driver.rules;

        expect(rules).toHaveLength(2); // Deduplicated by rule
    });

    it('should include fix as SARIF fix suggestion', () => {
        const report = makeReport([
            makeFinding({ fix: 'Add SameSite=Lax' }),
        ]);

        const sarif = JSON.parse(formatAuditSarif(report));
        expect(sarif.runs[0].results[0].fixes[0].description.text).toBe('Add SameSite=Lax');
    });
});

// ─── Diff Analyzer Tests ───────────────────────────────────────────

describe('Diff Analyzer', () => {
    it('should detect added findings', () => {
        const baseline = makeReport([
            makeFinding({ rule: 'cors-wildcard', file: 'server.js', line: 10, message: 'CORS *' }),
        ]);
        const current = makeReport([
            makeFinding({ rule: 'cors-wildcard', file: 'server.js', line: 10, message: 'CORS *' }),
            makeFinding({ rule: 'pii-column', file: 'schema.prisma', line: 5, message: 'New PII' }),
        ]);

        const diff = diffReports(current, baseline);
        expect(diff.added).toHaveLength(1);
        expect(diff.added[0].rule).toBe('pii-column');
        expect(diff.unchanged).toHaveLength(1);
        expect(diff.removed).toHaveLength(0);
    });

    it('should detect removed findings', () => {
        const baseline = makeReport([
            makeFinding({ rule: 'debug-mode', file: 'settings.py', line: 1, message: 'Debug on' }),
            makeFinding({ rule: 'cors-wildcard', file: 'server.js', line: 10, message: 'CORS *' }),
        ]);
        const current = makeReport([
            makeFinding({ rule: 'cors-wildcard', file: 'server.js', line: 10, message: 'CORS *' }),
        ]);

        const diff = diffReports(current, baseline);
        expect(diff.removed).toHaveLength(1);
        expect(diff.removed[0].rule).toBe('debug-mode');
    });

    it('should block when new high-severity findings exist', () => {
        const diff = {
            added: [makeFinding({ severity: 'high' })],
            removed: [],
            unchanged: [],
        };

        expect(shouldBlock(diff, 'high')).toBe(true);
        expect(shouldBlock(diff, 'critical')).toBe(false);
    });

    it('should not block when only low-severity findings exist', () => {
        const diff = {
            added: [makeFinding({ severity: 'low' })],
            removed: [],
            unchanged: [],
        };

        expect(shouldBlock(diff, 'high')).toBe(false);
        expect(shouldBlock(diff, 'medium')).toBe(false);
        expect(shouldBlock(diff, 'low')).toBe(true);
    });

    it('should not block when no new findings', () => {
        const diff = {
            added: [],
            removed: [makeFinding({ severity: 'high' })],
            unchanged: [makeFinding({ severity: 'critical' })],
        };

        expect(shouldBlock(diff, 'low')).toBe(false);
    });
});

// ─── Git Blame Tests ───────────────────────────────────────────────

import { enrichFindings } from '../audit/git-blame.js';

// ... (keep existing imports above)

describe('Git Blame', () => {
    it('should return false for non-git directories', () => {
        expect(isGitRepo('/tmp')).toBe(false);
    });

    it('should gracefully handle non-git repos in enrichFindings', () => {
        const findings = [makeFinding({ file: 'test.ts', line: 1 })];
        const result = enrichFindings(findings, '/tmp');
        expect(result).toHaveLength(1);
        expect(result[0].blame).toBeUndefined();
    });
});

// ─── Server-Side Tracking Tests ────────────────────────────────────

describe('Server-Side Tracking Scanner', () => {
    const stack: StackInfo = { languages: ['typescript'], framework: 'none', orm: 'none', packageManager: 'npm', detectedFiles: [] };

    it('should detect hardcoded Google Analytics server-side URL', () => {
        const file = createFixture('server/ga.ts', `
async function trackEvent(event) {
  await fetch('https://www.google-analytics.com/collect', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}
`);
        const findings = scanServerTracking([file], FIXTURE_DIR, stack);
        expect(findings.some(f => f.vendorId === 'google-analytics')).toBe(true);
        expect(findings.some(f => f.rule === 'server-side-tracking')).toBe(true);
    });

    it('should detect Facebook Conversions API calls', () => {
        const file = createFixture('server/fb.ts', `
const url = 'https://graph.facebook.com/v18.0/pixel-id/events';
await fetch(url, { method: 'POST', body: data });
`);
        const findings = scanServerTracking([file], FIXTURE_DIR, stack);
        expect(findings.some(f => f.vendorId === 'facebook-pixel')).toBe(true);
    });

    it('should detect axios calls to Segment', () => {
        const file = createFixture('server/segment.ts', `
import axios from 'axios';
await axios.post("https://api.segment.io/v1/track", payload);
`);
        const findings = scanServerTracking([file], FIXTURE_DIR, stack);
        expect(findings.some(f => f.title.toLowerCase().includes('segment'))).toBe(true);
    });

    it('should detect Python requests to Mixpanel', () => {
        const file = createFixture('server/track.py', `
import requests
requests.post("https://api.mixpanel.com/track", json=data)
`);
        const findings = scanServerTracking([file], FIXTURE_DIR, stack);
        expect(findings.some(f => f.title.toLowerCase().includes('mixpanel'))).toBe(true);
    });

    it('should not flag non-tracker URLs', () => {
        const file = createFixture('server/clean.ts', `
await fetch('https://api.myapp.com/users');
await fetch('https://api.stripe.com/v1/charges');
`);
        const findings = scanServerTracking([file], FIXTURE_DIR, stack);
        expect(findings).toHaveLength(0);
    });

    it('should detect URL in variable assignment', () => {
        const file = createFixture('server/vars.ts', `
const endpoint = "https://api.amplitude.com/2/httpapi";
`);
        const findings = scanServerTracking([file], FIXTURE_DIR, stack);
        expect(findings.some(f => f.title.toLowerCase().includes('amplitude'))).toBe(true);
    });
});

// ─── CNAME Cloaking Tests ──────────────────────────────────────────

describe('CNAME Cloaking Scanner', () => {
    const stack: StackInfo = { languages: ['typescript'], framework: 'next', orm: 'none', packageManager: 'npm', detectedFiles: [] };

    it('should detect CNAME to Adobe Analytics in DNS config', () => {
        const file = createFixture('dns-records.json', `{
  "records": [
    { "type": "CNAME", "name": "metrics", "value": "mysite.sc.omtrdc.net" }
  ]
}`);
        const findings = scanCnameCloaking([file], FIXTURE_DIR, stack);
        expect(findings.some(f => f.rule === 'cname-cloaking')).toBe(true);
        expect(findings.some(f => f.vendorId === 'adobe-analytics')).toBe(true);
        expect(findings[0].severity).toBe('critical');
    });

    it('should detect CNAME in Terraform dns record', () => {
        const file = createFixture('infra/dns.tf', `
resource "cloudflare_record" "tracking" {
  zone_id = var.zone_id
  name    = "t"
  type    = "CNAME"
  value   = "partner.dnsdelegation.io"
}
`);
        const findings = scanCnameCloaking([file], FIXTURE_DIR, stack);
        expect(findings.some(f => f.vendorId === 'criteo')).toBe(true);
    });

    it('should detect nginx proxy_pass to tracker domain', () => {
        const file = createFixture('config/nginx.conf', `
server {
    location /analytics {
        proxy_pass https://cdn.segment.com;
    }
}
`);
        const findings = scanCnameCloaking([file], FIXTURE_DIR, stack);
        expect(findings.some(f => f.vendorId === 'segment')).toBe(true);
        expect(findings.some(f => f.message.includes('Reverse proxy'))).toBe(true);
    });

    it('should detect Next.js rewrite to tracker', () => {
        const file = createFixture('next.config.mjs', `
export default {
  async rewrites() {
    return [
      {
        source: '/t/:path*',
        destination: 'https://api.segment.io/:path*',
      },
    ];
  },
};
`);
        const findings = scanCnameCloaking([file], FIXTURE_DIR, stack);
        expect(findings.some(f => f.vendorId === 'segment')).toBe(true);
    });

    it('should detect Vercel.json redirect to tracker', () => {
        const file = createFixture('vercel.json', `{
  "rewrites": [
    { "source": "/a/(.*)", "destination": "https://app.posthog.com/$1" }
  ]
}`);
        const findings = scanCnameCloaking([file], FIXTURE_DIR, stack);
        expect(findings.some(f => f.vendorId === 'posthog')).toBe(true);
    });

    it('should detect Express proxy middleware to tracker', () => {
        const file = createFixture('middleware/proxy.ts', `
import { createProxyMiddleware } from 'http-proxy-middleware';
app.use('/analytics', createProxyMiddleware({ target: 'https://api-js.mixpanel.com', changeOrigin: true }));
`);
        const findings = scanCnameCloaking([file], FIXTURE_DIR, stack);
        expect(findings.some(f => f.vendorId === 'mixpanel')).toBe(true);
    });

    it('should not flag clean configs', () => {
        const file = createFixture('clean-vercel.json', `{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://api.myapp.com/$1" }
  ]
}`);
        const findings = scanCnameCloaking([file], FIXTURE_DIR, stack);
        expect(findings).toHaveLength(0);
    });
});
