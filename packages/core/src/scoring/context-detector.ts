// ─── Context Detector ─────────────────────────────────────────────
//
// Detects project context: industry, region, data sensitivity,
// user base characteristics. This information is used to adjust
// risk scoring in Phase 4.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { StackInfo } from '../audit/types.js';

// ─── Types ────────────────────────────────────────────────────────

export type Industry = 'healthcare' | 'finance' | 'education' | 'ecommerce' | 'saas' | 'media' | 'government' | 'gaming' | 'social' | 'general';
export type Region = 'eu' | 'us' | 'uk' | 'ca' | 'au' | 'br' | 'global' | 'unknown';
export type DataSensitivity = 'high' | 'medium' | 'low';

export interface ProjectContext {
    industry: Industry;
    region: Region;
    data_sensitivity: DataSensitivity;
    handles_children: boolean;
    handles_health_data: boolean;
    handles_financial_data: boolean;
    has_user_accounts: boolean;
    is_b2b: boolean;
    detected_signals: string[];
}

// ─── Detection Logic ──────────────────────────────────────────────

export function detectProjectContext(directory: string, _stack?: StackInfo): ProjectContext {
    const signals: string[] = [];
    let industry: Industry = 'general';
    let region: Region = 'unknown';
    let data_sensitivity: DataSensitivity = 'medium';
    let handles_children = false;
    let handles_health_data = false;
    let handles_financial_data = false;
    let has_user_accounts = false;
    let is_b2b = false;

    // Read package.json for clues
    const pkgPath = join(directory, 'package.json');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string>; description?: string; keywords?: string[]; [key: string]: any } = {};
    if (existsSync(pkgPath)) {
        try {
            pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        } catch { /* ignore */ }
    }

    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    const description = (pkg.description || '').toLowerCase();
    const keywords = (pkg.keywords || []).map((k: string) => k.toLowerCase());

    // ─── Industry Detection ──────────────────────────────────────

    // Healthcare
    if (allDeps['@medplum/core'] || allDeps['fhir'] || allDeps['hl7'] ||
        keywords.some((k: string) => /health|medical|hipaa|clinical|patient|ehr|fhir/.test(k)) ||
        /health|medical|hipaa|clinical|patient|ehr/.test(description)) {
        industry = 'healthcare';
        handles_health_data = true;
        data_sensitivity = 'high';
        signals.push('Healthcare dependencies/keywords detected');
    }

    // Finance
    if (allDeps['stripe'] || allDeps['plaid'] || allDeps['@stripe/stripe-js'] ||
        keywords.some((k: string) => /fintech|banking|payment|financial|trading/.test(k)) ||
        /fintech|banking|payment|financial|trading|pci/.test(description)) {
        if (industry === 'general') industry = 'finance';
        handles_financial_data = true;
        data_sensitivity = 'high';
        signals.push('Financial dependencies/keywords detected');
    }

    // Education
    if (allDeps['@google/classroom'] || allDeps['lti'] ||
        keywords.some((k: string) => /education|learning|school|student|lms|coppa|ferpa/.test(k)) ||
        /education|learning|school|student|lms/.test(description)) {
        if (industry === 'general') industry = 'education';
        handles_children = true;
        data_sensitivity = 'high';
        signals.push('Education dependencies/keywords detected');
    }

    // E-commerce
    if (allDeps['@shopify/polaris'] || allDeps['shopify-api-node'] ||
        allDeps['@stripe/react-stripe-js'] || allDeps['medusa-core'] ||
        keywords.some((k: string) => /ecommerce|shop|store|cart|checkout/.test(k)) ||
        /ecommerce|shop|store|cart|checkout/.test(description)) {
        if (industry === 'general') industry = 'ecommerce';
        handles_financial_data = true;
        signals.push('E-commerce dependencies/keywords detected');
    }

    // SaaS
    if (allDeps['@auth0/nextjs-auth0'] || allDeps['@clerk/nextjs'] ||
        allDeps['@supabase/supabase-js'] || allDeps['next-auth'] ||
        keywords.some((k: string) => /saas|subscription|tenant|multi-tenant/.test(k))) {
        if (industry === 'general') industry = 'saas';
        has_user_accounts = true;
        signals.push('SaaS dependencies/keywords detected');
    }

    // Gaming
    if (allDeps['phaser'] || allDeps['three'] || allDeps['pixi.js'] ||
        keywords.some((k: string) => /game|gaming|esports/.test(k))) {
        if (industry === 'general') industry = 'gaming';
        signals.push('Gaming dependencies detected');
    }

    // ─── Region Detection ────────────────────────────────────────

    // Check for GDPR-related packages
    if (allDeps['react-cookie-consent'] || allDeps['cookie-consent'] ||
        allDeps['@consent-manager/core'] || allDeps['cookieconsent']) {
        region = 'eu';
        signals.push('GDPR consent packages detected — likely EU-focused');
    }

    // Check README/docs for region hints
    const readmePath = join(directory, 'README.md');
    if (existsSync(readmePath)) {
        try {
            const readme = readFileSync(readmePath, 'utf-8').toLowerCase();
            if (/gdpr|european union|eu .?regulation|dsgvo/.test(readme)) {
                region = 'eu';
                signals.push('GDPR references in README');
            } else if (/ccpa|california|cpra/.test(readme)) {
                region = 'us';
                signals.push('CCPA references in README');
            } else if (/pipeda|canadian/.test(readme)) {
                region = 'ca';
                signals.push('PIPEDA references in README');
            } else if (/lgpd|brazilian|brasil/.test(readme)) {
                region = 'br';
                signals.push('LGPD references in README');
            }
        } catch { /* ignore */ }
    }

    // Check for i18n packages
    if (allDeps['next-intl'] || allDeps['react-i18next'] || allDeps['vue-i18n']) {
        if (region === 'unknown') region = 'global';
        signals.push('i18n packages detected — likely multi-region');
    }

    // ─── User Account Detection ──────────────────────────────────

    if (allDeps['next-auth'] || allDeps['@auth0/nextjs-auth0'] ||
        allDeps['@clerk/nextjs'] || allDeps['passport'] ||
        allDeps['lucia'] || allDeps['better-auth'] ||
        allDeps['@supabase/auth-helpers-nextjs']) {
        has_user_accounts = true;
        if (data_sensitivity !== 'high') data_sensitivity = 'medium';
        signals.push('Authentication packages detected — handles user data');
    }

    // ─── B2B Detection ───────────────────────────────────────────

    if (keywords.some((k: string) => /b2b|enterprise|saas|dashboard|admin/.test(k)) ||
        allDeps['@tanstack/react-table'] || allDeps['ag-grid-react']) {
        is_b2b = true;
        signals.push('B2B indicators detected');
    }

    // ─── Children Data Detection ─────────────────────────────────

    if (keywords.some((k: string) => /kids|children|coppa|child|parental/.test(k)) ||
        /kids|children|coppa|child|parental/.test(description)) {
        handles_children = true;
        data_sensitivity = 'high';
        signals.push('Children/COPPA indicators detected');
    }

    return {
        industry,
        region,
        data_sensitivity,
        handles_children,
        handles_health_data,
        handles_financial_data,
        has_user_accounts,
        is_b2b,
        detected_signals: signals,
    };
}
