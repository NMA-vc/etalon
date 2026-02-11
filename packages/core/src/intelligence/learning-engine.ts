// ─── Learning Engine (Stubs) ──────────────────────────────────────
//
// Pattern learning engine for ETALON. In the open-source version,
// this learns from local usage patterns and false positive reports.
// The SaaS version would aggregate across all users.

import { getFeedbackSummary, getReports } from './feedback-collector.js';
import { type SafePattern } from '../patterns/safe-patterns.js';

// ─── Types ────────────────────────────────────────────────────────

export interface LearnedPattern {
    domain: string;
    suggested_action: 'whitelist' | 'adjust_severity' | 'add_context_rule';
    confidence: number;
    evidence_count: number;
    source: 'user_feedback' | 'usage_pattern' | 'community';
}

export interface LearningStats {
    patterns_learned: number;
    feedback_processed: number;
    accuracy_improvement: string;
}

// ─── Learning Engine ──────────────────────────────────────────────

/**
 * Analyze feedback reports and suggest patterns to learn.
 */
export function analyzePatterns(): LearnedPattern[] {
    const summary = getFeedbackSummary();
    const learned: LearnedPattern[] = [];

    // Domains reported 3+ times as false positives
    for (const { domain, count } of summary.most_reported_domains) {
        if (count >= 3) {
            learned.push({
                domain,
                suggested_action: 'whitelist',
                confidence: Math.min(0.5 + (count * 0.1), 0.95),
                evidence_count: count,
                source: 'user_feedback',
            });
        }
    }

    return learned;
}

/**
 * Convert learned patterns to safe patterns for potential inclusion.
 */
export function learnedToSafePatterns(learned: LearnedPattern[]): SafePattern[] {
    return learned
        .filter(l => l.suggested_action === 'whitelist' && l.confidence >= 0.7)
        .map(l => ({
            domain: l.domain,
            reason: `Learned from ${l.evidence_count} user reports`,
            category: 'infrastructure' as const,
            confidence: l.confidence,
            conditions: ['Auto-learned — review recommended'],
        }));
}

/**
 * Get learning statistics.
 */
export function getLearningStats(): LearningStats {
    const reports = getReports();
    const patterns = analyzePatterns();

    return {
        patterns_learned: patterns.length,
        feedback_processed: reports.length,
        accuracy_improvement: patterns.length > 0
            ? `~${Math.round(patterns.length * 5)}% fewer false positives`
            : 'No patterns learned yet — report false positives to teach ETALON',
    };
}
