// ─── Pattern Library ──────────────────────────────────────────────
//
// Central export for the ETALON pattern library.
// Provides safe patterns, false positive detection, and
// context-aware analysis to reduce scan noise.

export {
    type SafePattern,
    ALL_SAFE_PATTERNS,
    matchSafePattern,
    isSafeDomain,
    getSafePatternsByCategory,
    SAFE_CDNS,
    SAFE_FONTS,
    SAFE_INFRASTRUCTURE,
    SAFE_PAYMENTS,
    SAFE_UI,
    SAFE_MAPS,
    SAFE_MEDIA,
    SAFE_SECURITY,
    SAFE_OPEN_SOURCE,
} from './safe-patterns.js';

export {
    type FalsePositiveRule,
    type FalsePositiveContext,
    checkFalsePositive,
    filterFalsePositives,
    getFalsePositiveRuleIds,
} from './false-positives.js';

export {
    type ContextRule,
    type ContextCheckInput,
    type ContextResult,
    evaluateContext,
    getContextRuleIds,
    adjustSeverityByContext,
} from './context-rules.js';

// ─── Combined Pattern Engine ──────────────────────────────────────

import { matchSafePattern } from './safe-patterns.js';
import { checkFalsePositive, type FalsePositiveContext } from './false-positives.js';
import { evaluateContext, type ContextCheckInput } from './context-rules.js';

export interface PatternCheckResult {
    is_safe: boolean;
    reason: string;
    source: 'safe_pattern' | 'false_positive' | 'context_rule' | 'none';
    confidence: number;
}

/**
 * Run all pattern checks against a domain/detection.
 * This is the main entry point for the pattern library.
 * Returns whether the detection should be suppressed.
 */
export function checkPatterns(
    domain: string,
    fpContext?: FalsePositiveContext,
    ctxInput?: ContextCheckInput,
): PatternCheckResult {
    // 1. Check safe patterns first (cheapest)
    const safeMatch = matchSafePattern(domain);
    if (safeMatch && safeMatch.confidence > 0.8) {
        return {
            is_safe: true,
            reason: safeMatch.reason,
            source: 'safe_pattern',
            confidence: safeMatch.confidence,
        };
    }

    // 2. Check false positive rules
    if (fpContext) {
        const fpMatch = checkFalsePositive(fpContext);
        if (fpMatch) {
            return {
                is_safe: true,
                reason: fpMatch.description,
                source: 'false_positive',
                confidence: 0.85,
            };
        }
    }

    // 3. Check context rules
    if (ctxInput) {
        const ctxResult = evaluateContext(ctxInput);
        if (ctxResult && ctxResult.safe && ctxResult.confidence > 0.7) {
            return {
                is_safe: true,
                reason: ctxResult.reason,
                source: 'context_rule',
                confidence: ctxResult.confidence,
            };
        }
    }

    return {
        is_safe: false,
        reason: 'No safe pattern matched',
        source: 'none',
        confidence: 0,
    };
}
