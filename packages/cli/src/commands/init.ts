import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';

// ─── Templates ────────────────────────────────────────────────────

const ETALON_YAML = `# ETALON Configuration
# https://etalon.nma.vc/docs/config
version: "1.0"

# Vendors/domains you've reviewed and approved
allowlist: []
  # - vendor_id: google-analytics
  #   reason: "Required for analytics — consent collected via CMP"
  #   approved_by: "privacy@company.com"
  #   approved_date: "2025-01-15"

# Audit settings
audit:
  severity: low          # minimum severity to report
  include_blame: false   # enrich with git blame info

# Scan settings (runtime)
scan:
  timeout: 30000
  wait_for_network_idle: true
`;

const GITHUB_ACTION = `name: ETALON Privacy Audit
on:
  pull_request:
    branches: [main, master]

permissions:
  contents: read
  pull-requests: write
  security-events: write

jobs:
  etalon:
    name: Privacy Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install ETALON
        run: npm install -g etalon

      - name: Run audit
        run: etalon audit ./ --format sarif > etalon-results.sarif

      - name: Upload SARIF
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: etalon-results.sarif
          category: etalon-privacy
`;

const PRECOMMIT_HOOK = `#!/bin/sh
# ETALON pre-commit hook — blocks commits with critical/high privacy issues
# Installed by 'etalon init'

# Get staged files
STAGED_FILES=\$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "\$STAGED_FILES" ]; then
  exit 0
fi

# Run audit silently
echo "🔍 ETALON: checking for privacy issues..."
npx etalon audit ./ --format json --severity high 2>/dev/null | node -e "
  const data = require('fs').readFileSync('/dev/stdin', 'utf8');
  try {
    const report = JSON.parse(data);
    const staged = process.argv.slice(1);
    const issues = report.findings.filter(f => staged.some(s => f.file.includes(s)));
    if (issues.length > 0) {
      console.error('\\n🔴 ETALON: Found ' + issues.length + ' high/critical privacy issue(s):');
      issues.forEach(f => console.error('  • ' + f.severity.toUpperCase() + ': ' + f.title + ' (' + f.file + ')'));
      console.error('\\nFix these issues or use --no-verify to skip.\\n');
      process.exit(1);
    }
  } catch(e) { /* audit not available, allow commit */ }
" \$STAGED_FILES
`;

const GITIGNORE_ADDITIONS = `
# ETALON
etalon-report.html
etalon-badge.svg
etalon-results.sarif
`;

// ─── Init Command ─────────────────────────────────────────────────

export interface InitOptions {
    ci?: 'github' | 'gitlab' | 'none';
    precommit?: boolean;
    force?: boolean;
}

export async function runInit(dir: string, options: InitOptions = {}): Promise<void> {
    const ci = options.ci ?? 'github';
    const precommit = options.precommit ?? true;
    const force = options.force ?? false;

    console.log('');
    console.log(chalk.bold('🔧 ETALON Project Setup'));
    console.log(chalk.dim('═══════════════════════════════════════════════════════'));
    console.log('');

    // 1. Create etalon.yaml
    const yamlPath = join(dir, 'etalon.yaml');
    if (!existsSync(yamlPath) || force) {
        writeFileSync(yamlPath, ETALON_YAML, 'utf-8');
        console.log(chalk.green('✓') + ` Created ${chalk.cyan('etalon.yaml')}`);
    } else {
        console.log(chalk.yellow('⊘') + ` ${chalk.cyan('etalon.yaml')} already exists (use --force to overwrite)`);
    }

    // 2. Create CI workflow
    if (ci === 'github') {
        const workflowDir = join(dir, '.github', 'workflows');
        const workflowPath = join(workflowDir, 'etalon.yml');
        if (!existsSync(workflowPath) || force) {
            mkdirSync(workflowDir, { recursive: true });
            writeFileSync(workflowPath, GITHUB_ACTION, 'utf-8');
            console.log(chalk.green('✓') + ` Created ${chalk.cyan('.github/workflows/etalon.yml')}`);
        } else {
            console.log(chalk.yellow('⊘') + ` ${chalk.cyan('.github/workflows/etalon.yml')} already exists`);
        }
    }

    // 3. Create pre-commit hook
    if (precommit) {
        const hooksDir = join(dir, '.git', 'hooks');
        const hookPath = join(hooksDir, 'pre-commit');

        // Also create as a standalone script for Husky/lint-staged users
        const etalonDir = join(dir, '.etalon');
        const standalonePath = join(etalonDir, 'pre-commit.sh');
        mkdirSync(etalonDir, { recursive: true });

        if (!existsSync(standalonePath) || force) {
            writeFileSync(standalonePath, PRECOMMIT_HOOK, { mode: 0o755 });
            console.log(chalk.green('✓') + ` Created ${chalk.cyan('.etalon/pre-commit.sh')}`);
        }

        // Try to install into .git/hooks
        if (existsSync(join(dir, '.git'))) {
            mkdirSync(hooksDir, { recursive: true });
            if (!existsSync(hookPath) || force) {
                writeFileSync(hookPath, PRECOMMIT_HOOK, { mode: 0o755 });
                console.log(chalk.green('✓') + ` Installed ${chalk.cyan('pre-commit hook')}`);
            } else {
                console.log(chalk.yellow('⊘') + ` pre-commit hook already exists (see ${chalk.cyan('.etalon/pre-commit.sh')})`);
            }
        } else {
            console.log(chalk.dim('  (no .git directory — hook saved to .etalon/pre-commit.sh)'));
        }
    }

    // 4. Create .etalon/rules directory for custom rules
    const rulesDir = join(dir, '.etalon', 'rules');
    if (!existsSync(rulesDir)) {
        mkdirSync(rulesDir, { recursive: true });
        writeFileSync(join(rulesDir, '.gitkeep'), '', 'utf-8');
        console.log(chalk.green('✓') + ` Created ${chalk.cyan('.etalon/rules/')} for custom rules`);
    }

    // 5. Update .gitignore
    const gitignorePath = join(dir, '.gitignore');
    if (existsSync(gitignorePath)) {
        const content = await import('node:fs').then(fs => fs.readFileSync(gitignorePath, 'utf-8'));
        if (!content.includes('etalon-report.html')) {
            writeFileSync(gitignorePath, content + GITIGNORE_ADDITIONS, 'utf-8');
            console.log(chalk.green('✓') + ` Updated ${chalk.cyan('.gitignore')}`);
        }
    }

    // Summary
    console.log('');
    console.log(chalk.dim('───────────────────────────────────────────────────────'));
    console.log(chalk.bold('Next steps:'));
    console.log(`  1. Review ${chalk.cyan('etalon.yaml')} and add approved vendors`);
    console.log(`  2. Run ${chalk.cyan('etalon audit ./')} to scan your codebase`);
    if (ci === 'github') {
        console.log(`  3. Push to trigger the GitHub Action`);
    }
    console.log(`  4. Visit ${chalk.cyan('https://etalon.nma.vc/docs')} for full documentation`);
    console.log('');
}
