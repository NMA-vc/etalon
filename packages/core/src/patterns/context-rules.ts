// ─── Context Rules ────────────────────────────────────────────────
//
// Contextual safety rules that determine if a domain reference
// is actually tracking based on HOW it's used, not just WHAT it is.

export interface ContextRule {
    id: string;
    description: string;
    applies: (context: ContextCheckInput) => ContextResult;
}

export interface ContextCheckInput {
    domain: string;
    element_type: 'script' | 'img' | 'link' | 'iframe' | 'a' | 'meta' | 'other';
    attributes: Record<string, string>;
    surrounding_code: string;
    file_extension: string;
    is_dynamic: boolean; // loaded dynamically vs static HTML
}

export interface ContextResult {
    safe: boolean;
    reason: string;
    confidence: number; // 0-1
    adjusted_severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

const CONTEXT_RULES: ContextRule[] = [
    // ─── Script Tag with Async/Defer ─────────────────────────────
    {
        id: 'async-script-is-tracker',
        description: 'Async scripts loaded from known tracker domains are likely active trackers',
        applies: (ctx) => {
            if (ctx.element_type !== 'script') return { safe: true, reason: 'Not a script', confidence: 0 };
            const isAsync = ctx.attributes['async'] !== undefined || ctx.attributes['defer'] !== undefined;
            if (isAsync) {
                return {
                    safe: false,
                    reason: 'Async-loaded script from tracker domain — likely an active tracking pixel',
                    confidence: 0.9,
                    adjusted_severity: 'high',
                };
            }
            return { safe: true, reason: 'Not async', confidence: 0 };
        },
    },

    // ─── Image Pixel Tracking ────────────────────────────────────
    {
        id: 'tracking-pixel',
        description: '1x1 or hidden images are tracking pixels',
        applies: (ctx) => {
            if (ctx.element_type !== 'img') return { safe: true, reason: 'Not an image', confidence: 0 };

            const width = parseInt(ctx.attributes['width'] || '0', 10);
            const height = parseInt(ctx.attributes['height'] || '0', 10);
            const isHidden = ctx.attributes['style']?.includes('display:none')
                || ctx.attributes['style']?.includes('visibility:hidden')
                || ctx.attributes['hidden'] !== undefined;

            if ((width <= 1 && height <= 1) || isHidden) {
                return {
                    safe: false,
                    reason: 'Hidden or 1x1 image — tracking pixel',
                    confidence: 0.95,
                    adjusted_severity: 'high',
                };
            }

            return {
                safe: true,
                reason: 'Visible image with dimensions — likely display content',
                confidence: 0.8,
            };
        },
    },

    // ─── Iframe Embedding ────────────────────────────────────────
    {
        id: 'iframe-embed-context',
        description: 'Iframes from video/map services used for display vs tracking',
        applies: (ctx) => {
            if (ctx.element_type !== 'iframe') return { safe: true, reason: 'Not an iframe', confidence: 0 };

            // YouTube nocookie mode
            if (ctx.domain.includes('youtube-nocookie.com')) {
                return { safe: true, reason: 'YouTube privacy-enhanced mode', confidence: 0.95 };
            }

            // Vimeo with DNT
            if (ctx.domain.includes('vimeo.com') && ctx.attributes['src']?.includes('dnt=1')) {
                return { safe: true, reason: 'Vimeo with Do Not Track parameter', confidence: 0.9 };
            }

            // Regular YouTube embeds
            if (ctx.domain.includes('youtube.com')) {
                return {
                    safe: false,
                    reason: 'YouTube embed without privacy mode sets cookies',
                    confidence: 0.85,
                    adjusted_severity: 'medium',
                };
            }

            return { safe: true, reason: 'Unknown iframe source', confidence: 0 };
        },
    },

    // ─── Next.js Script Strategy ─────────────────────────────────
    {
        id: 'nextjs-script-strategy',
        description: 'Next.js Script components with strategy="lazyOnload" are deferred',
        applies: (ctx) => {
            const hasLazy = ctx.surrounding_code.includes('strategy="lazyOnload"');
            const hasWorker = ctx.surrounding_code.includes('strategy="worker"');

            if (hasWorker) {
                return {
                    safe: true,
                    reason: 'Next.js Script with worker strategy — runs in web worker, isolated',
                    confidence: 0.9,
                };
            }

            if (hasLazy) {
                return {
                    safe: false,
                    reason: 'Lazy-loaded but still loads without consent check',
                    confidence: 0.7,
                    adjusted_severity: 'medium',
                };
            }

            return { safe: true, reason: 'No Next.js script strategy detected', confidence: 0 };
        },
    },

    // ─── Preconnect / Prefetch Links ─────────────────────────────
    {
        id: 'preconnect-link',
        description: 'Preconnect/prefetch hints are not active tracking',
        applies: (ctx) => {
            if (ctx.element_type !== 'link') return { safe: true, reason: 'Not a link', confidence: 0 };

            const rel = ctx.attributes['rel'] || '';
            if (['preconnect', 'prefetch', 'dns-prefetch', 'preload'].includes(rel)) {
                return {
                    safe: true,
                    reason: `Resource hint (${rel}) — pre-establishes connection but doesn't load tracker code`,
                    confidence: 0.85,
                };
            }

            return { safe: true, reason: 'Not a resource hint', confidence: 0 };
        },
    },

    // ─── Dynamically Loaded Scripts ──────────────────────────────
    {
        id: 'dynamic-script-loading',
        description: 'Dynamically created scripts should have consent checks',
        applies: (ctx) => {
            if (!ctx.is_dynamic) return { safe: true, reason: 'Not dynamically loaded', confidence: 0 };

            // Check if there's a consent check nearby
            const hasConsentCheck = /consent|gdpr|cookie.*accept|opt.?in/i.test(ctx.surrounding_code);

            if (hasConsentCheck) {
                return {
                    safe: true,
                    reason: 'Dynamic script loading with consent check present',
                    confidence: 0.8,
                };
            }

            return {
                safe: false,
                reason: 'Dynamically loaded script without consent check',
                confidence: 0.85,
                adjusted_severity: 'high',
            };
        },
    },

    // ─── Server-Side Rendering Context ───────────────────────────
    {
        id: 'ssr-context',
        description: 'Scripts in SSR contexts may need different handling',
        applies: (ctx) => {
            // Check if this is in an SSR-only context
            const isSSRFile = ctx.file_extension === 'server.tsx'
                || ctx.file_extension === 'server.ts'
                || ctx.surrounding_code.includes("'use server'");

            if (isSSRFile) {
                return {
                    safe: true,
                    reason: 'Server component — script references don\'t execute in browser',
                    confidence: 0.9,
                };
            }

            return { safe: true, reason: 'Not SSR context', confidence: 0 };
        },
    },

    // ─── Data Attribute Usage ────────────────────────────────────
    {
        id: 'data-attribute-config',
        description: 'Data attributes referencing tracker IDs are configuration, not active loading',
        applies: (ctx) => {
            const hasDataAttrs = Object.keys(ctx.attributes).some(k => k.startsWith('data-'));
            if (hasDataAttrs && ctx.element_type !== 'script') {
                return {
                    safe: true,
                    reason: 'Data attributes on non-script element — configuration, not tracking',
                    confidence: 0.7,
                };
            }
            return { safe: true, reason: 'No data attributes', confidence: 0 };
        },
    },
];

// ─── Public API ───────────────────────────────────────────────────

/**
 * Run all context rules against a detection context.
 * Returns the first definitive result (safe or unsafe with high confidence).
 */
export function evaluateContext(input: ContextCheckInput): ContextResult | null {
    for (const rule of CONTEXT_RULES) {
        const result = rule.applies(input);
        if (result.confidence > 0.5) {
            return result;
        }
    }
    return null;
}

/**
 * Get all context rule IDs.
 */
export function getContextRuleIds(): string[] {
    return CONTEXT_RULES.map(r => r.id);
}

/**
 * Adjust severity based on context analysis.
 * Returns the adjusted severity or the original if no context applies.
 */
export function adjustSeverityByContext(
    originalSeverity: 'critical' | 'high' | 'medium' | 'low' | 'info',
    input: ContextCheckInput,
): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    const result = evaluateContext(input);
    if (result?.adjusted_severity) {
        return result.adjusted_severity;
    }
    return originalSeverity;
}
