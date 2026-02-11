// ─── Context-Aware Scoring Engine ─────────────────────────────────
//
// Central export for context-aware scoring.
// Combines project context detection with industry and region rules
// to adjust risk scoring for audit findings.

export {
    type ProjectContext,
    type Industry,
    type Region,
    type DataSensitivity,
    detectProjectContext,
} from './context-detector.js';

export {
    type IndustryRule,
    INDUSTRY_RULES,
    getIndustryRule,
    getIndustryAdjustment,
} from './industry-rules.js';

export {
    type RegionRule,
    REGION_RULES,
    getRegionRule,
    getRegionAdjustment,
    getUserRightsForRegion,
} from './region-rules.js';

// ─── Combined Scoring Adjustments ─────────────────────────────────

import { type ProjectContext, detectProjectContext } from './context-detector.js';
import { getIndustryAdjustment } from './industry-rules.js';
import { getRegionAdjustment } from './region-rules.js';
import type { AuditFinding } from '../audit/types.js';

export interface ScoringContext {
    projectContext: ProjectContext;
    adjustedFindings: AuditFinding[];
    adjustments: Array<{
        finding_rule: string;
        original_severity: string;
        adjusted_severity: string;
        reason: string;
    }>;
}

/**
 * Calculate context-adjusted severity for a finding.
 */
export function adjustFindingSeverity(
    finding: AuditFinding,
    context: ProjectContext,
): { severity: AuditFinding['severity']; reason?: string } {
    const SEVERITY_ORDER = ['info', 'low', 'medium', 'high', 'critical'] as const;
    const currentIndex = SEVERITY_ORDER.indexOf(finding.severity);

    // Get industry and region adjustments
    const category = finding.category || 'other';
    const industryAdj = getIndustryAdjustment(context.industry, category);
    const regionAdj = getRegionAdjustment(context.region, category);

    // Combined adjustment (take the larger modifier)
    const totalAdj = Math.max(industryAdj, regionAdj);

    if (totalAdj === 0) {
        return { severity: finding.severity };
    }

    // Map adjustment to severity steps
    let steps = 0;
    if (totalAdj >= 4) steps = 2;
    else if (totalAdj >= 2) steps = 1;

    const newIndex = Math.min(currentIndex + steps, SEVERITY_ORDER.length - 1);
    const newSeverity = SEVERITY_ORDER[newIndex];

    if (newSeverity === finding.severity) {
        return { severity: finding.severity };
    }

    const reasons: string[] = [];
    if (industryAdj > 0) reasons.push(`${context.industry} industry (+${industryAdj})`);
    if (regionAdj > 0) reasons.push(`${context.region} region / ${context.region === 'eu' ? 'GDPR' : 'regulations'} (+${regionAdj})`);

    return {
        severity: newSeverity,
        reason: `Elevated: ${reasons.join(', ')}`,
    };
}

/**
 * Apply context-aware scoring to all findings in a report.
 * Returns the adjusted findings and a summary of changes.
 */
export function applyContextScoring(
    findings: AuditFinding[],
    directory: string,
): ScoringContext {
    const projectContext = detectProjectContext(directory);
    const adjustments: ScoringContext['adjustments'] = [];

    const adjustedFindings = findings.map(finding => {
        const { severity, reason } = adjustFindingSeverity(finding, projectContext);
        if (severity !== finding.severity) {
            adjustments.push({
                finding_rule: finding.rule,
                original_severity: finding.severity,
                adjusted_severity: severity,
                reason: reason || '',
            });
            return { ...finding, severity };
        }
        return finding;
    });

    return { projectContext, adjustedFindings, adjustments };
}
