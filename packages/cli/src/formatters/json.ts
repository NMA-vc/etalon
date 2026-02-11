import type { ScanReport } from '@etalon/core';

/**
 * Format a scan report as JSON matching the PRD spec.
 */
export function formatJson(report: ScanReport): string {
    const output = {
        meta: {
            etalon_version: report.meta.etalonVersion,
            scan_date: report.meta.scanDate,
            scan_duration_ms: report.meta.scanDurationMs,
            url: report.meta.url,
        },
        summary: {
            total_requests: report.summary.totalRequests,
            third_party_requests: report.summary.thirdPartyRequests,
            known_vendors: report.summary.knownVendors,
            unknown_domains: report.summary.unknownDomains,
            high_risk: report.summary.highRisk,
            medium_risk: report.summary.mediumRisk,
            low_risk: report.summary.lowRisk,
        },
        vendors: report.vendors.map((dv) => ({
            domain: dv.vendor.domains[0],
            vendor_id: dv.vendor.id,
            name: dv.vendor.name,
            category: dv.vendor.category,
            risk_level: dv.vendor.risk_score >= 6 ? 'high' : dv.vendor.risk_score >= 3 ? 'medium' : 'low',
            risk_score: dv.vendor.risk_score,
            gdpr_compliant: dv.vendor.gdpr_compliant,
            dpa_url: dv.vendor.dpa_url,
            data_collected: dv.vendor.data_collected,
            requests: dv.requests.map((r) => ({
                url: r.url,
                method: r.method,
                type: r.type,
                timestamp: r.timestamp,
            })),
        })),
        unknown: report.unknown.map((u) => ({
            domain: u.domain,
            requests: u.requests.map((r) => ({
                url: r.url,
                method: r.method,
                type: r.type,
            })),
            suggested_action: u.suggestedAction,
        })),
        recommendations: report.recommendations.map((r) => ({
            type: r.type,
            vendor_id: r.vendorId,
            message: r.message,
        })),
    };

    return JSON.stringify(output, null, 2);
}
