// ─── Industry-Specific Scoring Rules ──────────────────────────────
//
// Severity adjustments based on detected industry.
// Healthcare, finance, and education have stricter requirements.

import type { Industry } from './context-detector.js';

export interface IndustryRule {
    industry: Industry;
    severity_modifier: number; // Added to base severity weight
    description: string;
    tracker_category_overrides: Record<string, number>; // category → additional weight
    required_disclosures: string[];
}

export const INDUSTRY_RULES: Record<Industry, IndustryRule> = {
    healthcare: {
        industry: 'healthcare',
        severity_modifier: 2,
        description: 'HIPAA requires strict control over PHI disclosure to third parties',
        tracker_category_overrides: {
            analytics: 3,      // Analytics in healthcare = serious
            advertising: 5,    // Advertising trackers on health site = critical
            marketing: 4,      // Marketing pixels tracking health info
            social: 3,         // Social widgets leaking health data
        },
        required_disclosures: [
            'HIPAA BAA required for all third-party data processors',
            'Patient data must not be shared with analytics providers',
            'Tracking pixels may constitute PHI disclosure',
        ],
    },

    finance: {
        industry: 'finance',
        severity_modifier: 2,
        description: 'PCI-DSS and financial regulations require data protection',
        tracker_category_overrides: {
            analytics: 2,
            advertising: 3,
            marketing: 2,
            session_replay: 4, // Session replay on financial pages = very bad
        },
        required_disclosures: [
            'PCI-DSS scope includes all third-party scripts on payment pages',
            'Financial data tracking requires explicit user consent',
            'Session replay tools may capture sensitive financial data',
        ],
    },

    education: {
        industry: 'education',
        severity_modifier: 2,
        description: 'COPPA/FERPA requires parental consent for children\'s data',
        tracker_category_overrides: {
            analytics: 2,
            advertising: 5,    // Advertising to children = very serious
            marketing: 4,
            social: 3,
        },
        required_disclosures: [
            'COPPA requires verifiable parental consent for children under 13',
            'FERPA protects student educational records',
            'No behavioral advertising permitted for student-facing features',
        ],
    },

    ecommerce: {
        industry: 'ecommerce',
        severity_modifier: 1,
        description: 'E-commerce handles payment and personal data',
        tracker_category_overrides: {
            analytics: 1,
            advertising: 1,
            session_replay: 2,
            payments: -1, // Payment SDKs are expected
        },
        required_disclosures: [
            'Payment data processing must be PCI-DSS compliant',
            'Remarketing pixels must have user consent',
        ],
    },

    saas: {
        industry: 'saas',
        severity_modifier: 1,
        description: 'SaaS products handle customer data with trust obligations',
        tracker_category_overrides: {
            analytics: 1,
            session_replay: 2, // Session replay captures customer data
            advertising: 1,
        },
        required_disclosures: [
            'Customer data shared with third-party analytics requires disclosure',
            'Sub-processor list must include all third-party tracking services',
        ],
    },

    media: {
        industry: 'media',
        severity_modifier: 0,
        description: 'Media sites typically use more tracking for ad revenue',
        tracker_category_overrides: {
            advertising: 0,  // Expected in media
            analytics: 0,
        },
        required_disclosures: [
            'Consent mechanism required for non-essential tracking',
        ],
    },

    government: {
        industry: 'government',
        severity_modifier: 3,
        description: 'Government sites serve all citizens and have strict privacy requirements',
        tracker_category_overrides: {
            analytics: 2,
            advertising: 5,    // No advertising on gov sites
            marketing: 5,
            social: 3,
        },
        required_disclosures: [
            'Government privacy requirements prohibit most third-party tracking',
            'Analytics must use privacy-preserving alternatives',
        ],
    },

    gaming: {
        industry: 'gaming',
        severity_modifier: 0,
        description: 'Gaming may involve children and in-app purchases',
        tracker_category_overrides: {
            advertising: 1,
            analytics: 0,
        },
        required_disclosures: [
            'Age verification may be required for tracking',
            'In-app purchase tracking requires disclosure',
        ],
    },

    social: {
        industry: 'social',
        severity_modifier: 1,
        description: 'Social platforms handle significant personal data',
        tracker_category_overrides: {
            analytics: 1,
            advertising: 1,
        },
        required_disclosures: [
            'Social platforms must disclose advertising data usage',
            'Cross-platform tracking requires explicit consent',
        ],
    },

    general: {
        industry: 'general',
        severity_modifier: 0,
        description: 'General project with standard privacy requirements',
        tracker_category_overrides: {},
        required_disclosures: [],
    },
};

/**
 * Get the industry rule for a given industry.
 */
export function getIndustryRule(industry: Industry): IndustryRule {
    return INDUSTRY_RULES[industry] || INDUSTRY_RULES.general;
}

/**
 * Get additional severity weight for a tracker category in a specific industry.
 */
export function getIndustryAdjustment(industry: Industry, trackerCategory: string): number {
    const rule = INDUSTRY_RULES[industry];
    return (rule?.tracker_category_overrides[trackerCategory] ?? 0) + (rule?.severity_modifier ?? 0);
}
