import { VendorRegistry } from '../vendor-registry.js';
import type { AuditReport, AuditFinding, StackInfo } from './types.js';
import type { DataFlowMap } from './data-flow-analyzer.js';
import type { Vendor } from '../types.js';

// ─── Types ────────────────────────────────────────────────────────

export interface PolicyInput {
    siteUrl?: string;
    projectDir?: string;
    companyName: string;
    companyEmail: string;
    companyCountry?: string;
}

export interface PolicySection {
    id: string;
    title: string;
    content: string;
}

export interface PolicyVendorEntry {
    vendorId: string;
    vendorName: string;
    company: string;
    category: string;
    purpose: string;
    dataCollected: string[];
    privacyPolicyUrl?: string;
    dpaUrl?: string;
    retentionPeriod?: string;
    gdprCompliant: boolean;
    source: 'code' | 'network' | 'both';
}

export interface GeneratedPolicy {
    sections: PolicySection[];
    vendors: PolicyVendorEntry[];
    piiTypes: string[];
    fullText: string;
    meta: {
        generatedAt: string;
        etalonVersion: string;
        sources: string[];
    };
}

// ─── Category Labels ──────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
    analytics: 'Website Analytics',
    advertising: 'Advertising & Conversion Tracking',
    social: 'Social Media Integration',
    tag_manager: 'Tag Management',
    heatmaps: 'Heatmap & Session Recording',
    ab_testing: 'A/B Testing',
    error_tracking: 'Error Monitoring',
    chat: 'Live Chat & Customer Support',
    video: 'Video Embedding',
    cdn: 'Content Delivery',
    payments: 'Payment Processing',
    consent: 'Cookie Consent Management',
    security: 'Security',
    fonts: 'Web Fonts',
    other: 'Third-Party Services',
};

const CATEGORY_PURPOSES: Record<string, string> = {
    analytics: 'to understand how visitors interact with our website, including page views, session duration, and user behavior',
    advertising: 'for advertising, retargeting, and conversion tracking to measure the effectiveness of our marketing campaigns',
    social: 'to enable social media sharing, login, and integration features',
    tag_manager: 'to manage third-party scripts and tags on our website',
    heatmaps: 'to record user interactions such as clicks, scrolls, and mouse movements for improving user experience',
    ab_testing: 'to test different versions of our website and optimize the user experience',
    error_tracking: 'to monitor and diagnose technical errors and improve website reliability',
    chat: 'to provide live chat and customer support functionality',
    video: 'to embed and deliver video content',
    cdn: 'for content delivery and performance optimization',
    payments: 'to process payments securely',
    consent: 'to manage cookie consent preferences',
    security: 'for security monitoring and fraud prevention',
    fonts: 'to deliver custom web fonts',
    other: 'for various operational purposes',
};

// ─── PII Type Labels ─────────────────────────────────────────────

const PII_LABELS: Record<string, string> = {
    email: 'Email addresses',
    ip: 'IP addresses',
    name: 'Names',
    phone: 'Phone numbers',
    address: 'Physical addresses',
    ssn: 'Government identification numbers',
    'credit-card': 'Payment card information',
    'date-of-birth': 'Date of birth',
    password: 'Passwords (hashed)',
    geolocation: 'Geolocation data',
    'device-id': 'Device identifiers',
    cookie: 'Cookies and tracking identifiers',
};

// ─── Vendor Merging ──────────────────────────────────────────────

function mergeVendors(
    codeVendorIds: Set<string>,
    networkVendorIds: Set<string>,
    registry: VendorRegistry,
): PolicyVendorEntry[] {
    const allIds = new Set([...codeVendorIds, ...networkVendorIds]);
    const entries: PolicyVendorEntry[] = [];

    for (const id of allIds) {
        const vendor = registry.getById(id);
        if (!vendor) continue;

        // Skip low-risk infrastructure
        const skipCategories = ['cdn', 'consent', 'security', 'fonts'];
        if (skipCategories.includes(vendor.category)) continue;

        const inCode = codeVendorIds.has(id);
        const inNetwork = networkVendorIds.has(id);

        entries.push({
            vendorId: vendor.id,
            vendorName: vendor.name,
            company: vendor.company,
            category: vendor.category,
            purpose: vendor.purpose,
            dataCollected: vendor.data_collected,
            privacyPolicyUrl: vendor.privacy_policy,
            dpaUrl: vendor.dpa_url,
            retentionPeriod: vendor.retention_period,
            gdprCompliant: vendor.gdpr_compliant,
            source: inCode && inNetwork ? 'both' : inCode ? 'code' : 'network',
        });
    }

    // Sort: advertising first, then analytics, then rest
    const categoryOrder: Record<string, number> = {
        advertising: 0, social: 1, analytics: 2, heatmaps: 3,
        ab_testing: 4, tag_manager: 5, error_tracking: 6, chat: 7,
        video: 8, payments: 9, other: 10,
    };
    entries.sort((a, b) => (categoryOrder[a.category] ?? 10) - (categoryOrder[b.category] ?? 10));

    return entries;
}

// ─── PII Extraction from Data Flow ───────────────────────────────

function extractPiiTypes(dataFlow?: DataFlowMap): string[] {
    if (!dataFlow) return [];
    const types = new Set<string>();
    for (const node of dataFlow.nodes) {
        if (node.piiType) {
            types.add(node.piiType);
        }
    }
    return Array.from(types);
}

// ─── Extract Vendor IDs from Code Audit ──────────────────────────

function extractCodeVendorIds(audit?: AuditReport): Set<string> {
    if (!audit) return new Set();
    const ids = new Set<string>();
    for (const finding of audit.findings) {
        if (finding.vendorId) {
            ids.add(finding.vendorId);
        }
    }
    return ids;
}

// ─── Section Generators ──────────────────────────────────────────

function generateIntroSection(input: PolicyInput): PolicySection {
    const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });

    return {
        id: 'introduction',
        title: 'Introduction & Data Controller',
        content: [
            `This privacy policy explains how **${input.companyName}** ("we", "us", "our") collects, uses, and protects your personal data when you use our website${input.siteUrl ? ` (${input.siteUrl})` : ''} and services.`,
            '',
            `**Data Controller:** ${input.companyName}`,
            `**Contact:** ${input.companyEmail}`,
            input.companyCountry ? `**Jurisdiction:** ${input.companyCountry}` : '',
            '',
            `*Last updated: ${date}*`,
        ].filter(Boolean).join('\n'),
    };
}

function generateDataCollectionSection(piiTypes: string[]): PolicySection {
    if (piiTypes.length === 0) {
        return {
            id: 'data-collection',
            title: 'Data We Collect',
            content: 'We collect standard usage data such as IP addresses, browser type, and pages visited when you use our website.',
        };
    }

    const items = piiTypes.map((t) => {
        const label = PII_LABELS[t] ?? t;
        return `- ${label}`;
    });

    return {
        id: 'data-collection',
        title: 'Data We Collect',
        content: [
            'We collect the following categories of personal data:',
            '',
            ...items,
            '',
            'Additionally, we automatically collect standard usage data such as IP addresses, browser type, device information, and pages visited.',
        ].join('\n'),
    };
}

function generateThirdPartiesSection(vendors: PolicyVendorEntry[]): PolicySection {
    if (vendors.length === 0) {
        return {
            id: 'third-parties',
            title: 'Third-Party Services',
            content: 'We do not currently use third-party tracking or analytics services on our website.',
        };
    }

    // Group by category
    const groups = new Map<string, PolicyVendorEntry[]>();
    for (const v of vendors) {
        const existing = groups.get(v.category) ?? [];
        existing.push(v);
        groups.set(v.category, existing);
    }

    const parts: string[] = [
        'We use the following third-party services:',
        '',
    ];

    for (const [category, categoryVendors] of groups) {
        const label = CATEGORY_LABELS[category] ?? category;
        parts.push(`### ${label}`);
        parts.push('');

        for (const v of categoryVendors) {
            let snippet = `**${v.vendorName}**`;
            if (v.company && v.company !== v.vendorName) {
                snippet += ` (provided by ${v.company})`;
            }

            const purposeText = CATEGORY_PURPOSES[v.category] ?? v.purpose;
            snippet += ` — We use this service ${purposeText}.`;

            if (v.dataCollected.length > 0) {
                snippet += ` This service may collect: ${v.dataCollected.join(', ')}.`;
            }

            if (v.retentionPeriod) {
                snippet += ` Data retention: ${v.retentionPeriod}.`;
            }

            if (v.privacyPolicyUrl) {
                snippet += ` [Privacy Policy](${v.privacyPolicyUrl})`;
            }

            parts.push(snippet);
            parts.push('');
        }
    }

    return {
        id: 'third-parties',
        title: 'Third-Party Services',
        content: parts.join('\n'),
    };
}

function generateCookiesSection(vendors: PolicyVendorEntry[]): PolicySection {
    const cookieVendors = vendors.filter((v) =>
        ['analytics', 'advertising', 'social', 'heatmaps', 'ab_testing', 'tag_manager'].includes(v.category)
    );

    if (cookieVendors.length === 0) {
        return {
            id: 'cookies',
            title: 'Cookies & Tracking Technologies',
            content: [
                'We use essential cookies required for the basic functioning of our website. These cookies do not require consent under GDPR as they are strictly necessary.',
                '',
                'We do not use analytics or advertising cookies.',
            ].join('\n'),
        };
    }

    const rows = cookieVendors.map((v) => {
        const cat = CATEGORY_LABELS[v.category] ?? v.category;
        const data = v.dataCollected.length > 0 ? v.dataCollected.slice(0, 3).join(', ') : 'Usage data';
        const retention = v.retentionPeriod ?? 'See provider policy';
        return `| ${v.vendorName} | ${cat} | ${data} | ${retention} |`;
    });

    return {
        id: 'cookies',
        title: 'Cookies & Tracking Technologies',
        content: [
            'We use cookies and similar tracking technologies on our website. Below is a summary of the cookies set by third-party services:',
            '',
            '| Provider | Category | Data Collected | Retention |',
            '|----------|----------|----------------|-----------|',
            ...rows,
            '',
            '**Essential cookies** required for basic website functionality do not require consent. All other cookies require your explicit consent before being set.',
            '',
            'You can manage your cookie preferences at any time through your browser settings or our cookie consent banner.',
        ].join('\n'),
    };
}

function generateDataTransferSection(vendors: PolicyVendorEntry[]): PolicySection {
    const nonCompliant = vendors.filter((v) => !v.gdprCompliant);

    if (nonCompliant.length === 0) {
        return {
            id: 'data-transfers',
            title: 'International Data Transfers',
            content: 'All third-party services we use are GDPR-compliant and process data within the EU/EEA or under appropriate safeguards (such as Standard Contractual Clauses).',
        };
    }

    const lines = nonCompliant.map((v) => {
        let line = `- **${v.vendorName}** (${v.company})`;
        if (v.dpaUrl) {
            line += ` — [Data Processing Agreement](${v.dpaUrl})`;
        }
        return line;
    });

    return {
        id: 'data-transfers',
        title: 'International Data Transfers',
        content: [
            'Some of our third-party service providers may process data outside the EU/EEA. We ensure appropriate safeguards are in place, including Standard Contractual Clauses (SCCs) and adequacy decisions.',
            '',
            'The following services may transfer data internationally:',
            '',
            ...lines,
        ].join('\n'),
    };
}

function generateRetentionSection(vendors: PolicyVendorEntry[]): PolicySection {
    const withRetention = vendors.filter((v) => v.retentionPeriod);

    return {
        id: 'data-retention',
        title: 'Data Retention',
        content: [
            'We retain personal data only for as long as necessary to fulfill the purposes for which it was collected, or as required by law.',
            '',
            ...(withRetention.length > 0 ? [
                'Retention periods for third-party services:',
                '',
                ...withRetention.map((v) => `- **${v.vendorName}**: ${v.retentionPeriod}`),
                '',
            ] : []),
            'When data is no longer needed, it is securely deleted or anonymized.',
        ].join('\n'),
    };
}

function generateRightsSection(): PolicySection {
    return {
        id: 'your-rights',
        title: 'Your Rights Under GDPR',
        content: [
            'Under the General Data Protection Regulation (GDPR), you have the following rights regarding your personal data:',
            '',
            '- **Right of Access** (Art. 15) — You can request a copy of the personal data we hold about you.',
            '- **Right to Rectification** (Art. 16) — You can request correction of inaccurate or incomplete data.',
            '- **Right to Erasure** (Art. 17) — You can request deletion of your personal data ("right to be forgotten").',
            '- **Right to Restrict Processing** (Art. 18) — You can request that we limit how we use your data.',
            '- **Right to Data Portability** (Art. 20) — You can request your data in a structured, machine-readable format.',
            '- **Right to Object** (Art. 21) — You can object to processing based on legitimate interests or direct marketing.',
            '- **Right to Withdraw Consent** (Art. 7(3)) — You can withdraw consent at any time without affecting prior processing.',
            '',
            'To exercise any of these rights, please contact us using the information provided above.',
        ].join('\n'),
    };
}

function generateContactSection(input: PolicyInput): PolicySection {
    return {
        id: 'contact',
        title: 'Contact & Data Protection Officer',
        content: [
            `For any privacy-related questions or to exercise your rights, please contact:`,
            '',
            `**${input.companyName}**`,
            `Email: ${input.companyEmail}`,
            '',
            'If you believe that your data protection rights have been violated, you have the right to lodge a complaint with a supervisory authority in the EU member state of your habitual residence, place of work, or place of the alleged infringement.',
        ].join('\n'),
    };
}

// ─── Main Generator ──────────────────────────────────────────────

export interface PolicyGeneratorInput {
    input: PolicyInput;
    audit?: AuditReport;
    networkVendorIds?: Set<string>;
    dataFlow?: DataFlowMap;
}

export function generatePolicy(opts: PolicyGeneratorInput): GeneratedPolicy {
    const registry = VendorRegistry.load();
    const codeVendorIds = extractCodeVendorIds(opts.audit);
    const networkIds = opts.networkVendorIds ?? new Set<string>();
    const piiTypes = extractPiiTypes(opts.dataFlow);

    // Merge vendors from code + network
    const vendors = mergeVendors(codeVendorIds, networkIds, registry);

    // Track sources used
    const sources: string[] = [];
    if (opts.audit) sources.push('code-audit');
    if (opts.networkVendorIds) sources.push('network-scan');
    if (opts.dataFlow) sources.push('data-flow-analysis');

    // Generate sections
    const sections: PolicySection[] = [
        generateIntroSection(opts.input),
        generateDataCollectionSection(piiTypes),
        generateThirdPartiesSection(vendors),
        generateCookiesSection(vendors),
        generateDataTransferSection(vendors),
        generateRetentionSection(vendors),
        generateRightsSection(),
        generateContactSection(opts.input),
    ];

    // Assemble full text
    const fullText = assemblePolicy(opts.input, sections);

    return {
        sections,
        vendors,
        piiTypes,
        fullText,
        meta: {
            generatedAt: new Date().toISOString(),
            etalonVersion: '1.0.0',
            sources,
        },
    };
}

// ─── Assembler ───────────────────────────────────────────────────

function assemblePolicy(input: PolicyInput, sections: PolicySection[]): string {
    const lines: string[] = [
        `# Privacy Policy — ${input.companyName}`,
        '',
    ];

    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        lines.push(`## ${i + 1}. ${section.title}`);
        lines.push('');
        lines.push(section.content);
        lines.push('');
        lines.push('---');
        lines.push('');
    }

    lines.push('');
    lines.push('> **Disclaimer:** This privacy policy was auto-generated by [ETALON](https://etalon.dev) based on an automated scan of the website and codebase. It should be reviewed by a qualified legal professional before publication. ETALON does not provide legal advice.');
    lines.push('');

    return lines.join('\n');
}
