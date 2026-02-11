// ─── Audit Finding Types ──────────────────────────────────────────

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type FindingCategory = 'code' | 'schema' | 'config';

export interface AuditFinding {
    id: string;
    category: FindingCategory;
    severity: FindingSeverity;
    title: string;
    message: string;
    file: string;
    line?: number;
    column?: number;
    vendorId?: string;
    rule: string;
    fix?: string;
    blame?: BlameInfo;
    gdprArticles?: GdprReference[];
}

// ─── Git Blame ────────────────────────────────────────────────────

export interface BlameInfo {
    author: string;
    email: string;
    date: string;
    commit: string;
    commitMessage: string;
}

// ─── Diff Analysis ────────────────────────────────────────────────

export interface DiffResult {
    added: AuditFinding[];
    removed: AuditFinding[];
    unchanged: AuditFinding[];
}

// ─── GDPR Reference ──────────────────────────────────────────────

export interface GdprReference {
    article: string;
    title: string;
    url: string;
}

// ─── Compliance Score ────────────────────────────────────────────

export type ComplianceGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface ComplianceScore {
    score: number;      // 0-100
    grade: ComplianceGrade;
    breakdown: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        info: number;
    };
}

// ─── Audit Report ─────────────────────────────────────────────────

export interface AuditReport {
    meta: {
        etalonVersion: string;
        auditDate: string;
        auditDurationMs: number;
        directory: string;
        stack: StackInfo;
    };
    summary: AuditSummary;
    score?: ComplianceScore;
    findings: AuditFinding[];
    recommendations: string[];
}

export interface AuditSummary {
    totalFindings: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    trackerSdksFound: number;
    piiColumnsFound: number;
    configIssues: number;
}

// ─── Stack Detection ──────────────────────────────────────────────

export type Language = 'javascript' | 'typescript' | 'python' | 'rust' | 'unknown';
export type Framework =
    | 'nextjs'
    | 'express'
    | 'fastify'
    | 'nuxt'
    | 'svelte'
    | 'django'
    | 'flask'
    | 'fastapi'
    | 'actix'
    | 'axum'
    | 'rocket'
    | 'none';
export type ORM =
    | 'prisma'
    | 'typeorm'
    | 'drizzle'
    | 'sequelize'
    | 'django-orm'
    | 'sqlalchemy'
    | 'diesel'
    | 'sea-orm'
    | 'raw-sql'
    | 'none';

export interface StackInfo {
    languages: Language[];
    framework: Framework;
    orm: ORM;
    packageManager: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'poetry' | 'cargo' | 'unknown';
    detectedFiles: string[];
}

// ─── Pattern Database ─────────────────────────────────────────────

export interface TrackerPattern {
    vendorId: string;
    severity: FindingSeverity;
}

export interface TrackerPatternDatabase {
    npm: Record<string, TrackerPattern>;
    pypi: Record<string, TrackerPattern>;
    cargo: Record<string, TrackerPattern>;
    envVars: Record<string, TrackerPattern>;
    htmlPatterns: Array<{
        pattern: string;
        vendorId: string;
        severity: FindingSeverity;
    }>;
    importPatterns: Array<{
        pattern: string;
        language: Language;
        vendorId: string;
        severity: FindingSeverity;
    }>;
}

// ─── PII Detection ────────────────────────────────────────────────

export interface PiiColumnPattern {
    pattern: string;
    piiType: string;
    severity: FindingSeverity;
    recommendation: string;
}
