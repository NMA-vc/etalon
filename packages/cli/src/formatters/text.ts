import chalk from 'chalk';
import type { ScanReport, DetectedVendor, UnknownDomain } from 'etalon-core';

/**
 * Format a scan report as a pretty-printed terminal string.
 */
export function formatText(report: ScanReport): string {
    const lines: string[] = [];

    // Header
    lines.push('');
    lines.push(chalk.bold.cyan('ETALON Privacy Audit'));
    lines.push(chalk.dim('═'.repeat(55)));
    lines.push(`${chalk.dim('Site:')}       ${report.meta.url}`);
    lines.push(`${chalk.dim('Scanned:')}    ${new Date(report.meta.scanDate).toLocaleString()}`);
    lines.push(`${chalk.dim('Duration:')}   ${(report.meta.scanDurationMs / 1000).toFixed(1)} seconds`);
    if (report.meta.deep) {
        lines.push(`${chalk.dim('Mode:')}       ${chalk.yellow('Deep scan')}`);
    }

    // Summary
    lines.push('');
    lines.push(chalk.bold('📊 Summary'));
    lines.push(chalk.dim('─'.repeat(55)));

    const { summary } = report;
    lines.push(`${chalk.green('✓')} ${summary.thirdPartyRequests} third-party requests`);
    lines.push(`${chalk.green('✓')} ${summary.knownVendors} matched to known vendors`);

    if (summary.unknownDomains > 0) {
        lines.push(`${chalk.yellow('⚠')} ${summary.unknownDomains} unknown domain${summary.unknownDomains !== 1 ? 's' : ''}`);
    }
    if (summary.highRisk > 0) {
        lines.push(`${chalk.red('✗')} ${summary.highRisk} high-risk tracker${summary.highRisk !== 1 ? 's' : ''} detected`);
    }

    // High Risk Vendors
    const highRisk = report.vendors.filter((v) => v.vendor.risk_score >= 6);
    if (highRisk.length > 0) {
        lines.push('');
        lines.push(chalk.bold.red(`🔴 High Risk (${highRisk.length})`));
        lines.push(chalk.dim('─'.repeat(55)));
        for (const dv of highRisk) {
            lines.push(...formatVendorEntry(dv));
            lines.push('');
        }
    }

    // Medium Risk Vendors
    const mediumRisk = report.vendors.filter((v) => v.vendor.risk_score >= 3 && v.vendor.risk_score < 6);
    if (mediumRisk.length > 0) {
        lines.push('');
        lines.push(chalk.bold.yellow(`🟡 Medium Risk (${mediumRisk.length})`));
        lines.push(chalk.dim('─'.repeat(55)));
        for (const dv of mediumRisk) {
            lines.push(...formatVendorEntry(dv));
            lines.push('');
        }
    }

    // Low Risk Vendors
    const lowRisk = report.vendors.filter((v) => v.vendor.risk_score < 3);
    if (lowRisk.length > 0) {
        lines.push('');
        lines.push(chalk.bold.green(`🟢 Low Risk (${lowRisk.length})`));
        lines.push(chalk.dim('─'.repeat(55)));
        for (const dv of lowRisk) {
            lines.push(...formatVendorEntry(dv, true));
            lines.push('');
        }
    }

    // Unknown domains
    if (report.unknown.length > 0) {
        lines.push('');
        lines.push(chalk.bold.gray(`❓ Unknown (${report.unknown.length})`));
        lines.push(chalk.dim('─'.repeat(55)));
        for (const u of report.unknown) {
            lines.push(...formatUnknownEntry(u));
        }
    }

    // Recommendations
    if (report.recommendations.length > 0) {
        lines.push('');
        lines.push(chalk.bold('💡 Recommendations'));
        lines.push(chalk.dim('─'.repeat(55)));
        report.recommendations.forEach((rec, i) => {
            lines.push(`${i + 1}. ${rec.message}`);
        });
    }

    // Footer
    lines.push('');
    lines.push(chalk.dim('Run with --format json for machine-readable output'));
    lines.push(chalk.dim('Report issues: github.com/NMA-vc/etalon/issues'));
    lines.push('');

    return lines.join('\n');
}

function formatVendorEntry(dv: DetectedVendor, compact = false): string[] {
    const { vendor } = dv;
    const lines: string[] = [];

    const riskColor = vendor.risk_score >= 6 ? chalk.red : vendor.risk_score >= 3 ? chalk.yellow : chalk.green;

    lines.push(
        `${riskColor(vendor.domains[0].padEnd(35))} ${chalk.bold(vendor.name)}`
    );
    lines.push(`├─ ${chalk.dim('Category:')}   ${vendor.category}`);

    if (!compact) {
        const gdprStatus = vendor.gdpr_compliant
            ? chalk.green('Compliant') + (vendor.dpa_url ? chalk.dim(' (with DPA)') : '')
            : chalk.red('Non-compliant');
        lines.push(`├─ ${chalk.dim('GDPR:')}       ${gdprStatus}`);

        if (vendor.data_collected.length > 0) {
            lines.push(`├─ ${chalk.dim('Data:')}       ${vendor.data_collected.join(', ')}`);
        }

        if (vendor.dpa_url) {
            lines.push(`├─ ${chalk.dim('DPA:')}        ${chalk.underline(vendor.dpa_url)}`);
        }

        if (vendor.alternatives?.length) {
            lines.push(`└─ ${chalk.dim('Alt:')}        Consider ${vendor.alternatives.join(', ')}`);
        } else {
            lines.push(`└─ ${chalk.dim('Requests:')}   ${dv.requests.length}`);
        }
    } else {
        lines.push(`└─ ${chalk.dim('Requests:')}   ${dv.requests.length}`);
    }

    return lines;
}

function formatUnknownEntry(u: UnknownDomain): string[] {
    return [
        `${chalk.gray(u.domain)}`,
        `├─ ${chalk.dim('Requests:')}   ${u.requests.length}`,
        `└─ ${chalk.dim('Action:')}     Submit to ETALON registry`,
        '',
    ];
}
