import type { AuditReport, AuditFinding, DiffResult, FindingSeverity } from './types.js';

// ─── Diff Analyzer ─────────────────────────────────────────────────

/**
 * Compare two audit reports to identify added, removed, and unchanged findings.
 * Used by the GitHub Action to surface only new issues introduced in a PR.
 */
export function diffReports(current: AuditReport, baseline: AuditReport): DiffResult {
    const makeKey = (f: AuditFinding) => `${f.rule}::${f.file}::${f.line ?? 0}::${f.message}`;

    const baselineKeys = new Set(baseline.findings.map(makeKey));
    const currentKeys = new Set(current.findings.map(makeKey));

    const added: AuditFinding[] = [];
    const unchanged: AuditFinding[] = [];

    for (const finding of current.findings) {
        if (baselineKeys.has(makeKey(finding))) {
            unchanged.push(finding);
        } else {
            added.push(finding);
        }
    }

    const removed = baseline.findings.filter((f) => !currentKeys.has(makeKey(f)));

    return { added, removed, unchanged };
}

/**
 * Check whether diff results should block a PR based on minimum severity threshold.
 */
export function shouldBlock(diff: DiffResult, threshold: FindingSeverity): boolean {
    const order: Record<string, number> = {
        info: 0,
        low: 1,
        medium: 2,
        high: 3,
        critical: 4,
    };
    const minLevel = order[threshold] ?? 0;

    return diff.added.some((f) => (order[f.severity] ?? 0) >= minLevel);
}
