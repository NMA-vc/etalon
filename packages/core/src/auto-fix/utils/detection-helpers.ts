// ─── Shared Detection Helpers ─────────────────────────────────────
//
// Common regex-based detection patterns used across all tracker
// fix templates. Each helper returns FixLocation[] arrays.

import type { FixLocation } from '../types.js';

/**
 * Find script tags loading a specific domain.
 */
export function findScriptTags(code: string, domainPattern: RegExp): FixLocation[] {
    const locations: FixLocation[] = [];
    const regex = new RegExp(
        `<[Ss]cript[^>]*src=["']([^"']*${domainPattern.source}[^"']*)["'][^>]*>`,
        'g',
    );
    let match;
    while ((match = regex.exec(code)) !== null) {
        locations.push({
            file: '',
            line: code.substring(0, match.index).split('\n').length,
            column: match.index - code.lastIndexOf('\n', match.index),
            code: match[0],
            context: 'script',
        });
    }
    return locations;
}

/**
 * Find Next.js Script component tags loading a specific domain.
 */
export function findNextScriptTags(code: string, domainPattern: RegExp): FixLocation[] {
    const locations: FixLocation[] = [];
    const regex = new RegExp(
        `<Script[^>]*src=["']([^"']*${domainPattern.source}[^"']*)["'][^>]*\\/?>`,
        'g',
    );
    let match;
    while ((match = regex.exec(code)) !== null) {
        locations.push({
            file: '',
            line: code.substring(0, match.index).split('\n').length,
            column: match.index - code.lastIndexOf('\n', match.index),
            code: match[0],
            context: 'component',
        });
    }
    return locations;
}

/**
 * Find function calls matching a pattern (e.g. gtag(), fbq(), etc.).
 */
export function findFunctionCalls(code: string, funcPattern: RegExp): FixLocation[] {
    const locations: FixLocation[] = [];
    const regex = new RegExp(`${funcPattern.source}\\([^)]*\\)`, 'g');
    let match;
    while ((match = regex.exec(code)) !== null) {
        locations.push({
            file: '',
            line: code.substring(0, match.index).split('\n').length,
            column: match.index - code.lastIndexOf('\n', match.index),
            code: match[0],
            context: 'hook',
        });
    }
    return locations;
}

/**
 * Find import statements for a specific library.
 */
export function findImports(code: string, libPattern: RegExp): FixLocation[] {
    const locations: FixLocation[] = [];
    const regex = new RegExp(
        `(?:import\\s+.*?from\\s+['"]${libPattern.source}['"]|require\\(['"]${libPattern.source}['"]\\))`,
        'gm',
    );
    let match;
    while ((match = regex.exec(code)) !== null) {
        locations.push({
            file: '',
            line: code.substring(0, match.index).split('\n').length,
            column: match.index - code.lastIndexOf('\n', match.index),
            code: match[0],
            context: 'import',
        });
    }
    return locations;
}

/**
 * Find inline script blocks containing specific code patterns.
 */
export function findInlineScripts(code: string, contentPattern: RegExp): FixLocation[] {
    const locations: FixLocation[] = [];
    const regex = new RegExp(
        `<script[^>]*>([\\s\\S]*?${contentPattern.source}[\\s\\S]*?)<\\/script>`,
        'gi',
    );
    let match;
    while ((match = regex.exec(code)) !== null) {
        locations.push({
            file: '',
            line: code.substring(0, match.index).split('\n').length,
            column: match.index - code.lastIndexOf('\n', match.index),
            code: match[0],
            context: 'inline',
        });
    }
    return locations;
}

/**
 * Wrap a piece of code in a consent check for the given framework.
 */
export function wrapCodeInConsent(
    originalCode: string,
    fullFileCode: string,
    framework: string,
    consentCategory: string,
): string {
    switch (framework) {
        case 'react':
        case 'nextjs':
            return fullFileCode.replace(
                originalCode,
                `{consentState?.${consentCategory} && (\n  ${originalCode}\n)}`,
            );
        case 'vue':
            // For Vue template elements, add v-if
            if (originalCode.startsWith('<')) {
                return fullFileCode.replace(
                    originalCode,
                    originalCode.replace(/^(<\w+)/, `$1 v-if="userConsent.${consentCategory}"`),
                );
            }
            return fullFileCode.replace(
                originalCode,
                `<!-- ETALON: Consent required -->\n<template v-if="userConsent.${consentCategory}">\n  ${originalCode}\n</template>`,
            );
        default:
            return fullFileCode.replace(
                originalCode,
                `if (window.__etalon_consent?.${consentCategory}) {\n  ${originalCode}\n}`,
            );
    }
}

/**
 * Wrap a function call in a consent guard.
 */
export function wrapCallInConsent(
    originalCall: string,
    fullFileCode: string,
    framework: string,
    consentCategory: string,
): string {
    switch (framework) {
        case 'react':
        case 'nextjs':
            return fullFileCode.replace(
                originalCall,
                `if (consentState?.${consentCategory}) {\n    ${originalCall}\n  }`,
            );
        case 'vue':
            return fullFileCode.replace(
                originalCall,
                `if (userConsent.${consentCategory}) {\n    ${originalCall}\n  }`,
            );
        default:
            return fullFileCode.replace(
                originalCall,
                `if (window.__etalon_consent?.${consentCategory}) {\n  ${originalCall}\n}`,
            );
    }
}
