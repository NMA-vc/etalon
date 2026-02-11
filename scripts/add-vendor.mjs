#!/usr/bin/env node

/**
 * Quick vendor addition script for ETALON registry.
 *
 * Usage:
 *   node scripts/add-vendor.mjs <domain> [options]
 *
 * Options:
 *   --id           Vendor ID (slug). Auto-generated from name if omitted.
 *   --name         Vendor display name (required)
 *   --company      Company legal name (defaults to name)
 *   --category     Category slug (default: cdn)
 *   --risk         Risk score 1-10 (default: 1)
 *   --gdpr         GDPR compliant true/false (default: true)
 *   --purpose      Short purpose string
 *   --data         Comma-separated data collected list
 *   --privacy      Privacy policy URL
 *   --dpa          DPA URL
 *   --alternatives Comma-separated alternative vendor IDs
 *   --domains      Additional domains, comma-separated (first positional arg is always included)
 *   --dry-run      Print the entry without writing
 *
 * Examples:
 *   node scripts/add-vendor.mjs cdn.prod.website-files.com \
 *     --name "Webflow CDN" --company "Webflow Inc." --category cdn \
 *     --purpose "Asset delivery for Webflow-hosted sites" \
 *     --data "IP address,request headers" --risk 1
 *
 *   node scripts/add-vendor.mjs ajax.googleapis.com \
 *     --name "Google Hosted Libraries" --company "Google LLC" --category cdn \
 *     --purpose "CDN for popular JavaScript libraries" \
 *     --data "IP address" --risk 1
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VENDORS_PATH = resolve(__dirname, '../data/vendors.json');

function parseArgs(argv) {
    const args = { _: [] };
    let i = 2; // skip node and script path
    while (i < argv.length) {
        const arg = argv[i];
        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            const next = argv[i + 1];
            if (next && !next.startsWith('--')) {
                args[key] = next;
                i += 2;
            } else {
                args[key] = true;
                i += 1;
            }
        } else {
            args._.push(arg);
            i += 1;
        }
    }
    return args;
}

function slugify(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function main() {
    const args = parseArgs(process.argv);
    const domain = args._[0];

    if (!domain) {
        console.error('Usage: node scripts/add-vendor.mjs <domain> --name "Vendor Name" [options]');
        console.error('Run with no args for full help (see script header).');
        process.exit(1);
    }

    if (!args.name) {
        console.error('Error: --name is required');
        process.exit(1);
    }

    // Build domains list
    const domains = [domain];
    if (args.domains) {
        domains.push(...args.domains.split(',').map(d => d.trim()));
    }

    // Build vendor entry
    const entry = {
        id: args.id || slugify(args.name),
        domains,
        name: args.name,
        company: args.company || args.name,
        category: args.category || 'cdn',
        gdpr_compliant: args.gdpr !== 'false',
    };

    if (args.privacy) entry.privacy_policy = args.privacy;
    if (args.dpa) entry.dpa_url = args.dpa;

    entry.purpose = args.purpose || '';

    entry.data_collected = args.data
        ? args.data.split(',').map(d => d.trim())
        : [];

    entry.risk_score = parseInt(args.risk, 10) || 1;

    if (args.alternatives) {
        entry.alternatives = args.alternatives.split(',').map(a => a.trim());
    }

    // Check for duplicates
    const db = JSON.parse(readFileSync(VENDORS_PATH, 'utf-8'));
    const existing = db.vendors.find(v =>
        v.id === entry.id || v.domains.some(d => domains.includes(d))
    );

    if (existing) {
        console.error(`\n⚠ Vendor already exists: ${existing.name} (${existing.id})`);
        console.error(`  Domains: ${existing.domains.join(', ')}`);
        process.exit(1);
    }

    // Pretty print
    console.log('\n📦 New vendor entry:');
    console.log(JSON.stringify(entry, null, 2));

    if (args['dry-run']) {
        console.log('\n(dry run — not written)');
        return;
    }

    // Insert in alphabetical order by id
    const insertIdx = db.vendors.findIndex(v => v.id > entry.id);
    if (insertIdx === -1) {
        db.vendors.push(entry);
    } else {
        db.vendors.splice(insertIdx, 0, entry);
    }

    // Update metadata
    db.last_updated = new Date().toISOString();

    writeFileSync(VENDORS_PATH, JSON.stringify(db, null, 4) + '\n');

    // Sync to core package so CLI picks it up
    const corePath = resolve(__dirname, '../packages/core/data/vendors.json');
    writeFileSync(corePath, JSON.stringify(db, null, 4) + '\n');

    // Sync to global npm link if it exists (npm link creates a separate copy)
    const globalPaths = [
        // nvm-based Node installation
        resolve(process.execPath, '..', '..', 'lib', 'node_modules', '@etalon', 'cli', 'node_modules', '@etalon', 'core', 'data', 'vendors.json'),
    ];
    for (const gp of globalPaths) {
        try {
            writeFileSync(gp, JSON.stringify(db, null, 4) + '\n');
            console.log(`   Synced to global: ${gp}`);
        } catch { /* not found, skip */ }
    }

    console.log(`\n✅ Added "${entry.name}" to vendors.json (${db.vendors.length} total vendors)`);
    console.log(`   Synced to packages/core/data/vendors.json`);
}

main();
