import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectStack } from './stack-detector.js';
import { scanCode } from './code-scanner.js';
import { scanSchemas } from './schema-scanner.js';
import { scanConfigs } from './config-scanner.js';
import { scanServerTracking } from './server-tracker-scanner.js';
import { scanCnameCloaking } from './cname-cloaking-scanner.js';
import { enrichFindings } from './git-blame.js';
import { enrichWithGdpr } from './gdpr-articles.js';
import { calculateScore } from './scoring.js';
import type {
    AuditReport,
    AuditSummary,
    AuditFinding,
    TrackerPatternDatabase,
    StackInfo,
} from './types.js';

export { detectStack } from './stack-detector.js';
export { scanCode } from './code-scanner.js';
export { scanSchemas } from './schema-scanner.js';
export { scanConfigs } from './config-scanner.js';
export { scanServerTracking } from './server-tracker-scanner.js';
export { scanCnameCloaking } from './cname-cloaking-scanner.js';
export { formatAuditSarif } from './sarif-formatter.js';
export { diffReports, shouldBlock } from './diff-analyzer.js';
export { enrichFindings, getBlameForLine, isGitRepo, groupByAuthor } from './git-blame.js';
export { enrichWithGdpr, GDPR_RULE_MAP } from './gdpr-articles.js';
export type { GdprReference } from './gdpr-articles.js';
export { calculateScore, gradeColor } from './scoring.js';
export { generateBadgeSvg, badgeUrl, badgeMarkdown } from './badge.js';
export { generatePatches, applyPatches, fixableRules } from './auto-fixer.js';
export type { FilePatch } from './auto-fixer.js';
export { loadCustomRules, scanWithCustomRules } from './plugin-loader.js';
export type { CustomRule, CustomPattern } from './plugin-loader.js';
export { analyzeDataFlow, toMermaid, toTextSummary } from './data-flow-analyzer.js';
export type { DataFlowMap, FlowNode, FlowEdge, FlowNodeType } from './data-flow-analyzer.js';
export { generatePolicy } from './policy-generator.js';
export type { GeneratedPolicy, PolicySection, PolicyVendorEntry, PolicyInput, PolicyGeneratorInput } from './policy-generator.js';
export * from './types.js';

/**
 * Resolve the tracker-patterns.json file by walking up from the current file.
 */
function findPatternsFile(): string | null {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    // Walk up from packages/core/dist (or packages/core/src) to repo root
    let dir = currentDir;
    for (let i = 0; i < 6; i++) {
        const candidate = join(dir, 'data', 'tracker-patterns.json');
        if (existsSync(candidate)) return candidate;
        dir = dirname(dir);
    }
    return null;
}

/**
 * Run a full audit on a project directory.
 */
export async function auditProject(
    directory: string,
    options: { severity?: string; includeBlame?: boolean } = {},
): Promise<AuditReport> {
    const startTime = Date.now();

    // 1. Detect project stack
    const stack = detectStack(directory);

    // 2. Load tracker patterns
    let patterns: TrackerPatternDatabase;
    const patternsPath = findPatternsFile();
    if (patternsPath) {
        patterns = JSON.parse(readFileSync(patternsPath, 'utf-8'));
    } else {
        // Fallback — empty patterns
        patterns = { npm: {}, pypi: {}, cargo: {}, envVars: {}, htmlPatterns: [], importPatterns: [] };
    }


    // 3. Collect all files
    const allFiles = collectFiles(directory);

    // 4. Run scanners
    const codeFindings = scanCode(allFiles, directory, stack, patterns);
    const schemaFindings = scanSchemas(allFiles, directory, stack);
    const configFindings = scanConfigs(allFiles, directory, stack);
    const serverFindings = scanServerTracking(allFiles, directory, stack);
    const cnameFindings = scanCnameCloaking(allFiles, directory, stack);

    // 4b. Run custom rules from .etalon/rules/
    const { loadCustomRules, scanWithCustomRules } = await import('./plugin-loader.js');
    const customRules = loadCustomRules(directory);
    const customFindings = scanWithCustomRules(allFiles, directory, customRules);

    // 5. Combine and filter findings
    let findings = [...codeFindings, ...schemaFindings, ...configFindings, ...serverFindings, ...cnameFindings, ...customFindings];

    // Filter by severity if specified
    if (options.severity) {
        const minLevel = severityLevel(options.severity);
        findings = findings.filter((f) => severityLevel(f.severity) >= minLevel);
    }

    // Sort by severity (critical first)
    findings.sort((a, b) => severityLevel(b.severity) - severityLevel(a.severity));

    // Enrich with git blame if requested
    if (options.includeBlame) {
        findings = enrichFindings(findings, directory);
    }

    // Enrich with GDPR article references
    findings = enrichWithGdpr(findings);

    // 6. Generate summary
    const summary = summarizeFindings(findings);

    // 7. Generate recommendations
    const recommendations = generateRecommendations(findings, stack);

    const durationMs = Date.now() - startTime;

    const report: AuditReport = {
        meta: {
            etalonVersion: '1.0.0',
            auditDate: new Date().toISOString(),
            auditDurationMs: durationMs,
            directory,
            stack,
        },
        summary,
        findings,
        recommendations,
    };

    // 8. Calculate compliance score
    report.score = calculateScore(report);

    return report;
}

// ─── File Collection ───────────────────────────────────────────

import { readdirSync } from 'node:fs';

const IGNORE_DIRS = new Set([
    'node_modules', '.next', '.nuxt', '__pycache__', '.git', 'dist', 'build',
    'target', '.venv', 'venv', 'env', '.tox', '.mypy_cache',
    'vendor', '.cargo', 'coverage', '.turbo', '.svelte-kit',
    '.vercel', '.output',
]);

export function collectFiles(dir: string, maxDepth = 8): string[] {
    const files: string[] = [];

    function walk(currentDir: string, depth: number): void {
        if (depth > maxDepth) return;

        let entries;
        try {
            entries = readdirSync(currentDir, { withFileTypes: true });
        } catch {
            return;
        }

        for (const entry of entries) {
            if (entry.name.startsWith('.') && entry.name !== '.env' && !entry.name.startsWith('.env.')) continue;

            const fullPath = join(currentDir, entry.name);

            if (entry.isDirectory()) {
                if (!IGNORE_DIRS.has(entry.name)) {
                    walk(fullPath, depth + 1);
                }
            } else if (entry.isFile()) {
                files.push(fullPath);
            }
        }
    }

    walk(dir, 0);
    return files;
}

// ─── Helpers ───────────────────────────────────────────────────

function severityLevel(severity: string): number {
    switch (severity) {
        case 'critical': return 5;
        case 'high': return 4;
        case 'medium': return 3;
        case 'low': return 2;
        case 'info': return 1;
        default: return 0;
    }
}

function summarizeFindings(findings: AuditFinding[]): AuditSummary {
    return {
        totalFindings: findings.length,
        critical: findings.filter((f) => f.severity === 'critical').length,
        high: findings.filter((f) => f.severity === 'high').length,
        medium: findings.filter((f) => f.severity === 'medium').length,
        low: findings.filter((f) => f.severity === 'low').length,
        info: findings.filter((f) => f.severity === 'info').length,
        trackerSdksFound: new Set(findings.filter((f) => f.category === 'code' && f.vendorId).map((f) => f.vendorId)).size,
        piiColumnsFound: findings.filter((f) => f.rule === 'pii-column').length,
        configIssues: findings.filter((f) => f.category === 'config').length,
    };
}

function generateRecommendations(findings: AuditFinding[], _stack: StackInfo): string[] {
    const recs: string[] = [];

    const trackerCount = new Set(findings.filter((f) => f.category === 'code' && f.vendorId).map((f) => f.vendorId)).size;
    if (trackerCount > 0) {
        recs.push(`Found ${trackerCount} third-party tracker SDK(s) in your codebase. Ensure each is documented in your privacy policy and loaded only after user consent.`);
    }

    const piiCount = findings.filter((f) => f.rule === 'pii-column').length;
    if (piiCount > 0) {
        recs.push(`Found ${piiCount} PII column(s) in your database schemas. Review each for encryption, anonymization, and retention policies.`);
    }

    const criticalCount = findings.filter((f) => f.severity === 'critical').length;
    if (criticalCount > 0) {
        recs.push(`${criticalCount} critical finding(s) need immediate attention — these represent serious privacy or security risks.`);
    }

    const cookieIssues = findings.filter((f) => f.rule.startsWith('cookie-'));
    if (cookieIssues.length > 0) {
        recs.push(`${cookieIssues.length} cookie configuration issue(s) found. Set Secure, HttpOnly, and SameSite flags on all cookies.`);
    }

    const noRetention = findings.filter((f) => f.rule === 'no-retention-policy');
    if (noRetention.length > 0) {
        recs.push(`${noRetention.length} database table(s) with PII lack retention policies. Add deleted_at/expires_at columns and implement cleanup jobs.`);
    }

    if (findings.some((f) => f.rule === 'missing-csp')) {
        recs.push('Add a Content-Security-Policy header to prevent unauthorized tracker injection via XSS.');
    }

    if (recs.length === 0) {
        recs.push('No significant GDPR compliance issues found. Keep it up! 🎉');
    }

    return recs;
}
