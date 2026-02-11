import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { EtalonConfig, AllowlistEntry } from '@etalon/core';

const CONFIG_FILENAMES = ['etalon.yaml', 'etalon.yml', '.etalon.yaml', '.etalon.yml'];

/**
 * Load etalon.yaml config from the current directory or ancestors.
 * Returns null if no config file is found.
 */
export function loadConfig(startDir?: string): EtalonConfig | null {
    const dir = startDir ?? process.cwd();

    for (const filename of CONFIG_FILENAMES) {
        const filePath = join(dir, filename);
        if (existsSync(filePath)) {
            try {
                const raw = readFileSync(filePath, 'utf-8');
                return parseYaml(raw) as EtalonConfig;
            } catch (err) {
                console.error(`Warning: Failed to parse ${filePath}: ${err}`);
                return null;
            }
        }
    }

    return null;
}

/**
 * Check if a vendor/domain is in the allowlist.
 */
export function isAllowed(
    vendorId: string | undefined,
    domain: string,
    allowlist: AllowlistEntry[]
): boolean {
    return allowlist.some((entry) => {
        if (entry.vendor_id && vendorId && entry.vendor_id === vendorId) return true;
        if (entry.domain && domain.endsWith(entry.domain)) return true;
        return false;
    });
}
