// ─── Tracker Fix Template Definitions ─────────────────────────────
//
// This file contains all 20 tracker fix templates. Each template
// defines detection patterns and framework-specific fix handlers
// for wrapping tracker code in consent checks.

import type { FixTemplate, FixLocation } from './types.js';
import {
    findScriptTags,
    findNextScriptTags,
    findFunctionCalls,
    findImports,
    findInlineScripts,
    wrapCodeInConsent,
    wrapCallInConsent,
} from './utils/detection-helpers.js';

// ─── Template Factory ─────────────────────────────────────────────

interface TrackerDef {
    id: string;
    name: string;
    consentCategory: 'analytics' | 'marketing' | 'functional';
    scriptDomains: RegExp[];
    functionPatterns: RegExp[];
    importPatterns: RegExp[];
    inlinePatterns: RegExp[];
}

function createTemplate(def: TrackerDef): FixTemplate {
    const makeDetector = (framework: string) => (code: string): FixLocation[] => {
        const locations: FixLocation[] = [];

        for (const domain of def.scriptDomains) {
            if (framework === 'nextjs') {
                locations.push(...findNextScriptTags(code, domain));
            }
            locations.push(...findScriptTags(code, domain));
        }

        for (const func of def.functionPatterns) {
            locations.push(...findFunctionCalls(code, func));
        }

        for (const lib of def.importPatterns) {
            locations.push(...findImports(code, lib));
        }

        for (const inline of def.inlinePatterns) {
            locations.push(...findInlineScripts(code, inline));
        }

        return locations;
    };

    const makeFixer = (framework: string) => (code: string, location: FixLocation): string => {
        if (location.context === 'hook' || location.context === 'inline') {
            return wrapCallInConsent(location.code, code, framework, def.consentCategory);
        }
        return wrapCodeInConsent(location.code, code, framework, def.consentCategory);
    };

    const consentImport = (framework: string): string[] => {
        switch (framework) {
            case 'react':
                return ["import { useConsent } from '@/hooks/useConsent';"];
            case 'nextjs':
                return [
                    "import { useConsent } from '@/hooks/useConsent';",
                    "import Script from 'next/script';",
                ];
            case 'vue':
                return ["import { useConsent } from '@/composables/useConsent';"];
            default:
                return [];
        }
    };

    return {
        tracker_id: def.id,
        tracker_name: def.name,
        violation_type: 'no_consent',
        detect_patterns: [
            ...def.scriptDomains,
            ...def.functionPatterns,
            ...def.importPatterns,
        ],
        frameworks: {
            react: {
                detector: makeDetector('react'),
                fixer: makeFixer('react'),
                requiresConsentState: true,
                requiresImports: consentImport('react'),
            },
            nextjs: {
                detector: makeDetector('nextjs'),
                fixer: makeFixer('nextjs'),
                requiresConsentState: true,
                requiresImports: consentImport('nextjs'),
            },
            vue: {
                detector: makeDetector('vue'),
                fixer: makeFixer('vue'),
                requiresConsentState: true,
                requiresImports: consentImport('vue'),
            },
            vanilla: {
                detector: makeDetector('vanilla'),
                fixer: makeFixer('vanilla'),
                requiresConsentState: true,
                requiresImports: [],
            },
        },
    };
}

// ─── Tracker Definitions ──────────────────────────────────────────

const TRACKER_DEFS: TrackerDef[] = [
    // 1. Google Analytics
    {
        id: 'google-analytics',
        name: 'Google Analytics',
        consentCategory: 'analytics',
        scriptDomains: [
            /googletagmanager\.com\/gtag\/js/,
            /google-analytics\.com\/analytics\.js/,
            /google-analytics\.com\/ga\.js/,
        ],
        functionPatterns: [/\bgtag\s*\(/, /\bga\s*\(/],
        importPatterns: [/react-ga/, /react-ga4/],
        inlinePatterns: [/gtag\s*\(\s*['"]config['"]/, /gtag\s*\(\s*['"]event['"]/],
    },

    // 2. Facebook Pixel
    {
        id: 'facebook-pixel',
        name: 'Facebook Pixel',
        consentCategory: 'marketing',
        scriptDomains: [/connect\.facebook\.net\/.*\/fbevents\.js/],
        functionPatterns: [/\bfbq\b/],
        importPatterns: [/react-facebook-pixel/],
        inlinePatterns: [/fbq\s*\(\s*['"]init['"]/, /fbq\s*\(\s*['"]track['"]/],
    },

    // 3. Google Tag Manager
    {
        id: 'google-tag-manager',
        name: 'Google Tag Manager',
        consentCategory: 'analytics',
        scriptDomains: [/googletagmanager\.com\/gtm\.js/],
        functionPatterns: [/\bdataLayer\.push\b/],
        importPatterns: [/react-gtm-module/],
        inlinePatterns: [/googletagmanager\.com.*GTM-/],
    },

    // 4. Hotjar
    {
        id: 'hotjar',
        name: 'Hotjar',
        consentCategory: 'analytics',
        scriptDomains: [/static\.hotjar\.com/, /script\.hotjar\.com/],
        functionPatterns: [/\bhj\b/],
        importPatterns: [/react-hotjar/, /@hotjar\/browser/],
        inlinePatterns: [/hotjar\.com.*hjid/],
    },

    // 5. Segment
    {
        id: 'segment',
        name: 'Segment',
        consentCategory: 'analytics',
        scriptDomains: [/cdn\.segment\.com\/analytics\.js/],
        functionPatterns: [/\banalytics\.track\b/, /\banalytics\.identify\b/, /\banalytics\.page\b/],
        importPatterns: [/@segment\/analytics-next/, /@segment\/analytics/],
        inlinePatterns: [/analytics\.load\s*\(/],
    },

    // 6. Mixpanel
    {
        id: 'mixpanel',
        name: 'Mixpanel',
        consentCategory: 'analytics',
        scriptDomains: [/cdn\.mxpnl\.com/, /cdn\.mixpanel\.com/],
        functionPatterns: [/\bmixpanel\.track\b/, /\bmixpanel\.identify\b/],
        importPatterns: [/mixpanel-browser/, /mixpanel/],
        inlinePatterns: [/mixpanel\.init\s*\(/],
    },

    // 7. Amplitude
    {
        id: 'amplitude',
        name: 'Amplitude',
        consentCategory: 'analytics',
        scriptDomains: [/cdn\.amplitude\.com/],
        functionPatterns: [/\bamplitude\.track\b/, /\bamplitude\.logEvent\b/],
        importPatterns: [/@amplitude\/analytics-browser/, /amplitude-js/],
        inlinePatterns: [/amplitude\.getInstance\(\)/],
    },

    // 8. Intercom
    {
        id: 'intercom',
        name: 'Intercom',
        consentCategory: 'functional',
        scriptDomains: [/widget\.intercom\.io/, /js\.intercomcdn\.com/],
        functionPatterns: [/\bIntercom\b/],
        importPatterns: [/react-intercom/, /intercom-client/],
        inlinePatterns: [/Intercom\s*\(\s*['"]boot['"]/],
    },

    // 9. HubSpot
    {
        id: 'hubspot',
        name: 'HubSpot',
        consentCategory: 'marketing',
        scriptDomains: [/js\.hs-scripts\.com/, /js\.hs-analytics\.net/, /js\.hubspot\.com/],
        functionPatterns: [/\b_hsq\.push\b/, /\bhsConversationsSettings\b/],
        importPatterns: [/react-hubspot/],
        inlinePatterns: [/hs-scripts\.com\/\d+\.js/],
    },

    // 10. LinkedIn Insight Tag
    {
        id: 'linkedin-insight',
        name: 'LinkedIn Insight Tag',
        consentCategory: 'marketing',
        scriptDomains: [/snap\.licdn\.com\/li\.lms-analytics/],
        functionPatterns: [/\blintrk\b/],
        importPatterns: [/react-linkedin-insight/],
        inlinePatterns: [/_linkedin_partner_id/, /linkedin.*partner-id/],
    },

    // 11. Twitter/X Pixel
    {
        id: 'twitter-pixel',
        name: 'Twitter/X Pixel',
        consentCategory: 'marketing',
        scriptDomains: [/static\.ads-twitter\.com/, /analytics\.twitter\.com/],
        functionPatterns: [/\btwq\b/],
        importPatterns: [/react-twitter/],
        inlinePatterns: [/twq\s*\(\s*['"]init['"]/],
    },

    // 12. TikTok Pixel
    {
        id: 'tiktok-pixel',
        name: 'TikTok Pixel',
        consentCategory: 'marketing',
        scriptDomains: [/analytics\.tiktok\.com/],
        functionPatterns: [/\bttq\.track\b/, /\bttq\.page\b/],
        importPatterns: [/tiktok-pixel/],
        inlinePatterns: [/ttq\.load\s*\(/],
    },

    // 13. Pinterest Tag
    {
        id: 'pinterest-tag',
        name: 'Pinterest Tag',
        consentCategory: 'marketing',
        scriptDomains: [/s\.pinimg\.com\/ct\/core\.js/],
        functionPatterns: [/\bpintrk\b/],
        importPatterns: [/react-pinterest-tag/],
        inlinePatterns: [/pintrk\s*\(\s*['"]load['"]/],
    },

    // 14. Reddit Pixel
    {
        id: 'reddit-pixel',
        name: 'Reddit Pixel',
        consentCategory: 'marketing',
        scriptDomains: [/alb\.reddit\.com/],
        functionPatterns: [/\brdt\b/],
        importPatterns: [],
        inlinePatterns: [/rdt\s*\(\s*['"]init['"]/],
    },

    // 15. Snapchat Pixel
    {
        id: 'snapchat-pixel',
        name: 'Snapchat Pixel',
        consentCategory: 'marketing',
        scriptDomains: [/sc-static\.net\/scevent\.min\.js/],
        functionPatterns: [/\bsnaptr\b/],
        importPatterns: [],
        inlinePatterns: [/snaptr\s*\(\s*['"]init['"]/],
    },

    // 16. Microsoft Clarity
    {
        id: 'microsoft-clarity',
        name: 'Microsoft Clarity',
        consentCategory: 'analytics',
        scriptDomains: [/clarity\.ms\/tag/],
        functionPatterns: [/\bclarity\s*\(/],
        importPatterns: [],
        inlinePatterns: [/clarity\s*\(\s*["']set["']/],
    },

    // 17. FullStory
    {
        id: 'fullstory',
        name: 'FullStory',
        consentCategory: 'analytics',
        scriptDomains: [/fullstory\.com\/s\/fs\.js/],
        functionPatterns: [/\bFS\.event\b/, /\bFS\.identify\b/],
        importPatterns: [/@fullstory\/browser/],
        inlinePatterns: [/FullStory.*snippet/],
    },

    // 18. LogRocket
    {
        id: 'logrocket',
        name: 'LogRocket',
        consentCategory: 'analytics',
        scriptDomains: [/cdn\.logrocket\.io/, /cdn\.lr-ingest\.io/],
        functionPatterns: [/\bLogRocket\.init\b/, /\bLogRocket\.identify\b/],
        importPatterns: [/logrocket/],
        inlinePatterns: [/LogRocket\.init\s*\(/],
    },

    // 19. Sentry (client-side)
    {
        id: 'sentry',
        name: 'Sentry',
        consentCategory: 'functional',
        scriptDomains: [/browser\.sentry-cdn\.com/],
        functionPatterns: [/\bSentry\.init\b/, /\bSentry\.captureException\b/],
        importPatterns: [/@sentry\/browser/, /@sentry\/react/, /@sentry\/nextjs/, /@sentry\/vue/],
        inlinePatterns: [/Sentry\.init\s*\(\s*\{/],
    },

    // 20. PostHog
    {
        id: 'posthog',
        name: 'PostHog',
        consentCategory: 'analytics',
        scriptDomains: [/us\.posthog\.com/, /eu\.posthog\.com/, /app\.posthog\.com/],
        functionPatterns: [/\bposthog\.capture\b/, /\bposthog\.identify\b/],
        importPatterns: [/posthog-js/, /posthog-node/],
        inlinePatterns: [/posthog\.init\s*\(/],
    },
];

// ─── Build All Templates ──────────────────────────────────────────

export const ALL_TEMPLATES: FixTemplate[] = TRACKER_DEFS.map(createTemplate);

export function getTemplateById(id: string): FixTemplate | undefined {
    return ALL_TEMPLATES.find(t => t.tracker_id === id);
}

export function getTemplateIds(): string[] {
    return ALL_TEMPLATES.map(t => t.tracker_id);
}
