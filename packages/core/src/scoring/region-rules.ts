// ─── Region-Specific Scoring Rules ────────────────────────────────
//
// Privacy regulation adjustments by region.
// EU/GDPR is strictest, with other regions having varying requirements.

import type { Region } from './context-detector.js';

export interface RegionRule {
    region: Region;
    regulation: string;
    severity_modifier: number;
    consent_required: boolean;
    right_to_deletion: boolean;
    data_portability: boolean;
    breach_notification_hours: number | null;
    cross_border_transfer_restricted: boolean;
    children_age_threshold: number;
    user_rights: string[];
    tracker_adjustments: Record<string, number>;
}

export const REGION_RULES: Record<Region, RegionRule> = {
    eu: {
        region: 'eu',
        regulation: 'GDPR',
        severity_modifier: 2,
        consent_required: true,
        right_to_deletion: true,
        data_portability: true,
        breach_notification_hours: 72,
        cross_border_transfer_restricted: true,
        children_age_threshold: 16,
        user_rights: [
            'Right of access (Art. 15)',
            'Right to rectification (Art. 16)',
            'Right to erasure / "right to be forgotten" (Art. 17)',
            'Right to restriction of processing (Art. 18)',
            'Right to data portability (Art. 20)',
            'Right to object (Art. 21)',
            'Right not to be subject to automated decision-making (Art. 22)',
        ],
        tracker_adjustments: {
            analytics: 2,      // Analytics without consent = GDPR breach
            advertising: 3,    // Advertising without consent = serious breach
            marketing: 2,
            social: 1,
            fingerprinting: 3, // Browser fingerprinting restricted
        },
    },

    uk: {
        region: 'uk',
        regulation: 'UK GDPR + PECR',
        severity_modifier: 2,
        consent_required: true,
        right_to_deletion: true,
        data_portability: true,
        breach_notification_hours: 72,
        cross_border_transfer_restricted: true,
        children_age_threshold: 13,
        user_rights: [
            'Right of access',
            'Right to rectification',
            'Right to erasure',
            'Right to restrict processing',
            'Right to data portability',
            'Right to object',
            'Rights related to automated decision-making',
        ],
        tracker_adjustments: {
            analytics: 2,
            advertising: 3,
            marketing: 2,
        },
    },

    us: {
        region: 'us',
        regulation: 'CCPA/CPRA (California)',
        severity_modifier: 1,
        consent_required: false, // CCPA is opt-out not opt-in
        right_to_deletion: true,
        data_portability: true,
        breach_notification_hours: null, // Varies by state
        cross_border_transfer_restricted: false,
        children_age_threshold: 13, // COPPA
        user_rights: [
            'Right to know what personal information is collected',
            'Right to delete personal information',
            'Right to opt-out of sale/sharing of personal information',
            'Right to non-discrimination for exercising rights',
            'Right to correct inaccurate personal information',
            'Right to limit use of sensitive personal information',
        ],
        tracker_adjustments: {
            analytics: 0,
            advertising: 1,    // "Do Not Sell" implications
            marketing: 1,
        },
    },

    ca: {
        region: 'ca',
        regulation: 'PIPEDA',
        severity_modifier: 1,
        consent_required: true,
        right_to_deletion: true,
        data_portability: false,
        breach_notification_hours: null,
        cross_border_transfer_restricted: false,
        children_age_threshold: 13,
        user_rights: [
            'Right to access personal information',
            'Right to challenge accuracy',
            'Right to withdraw consent',
        ],
        tracker_adjustments: {
            analytics: 1,
            advertising: 1,
        },
    },

    au: {
        region: 'au',
        regulation: 'Privacy Act 1988 (APPs)',
        severity_modifier: 1,
        consent_required: true,
        right_to_deletion: false,
        data_portability: false,
        breach_notification_hours: null,
        cross_border_transfer_restricted: true,
        children_age_threshold: 15,
        user_rights: [
            'Right to access personal information',
            'Right to correction',
            'Right to complain to the OAIC',
        ],
        tracker_adjustments: {
            analytics: 1,
            advertising: 1,
        },
    },

    br: {
        region: 'br',
        regulation: 'LGPD',
        severity_modifier: 2,
        consent_required: true,
        right_to_deletion: true,
        data_portability: true,
        breach_notification_hours: null, // "reasonable time"
        cross_border_transfer_restricted: true,
        children_age_threshold: 12,
        user_rights: [
            'Right to confirmation and access',
            'Right to correction',
            'Right to anonymization, blocking, or deletion',
            'Right to data portability',
            'Right to information about sharing',
            'Right to revoke consent',
        ],
        tracker_adjustments: {
            analytics: 2,
            advertising: 2,
            marketing: 2,
        },
    },

    global: {
        region: 'global',
        regulation: 'Multiple (apply strictest)',
        severity_modifier: 2, // Apply strictest rules when global
        consent_required: true,
        right_to_deletion: true,
        data_portability: true,
        breach_notification_hours: 72,
        cross_border_transfer_restricted: true,
        children_age_threshold: 13,
        user_rights: [
            'Right to access',
            'Right to deletion',
            'Right to portability',
            'Right to object to processing',
        ],
        tracker_adjustments: {
            analytics: 2,
            advertising: 3,
            marketing: 2,
        },
    },

    unknown: {
        region: 'unknown',
        regulation: 'Unknown — consider GDPR as baseline',
        severity_modifier: 1,
        consent_required: true,
        right_to_deletion: true,
        data_portability: false,
        breach_notification_hours: null,
        cross_border_transfer_restricted: false,
        children_age_threshold: 13,
        user_rights: [],
        tracker_adjustments: {},
    },
};

/**
 * Get the region rule for a given region.
 */
export function getRegionRule(region: Region): RegionRule {
    return REGION_RULES[region] || REGION_RULES.unknown;
}

/**
 * Get additional severity weight for a tracker category in a specific region.
 */
export function getRegionAdjustment(region: Region, trackerCategory: string): number {
    const rule = REGION_RULES[region];
    return (rule?.tracker_adjustments[trackerCategory] ?? 0) + (rule?.severity_modifier ?? 0);
}

/**
 * Get the user rights list for policy generation in a specific region.
 */
export function getUserRightsForRegion(region: Region): string[] {
    const rule = REGION_RULES[region];
    return rule?.user_rights ?? [];
}
