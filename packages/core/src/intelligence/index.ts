// ─── Intelligence Engine ──────────────────────────────────────────
//
// Central export for the ETALON intelligence engine.
// Combines telemetry, feedback collection, and pattern learning.

export {
    isTelemetryEnabled,
    enableTelemetry,
    disableTelemetry,
    getTelemetryStatus,
    recordEvent,
    recordAuditEvent,
    recordFixEvent,
    getStoredEvents,
    type TelemetryConfig,
    type TelemetryEvent,
} from './telemetry.js';

export {
    reportFalsePositive,
    getReports,
    getFeedbackSummary,
    clearReports,
    isDomainReported,
    getReportCountForDomain,
    type FalsePositiveReport,
    type FeedbackSummary,
} from './feedback-collector.js';

export {
    analyzePatterns,
    learnedToSafePatterns,
    getLearningStats,
    type LearnedPattern,
    type LearningStats,
} from './learning-engine.js';
