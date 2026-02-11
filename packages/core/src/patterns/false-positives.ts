// ─── False Positive Rules ─────────────────────────────────────────
//
// Rules that identify common false positives in ETALON scans.
// These patterns look like tracking but are actually benign.

export interface FalsePositiveRule {
    id: string;
    description: string;
    priority: number; // Higher = checked first
    check: (context: FalsePositiveContext) => boolean;
}

export interface FalsePositiveContext {
    domain: string;
    url: string;
    element: string; // 'script' | 'img' | 'link' | 'iframe' | 'a' | 'code'
    surrounding_code?: string;
    file_path?: string;
    framework?: string;
}

const RULES: FalsePositiveRule[] = [
    // ─── Image Tag Tracking Pixels ───────────────────────────────
    {
        id: 'img-display-vs-pixel',
        description: 'Image tags used for display (not tracking pixels)',
        priority: 10,
        check: (ctx) => {
            // An <img> tag with visible dimensions is likely display, not tracking
            if (ctx.element !== 'img') return false;
            const hasSize = /width=["']\d{2,}/.test(ctx.surrounding_code ?? '');
            const hasAlt = /alt=["'][^"']+["']/.test(ctx.surrounding_code ?? '');
            return hasSize || hasAlt;
        },
    },

    // ─── Link Tags vs Script Tags ────────────────────────────────
    {
        id: 'css-link-not-tracker',
        description: 'CSS link tags are not tracking scripts',
        priority: 9,
        check: (ctx) => {
            if (ctx.element !== 'link') return false;
            return /rel=["']stylesheet["']/.test(ctx.surrounding_code ?? '');
        },
    },

    // ─── Anchor Tags ─────────────────────────────────────────────
    {
        id: 'anchor-tag-not-tracker',
        description: 'Anchor tags linking to vendor sites are not tracking',
        priority: 9,
        check: (ctx) => ctx.element === 'a',
    },

    // ─── Development / Test Files ────────────────────────────────
    {
        id: 'test-file-code',
        description: 'Code in test files is not a production concern',
        priority: 8,
        check: (ctx) => {
            if (!ctx.file_path) return false;
            return /\.(test|spec|mock|fixture|story|stories)\.(ts|tsx|js|jsx)$/.test(ctx.file_path)
                || ctx.file_path.includes('__tests__')
                || ctx.file_path.includes('__mocks__')
                || ctx.file_path.includes('.storybook');
        },
    },

    // ─── Comments / Documentation ────────────────────────────────
    {
        id: 'comment-not-code',
        description: 'Tracker domains in comments are not violations',
        priority: 8,
        check: (ctx) => {
            const code = ctx.surrounding_code ?? '';
            // Check if the matching line is a comment
            const lines = code.split('\n');
            for (const line of lines) {
                if (line.includes(ctx.domain)) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('#') || trimmed.startsWith('<!--')) {
                        return true;
                    }
                }
            }
            return false;
        },
    },

    // ─── Environment Variable References ─────────────────────────
    {
        id: 'env-var-reference',
        description: 'Environment variable references are configuration, not active tracking',
        priority: 7,
        check: (ctx) => {
            const code = ctx.surrounding_code ?? '';
            return /process\.env\.[A-Z_]+/.test(code) && !code.includes('<script');
        },
    },

    // ─── Server-Side Only Code ───────────────────────────────────
    {
        id: 'server-side-code',
        description: 'Server-side files don\'t execute in the browser',
        priority: 7,
        check: (ctx) => {
            if (!ctx.file_path) return false;
            // Next.js server components, API routes, etc.
            return /\/(api|server|middleware|trpc)\//i.test(ctx.file_path)
                || ctx.file_path.endsWith('.server.ts')
                || ctx.file_path.endsWith('.server.tsx')
                || ctx.file_path.endsWith('.server.js');
        },
    },

    // ─── Package Lock / Config Files ─────────────────────────────
    {
        id: 'lockfile-reference',
        description: 'References in lock files or configs are metadata, not active code',
        priority: 9,
        check: (ctx) => {
            if (!ctx.file_path) return false;
            const name = ctx.file_path.split('/').pop() ?? '';
            return ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
                'composer.lock', 'Cargo.lock', 'Gemfile.lock',
                '.eslintrc', '.prettierrc', 'tsconfig.json',
                'jest.config.js', 'vitest.config.ts'].includes(name);
        },
    },

    // ─── Documentation / README ──────────────────────────────────
    {
        id: 'documentation-reference',
        description: 'Tracker references in docs/README are not active code',
        priority: 8,
        check: (ctx) => {
            if (!ctx.file_path) return false;
            return /\.(md|mdx|txt|rst|adoc)$/i.test(ctx.file_path)
                || ctx.file_path.toLowerCase().includes('readme')
                || ctx.file_path.toLowerCase().includes('changelog')
                || ctx.file_path.toLowerCase().includes('docs/');
        },
    },

    // ─── Type Definitions ────────────────────────────────────────
    {
        id: 'type-definition',
        description: 'Type definitions reference APIs but don\'t execute code',
        priority: 7,
        check: (ctx) => {
            if (!ctx.file_path) return false;
            return ctx.file_path.endsWith('.d.ts')
                || ctx.file_path.includes('@types/');
        },
    },

    // ─── Consent Manager References ──────────────────────────────
    {
        id: 'consent-manager-code',
        description: 'Consent management code is privacy-positive, not a violation',
        priority: 10,
        check: (ctx) => {
            const code = ctx.surrounding_code ?? '';
            return /consent|cookie-?banner|cookie-?notice|gdpr|ccpa|privacy-?settings/i.test(code)
                && !/load\s*\(|init\s*\(|track\s*\(/.test(code);
        },
    },

    // ─── First-party Subdomains ──────────────────────────────────
    {
        id: 'first-party-subdomain',
        description: 'Same-origin or first-party subdomains are not third-party tracking',
        priority: 6,
        check: (_ctx) => {
            // TODO: Implement first-party detection by comparing the URL host
            // against the project's configured domain(s).
            return false; // Conservative default — always flag until implemented
        },
    },
];

// ─── Public API ───────────────────────────────────────────────────

/**
 * Check if a detection is a false positive.
 * Returns the matching rule or null.
 */
export function checkFalsePositive(context: FalsePositiveContext): FalsePositiveRule | null {
    // Sort by priority (highest first)
    const sorted = [...RULES].sort((a, b) => b.priority - a.priority);

    for (const rule of sorted) {
        if (rule.check(context)) {
            return rule;
        }
    }

    return null;
}

/**
 * Filter out false positives from a list of detections.
 */
export function filterFalsePositives<T extends { domain: string; file?: string; line?: number }>(
    detections: T[],
    getContext: (det: T) => FalsePositiveContext,
): { valid: T[]; filtered: Array<{ detection: T; rule: FalsePositiveRule }> } {
    const valid: T[] = [];
    const filtered: Array<{ detection: T; rule: FalsePositiveRule }> = [];

    for (const det of detections) {
        const ctx = getContext(det);
        const rule = checkFalsePositive(ctx);
        if (rule) {
            filtered.push({ detection: det, rule });
        } else {
            valid.push(det);
        }
    }

    return { valid, filtered };
}

/**
 * Get all false positive rule IDs.
 */
export function getFalsePositiveRuleIds(): string[] {
    return RULES.map(r => r.id);
}
