import { readFileSync, writeFileSync } from 'node:fs';
import type { AuditFinding } from './types.js';

// ─── Types ────────────────────────────────────────────────────────

export interface FilePatch {
    file: string;
    line: number;
    rule: string;
    oldContent: string;
    newContent: string;
    description: string;
}

// ─── Fixers ───────────────────────────────────────────────────────

type Fixer = (finding: AuditFinding, fileContent: string) => FilePatch | null;

const FIXERS: Record<string, Fixer> = {
    'cookie-samesite': fixCookieSameSite,
    'cookie-insecure': fixCookieSecure,
    'csp-unsafe-eval': fixCspUnsafeEval,
    'cors-credentials-wildcard': fixCorsCredentials,
};

function fixCookieSameSite(finding: AuditFinding, content: string): FilePatch | null {
    const lines = content.split('\n');
    const line = finding.line ? lines[finding.line - 1] : null;
    if (!line) return null;

    // Add SameSite=Lax to Set-Cookie headers
    if (line.includes('Set-Cookie') || line.toLowerCase().includes('cookie')) {
        const patched = line.includes(';')
            ? line.replace(/;([^;]*)$/, '; SameSite=Lax;$1')
            : line.replace(/(["'`])$/, '; SameSite=Lax$1');

        if (patched !== line) {
            return {
                file: finding.file,
                line: finding.line!,
                rule: finding.rule,
                oldContent: line,
                newContent: patched,
                description: 'Add SameSite=Lax to cookie',
            };
        }
    }
    return null;
}

function fixCookieSecure(finding: AuditFinding, content: string): FilePatch | null {
    const lines = content.split('\n');
    const line = finding.line ? lines[finding.line - 1] : null;
    if (!line) return null;

    if ((line.includes('Set-Cookie') || line.toLowerCase().includes('cookie')) && !line.includes('Secure')) {
        const patched = line.includes(';')
            ? line.replace(/;([^;]*)$/, '; Secure;$1')
            : line.replace(/(["'`])$/, '; Secure$1');

        if (patched !== line) {
            return {
                file: finding.file,
                line: finding.line!,
                rule: finding.rule,
                oldContent: line,
                newContent: patched,
                description: 'Add Secure flag to cookie',
            };
        }
    }
    return null;
}

function fixCspUnsafeEval(finding: AuditFinding, content: string): FilePatch | null {
    const lines = content.split('\n');
    const line = finding.line ? lines[finding.line - 1] : null;
    if (!line) return null;

    if (line.includes("'unsafe-eval'")) {
        return {
            file: finding.file,
            line: finding.line!,
            rule: finding.rule,
            oldContent: line,
            newContent: line.replace(/'unsafe-eval'\s*/g, ''),
            description: "Remove 'unsafe-eval' from CSP",
        };
    }
    return null;
}

function fixCorsCredentials(finding: AuditFinding, content: string): FilePatch | null {
    const lines = content.split('\n');
    const line = finding.line ? lines[finding.line - 1] : null;
    if (!line) return null;

    // Replace wildcard * with a placeholder origin
    if (line.includes("'*'") || line.includes('"*"')) {
        return {
            file: finding.file,
            line: finding.line!,
            rule: finding.rule,
            oldContent: line,
            newContent: line.replace(/(['"])\*\1/, `$1https://yourdomain.com$1 /* TODO: replace with actual origin */`),
            description: 'Replace CORS wildcard with specific origin (needs manual review)',
        };
    }
    return null;
}

// ─── Public API ───────────────────────────────────────────────────

/**
 * Generate patches for fixable findings.
 */
export function generatePatches(findings: AuditFinding[], baseDir: string): FilePatch[] {
    const patches: FilePatch[] = [];
    const fileCache = new Map<string, string>();

    for (const finding of findings) {
        const fixer = FIXERS[finding.rule];
        if (!fixer) continue;

        const filePath = `${baseDir}/${finding.file}`;
        let content = fileCache.get(filePath);
        if (content === undefined) {
            try {
                content = readFileSync(filePath, 'utf-8');
                fileCache.set(filePath, content);
            } catch {
                continue;
            }
        }

        const patch = fixer(finding, content);
        if (patch) patches.push(patch);
    }

    return patches;
}

/**
 * Apply patches to files.
 */
export function applyPatches(patches: FilePatch[], baseDir: string): number {
    const fileEdits = new Map<string, Map<number, string>>();

    for (const patch of patches) {
        const file = `${baseDir}/${patch.file}`;
        if (!fileEdits.has(file)) fileEdits.set(file, new Map());
        fileEdits.get(file)!.set(patch.line, patch.newContent);
    }

    let applied = 0;
    for (const [file, edits] of fileEdits) {
        try {
            const content = readFileSync(file, 'utf-8');
            const lines = content.split('\n');

            for (const [lineNum, newContent] of edits) {
                lines[lineNum - 1] = newContent;
                applied++;
            }

            writeFileSync(file, lines.join('\n'), 'utf-8');
        } catch {
            // Skip files that can't be read/written
        }
    }

    return applied;
}

/**
 * List of rules that have auto-fixers.
 */
export function fixableRules(): string[] {
    return Object.keys(FIXERS);
}
