// ─── Vendor Database Types ────────────────────────────────────────

export interface Vendor {
    id: string;
    domains: string[];
    name: string;
    company: string;
    category: VendorCategory;
    gdpr_compliant: boolean;
    dpa_url?: string;
    privacy_policy?: string;
    purpose: string;
    data_collected: string[];
    retention_period?: string;
    last_verified?: string;
    risk_score: number; // 1-10
    alternatives?: string[];
}

export type VendorCategory =
    | 'analytics'
    | 'advertising'
    | 'social'
    | 'cdn'
    | 'payments'
    | 'chat'
    | 'heatmaps'
    | 'ab_testing'
    | 'error_tracking'
    | 'tag_manager'
    | 'consent'
    | 'video'
    | 'fonts'
    | 'security'
    | 'push'
    | 'forms'
    | 'referral'
    | 'booking'
    | 'maps'
    | 'web3'
    | 'b2b_intelligence'
    | 'other';

export interface Category {
    id: VendorCategory;
    name: string;
    description: string;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
}

export interface VendorDatabase {
    version: string;
    last_updated: string;
    vendors: Vendor[];
    categories: Category[];
}

// ─── Scan Types ───────────────────────────────────────────────────

export interface ScanRequest {
    url: string;
    deep?: boolean;
    timeout?: number;
    waitForNetworkIdle?: boolean;
    userAgent?: string;
    viewport?: { width: number; height: number };
}

export interface NetworkRequest {
    url: string;
    domain: string;
    method: string;
    type: string;
    timestamp: string;
    statusCode?: number;
    contentType?: string;
    size?: number;
}

export interface DetectedVendor {
    vendor: Vendor;
    requests: NetworkRequest[];
}

export interface UnknownDomain {
    domain: string;
    requests: NetworkRequest[];
    suggestedAction: 'submit_for_review' | 'likely_benign' | 'investigate';
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ScanSummary {
    totalRequests: number;
    thirdPartyRequests: number;
    knownVendors: number;
    unknownDomains: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
}

export interface ScanReport {
    meta: {
        etalonVersion: string;
        scanDate: string;
        scanDurationMs: number;
        url: string;
        deep: boolean;
    };
    summary: ScanSummary;
    vendors: DetectedVendor[];
    unknown: UnknownDomain[];
    recommendations: Recommendation[];
}

export interface Recommendation {
    type: 'high_risk_vendor' | 'missing_dpa' | 'unknown_tracker' | 'consider_alternative';
    vendorId?: string;
    domain?: string;
    message: string;
}

// ─── Config Types ─────────────────────────────────────────────────

export interface OpticConfig {
    version: string;
    sites?: SiteConfig[];
    allowlist?: AllowlistEntry[];
    notifications?: NotificationConfig;
    scan?: ScanConfig;
}

export interface SiteConfig {
    url: string;
    name: string;
    schedule?: 'daily' | 'weekly' | 'on-commit';
}

export interface AllowlistEntry {
    vendor_id?: string;
    domain?: string;
    reason: string;
    approved_by?: string;
    approved_date?: string;
    notes?: string;
}

export interface NotificationConfig {
    email?: string;
    slack_webhook?: string;
    threshold?: 'low' | 'medium' | 'high';
}

export interface ScanConfig {
    wait_for_network_idle?: boolean;
    timeout?: number;
    user_agent?: string;
    viewport?: { width: number; height: number };
}
