// ─── Auto-Fix Engine ──────────────────────────────────────────────
//
// The main engine that coordinates detection and fixing of tracker
// violations across frameworks. It uses the fix templates to detect
// violations, generates fix suggestions, and applies them.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { FixTemplate, FixResult, FixSuggestion, SupportedFramework } from './types.js';
import { ALL_TEMPLATES, getTemplateById } from './templates.js';
import { generateConsentWrapper } from './utils/consent-wrapper.js';
import type { StackInfo } from '../audit/types.js';

export type { FixTemplate, FixResult, FixSuggestion, FixLocation, SupportedFramework } from './types.js';

// ─── Engine ───────────────────────────────────────────────────────

export class AutoFixEngine {
    private templates: FixTemplate[];
    private framework: SupportedFramework;

    constructor(framework?: SupportedFramework) {
        this.templates = ALL_TEMPLATES;
        this.framework = framework ?? 'vanilla';
    }

    /**
     * Detect the framework from stack info.
     */
    static fromStackInfo(stack: StackInfo): AutoFixEngine {
        let framework: SupportedFramework = 'vanilla';
        if (stack.framework === 'nextjs') framework = 'nextjs';
        else if (stack.framework === 'svelte') {
            // Svelte: no dedicated consent wrapper yet — fall back to vanilla
            framework = 'vanilla';
        } else if (['none'].includes(stack.framework || '')) {
            if (stack.languages?.includes('typescript') || stack.languages?.includes('javascript')) {
                framework = 'react'; // Default to React for TS/JS without specific framework
            }
        } else if (stack.framework === 'nuxt') framework = 'vue';
        else if (stack.framework === 'express' || stack.framework === 'fastify') framework = 'vanilla';

        // Check detected files for more specific detection
        if (stack.detectedFiles?.some((f: string) => f.includes('next.config'))) framework = 'nextjs';

        return new AutoFixEngine(framework);
    }

    /**
     * Scan a file for tracker violations that can be auto-fixed.
     */
    scanFile(filePath: string, code?: string): FixSuggestion[] {
        const content = code ?? readFileSync(filePath, 'utf-8');
        const suggestions: FixSuggestion[] = [];

        for (const template of this.templates) {
            const handler = template.frameworks[this.framework];
            if (!handler) continue;

            const locations = handler.detector(content);
            for (const location of locations) {
                location.file = filePath;

                // Generate preview
                const fixed = handler.fixer(content, location);
                const beforeLines = extractContext(content, location.line, 3);
                const afterLines = extractContext(fixed, location.line, 5);

                suggestions.push({
                    tracker_id: template.tracker_id,
                    tracker_name: template.tracker_name,
                    location,
                    framework: this.framework,
                    violation_type: template.violation_type,
                    description: `${template.tracker_name} loads without user consent. Wrap in consent check for GDPR compliance.`,
                    preview: {
                        before: beforeLines,
                        after: afterLines,
                    },
                });
            }
        }

        return deduplicateSuggestions(suggestions);
    }

    /**
     * Scan multiple files for tracker violations.
     */
    scanFiles(filePaths: string[]): FixSuggestion[] {
        const allSuggestions: FixSuggestion[] = [];

        for (const filePath of filePaths) {
            try {
                allSuggestions.push(...this.scanFile(filePath));
            } catch {
                // Skip files that can't be read
            }
        }

        return allSuggestions;
    }

    /**
     * Apply a fix suggestion to a file.
     */
    applyFix(suggestion: FixSuggestion): FixResult {
        try {
            const content = readFileSync(suggestion.location.file, 'utf-8');
            const template = getTemplateById(suggestion.tracker_id);
            if (!template) {
                return { success: false, error: `Template not found: ${suggestion.tracker_id}` };
            }

            const handler = template.frameworks[suggestion.framework];
            if (!handler) {
                return { success: false, error: `Framework handler not found: ${suggestion.framework}` };
            }

            let fixed = handler.fixer(content, suggestion.location);

            // Add consent import if needed
            if (handler.requiresImports?.length) {
                fixed = addImports(fixed, handler.requiresImports);
            }

            const linesBefore = content.split('\n').length;
            const linesAfter = fixed.split('\n').length;

            writeFileSync(suggestion.location.file, fixed, 'utf-8');

            return {
                success: true,
                changes: {
                    file: suggestion.location.file,
                    before: content,
                    after: fixed,
                    linesChanged: Math.abs(linesAfter - linesBefore),
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Apply all fix suggestions to their respective files.
     */
    applyAllFixes(suggestions: FixSuggestion[]): { applied: number; failed: number; results: FixResult[] } {
        const results: FixResult[] = [];
        let applied = 0;
        let failed = 0;

        // Group by file to handle multiple fixes in the same file
        const byFile = new Map<string, FixSuggestion[]>();
        for (const s of suggestions) {
            const existing = byFile.get(s.location.file) ?? [];
            existing.push(s);
            byFile.set(s.location.file, existing);
        }

        for (const [filePath, fileSuggestions] of byFile) {
            try {
                let content = readFileSync(filePath, 'utf-8');
                const importsNeeded = new Set<string>();

                // Sort suggestions by line number in reverse to apply from bottom up
                const sorted = fileSuggestions.sort((a, b) => b.location.line - a.location.line);

                for (const suggestion of sorted) {
                    const template = getTemplateById(suggestion.tracker_id);
                    if (!template) continue;

                    const handler = template.frameworks[suggestion.framework];
                    if (!handler) continue;

                    content = handler.fixer(content, suggestion.location);

                    if (handler.requiresImports) {
                        for (const imp of handler.requiresImports) {
                            importsNeeded.add(imp);
                        }
                    }

                    applied++;
                }

                // Add all needed imports
                if (importsNeeded.size > 0) {
                    content = addImports(content, [...importsNeeded]);
                }

                writeFileSync(filePath, content, 'utf-8');
                results.push({ success: true, changes: { file: filePath, before: '', after: content, linesChanged: sorted.length } });
            } catch (error) {
                failed++;
                results.push({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
            }
        }

        return { applied, failed, results };
    }

    /**
     * Generate the consent wrapper hook/composable for the detected framework.
     * Writes it to the appropriate location in the project.
     */
    generateConsentHook(projectDir: string): string {
        const code = generateConsentWrapper(this.framework);
        let targetPath: string;

        switch (this.framework) {
            case 'react':
            case 'nextjs':
                targetPath = join(projectDir, 'src', 'hooks', 'useConsent.ts');
                break;
            case 'vue':
                targetPath = join(projectDir, 'src', 'composables', 'useConsent.ts');
                break;
            default:
                targetPath = join(projectDir, 'etalon-consent.js');
                break;
        }

        const dir = dirname(targetPath);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }

        if (!existsSync(targetPath)) {
            writeFileSync(targetPath, code, 'utf-8');
        }

        return targetPath;
    }

    /**
     * Get the framework this engine is configured for.
     */
    getFramework(): SupportedFramework {
        return this.framework;
    }

    /**
     * Get the list of template IDs.
     */
    getTemplateIds(): string[] {
        return this.templates.map(t => t.tracker_id);
    }

    /**
     * Get all available templates.
     */
    getTemplates(): FixTemplate[] {
        return [...this.templates];
    }
}

// ─── Helpers ──────────────────────────────────────────────────────

function extractContext(code: string, line: number, contextLines: number): string {
    const lines = code.split('\n');
    const start = Math.max(0, line - contextLines - 1);
    const end = Math.min(lines.length, line + contextLines);
    return lines.slice(start, end).join('\n');
}

function addImports(code: string, imports: string[]): string {
    const lines = code.split('\n');

    // Find the last import line
    let lastImportIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ') || lines[i].startsWith("import '") || lines[i].startsWith('import "')) {
            lastImportIndex = i;
        }
    }

    // Filter out imports that already exist
    const newImports = imports.filter(imp => !code.includes(imp));

    if (newImports.length === 0) return code;

    // Insert after the last import, or at the top
    const insertIndex = lastImportIndex >= 0 ? lastImportIndex + 1 : 0;
    lines.splice(insertIndex, 0, ...newImports);

    return lines.join('\n');
}

function deduplicateSuggestions(suggestions: FixSuggestion[]): FixSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(s => {
        const key = `${s.tracker_id}:${s.location.file}:${s.location.line}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
