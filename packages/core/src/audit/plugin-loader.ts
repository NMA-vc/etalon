import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { AuditFinding, FindingSeverity } from './types.js';
import { GDPR_RULE_MAP, type GdprReference } from './gdpr-articles.js';

// ─── Custom Rule Definition ───────────────────────────────────────

export interface CustomRule {
    name: string;
    description: string;
    severity: FindingSeverity;
    patterns: CustomPattern[];
    gdpr_articles?: string[];
    fix?: string;
}

export interface CustomPattern {
    regex: string;
    languages?: string[];
    message: string;
}

// ─── Plugin Loader ────────────────────────────────────────────────

/**
 * Load custom rules from a directory of YAML files.
 * Expected location: .etalon/rules/*.yaml
 */
export function loadCustomRules(directory: string): CustomRule[] {
    const rulesDir = join(directory, '.etalon', 'rules');
    if (!existsSync(rulesDir)) return [];

    const rules: CustomRule[] = [];
    const files = readdirSync(rulesDir).filter(f => {
        const ext = extname(f);
        return ext === '.yaml' || ext === '.yml';
    });

    for (const file of files) {
        try {
            const content = readFileSync(join(rulesDir, file), 'utf-8');
            const parsed = parseYaml(content) as CustomRule;

            // Validate required fields
            if (!parsed.name || !parsed.severity || !parsed.patterns) {
                continue;
            }

            rules.push(parsed);
        } catch {
            // Skip invalid files
        }
    }

    return rules;
}

/**
 * Scan files using custom rules and return findings.
 */
export function scanWithCustomRules(
    files: string[],
    directory: string,
    rules: CustomRule[],
): AuditFinding[] {
    if (rules.length === 0) return [];

    const findings: AuditFinding[] = [];
    let findingId = 0;

    for (const file of files) {
        const fullPath = join(directory, file);
        let content: string;
        try {
            content = readFileSync(fullPath, 'utf-8');
        } catch {
            continue;
        }

        const lines = content.split('\n');

        for (const rule of rules) {
            for (const pattern of rule.patterns) {
                // Check language filter
                if (pattern.languages && pattern.languages.length > 0) {
                    const ext = extname(file).substring(1);
                    const langMap: Record<string, string[]> = {
                        javascript: ['js', 'jsx', 'mjs', 'cjs'],
                        typescript: ['ts', 'tsx', 'mts', 'cts'],
                        python: ['py'],
                        rust: ['rs'],
                        go: ['go'],
                        java: ['java'],
                        ruby: ['rb'],
                    };

                    const matches = pattern.languages.some(lang => {
                        const exts = langMap[lang] ?? [lang];
                        return exts.includes(ext);
                    });

                    if (!matches) continue;
                }

                // Scan each line
                const regex = new RegExp(pattern.regex, 'g');
                for (let i = 0; i < lines.length; i++) {
                    if (regex.test(lines[i])) {
                        const gdprArticles: GdprReference[] | undefined =
                            rule.gdpr_articles?.map(art => {
                                const existing = Object.values(GDPR_RULE_MAP)
                                    .flat()
                                    .find(r => r.article === art);
                                return existing ?? {
                                    article: art,
                                    title: `GDPR Article ${art}`,
                                    url: `https://gdpr-info.eu/art-${art.replace(/\(.*/, '')}-gdpr/`,
                                };
                            });

                        findings.push({
                            id: `custom-${findingId++}`,
                            category: 'code',
                            severity: rule.severity,
                            title: rule.description,
                            message: pattern.message,
                            file,
                            line: i + 1,
                            rule: `custom/${rule.name}`,
                            fix: rule.fix,
                            gdprArticles,
                        });
                    }
                    regex.lastIndex = 0; // Reset regex state
                }
            }
        }
    }

    return findings;
}
