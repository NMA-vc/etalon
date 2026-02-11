import chalk from 'chalk';
import type { AuditReport, AuditFinding, ComplianceGrade } from '@etalon/core';

const SEVERITY_ICONS: Record<string, string> = {
    critical: '🔴',
    high: '🔴',
    medium: '🟡',
    low: '🟢',
    info: 'ℹ️ ',
};

const SEVERITY_COLORS: Record<string, (s: string) => string> = {
    critical: chalk.red.bold,
    high: chalk.red,
    medium: chalk.yellow,
    low: chalk.green,
    info: chalk.gray,
};

const CATEGORY_LABELS: Record<string, string> = {
    code: '📦 Code',
    schema: '🗄️  Schema',
    config: '⚙️  Config',
};

/**
 * Format an audit report as pretty-printed terminal output.
 */
export function formatAuditText(report: AuditReport): string {
    const lines: string[] = [];

    // Header
    lines.push('');
    lines.push(chalk.bold('ETALON Code Audit'));
    lines.push(chalk.dim('═══════════════════════════════════════════════════════'));
    lines.push(`Directory:  ${chalk.cyan(report.meta.directory)}`);
    lines.push(`Scanned:    ${new Date(report.meta.auditDate).toLocaleString()}`);
    lines.push(`Duration:   ${(report.meta.auditDurationMs / 1000).toFixed(1)} seconds`);
    lines.push('');

    // Stack info
    lines.push(chalk.bold('🔍 Detected Stack'));
    lines.push(chalk.dim('───────────────────────────────────────────────────────'));
    lines.push(`Languages:  ${report.meta.stack.languages.join(', ')}`);
    lines.push(`Framework:  ${report.meta.stack.framework}`);
    lines.push(`ORM:        ${report.meta.stack.orm}`);
    lines.push(`Pkg Mgr:    ${report.meta.stack.packageManager}`);
    lines.push('');

    // Summary
    lines.push(chalk.bold('📊 Summary'));
    lines.push(chalk.dim('───────────────────────────────────────────────────────'));
    const s = report.summary;

    if (s.totalFindings === 0) {
        lines.push(chalk.green('✓ No findings!'));
    } else {
        if (s.critical > 0) lines.push(chalk.red.bold(`  🔴 ${s.critical} critical`));
        if (s.high > 0) lines.push(chalk.red(`  🔴 ${s.high} high`));
        if (s.medium > 0) lines.push(chalk.yellow(`  🟡 ${s.medium} medium`));
        if (s.low > 0) lines.push(chalk.green(`  🟢 ${s.low} low`));
        if (s.info > 0) lines.push(chalk.gray(`  ℹ️  ${s.info} info`));
        lines.push('');
        lines.push(`  Tracker SDKs:    ${s.trackerSdksFound}`);
        lines.push(`  PII columns:     ${s.piiColumnsFound}`);
        lines.push(`  Config issues:   ${s.configIssues}`);
    }
    lines.push('');

    // Compliance Score
    if (report.score) {
        const gradeColors: Record<ComplianceGrade, (s: string) => string> = {
            A: chalk.green.bold,
            B: chalk.green,
            C: chalk.yellow,
            D: chalk.red,
            F: chalk.red.bold,
        };
        const colorFn = gradeColors[report.score.grade];
        lines.push(chalk.bold('🛡️  Compliance Score'));
        lines.push(chalk.dim('───────────────────────────────────────────────────────'));
        lines.push(`  Grade: ${colorFn(report.score.grade)}  Score: ${colorFn(String(report.score.score))}/100`);
        lines.push('');
    }

    // Findings by category
    if (report.findings.length > 0) {
        const grouped = groupByCategory(report.findings);

        for (const [category, findings] of Object.entries(grouped)) {
            lines.push(chalk.bold(`${CATEGORY_LABELS[category] ?? category} Findings (${findings.length})`));
            lines.push(chalk.dim('───────────────────────────────────────────────────────'));

            for (const finding of findings) {
                const icon = SEVERITY_ICONS[finding.severity] ?? '?';
                const colorFn = SEVERITY_COLORS[finding.severity] ?? chalk.white;

                lines.push(`${icon} ${colorFn(finding.title)}`);
                lines.push(`├─ ${chalk.dim('File:')}    ${finding.file}${finding.line ? `:${finding.line}` : ''}`);
                if (finding.blame) {
                    const date = new Date(finding.blame.date).toLocaleDateString();
                    lines.push(`├─ ${chalk.dim('Blame:')}   ${finding.blame.author} on ${date} (${finding.blame.commit.substring(0, 8)})`);
                }
                lines.push(`├─ ${chalk.dim('Rule:')}    ${finding.rule}`);
                lines.push(`├─ ${chalk.dim('Message:')} ${finding.message}`);
                if (finding.gdprArticles && finding.gdprArticles.length > 0) {
                    const arts = finding.gdprArticles.map(a => `Art. ${a.article}`).join(', ');
                    lines.push(`├─ ${chalk.dim('GDPR:')}    ⚖️  ${chalk.magenta(arts)}`);
                }
                if (finding.fix) {
                    lines.push(`└─ ${chalk.dim('Fix:')}     ${chalk.cyan(finding.fix)}`);
                } else {
                    lines.push('');
                }
            }
            lines.push('');
        }
    }

    // Recommendations
    if (report.recommendations.length > 0) {
        lines.push(chalk.bold('💡 Recommendations'));
        lines.push(chalk.dim('───────────────────────────────────────────────────────'));
        for (let i = 0; i < report.recommendations.length; i++) {
            lines.push(`${i + 1}. ${report.recommendations[i]}`);
        }
        lines.push('');
    }

    lines.push(chalk.dim('Run with --format json for machine-readable output'));
    lines.push(chalk.dim('Report issues: github.com/NMA-vc/etalon/issues'));

    return lines.join('\n');
}

function groupByCategory(findings: AuditFinding[]): Record<string, AuditFinding[]> {
    const groups: Record<string, AuditFinding[]> = {};
    for (const finding of findings) {
        if (!groups[finding.category]) groups[finding.category] = [];
        groups[finding.category].push(finding);
    }
    return groups;
}
