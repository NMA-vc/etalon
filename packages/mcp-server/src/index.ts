import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { VendorRegistry } from 'etalon-core';

const registry = VendorRegistry.load();

const server = new Server(
    { name: 'etalon-mcp-server', version: '1.0.0' },
    { capabilities: { resources: {}, tools: {} } }
);

// ─── Resources ────────────────────────────────────────────────────

server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const categories = registry.getCategories();
    const resources = [
        {
            uri: 'etalon://registry/vendors',
            name: 'All Vendors',
            description: 'Complete ETALON vendor/tracker database',
            mimeType: 'application/json',
        },
        {
            uri: 'etalon://registry/vendors/compliant',
            name: 'GDPR-Compliant Vendors',
            description: 'Only GDPR-compliant vendors',
            mimeType: 'application/json',
        },
        {
            uri: 'etalon://registry/categories',
            name: 'Categories',
            description: 'All vendor categories with risk levels',
            mimeType: 'application/json',
        },
        ...categories.map((cat) => ({
            uri: `etalon://registry/vendors/${cat.id}`,
            name: `${cat.name} Vendors`,
            description: `Vendors in the ${cat.name} category`,
            mimeType: 'application/json',
        })),
    ];

    return { resources };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    if (uri === 'etalon://registry/vendors') {
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(registry.getAllVendors(), null, 2),
                },
            ],
        };
    }

    if (uri === 'etalon://registry/vendors/compliant') {
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(registry.getCompliant(), null, 2),
                },
            ],
        };
    }

    if (uri === 'etalon://registry/categories') {
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(registry.getCategories(), null, 2),
                },
            ],
        };
    }

    // Pattern: etalon://registry/vendors/{category}
    const categoryMatch = uri.match(/^etalon:\/\/registry\/vendors\/(.+)$/);
    if (categoryMatch) {
        const categoryId = categoryMatch[1];
        const vendors = registry.getByCategory(categoryId as Parameters<typeof registry.getByCategory>[0]);
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(vendors, null, 2),
                },
            ],
        };
    }

    throw new Error(`Resource not found: ${uri}`);
});

// ─── Tools ────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'etalon_lookup_vendor',
                description: 'Check if a domain is a known tracker in the ETALON vendor registry. Returns vendor details including risk score, category, GDPR compliance, and data collected.',
                inputSchema: {
                    type: 'object' as const,
                    properties: {
                        domain: {
                            type: 'string',
                            description: 'Domain to look up (e.g., "google-analytics.com" or "https://www.facebook.com/tr")',
                        },
                    },
                    required: ['domain'],
                },
            },
            {
                name: 'etalon_search_vendors',
                description: 'Search the ETALON vendor registry by name, company, or ID.',
                inputSchema: {
                    type: 'object' as const,
                    properties: {
                        query: {
                            type: 'string',
                            description: 'Search query (matches vendor name, company, or ID)',
                        },
                    },
                    required: ['query'],
                },
            },
            {
                name: 'etalon_get_vendor_info',
                description: 'Get detailed information about a specific vendor by its ID.',
                inputSchema: {
                    type: 'object' as const,
                    properties: {
                        vendor_id: {
                            type: 'string',
                            description: 'The vendor ID (e.g., "google-analytics", "facebook-pixel")',
                        },
                    },
                    required: ['vendor_id'],
                },
            },
            {
                name: 'etalon_registry_stats',
                description: 'Get statistics about the ETALON vendor registry (vendor count, categories, etc).',
                inputSchema: {
                    type: 'object' as const,
                    properties: {},
                },
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
        case 'etalon_lookup_vendor': {
            const domain = (args as { domain: string }).domain;
            const vendor = registry.lookupDomain(domain);

            if (vendor) {
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: JSON.stringify(
                                {
                                    found: true,
                                    vendor,
                                    riskLevel:
                                        vendor.risk_score >= 6 ? 'high' : vendor.risk_score >= 3 ? 'medium' : 'low',
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            } else {
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: JSON.stringify(
                                {
                                    found: false,
                                    domain,
                                    message: `"${domain}" is not in the ETALON vendor registry. It may be a first-party domain or an unknown tracker.`,
                                },
                                null,
                                2
                            ),
                        },
                    ],
                };
            }
        }

        case 'etalon_search_vendors': {
            const query = (args as { query: string }).query;
            const results = registry.search(query);
            return {
                content: [
                    {
                        type: 'text' as const,
                        text: JSON.stringify({ query, resultCount: results.length, vendors: results }, null, 2),
                    },
                ],
            };
        }

        case 'etalon_get_vendor_info': {
            const vendorId = (args as { vendor_id: string }).vendor_id;
            const vendor = registry.getById(vendorId);

            if (vendor) {
                return {
                    content: [{ type: 'text' as const, text: JSON.stringify(vendor, null, 2) }],
                };
            } else {
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: JSON.stringify({ error: `Vendor "${vendorId}" not found` }, null, 2),
                        },
                    ],
                };
            }
        }

        case 'etalon_registry_stats': {
            const meta = registry.getMetadata();
            return {
                content: [{ type: 'text' as const, text: JSON.stringify(meta, null, 2) }],
            };
        }

        default:
            throw new Error(`Unknown tool: ${name}`);
    }
});

// ─── Start Server ─────────────────────────────────────────────────

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('ETALON MCP Server running on stdio');
}

main().catch((err) => {
    console.error('Failed to start ETALON MCP Server:', err);
    process.exit(1);
});
