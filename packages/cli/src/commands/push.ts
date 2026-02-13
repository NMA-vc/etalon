import chalk from 'chalk';
import ora from 'ora';
import { auditProject, applyContextScoring } from '@etalon/core';
import { scanSite, type ScanOptions } from '../scanner.js';
import { loadCloudConfig, uploadScan } from './cloud.js';

const VERSION = '1.0.0';

export interface PushOptions {
    site?: string;
    timeout?: string;
    deep?: boolean;
}

/**
 * `etalon push <url> [dir]`
 *
 * Runs a scan (and optionally an audit) then uploads everything to ETALON Cloud.
 * Combines `etalon scan --upload` + `etalon audit` in one step.
 */
export async function runPush(url: string, dir: string, options: PushOptions): Promise<void> {
    const siteId = options.site;
    if (!siteId) {
        console.log('');
        console.log(chalk.red('❌ --site <id> is required'));
        console.log(chalk.gray('   Get your site ID from: https://etalon.nma.vc/dashboard/sites'));
        console.log(chalk.gray('   Or run: etalon sites'));
        process.exit(1);
    }

    const config = loadCloudConfig();
    if (!config) {
        console.log('');
        console.log(chalk.red('❌ Not logged in. Run: etalon auth login'));
        process.exit(1);
    }

    console.log('');
    console.log(chalk.bold('🚀 ETALON Push'));
    console.log(chalk.dim('═══════════════════════════════════════════════════════'));
    console.log('');

    // ─── Step 1: Scan the website ─────────────────────────────────
    const scanSpinner = ora(`Scanning ${url}...`).start();

    let scanReport;
    try {
        const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
        const scanOptions: ScanOptions = {
            deep: options.deep ?? false,
            timeout: parseInt(options.timeout ?? '30000', 10),
            waitForNetworkIdle: false,
        };
        scanReport = await scanSite(normalizedUrl, scanOptions);
        scanSpinner.succeed(`Scan complete — ${scanReport.summary.total} vendor(s) detected`);
    } catch (err) {
        scanSpinner.fail('Scan failed');
        console.error(chalk.red(`  ${err instanceof Error ? err.message : String(err)}`));
        process.exit(2);
    }

    // ─── Step 2: Audit the codebase (if dir exists) ───────────────
    let auditReport;
    const auditSpinner = ora(`Auditing ${dir}...`).start();
    try {
        auditReport = await auditProject(dir, {});
        const scoring = applyContextScoring(auditReport.findings, dir);
        auditReport.findings = scoring.adjustedFindings;
        auditSpinner.succeed(`Audit complete — ${auditReport.findings.length} finding(s)`);
    } catch {
        auditSpinner.warn('Audit skipped (no project found or not a codebase)');
        auditReport = null;
    }

    // ─── Step 3: Upload scan results ──────────────────────────────
    const uploadSpinner = ora('Uploading to ETALON Cloud...').start();

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    const result = await uploadScan(config, siteId, normalizedUrl, scanReport, VERSION);

    if (result.success) {
        uploadSpinner.succeed(`Uploaded! Grade: ${chalk.bold(result.grade)} (${result.score}/100)`);
    } else {
        uploadSpinner.fail(`Upload failed: ${result.error}`);
    }

    // ─── Summary ──────────────────────────────────────────────────
    console.log('');
    console.log(chalk.dim('───────────────────────────────────────────────────────'));

    if (result.success) {
        console.log(chalk.green('✓ Push complete'));
        console.log(chalk.gray(`  Dashboard: ${result.dashboardUrl}`));
    }

    if (scanReport.summary.highRisk > 0) {
        console.log(chalk.yellow(`  ⚠ ${scanReport.summary.highRisk} high-risk tracker(s) detected`));
    }

    if (auditReport && auditReport.findings.length > 0) {
        const critical = auditReport.findings.filter((f: any) => f.severity === 'critical').length;
        const high = auditReport.findings.filter((f: any) => f.severity === 'high').length;
        if (critical + high > 0) {
            console.log(chalk.yellow(`  ⚠ ${critical} critical, ${high} high severity code findings`));
        }
    }

    console.log('');
}
