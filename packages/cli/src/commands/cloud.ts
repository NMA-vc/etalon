import { writeFileSync, readFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import chalk from 'chalk';

const CONFIG_DIR = join(homedir(), '.etalon');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

const DEFAULT_API_URL = 'https://etalon.nma.vc/api';

export interface CloudConfig {
    apiKey: string;
    apiUrl: string;
}

/**
 * Save cloud config (API key + URL) to ~/.etalon/config.json.
 */
export function saveCloudConfig(config: CloudConfig): void {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
    }
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

/**
 * Load cloud config from ~/.etalon/config.json.
 * Returns null if not logged in.
 */
export function loadCloudConfig(): CloudConfig | null {
    if (!existsSync(CONFIG_FILE)) {
        return null;
    }
    try {
        return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
    } catch {
        return null;
    }
}

/**
 * Remove cloud config (logout).
 */
export function removeCloudConfig(): void {
    if (existsSync(CONFIG_FILE)) {
        unlinkSync(CONFIG_FILE);
    }
}

/**
 * Verify an API key against the cloud.
 */
export async function verifyApiKey(
    apiKey: string,
    apiUrl: string = DEFAULT_API_URL
): Promise<boolean> {
    try {
        const response = await fetch(`${apiUrl}/auth/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
        });
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Upload scan results to the cloud.
 */
export async function uploadScan(
    config: CloudConfig,
    siteId: string,
    url: string,
    results: unknown,
    cliVersion: string
): Promise<{ success: boolean; scanId?: string; score?: number; grade?: string; dashboardUrl?: string; error?: string }> {
    try {
        const response = await fetch(`${config.apiUrl}/ingest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
                siteId,
                url,
                results,
                cliVersion,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data.error || response.statusText };
        }

        return {
            success: true,
            scanId: data.scanId,
            score: data.score,
            grade: data.grade,
            dashboardUrl: data.dashboardUrl,
        };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Network error' };
    }
}

/**
 * Login flow — prompts for API key via stdin (no interactive dependency).
 */
export async function runLogin(): Promise<void> {
    console.log('');
    console.log(chalk.bold('🔐 Login to ETALON Cloud'));
    console.log(chalk.dim('═══════════════════════════════════════════════════════'));
    console.log('');
    console.log(chalk.gray('Get your API key from: https://etalon.nma.vc/dashboard/api-keys'));
    console.log('');

    // Read API key from stdin
    const apiKey = await readLine('Enter your API key: ');

    if (!apiKey || apiKey.length < 10) {
        console.log(chalk.red('❌ Invalid API key'));
        process.exit(1);
    }

    const spinner = (await import('ora')).default;
    const s = spinner('Verifying API key...').start();

    const isValid = await verifyApiKey(apiKey);

    if (!isValid) {
        s.fail('API key verification failed');
        console.log(chalk.gray('\nMake sure you copied the full key from the dashboard.'));
        process.exit(1);
    }

    saveCloudConfig({ apiKey, apiUrl: DEFAULT_API_URL });
    s.succeed('Successfully logged in!');

    console.log('');
    console.log(chalk.gray('You can now use:'));
    console.log(`  ${chalk.cyan('etalon scan <url> --upload --site <id>')}  Upload scan results`);
    console.log(`  ${chalk.cyan('etalon auth status')}                      Check login status`);
    console.log(`  ${chalk.cyan('etalon auth logout')}                      Remove stored key`);
    console.log('');
}

/**
 * Logout flow.
 */
export function runLogout(): void {
    removeCloudConfig();
    console.log(chalk.green('✓ Logged out successfully'));
}

/**
 * Status check.
 */
export async function runStatus(): Promise<void> {
    const config = loadCloudConfig();

    if (!config) {
        console.log(chalk.yellow('❌ Not logged in'));
        console.log(chalk.gray('\nRun: etalon auth login'));
        return;
    }

    const spinner = (await import('ora')).default;
    const s = spinner('Checking API key...').start();

    const isValid = await verifyApiKey(config.apiKey, config.apiUrl);

    if (isValid) {
        s.succeed('Logged in');
        console.log(chalk.gray(`  API: ${config.apiUrl}`));
        console.log(chalk.gray(`  Key: ${config.apiKey.slice(0, 12)}...`));
    } else {
        s.fail('API key expired or invalid');
        console.log(chalk.gray('\nRun: etalon auth login'));
    }
}

/**
 * Simple line reader without requiring @inquirer/prompts.
 */
function readLine(prompt: string): Promise<string> {
    return new Promise((resolve) => {
        process.stdout.write(prompt);
        let data = '';
        process.stdin.setEncoding('utf-8');
        process.stdin.resume();
        process.stdin.on('data', (chunk) => {
            data += chunk;
            if (data.includes('\n')) {
                process.stdin.pause();
                resolve(data.trim());
            }
        });
    });
}

/**
 * Fetch user's sites from the cloud API.
 */
export async function listSites(
    config: CloudConfig
): Promise<{ success: boolean; sites?: Array<{ id: string; name: string; url: string; slug: string; last_scanned_at: string | null }>; error?: string }> {
    try {
        const response = await fetch(`${config.apiUrl}/sites`, {
            headers: {
                Authorization: `Bearer ${config.apiKey}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data.error || response.statusText };
        }

        return { success: true, sites: data.sites };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Network error' };
    }
}

/**
 * List sites flow.
 */
export async function runListSites(): Promise<void> {
    const config = loadCloudConfig();

    if (!config) {
        console.log(chalk.yellow('❌ Not logged in'));
        console.log(chalk.gray('\nRun: etalon auth login'));
        return;
    }

    const spinner = (await import('ora')).default;
    const s = spinner('Fetching sites...').start();

    const result = await listSites(config);

    if (!result.success || !result.sites) {
        s.fail(`Failed: ${result.error}`);
        return;
    }

    s.stop();

    if (result.sites.length === 0) {
        console.log(chalk.yellow('No sites found.'));
        console.log(chalk.gray('Add a site at: https://etalon.nma.vc/dashboard/sites'));
        return;
    }

    console.log('');
    console.log(chalk.bold('📋 Your Sites'));
    console.log(chalk.dim('═══════════════════════════════════════════════════════'));
    console.log('');

    for (const site of result.sites) {
        const name = site.name || new URL(site.url).hostname;
        const lastScan = site.last_scanned_at
            ? chalk.gray(`Last scan: ${new Date(site.last_scanned_at).toLocaleDateString()}`)
            : chalk.gray('Never scanned');

        console.log(`  ${chalk.cyan(site.id)}  ${chalk.bold(name)}`);
        console.log(`  ${chalk.dim(site.url)}  ${lastScan}`);
        console.log('');
    }

    console.log(chalk.dim('Use the ID with: etalon scan <url> --upload --site <id>'));
    console.log('');
}

