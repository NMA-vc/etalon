import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { writeFileSync } from 'node:fs';
import {
    normalizeUrl, VendorRegistry, auditProject, formatAuditSarif,
    generateBadgeSvg, calculateScore, generatePatches, applyPatches,
    analyzeDataFlow, toMermaid, toTextSummary, generatePolicy,
} from '@etalon/core';
import { scanSite, type ScanOptions } from './scanner.js';
import { formatText } from './formatters/text.js';
import { formatJson } from './formatters/json.js';
import { formatSarif } from './formatters/sarif.js';
import { formatAuditText } from './formatters/audit-text.js';
import { generateHtmlReport } from './formatters/html-report.js';
import { loadConfig } from './config.js';
import { runInit } from './commands/init.js';

const VERSION = '1.0.0';

function showBanner() {
    const blue = chalk.hex('#3B82F6');
    const dim = chalk.hex('#64748B');
    const cyan = chalk.hex('#06B6D4');

    console.log('');
    console.log(blue.bold('  ███████╗████████╗ █████╗ ██╗      ██████╗ ███╗   ██╗'));
    console.log(blue.bold('  ██╔════╝╚══██╔══╝██╔══██╗██║     ██╔═══██╗████╗  ██║'));
    console.log(cyan.bold('  █████╗     ██║   ███████║██║     ██║   ██║██╔██╗ ██║'));
    console.log(cyan.bold('  ██╔══╝     ██║   ██╔══██║██║     ██║   ██║██║╚██╗██║'));
    console.log(blue.bold('  ███████╗   ██║   ██║  ██║███████╗╚██████╔╝██║ ╚████║'));
    console.log(blue.bold('  ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝'));
    console.log('');
    console.log(dim(`  v${VERSION}  `) + chalk.white('Privacy audit tool for AI coding agents'));
    console.log(dim('  Open-source GDPR compliance scanner  ') + cyan('etalon.nma.vc'));
    console.log('');
}

const program = new Command();

program
    .name('etalon')
    .description('ETALON — Open-source privacy auditor. Scan websites for trackers and GDPR compliance.')
    .version(VERSION)
    .hook('preAction', () => {
        showBanner();
    });

program
    .command('scan')
    .description('Scan a website for third-party trackers')
    .argument('<url>', 'URL to scan')
    .option('-f, --format <format>', 'Output format: text, json, sarif', 'text')
    .option('-d, --deep', 'Deep scan: scroll page, interact with consent dialogs', false)
    .option('-t, --timeout <ms>', 'Navigation timeout in milliseconds', '30000')
    .option('--idle', 'Wait for network idle (slower but more thorough)')
    .option('--config <path>', 'Path to etalon.yaml config file')
    .action(async (url: string, options: Record<string, string | boolean>) => {
        const normalizedUrl = normalizeUrl(url);
        const format = (options.format as string) ?? 'text';

        // Load config
        const config = loadConfig(options.config as string | undefined);

        // Build scan options
        const scanOptions: ScanOptions = {
            deep: options.deep as boolean,
            timeout: parseInt(options.timeout as string, 10),
            waitForNetworkIdle: options.idle === true,
        };

        // Merge config file scan settings
        if (config?.scan) {
            if (config.scan.timeout && !options.timeout) scanOptions.timeout = config.scan.timeout;
            if (config.scan.user_agent) scanOptions.userAgent = config.scan.user_agent;
            if (config.scan.viewport) scanOptions.viewport = config.scan.viewport;
            if (config.scan.wait_for_network_idle !== undefined && options.idle === undefined) {
                scanOptions.waitForNetworkIdle = config.scan.wait_for_network_idle;
            }
        }

        // Show spinner for text format only
        const showSpinner = format === 'text';
        const spinner = showSpinner ? ora(`Scanning ${normalizedUrl}...`).start() : null;

        try {
            const report = await scanSite(normalizedUrl, scanOptions);

            spinner?.stop();

            // Output the report
            switch (format) {
                case 'json':
                    console.log(formatJson(report));
                    break;
                case 'sarif':
                    console.log(formatSarif(report));
                    break;
                case 'text':
                default:
                    console.log(formatText(report));
                    break;
            }

            // Exit with non-zero if high-risk trackers found (useful for CI)
            if (report.summary.highRisk > 0) {
                process.exit(1);
            }
        } catch (error) {
            spinner?.fail('Scan failed');
            if (error instanceof Error) {
                console.error(`\nError: ${error.message}`);
                if (error.message.includes('Executable doesn\'t exist')) {
                    console.error('\nPlaywright browsers not installed. Run:');
                    console.error('  npx playwright install chromium');
                }
            } else {
                console.error('\nAn unexpected error occurred.');
            }
            process.exit(2);
        }
    });

program
    .command('audit')
    .description('Scan a codebase for GDPR compliance (tracker SDKs, PII in schemas, config issues)')
    .argument('[dir]', 'Directory to audit', './')
    .option('-f, --format <format>', 'Output format: text, json, sarif, html', 'text')
    .option('-s, --severity <level>', 'Minimum severity: info, low, medium, high, critical')
    .option('--include-blame', 'Include git blame information for each finding', false)
    .option('--fix', 'Auto-fix simple issues (preview before applying)', false)
    .action(async (dir: string, options: Record<string, string | boolean>) => {
        const format = (options.format as string) ?? 'text';
        const includeBlame = options.includeBlame as boolean;
        const autoFix = options.fix as boolean;
        const showSpinner = format === 'text';
        const spinner = showSpinner ? ora(`Auditing ${dir}...`).start() : null;

        try {
            const report = await auditProject(dir, {
                severity: options.severity as string | undefined,
                includeBlame,
            });

            spinner?.stop();

            // Auto-fix mode
            if (autoFix) {
                const patches = generatePatches(report.findings, dir);
                if (patches.length === 0) {
                    console.log(chalk.yellow('\nNo auto-fixable issues found.'));
                } else {
                    console.log(chalk.bold(`\n🔧 ${patches.length} auto-fixable issue(s):`));
                    for (const p of patches) {
                        console.log(`  ${chalk.dim(p.file)}:${p.line} — ${p.description}`);
                        console.log(`    ${chalk.red('- ' + p.oldContent.trim())}`);
                        console.log(`    ${chalk.green('+ ' + p.newContent.trim())}`);
                    }
                    const applied = applyPatches(patches, dir);
                    console.log(chalk.green(`\n✓ Applied ${applied} fix(es).`));
                }
            }

            switch (format) {
                case 'json':
                    console.log(JSON.stringify(report, null, 2));
                    break;
                case 'sarif':
                    console.log(formatAuditSarif(report));
                    break;
                case 'html': {
                    const html = generateHtmlReport(report);
                    const outPath = 'etalon-report.html';
                    writeFileSync(outPath, html, 'utf-8');
                    console.log(chalk.green(`✓ Report written to ${chalk.cyan(outPath)}`));
                    break;
                }
                case 'text':
                default:
                    console.log(formatAuditText(report));
                    break;
            }

            // Exit non-zero on critical/high findings
            if (report.summary.critical > 0 || report.summary.high > 0) {
                process.exit(1);
            }
        } catch (error) {
            spinner?.fail('Audit failed');
            if (error instanceof Error) {
                console.error(`\nError: ${error.message}`);
            } else {
                console.error('\nAn unexpected error occurred.');
            }
            process.exit(2);
        }
    });

program
    .command('lookup')
    .description('Look up a domain in the vendor registry')
    .argument('<domain>', 'Domain to look up')
    .action((domain: string) => {
        const registry = VendorRegistry.load();
        const vendor = registry.lookupDomain(domain);

        if (vendor) {
            console.log(JSON.stringify(vendor, null, 2));
        } else {
            console.log(`Domain "${domain}" is not in the ETALON vendor registry.`);
            process.exit(1);
        }
    });

program
    .command('info')
    .description('Show ETALON registry information')
    .action(() => {
        const registry = VendorRegistry.load();
        const meta = registry.getMetadata();
        console.log(`ETALON Registry v${meta.version}`);
        console.log(`Last updated: ${meta.lastUpdated}`);
        console.log(`Vendors: ${meta.vendorCount}`);
        console.log(`Domains tracked: ${meta.domainCount}`);
        console.log(`Categories: ${meta.categoryCount}`);
    });

// ─── New Commands ─────────────────────────────────────────────────

program
    .command('init')
    .description('Set up ETALON in your project (config, CI, pre-commit hook)')
    .argument('[dir]', 'Project directory', './')
    .option('--ci <provider>', 'CI provider: github, gitlab, none', 'github')
    .option('--no-precommit', 'Skip pre-commit hook installation')
    .option('--force', 'Overwrite existing files', false)
    .action(async (dir: string, options: Record<string, string | boolean>) => {
        await runInit(dir, {
            ci: options.ci as 'github' | 'gitlab' | 'none',
            precommit: options.precommit !== false,
            force: options.force as boolean,
        });
    });

program
    .command('consent-check')
    .description('Test if trackers fire before/after rejecting cookies on a website')
    .argument('<url>', 'URL to check')
    .option('-f, --format <format>', 'Output format: text, json', 'text')
    .option('-t, --timeout <ms>', 'Navigation timeout', '15000')
    .action(async (url: string, options: Record<string, string>) => {
        const normalizedUrl = normalizeUrl(url);
        const format = options.format ?? 'text';
        const spinner = format === 'text' ? ora(`Checking consent on ${normalizedUrl}...`).start() : null;

        try {
            const { checkConsent } = await import('./consent-checker.js');
            const result = await checkConsent(normalizedUrl, {
                timeout: parseInt(options.timeout ?? '15000', 10),
            });

            spinner?.stop();

            if (format === 'json') {
                console.log(JSON.stringify(result, null, 2));
            } else {
                console.log('');
                console.log(chalk.bold('ETALON Consent Verification'));
                console.log(chalk.dim('═══════════════════════════════════════════════════════'));
                console.log(`URL:       ${chalk.cyan(result.url)}`);
                console.log(`Banner:    ${result.bannerDetected ? chalk.green('✓ Detected') : chalk.red('✗ Not found')}${result.bannerType ? ` (${result.bannerType})` : ''}`);
                console.log(`Reject:    ${result.rejectClicked ? chalk.green('✓ Clicked') : chalk.yellow('✗ Could not reject')}`);
                console.log('');

                if (result.preConsentTrackers.length > 0) {
                    console.log(chalk.bold('🔍 Trackers before consent:'));
                    for (const t of result.preConsentTrackers) {
                        console.log(`  • ${t.name} (${chalk.dim(t.matchedDomain)})`);
                    }
                    console.log('');
                }

                if (result.postRejectTrackers.length > 0) {
                    console.log(chalk.bold('⚠️  Trackers after rejection:'));
                    for (const t of result.postRejectTrackers) {
                        console.log(`  • ${chalk.red(t.name)} (${chalk.dim(t.matchedDomain)})`);
                    }
                    console.log('');
                }

                if (result.violations.length > 0) {
                    console.log(chalk.red.bold(`🔴 ${result.violations.length} consent violation(s)`));
                    for (const v of result.violations) {
                        console.log(`  ${v.phase === 'before-interaction' ? '⏱' : '🔴'} ${v.message}`);
                    }
                } else {
                    console.log(chalk.green.bold('✓ No consent violations detected'));
                }
                console.log('');
            }

            if (!result.pass) process.exit(1);
        } catch (error) {
            spinner?.fail('Consent check failed');
            if (error instanceof Error) {
                console.error(`\nError: ${error.message}`);
            }
            process.exit(2);
        }
    });

program
    .command('policy-check')
    .description('Cross-reference privacy policy text against actual detected trackers')
    .argument('<url>', 'URL to check')
    .option('-f, --format <format>', 'Output format: text, json', 'text')
    .option('-t, --timeout <ms>', 'Navigation timeout', '30000')
    .option('--policy-url <url>', 'Directly specify the privacy policy URL')
    .action(async (url: string, options: Record<string, string>) => {
        const normalizedUrl = normalizeUrl(url);
        const format = options.format ?? 'text';
        const spinner = format === 'text' ? ora(`Analyzing privacy policy for ${normalizedUrl}...`).start() : null;

        try {
            const { checkPolicy } = await import('./policy-checker.js');
            const result = await checkPolicy(normalizedUrl, {
                timeout: parseInt(options.timeout ?? '30000', 10),
                policyUrl: options.policyUrl,
            });

            spinner?.stop();

            if (format === 'json') {
                console.log(JSON.stringify(result, null, 2));
            } else {
                console.log('');
                console.log(chalk.bold('ETALON Policy vs. Reality Audit'));
                console.log(chalk.dim('═══════════════════════════════════════════════════════'));
                console.log(`URL:           ${chalk.cyan(result.url)}`);
                console.log(`Policy page:   ${result.policyFound ? chalk.green(result.policyUrl!) : chalk.red('✗ Not found')}`);
                console.log('');
                console.log(`📋 Vendors mentioned in policy:  ${chalk.bold(String(result.mentionedVendors.length))}`);
                console.log(`🔍 Vendors detected by scan:     ${chalk.bold(String(result.detectedVendors.length))}`);
                console.log('');

                if (!result.policyFound) {
                    console.log(chalk.red.bold('⚠  No privacy policy page found — all detected trackers are undisclosed'));
                    console.log('');
                }

                if (result.undisclosed.length > 0) {
                    console.log(chalk.red.bold(`🔴 ${result.undisclosed.length} UNDISCLOSED (detected on site, not in policy):`));
                    for (const m of result.undisclosed) {
                        const icon = m.severity === 'critical' ? chalk.red('✗ CRITICAL') :
                            m.severity === 'high' ? chalk.yellow('✗ HIGH') :
                                m.severity === 'medium' ? chalk.yellow('✗ MEDIUM') :
                                    chalk.dim('✗ LOW');
                        console.log(`  ${icon}  ${m.vendorName} — ${m.message}`);
                    }
                    console.log('');
                }

                if (result.disclosed.length > 0) {
                    console.log(chalk.green.bold(`✓ ${result.disclosed.length} DISCLOSED (in both policy and scan):`));
                    for (const m of result.disclosed) {
                        console.log(`  ${chalk.green('✓')} ${m.vendorName}`);
                    }
                    console.log('');
                }

                if (result.overclaimed.length > 0) {
                    console.log(chalk.dim(`ℹ  ${result.overclaimed.length} OVERCLAIMED (in policy, not detected):`));
                    for (const m of result.overclaimed) {
                        console.log(`  ${chalk.dim('–')} ${m.vendorName}`);
                    }
                    console.log('');
                }

                if (result.pass) {
                    console.log(chalk.green.bold('✓ All detected trackers are disclosed in the privacy policy'));
                } else {
                    console.log(chalk.red.bold(`✗ ${result.undisclosed.length} tracker(s) not disclosed in privacy policy`));
                }
                console.log('');

                // Show disclosure snippets for undisclosed vendors
                if (result.disclosures.length > 0) {
                    console.log(chalk.bold.cyan('📝 Add this to your privacy policy:'));
                    console.log(chalk.dim('─────────────────────────────────────────────────────'));
                    for (const d of result.disclosures) {
                        console.log('');
                        console.log(chalk.bold(`  ${d.vendorName}`));
                        console.log(`  ${d.snippet}`);
                        if (d.dpaUrl) {
                            console.log(chalk.dim(`  DPA: ${d.dpaUrl}`));
                        }
                    }
                    console.log('');
                    console.log(chalk.dim('─────────────────────────────────────────────────────'));
                    console.log(chalk.dim('Copy the text above into your privacy policy or CMS.'));
                    console.log('');
                }
            }

            if (!result.pass) process.exit(1);
        } catch (error) {
            spinner?.fail('Policy check failed');
            if (error instanceof Error) {
                console.error(`\nError: ${error.message}`);
            }
            process.exit(2);
        }
    });

program
    .command('generate-policy')
    .description('Generate a GDPR privacy policy from code audit + network scan')
    .argument('[dir]', 'Project directory to audit', './')
    .requiredOption('--company <name>', 'Your company/organization name')
    .requiredOption('--email <email>', 'Privacy contact / DPO email')
    .option('--url <url>', 'Also scan a live URL for network trackers')
    .option('--country <country>', 'Jurisdiction (e.g. "EU", "Germany")')
    .option('-o, --output <file>', 'Output file', 'privacy-policy.md')
    .option('-f, --format <format>', 'Output format: md, html, txt', 'md')
    .action(async (dir: string, options: Record<string, string>) => {
        const spinner = ora('Generating privacy policy...').start();

        try {
            // Step 1: Code audit
            spinner.text = 'Running code audit...';
            const audit = await auditProject(dir);

            // Step 2: Data flow analysis
            spinner.text = 'Analyzing data flows...';
            const { collectFiles } = await import('@etalon/core');
            let dataFlow;
            try {
                // analyzeDataFlow needs file list
                const files = (collectFiles as any)?.(dir) ?? [];
                if (files.length > 0) {
                    dataFlow = analyzeDataFlow(files, dir);
                }
            } catch {
                // data flow analysis is optional
            }

            // Step 3: Optional network scan
            let networkVendorIds: Set<string> | undefined;
            if (options.url) {
                spinner.text = `Scanning ${options.url} for trackers...`;
                const scanResult = await scanSite(normalizeUrl(options.url), { timeout: 30000, deep: false });
                networkVendorIds = new Set(scanResult.vendors.map((v) => v.vendor.id));
            }

            // Step 4: Generate policy
            spinner.text = 'Assembling privacy policy...';
            const policy = generatePolicy({
                input: {
                    companyName: options.company,
                    companyEmail: options.email,
                    companyCountry: options.country,
                    siteUrl: options.url,
                    projectDir: dir,
                },
                audit,
                networkVendorIds,
                dataFlow,
            });

            // Step 5: Write output
            const outputFile = options.output ?? 'privacy-policy.md';
            writeFileSync(outputFile, policy.fullText, 'utf-8');

            spinner.succeed(`Privacy policy generated!`);

            console.log('');
            console.log(chalk.bold('ETALON Privacy Policy Generator'));
            console.log(chalk.dim('═══════════════════════════════════════════════════'));
            console.log(`Company:       ${chalk.cyan(options.company)}`);
            console.log(`Contact:       ${chalk.cyan(options.email)}`);
            if (options.url) {
                console.log(`Site scanned:  ${chalk.cyan(options.url)}`);
            }
            console.log(`Sources:       ${chalk.dim(policy.meta.sources.join(', '))}`);
            console.log('');
            console.log(`📋 Sections:   ${chalk.bold(String(policy.sections.length))}`);
            console.log(`🔍 Vendors:    ${chalk.bold(String(policy.vendors.length))}`);
            console.log(`🛡️  PII types:  ${chalk.bold(String(policy.piiTypes.length))}`);
            console.log('');

            if (policy.vendors.length > 0) {
                console.log(chalk.dim('Third-party vendors included:'));
                for (const v of policy.vendors) {
                    const src = v.source === 'both' ? chalk.magenta('code+network') :
                        v.source === 'code' ? chalk.blue('code') :
                            chalk.green('network');
                    console.log(`  ${chalk.bold(v.vendorName)} ${chalk.dim(`(${v.category})`)} — ${src}`);
                }
                console.log('');
            }

            console.log(chalk.green(`✓ Written to ${chalk.bold(outputFile)}`));
            console.log(chalk.dim('⚠ Review with a legal professional before publishing.'));
            console.log('');
        } catch (error) {
            spinner.fail('Policy generation failed');
            if (error instanceof Error) {
                console.error(`\nError: ${error.message}`);
            }
            process.exit(2);
        }
    });

program
    .command('badge')
    .description('Generate a compliance badge SVG for your README')
    .argument('[dir]', 'Directory to audit', './')
    .option('-o, --output <file>', 'Output file', 'etalon-badge.svg')
    .action(async (dir: string, options: Record<string, string>) => {
        const spinner = ora('Generating badge...').start();
        try {
            const report = await auditProject(dir);
            const score = report.score ?? calculateScore(report);
            const svg = generateBadgeSvg(score);
            writeFileSync(options.output, svg, 'utf-8');
            spinner.succeed(`Badge written to ${chalk.cyan(options.output)} — Grade: ${score.grade} (${score.score}/100)`);
            console.log('');
            console.log(chalk.bold('Shields.io badge for your README:'));
            console.log(chalk.dim('─────────────────────────────────'));
            const { badgeMarkdown: toBadgeMd } = await import('@etalon/core');
            console.log(toBadgeMd(score.grade, score.score));
            console.log('');
        } catch (error) {
            spinner.fail('Badge generation failed');
            if (error instanceof Error) console.error(`\nError: ${error.message}`);
            process.exit(2);
        }
    });

program
    .command('data-flow')
    .description('Map PII data flows through your codebase')
    .argument('[dir]', 'Directory to analyze', './')
    .option('-f, --format <format>', 'Output format: text, mermaid, json', 'text')
    .action(async (dir: string, options: Record<string, string>) => {
        const spinner = ora('Analyzing data flows...').start();
        try {
            // Collect files (reuse audit's file collection)
            const { readdirSync, statSync } = await import('node:fs');
            const { join, relative } = await import('node:path');

            const files: string[] = [];
            function walk(d: string) {
                for (const entry of readdirSync(d, { withFileTypes: true })) {
                    const full = join(d, entry.name);
                    if (entry.isDirectory()) {
                        if (!['node_modules', '.git', 'dist', 'build', '.next', '__pycache__'].includes(entry.name)) {
                            walk(full);
                        }
                    } else {
                        files.push(relative(dir, full));
                    }
                }
            }
            walk(dir);

            const flow = analyzeDataFlow(files, dir);
            spinner.stop();

            switch (options.format) {
                case 'json':
                    console.log(JSON.stringify(flow, null, 2));
                    break;
                case 'mermaid':
                    console.log(toMermaid(flow));
                    break;
                case 'text':
                default:
                    console.log(toTextSummary(flow));
                    break;
            }
        } catch (error) {
            spinner.fail('Data flow analysis failed');
            if (error instanceof Error) console.error(`\nError: ${error.message}`);
            process.exit(2);
        }
    });

program.parse();
