export { VendorRegistry } from './vendor-registry.js';
export { extractDomain, getParentDomains, isFirstParty, normalizeUrl } from './domain-utils.js';
export {
    auditProject,
    detectStack,
    scanCode,
    scanSchemas,
    scanConfigs,
    scanServerTracking,
    scanCnameCloaking,
    formatAuditSarif,
    diffReports,
    shouldBlock,
    enrichFindings,
    getBlameForLine,
    isGitRepo,
    groupByAuthor,
    enrichWithGdpr,
    GDPR_RULE_MAP,
    calculateScore,
    gradeColor,
    generateBadgeSvg,
    badgeUrl,
    badgeMarkdown,
    generatePatches,
    applyPatches,
    fixableRules,
    loadCustomRules,
    scanWithCustomRules,
    analyzeDataFlow,
    toMermaid,
    toTextSummary,
    generatePolicy,
    collectFiles,
} from './audit/index.js';
export type {
    Vendor,
    VendorCategory,
    Category,
    VendorDatabase,
    ScanRequest,
    ScanReport,
    ScanSummary,
    NetworkRequest,
    DetectedVendor,
    UnknownDomain,
    RiskLevel,
    Recommendation,
    EtalonConfig,
    SiteConfig,
    AllowlistEntry,
    NotificationConfig,
    ScanConfig,
} from './types.js';
export type {
    AuditReport,
    AuditFinding,
    AuditSummary,
    FindingSeverity,
    FindingCategory,
    StackInfo,
    BlameInfo,
    DiffResult,
    GdprReference,
    ComplianceScore,
    ComplianceGrade,
} from './audit/types.js';
export type {
    FilePatch,
} from './audit/auto-fixer.js';
export type {
    CustomRule,
    CustomPattern,
} from './audit/plugin-loader.js';
export type {
    DataFlowMap,
    FlowNode,
    FlowEdge,
    FlowNodeType,
} from './audit/data-flow-analyzer.js';
export type {
    GeneratedPolicy,
    PolicySection,
    PolicyVendorEntry,
    PolicyInput,
    PolicyGeneratorInput,
} from './audit/policy-generator.js';
export { AutoFixEngine } from './auto-fix/index.js';
export type {
    FixTemplate,
    FixResult,
    FixSuggestion,
    FixLocation,
    SupportedFramework,
} from './auto-fix/index.js';
export {
    checkPatterns,
    matchSafePattern,
    isSafeDomain,
    checkFalsePositive,
    filterFalsePositives,
    evaluateContext,
    adjustSeverityByContext,
} from './patterns/index.js';
export type {
    SafePattern,
    FalsePositiveRule,
    FalsePositiveContext,
    ContextRule,
    ContextCheckInput,
    ContextResult,
    PatternCheckResult,
} from './patterns/index.js';
export {
    detectProjectContext,
    applyContextScoring,
    adjustFindingSeverity,
    getIndustryRule,
    getRegionRule,
    getUserRightsForRegion,
} from './scoring/index.js';
export type {
    ProjectContext,
    Industry,
    Region,
    DataSensitivity,
    IndustryRule,
    RegionRule,
    ScoringContext,
} from './scoring/index.js';
export {
    isTelemetryEnabled,
    enableTelemetry,
    disableTelemetry,
    recordAuditEvent,
    recordFixEvent,
    reportFalsePositive,
    getFeedbackSummary,
    analyzePatterns,
    getLearningStats,
} from './intelligence/index.js';
export type {
    TelemetryEvent,
    FalsePositiveReport,
    FeedbackSummary,
    LearnedPattern,
    LearningStats,
} from './intelligence/index.js';
export {
    runFrameworkDetection,
    shouldSuppressFinding,
} from './detection/index.js';
export type {
    DetectionResult,
    FrameworkDetector,
} from './detection/index.js';
