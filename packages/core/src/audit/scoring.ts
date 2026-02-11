import type { AuditReport, ComplianceScore, ComplianceGrade, FindingSeverity } from './types.js';

// ─── Severity Weights ─────────────────────────────────────────────

const SEVERITY_WEIGHTS: Record<FindingSeverity, number> = {
    critical: 25,
    high: 10,
    medium: 3,
    low: 1,
    info: 0,
};

// ─── Grade Thresholds ─────────────────────────────────────────────

function gradeFromScore(score: number): ComplianceGrade {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    if (score >= 40) return 'D';
    return 'F';
}

// ─── Score Calculator ─────────────────────────────────────────────

/**
 * Calculate a compliance score (0–100) from an audit report.
 *
 * Formula: score = max(0, 100 - Σ(severity_weight × count))
 *
 * Grade scale:
 *   A = 90–100 (excellent)
 *   B = 75–89  (good, minor issues)
 *   C = 60–74  (fair, needs attention)
 *   D = 40–59  (poor, significant issues)
 *   F = 0–39   (failing, critical issues)
 */
export function calculateScore(report: AuditReport): ComplianceScore {
    const breakdown = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
    };

    for (const finding of report.findings) {
        breakdown[finding.severity]++;
    }

    let penalty = 0;
    for (const [severity, count] of Object.entries(breakdown)) {
        penalty += SEVERITY_WEIGHTS[severity as FindingSeverity] * count;
    }

    const score = Math.max(0, 100 - penalty);
    const grade = gradeFromScore(score);

    return { score, grade, breakdown };
}

/**
 * Get styling hints for a grade (for badges, HTML reports, etc.).
 */
export function gradeColor(grade: ComplianceGrade): string {
    switch (grade) {
        case 'A': return '#4caf50'; // green
        case 'B': return '#8bc34a'; // light green
        case 'C': return '#ff9800'; // orange
        case 'D': return '#ff5722'; // deep orange
        case 'F': return '#f44336'; // red
    }
}
