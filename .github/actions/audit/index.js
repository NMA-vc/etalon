// ETALON Privacy Audit — GitHub Action Entry Point
// Runs etalon audit on PRs, diffs against baseline, posts comments, uploads SARIF
//
// This is a standalone script — it calls the etalon CLI as a subprocess.
// Dependencies (@actions/core, @actions/github) are expected to be available
// in the GitHub Actions runner environment.

const core = require('@actions/core');
const github = require('@actions/github');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function run() {
    try {
        const failOn = core.getInput('fail-on') || 'high';
        const commentPR = core.getInput('comment-pr') === 'true';
        const githubToken = core.getInput('github-token');
        const baselineRef = core.getInput('baseline-ref') || 'main';

        // 1. Run audit on current code
        core.startGroup('Running ETALON audit');
        const currentResult = runAudit();
        core.endGroup();

        // 2. Run audit on baseline for diff (PRs only)
        let diff = null;

        if (github.context.eventName === 'pull_request') {
            core.startGroup(`Diffing against ${baselineRef}`);
            diff = getDiff(currentResult, baselineRef);
            core.endGroup();
        } else {
            // For pushes, treat all findings as "added"
            diff = { added: currentResult.findings, removed: [], unchanged: [] };
        }

        // 3. Set outputs
        const highCount = currentResult.summary.high + currentResult.summary.critical;
        const mediumCount = currentResult.summary.medium;
        const lowCount = currentResult.summary.low;

        core.setOutput('high-count', highCount);
        core.setOutput('medium-count', mediumCount);
        core.setOutput('low-count', lowCount);
        core.setOutput('added-count', diff.added.length);

        const block = shouldBlock(diff, failOn);
        core.setOutput('should-block', block);

        // 4. Post PR comment
        if (commentPR && github.context.payload.pull_request) {
            core.startGroup('Posting PR comment');
            await postComment(currentResult, diff, failOn, githubToken);
            core.endGroup();
        }

        // 5. Write SARIF for GitHub Code Scanning
        core.startGroup('Writing SARIF report');
        writeSarif(currentResult);
        core.endGroup();

        // 6. Log summary
        core.info(`Total findings: ${currentResult.summary.totalFindings}`);
        core.info(`New in this PR: ${diff.added.length}`);
        core.info(`Fixed in this PR: ${diff.removed.length}`);

        // 7. Fail if needed
        if (block) {
            core.setFailed(
                `Found ${diff.added.length} new privacy issue(s) at ${failOn} severity or higher`
            );
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

// ─── Audit Runner ──────────────────────────────────────────────────

function runAudit() {
    try {
        const output = execSync('npx etalon audit . --format json', {
            encoding: 'utf-8',
            timeout: 120_000,
        });
        return JSON.parse(output);
    } catch (error) {
        // npx etalon exits non-zero when it finds high findings
        // The JSON output is still on stdout
        if (error.stdout) {
            try {
                return JSON.parse(error.stdout);
            } catch {
                throw new Error(`Failed to parse audit output: ${error.message}`);
            }
        }
        throw error;
    }
}

// ─── Diff Calculation ──────────────────────────────────────────────

function getDiff(currentResult, baselineRef) {
    try {
        const currentBranch = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();

        execSync(`git fetch origin ${baselineRef} --depth=1`, { stdio: 'pipe' });
        execSync(`git checkout FETCH_HEAD --quiet`, { stdio: 'pipe' });

        const baselineResult = runAudit();

        // Return to PR branch
        execSync(`git checkout ${currentBranch} --quiet`, { stdio: 'pipe' });

        return calculateDiff(currentResult, baselineResult);
    } catch (error) {
        core.warning(`Could not diff against ${baselineRef}: ${error.message}`);
        return { added: currentResult.findings, removed: [], unchanged: [] };
    }
}

function calculateDiff(current, baseline) {
    const makeKey = (f) => `${f.rule}::${f.file}::${f.line || 0}::${f.message}`;

    const baselineKeys = new Set(baseline.findings.map(makeKey));
    const currentKeys = new Set(current.findings.map(makeKey));

    const added = current.findings.filter((f) => !baselineKeys.has(makeKey(f)));
    const removed = baseline.findings.filter((f) => !currentKeys.has(makeKey(f)));
    const unchanged = current.findings.filter((f) => baselineKeys.has(makeKey(f)));

    return { added, removed, unchanged };
}

// ─── Block Decision ────────────────────────────────────────────────

function shouldBlock(diff, threshold) {
    const order = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };
    const minLevel = order[threshold] ?? 0;

    return diff.added.some((f) => (order[f.severity] ?? 0) >= minLevel);
}

// ─── PR Comment ────────────────────────────────────────────────────

async function postComment(report, diff, failOn, token) {
    const octokit = github.getOctokit(token);
    const body = generateComment(report, diff);

    // Delete previous ETALON comments to avoid spam
    const { data: comments } = await octokit.rest.issues.listComments({
        ...github.context.repo,
        issue_number: github.context.payload.pull_request.number,
        per_page: 100,
    });

    for (const comment of comments) {
        if (comment.body && comment.body.includes('ETALON Privacy Audit')) {
            await octokit.rest.issues.deleteComment({
                ...github.context.repo,
                comment_id: comment.id,
            });
        }
    }

    await octokit.rest.issues.createComment({
        ...github.context.repo,
        issue_number: github.context.payload.pull_request.number,
        body,
    });
}

function generateComment(report, diff) {
    const { added, removed } = diff;
    let comment = '## 🔒 ETALON Privacy Audit\n\n';

    const s = report.summary;
    const newHigh = added.filter(
        (f) => f.severity === 'high' || f.severity === 'critical'
    ).length;

    // Status
    if (newHigh > 0) {
        comment += `❌ **${added.length} new privacy issue(s)** — PR blocked\n\n`;
    } else if (added.length > 0) {
        comment += `⚠️ **${added.length} new privacy issue(s)** found\n\n`;
    } else {
        comment += `✅ No new privacy issues detected\n\n`;
    }

    comment += `| Severity | Count |\n|----------|-------|\n`;
    if (s.critical > 0) comment += `| 🔴 Critical | ${s.critical} |\n`;
    if (s.high > 0) comment += `| 🔴 High | ${s.high} |\n`;
    if (s.medium > 0) comment += `| 🟡 Medium | ${s.medium} |\n`;
    if (s.low > 0) comment += `| 🟢 Low | ${s.low} |\n`;
    comment += '\n';

    // New issues
    if (added.length > 0) {
        comment += '<details>\n<summary>🆕 New Issues in This PR</summary>\n\n';

        const highFindings = added.filter(
            (f) => f.severity === 'high' || f.severity === 'critical'
        );
        const mediumFindings = added.filter((f) => f.severity === 'medium');

        if (highFindings.length > 0) {
            comment += '#### 🔴 High/Critical\n\n';
            for (const f of highFindings) {
                comment += `- **${f.title}**\n`;
                comment += `  - \`${f.file}${f.line ? `:${f.line}` : ''}\`\n`;
                if (f.fix) comment += `  - 💡 ${f.fix}\n`;
            }
            comment += '\n';
        }

        if (mediumFindings.length > 0 && mediumFindings.length <= 10) {
            comment += '#### 🟡 Medium\n\n';
            for (const f of mediumFindings) {
                comment += `- ${f.title} (\`${f.file}${f.line ? `:${f.line}` : ''}\`)\n`;
            }
            comment += '\n';
        } else if (mediumFindings.length > 10) {
            comment += `#### 🟡 Medium\n\n${mediumFindings.length} medium-severity findings. Run \`etalon audit .\` locally for details.\n\n`;
        }

        comment += '</details>\n\n';
    }

    // Fixed issues
    if (removed.length > 0) {
        comment += `### ✅ Fixed Issues\n\nThis PR fixes **${removed.length}** existing privacy issue(s)! 🎉\n\n`;
    }

    // Footer
    comment += '---\n';
    comment += '💡 Run `npx etalon audit .` locally for full details\n';

    return comment;
}

// ─── SARIF Output ──────────────────────────────────────────────────

function writeSarif(report) {
    const sarif = {
        $schema:
            'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
        version: '2.1.0',
        runs: [
            {
                tool: {
                    driver: {
                        name: 'ETALON',
                        version: report.meta.etalonVersion,
                        informationUri: 'https://github.com/nma-vc/etalon',
                    },
                },
                results: report.findings.map((f) => ({
                    ruleId: f.rule,
                    level: f.severity === 'critical' || f.severity === 'high' ? 'error' : 'warning',
                    message: { text: f.message },
                    locations: [
                        {
                            physicalLocation: {
                                artifactLocation: { uri: f.file },
                                region: { startLine: f.line || 1 },
                            },
                        },
                    ],
                })),
            },
        ],
    };

    fs.writeFileSync('etalon-results.sarif', JSON.stringify(sarif, null, 2));
    core.info('SARIF report written to etalon-results.sarif');
}

run();
