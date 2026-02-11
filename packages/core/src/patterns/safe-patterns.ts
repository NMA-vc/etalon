// ─── Safe Domain Patterns ─────────────────────────────────────────
//
// Domains and URL patterns that are known-safe and should NOT trigger
// privacy violations. These reduce false positives significantly.
//
// Categories:
// - CDNs that serve static assets (no tracking)
// - Font providers
// - Infrastructure services
// - Payment processors (PCI-compliant, not tracking)
// - UI component libraries
// - Open source package registries
// - Map/embed services used for display only

export interface SafePattern {
    domain: string;
    reason: string;
    category: 'cdn' | 'fonts' | 'infrastructure' | 'payments' | 'ui' | 'registry' | 'maps' | 'media' | 'security' | 'open_source';
    confidence: number; // 0-1: how confident we are this is safe
    conditions?: string[]; // additional notes on when this is safe
}

// ─── CDN / Static Asset Domains ───────────────────────────────────

export const SAFE_CDNS: SafePattern[] = [
    { domain: 'cdnjs.cloudflare.com', reason: 'Public JS/CSS CDN, no tracking', category: 'cdn', confidence: 1.0 },
    { domain: 'cdn.jsdelivr.net', reason: 'Public CDN for npm/GitHub, no tracking', category: 'cdn', confidence: 1.0 },
    { domain: 'unpkg.com', reason: 'Public npm CDN, no tracking', category: 'cdn', confidence: 1.0 },
    { domain: 'esm.sh', reason: 'ESM CDN for npm packages, no tracking', category: 'cdn', confidence: 1.0 },
    { domain: 'cdn.skypack.dev', reason: 'ESM CDN, no tracking', category: 'cdn', confidence: 0.95 },
    { domain: 'cdn.prod.website-files.com', reason: 'Webflow asset CDN, static files only', category: 'cdn', confidence: 0.9 },
    { domain: 'assets.website-files.com', reason: 'Webflow asset CDN', category: 'cdn', confidence: 0.9 },
    { domain: 'stackpath.bootstrapcdn.com', reason: 'Bootstrap CDN, no tracking', category: 'cdn', confidence: 1.0 },
    { domain: 'cdn.tailwindcss.com', reason: 'Tailwind CSS CDN', category: 'cdn', confidence: 1.0 },
    { domain: 'ajax.googleapis.com', reason: 'Google hosted libraries CDN (jQuery, etc.)', category: 'cdn', confidence: 0.95 },
    { domain: 'cdn.bootcdn.net', reason: 'Chinese open CDN, no tracking', category: 'cdn', confidence: 0.9 },
    { domain: 'fastly.jsdelivr.net', reason: 'jsDelivr Fastly edge', category: 'cdn', confidence: 1.0 },
    { domain: 'polyfill.io', reason: 'Polyfill service — use with caution', category: 'cdn', confidence: 0.5, conditions: ['polyfill.io was compromised in a 2024 supply-chain attack — consider self-hosting or using cdnjs instead'] },
    { domain: 'cdn.polyfill.io', reason: 'Polyfill.io CDN — use with caution', category: 'cdn', confidence: 0.5, conditions: ['polyfill.io was compromised in a 2024 supply-chain attack — consider self-hosting or using cdnjs instead'] },
];

// ─── Font Providers ───────────────────────────────────────────────

export const SAFE_FONTS: SafePattern[] = [
    { domain: 'fonts.googleapis.com', reason: 'Google Fonts CSS, no tracking since 2022', category: 'fonts', confidence: 0.95, conditions: ['Google stopped logging IPs from font requests in 2022'] },
    { domain: 'fonts.gstatic.com', reason: 'Google Fonts file serving, no tracking', category: 'fonts', confidence: 0.95 },
    { domain: 'use.typekit.net', reason: 'Adobe Fonts delivery', category: 'fonts', confidence: 0.85, conditions: ['Adobe Fonts may set cookies — check'] },
    { domain: 'fonts.bunny.net', reason: 'GDPR-compliant font CDN (Bunny Fonts)', category: 'fonts', confidence: 1.0 },
    { domain: 'api.fontshare.com', reason: 'Indian Type Foundry, free fonts, minimal tracking', category: 'fonts', confidence: 0.9 },
    { domain: 'rsms.me', reason: 'Inter font hosting', category: 'fonts', confidence: 1.0 },
];

// ─── Infrastructure / Hosting ─────────────────────────────────────

export const SAFE_INFRASTRUCTURE: SafePattern[] = [
    { domain: 'vercel.com', reason: 'Vercel hosting platform', category: 'infrastructure', confidence: 0.9 },
    { domain: 'netlify.com', reason: 'Netlify hosting', category: 'infrastructure', confidence: 0.9 },
    { domain: 'cloudflare.com', reason: 'Cloudflare CDN/security', category: 'infrastructure', confidence: 0.9 },
    { domain: 'amazonaws.com', reason: 'AWS infrastructure', category: 'infrastructure', confidence: 0.85 },
    { domain: 'azurewebsites.net', reason: 'Azure hosting', category: 'infrastructure', confidence: 0.85 },
    { domain: 'herokuapp.com', reason: 'Heroku hosting', category: 'infrastructure', confidence: 0.9 },
    { domain: 'railway.app', reason: 'Railway hosting', category: 'infrastructure', confidence: 0.9 },
    { domain: 'fly.dev', reason: 'Fly.io hosting', category: 'infrastructure', confidence: 0.9 },
    { domain: 'render.com', reason: 'Render hosting', category: 'infrastructure', confidence: 0.9 },
    { domain: 'supabase.co', reason: 'Supabase BaaS', category: 'infrastructure', confidence: 0.9 },
    { domain: 'supabase.com', reason: 'Supabase BaaS', category: 'infrastructure', confidence: 0.9 },
    { domain: 'firebase.google.com', reason: 'Firebase hosting', category: 'infrastructure', confidence: 0.85, conditions: ['Firebase Analytics is separate — check for analytics imports'] },
    { domain: 'firebaseio.com', reason: 'Firebase realtime database', category: 'infrastructure', confidence: 0.85 },
    { domain: 'appwrite.io', reason: 'Appwrite BaaS', category: 'infrastructure', confidence: 0.9 },
    { domain: 'neon.tech', reason: 'Neon database', category: 'infrastructure', confidence: 0.95 },
    { domain: 'planetscale.com', reason: 'PlanetScale database', category: 'infrastructure', confidence: 0.95 },
    { domain: 'upstash.com', reason: 'Upstash serverless Redis/Kafka', category: 'infrastructure', confidence: 0.95 },
];

// ─── Payment Processors ──────────────────────────────────────────

export const SAFE_PAYMENTS: SafePattern[] = [
    { domain: 'js.stripe.com', reason: 'Stripe payment SDK — PCI-compliant, required for payments', category: 'payments', confidence: 1.0 },
    { domain: 'checkout.stripe.com', reason: 'Stripe Checkout hosted page', category: 'payments', confidence: 1.0 },
    { domain: 'www.paypal.com', reason: 'PayPal SDK, payment processing', category: 'payments', confidence: 0.9, conditions: ['PayPal may set tracking cookies — use consent for marketing'] },
    { domain: 'www.paypalobjects.com', reason: 'PayPal static assets', category: 'payments', confidence: 0.95 },
    { domain: 'pay.google.com', reason: 'Google Pay SDK', category: 'payments', confidence: 0.95 },
    { domain: 'applepay.apple.com', reason: 'Apple Pay SDK', category: 'payments', confidence: 1.0 },
    { domain: 'js.braintreegateway.com', reason: 'Braintree payment SDK', category: 'payments', confidence: 1.0 },
    { domain: 'js.squareup.com', reason: 'Square payment SDK', category: 'payments', confidence: 1.0 },
    { domain: 'js.squareupsandbox.com', reason: 'Square sandbox SDK', category: 'payments', confidence: 1.0 },
    { domain: 'cdn.paddle.com', reason: 'Paddle payment SDK', category: 'payments', confidence: 0.95 },
    { domain: 'cdn.lemonsqueezy.com', reason: 'LemonSqueezy payment SDK', category: 'payments', confidence: 0.95 },
];

// ─── UI Component Libraries / Design Tools ────────────────────────

export const SAFE_UI: SafePattern[] = [
    { domain: 'kit.fontawesome.com', reason: 'FontAwesome icon kit', category: 'ui', confidence: 1.0 },
    { domain: 'use.fontawesome.com', reason: 'FontAwesome CDN', category: 'ui', confidence: 1.0 },
    { domain: 'cdn.lordicon.com', reason: 'Lordicon animated icons', category: 'ui', confidence: 0.95 },
    { domain: 'cdn.iconify.design', reason: 'Iconify icon CDN', category: 'ui', confidence: 1.0 },
    { domain: 'api.iconify.design', reason: 'Iconify API', category: 'ui', confidence: 1.0 },
    { domain: 'lottie.host', reason: 'Lottie animation hosting', category: 'ui', confidence: 0.9 },
];

// ─── Map / Embed Services ─────────────────────────────────────────

export const SAFE_MAPS: SafePattern[] = [
    { domain: 'api.mapbox.com', reason: 'Mapbox map tiles', category: 'maps', confidence: 0.9, conditions: ['Mapbox collects usage data — check their DPA'] },
    { domain: 'api.maptiler.com', reason: 'MapTiler map tiles', category: 'maps', confidence: 0.9 },
    { domain: 'tile.openstreetmap.org', reason: 'OpenStreetMap tiles, open source, no tracking', category: 'maps', confidence: 1.0 },
    { domain: 'unpkg.com/leaflet', reason: 'Leaflet map library', category: 'maps', confidence: 1.0 },
];

// ─── Media / Video Embedding ──────────────────────────────────────

export const SAFE_MEDIA: SafePattern[] = [
    { domain: 'www.youtube-nocookie.com', reason: 'YouTube privacy-enhanced mode', category: 'media', confidence: 0.95, conditions: ['Uses privacy-enhanced mode — no cookies until play'] },
    { domain: 'player.vimeo.com', reason: 'Vimeo player embed (with dnt=1)', category: 'media', confidence: 0.8, conditions: ['Add ?dnt=1 param for GDPR compliance'] },
    { domain: 'fast.wistia.com', reason: 'Wistia video hosting', category: 'media', confidence: 0.8, conditions: ['Check Wistia tracking settings'] },
    { domain: 'cdn.plyr.io', reason: 'Plyr open-source video player', category: 'media', confidence: 1.0 },
];

// ─── Security / Auth Services ─────────────────────────────────────

export const SAFE_SECURITY: SafePattern[] = [
    { domain: 'challenges.cloudflare.com', reason: 'Cloudflare Turnstile CAPTCHA', category: 'security', confidence: 1.0 },
    { domain: 'www.google.com/recaptcha', reason: 'Google reCAPTCHA', category: 'security', confidence: 0.8, conditions: ['reCAPTCHA v3 sends data to Google — disclose in privacy policy'] },
    { domain: 'hcaptcha.com', reason: 'hCaptcha — privacy-focused CAPTCHA', category: 'security', confidence: 0.95 },
    { domain: 'js.hcaptcha.com', reason: 'hCaptcha SDK', category: 'security', confidence: 0.95 },
    { domain: 'cdn.auth0.com', reason: 'Auth0 authentication SDK', category: 'security', confidence: 0.9 },
    { domain: 'accounts.google.com', reason: 'Google Sign-In SDK', category: 'security', confidence: 0.85, conditions: ['Only safe if used for auth, not tracking'] },
    { domain: 'appleid.apple.com', reason: 'Apple Sign-In', category: 'security', confidence: 0.95 },
    { domain: 'clerk.com', reason: 'Clerk authentication', category: 'security', confidence: 0.9 },
];

// ─── Open Source / Package Registries ─────────────────────────────

export const SAFE_OPEN_SOURCE: SafePattern[] = [
    { domain: 'registry.npmjs.org', reason: 'npm package registry', category: 'registry', confidence: 1.0 },
    { domain: 'github.com', reason: 'GitHub source hosting', category: 'open_source', confidence: 0.95 },
    { domain: 'raw.githubusercontent.com', reason: 'GitHub raw file serving', category: 'open_source', confidence: 0.95 },
    { domain: 'deno.land', reason: 'Deno module registry', category: 'open_source', confidence: 1.0 },
    { domain: 'jsr.io', reason: 'JSR package registry', category: 'open_source', confidence: 1.0 },
];

// ─── Aggregated Safe Patterns ─────────────────────────────────────

export const ALL_SAFE_PATTERNS: SafePattern[] = [
    ...SAFE_CDNS,
    ...SAFE_FONTS,
    ...SAFE_INFRASTRUCTURE,
    ...SAFE_PAYMENTS,
    ...SAFE_UI,
    ...SAFE_MAPS,
    ...SAFE_MEDIA,
    ...SAFE_SECURITY,
    ...SAFE_OPEN_SOURCE,
];

/**
 * Check if a domain matches any safe pattern.
 * Returns the matching pattern or null.
 */
export function matchSafePattern(domain: string): SafePattern | null {
    const normalized = domain.toLowerCase().replace(/^www\./, '');

    for (const pattern of ALL_SAFE_PATTERNS) {
        if (normalized === pattern.domain || normalized.endsWith('.' + pattern.domain)) {
            return pattern;
        }
    }

    return null;
}

/**
 * Check if a URL/domain is considered safe with a given minimum confidence.
 */
export function isSafeDomain(domain: string, minConfidence = 0.8): boolean {
    const pattern = matchSafePattern(domain);
    return pattern !== null && pattern.confidence >= minConfidence;
}

/**
 * Get all safe patterns for a specific category.
 */
export function getSafePatternsByCategory(category: SafePattern['category']): SafePattern[] {
    return ALL_SAFE_PATTERNS.filter(p => p.category === category);
}
