// ─── False Positive Feedback Collector ─────────────────────────────
//
// Allows users to report false positives, which feeds back into
// the pattern library. In the open-source version, reports are
// stored locally. A SaaS version could aggregate them.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

// ─── Types ────────────────────────────────────────────────────────

export interface FalsePositiveReport {
    id: string;
    timestamp: string;
    domain: string;
    rule: string;
    file?: string;
    line?: number;
    reason: string;
    suggested_action: 'whitelist_domain' | 'adjust_rule' | 'add_context' | 'other';
    context?: {
        framework?: string;
        element_type?: string;
        surrounding_code?: string;
    };
}

export interface FeedbackSummary {
    total_reports: number;
    by_domain: Record<string, number>;
    by_rule: Record<string, number>;
    most_reported_domains: Array<{ domain: string; count: number }>;
    suggested_whitelists: string[];
}

// ─── Storage ──────────────────────────────────────────────────────

const FEEDBACK_DIR = join(homedir(), '.etalon', 'feedback');
const REPORTS_PATH = join(FEEDBACK_DIR, 'false-positives.json');

function ensureDir(): void {
    if (!existsSync(FEEDBACK_DIR)) {
        mkdirSync(FEEDBACK_DIR, { recursive: true });
    }
}

function loadReports(): FalsePositiveReport[] {
    try {
        if (existsSync(REPORTS_PATH)) {
            return JSON.parse(readFileSync(REPORTS_PATH, 'utf-8'));
        }
    } catch { /* ignore */ }
    return [];
}

function saveReports(reports: FalsePositiveReport[]): void {
    ensureDir();
    writeFileSync(REPORTS_PATH, JSON.stringify(reports, null, 2), 'utf-8');
}

// ─── Public API ───────────────────────────────────────────────────

/**
 * Submit a false positive report.
 */
export function reportFalsePositive(report: Omit<FalsePositiveReport, 'id' | 'timestamp'>): FalsePositiveReport {
    const full: FalsePositiveReport = {
        ...report,
        id: `fp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        timestamp: new Date().toISOString(),
    };

    const reports = loadReports();
    reports.push(full);
    saveReports(reports);

    return full;
}

/**
 * Get all false positive reports.
 */
export function getReports(): FalsePositiveReport[] {
    return loadReports();
}

/**
 * Get a summary of false positive reports.
 */
export function getFeedbackSummary(): FeedbackSummary {
    const reports = loadReports();
    const byDomain: Record<string, number> = {};
    const byRule: Record<string, number> = {};

    for (const report of reports) {
        byDomain[report.domain] = (byDomain[report.domain] || 0) + 1;
        byRule[report.rule] = (byRule[report.rule] || 0) + 1;
    }

    const mostReportedDomains = Object.entries(byDomain)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([domain, count]) => ({ domain, count }));

    // Domains reported 3+ times are candidates for whitelisting
    const suggestedWhitelists = Object.entries(byDomain)
        .filter(([, count]) => count >= 3)
        .map(([domain]) => domain);

    return {
        total_reports: reports.length,
        by_domain: byDomain,
        by_rule: byRule,
        most_reported_domains: mostReportedDomains,
        suggested_whitelists: suggestedWhitelists,
    };
}

/**
 * Clear all false positive reports.
 */
export function clearReports(): void {
    saveReports([]);
}

/**
 * Check if a domain has been reported as a false positive.
 */
export function isDomainReported(domain: string): boolean {
    const reports = loadReports();
    return reports.some(r => r.domain === domain);
}

/**
 * Get the report count for a specific domain.
 */
export function getReportCountForDomain(domain: string): number {
    const reports = loadReports();
    return reports.filter(r => r.domain === domain).length;
}
