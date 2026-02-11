import type { ScanReport } from '@etalon/core';

/**
 * Format a scan report as SARIF 2.1.0 for CI/CD integration.
 * Compatible with GitHub Code Scanning and other SARIF consumers.
 */
export function formatSarif(report: ScanReport): string {
    const results = [];

    // High-risk vendor findings
    for (const dv of report.vendors) {
        if (dv.vendor.risk_score >= 6) {
            results.push({
                ruleId: 'high-risk-tracker',
                level: 'warning',
                message: {
                    text: `${dv.vendor.name} detected (risk score: ${dv.vendor.risk_score}/10). Category: ${dv.vendor.category}. ${dv.vendor.gdpr_compliant ? 'GDPR compliant' : 'Not GDPR compliant'}.`,
                },
                locations: [
                    {
                        physicalLocation: {
                            artifactLocation: { uri: report.meta.url },
                        },
                    },
                ],
                properties: {
                    vendorId: dv.vendor.id,
                    category: dv.vendor.category,
                    riskScore: dv.vendor.risk_score,
                    requestCount: dv.requests.length,
                },
            });
        }
    }

    // Medium-risk vendor findings
    for (const dv of report.vendors) {
        if (dv.vendor.risk_score >= 3 && dv.vendor.risk_score < 6) {
            results.push({
                ruleId: 'medium-risk-tracker',
                level: 'note',
                message: {
                    text: `${dv.vendor.name} detected (risk score: ${dv.vendor.risk_score}/10). Category: ${dv.vendor.category}.`,
                },
                locations: [
                    {
                        physicalLocation: {
                            artifactLocation: { uri: report.meta.url },
                        },
                    },
                ],
                properties: {
                    vendorId: dv.vendor.id,
                    category: dv.vendor.category,
                    riskScore: dv.vendor.risk_score,
                },
            });
        }
    }

    // Unknown domain findings
    for (const u of report.unknown) {
        results.push({
            ruleId: 'unknown-tracker',
            level: 'note',
            message: {
                text: `Unknown third-party domain: ${u.domain} (${u.requests.length} request${u.requests.length !== 1 ? 's' : ''})`,
            },
            locations: [
                {
                    physicalLocation: {
                        artifactLocation: { uri: report.meta.url },
                    },
                },
            ],
        });
    }

    const sarif = {
        $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
        version: '2.1.0' as const,
        runs: [
            {
                tool: {
                    driver: {
                        name: 'ETALON',
                        version: report.meta.etalonVersion,
                        informationUri: 'https://github.com/NMA-vc/etalon',
                        rules: [
                            {
                                id: 'high-risk-tracker',
                                shortDescription: { text: 'High-risk tracker detected' },
                                helpUri: 'https://github.com/NMA-vc/etalon#risk-levels',
                            },
                            {
                                id: 'medium-risk-tracker',
                                shortDescription: { text: 'Medium-risk tracker detected' },
                                helpUri: 'https://github.com/NMA-vc/etalon#risk-levels',
                            },
                            {
                                id: 'unknown-tracker',
                                shortDescription: { text: 'Unknown third-party domain' },
                                helpUri: 'https://github.com/NMA-vc/etalon#unknown-domains',
                            },
                        ],
                    },
                },
                results,
            },
        ],
    };

    return JSON.stringify(sarif, null, 2);
}
