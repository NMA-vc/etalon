import { readFileSync } from 'node:fs';
import { join, extname } from 'node:path';

// ─── Types ────────────────────────────────────────────────────────

export type FlowNodeType = 'source' | 'storage' | 'sink';

export interface FlowNode {
    type: FlowNodeType;
    label: string;
    file: string;
    line: number;
    piiType: string;
    detail: string;
}

export interface FlowEdge {
    from: number;
    to: number;
    label?: string;
}

export interface DataFlowMap {
    nodes: FlowNode[];
    edges: FlowEdge[];
}

// ─── PII Patterns ─────────────────────────────────────────────────

const PII_PATTERNS = [
    { regex: /\b(email|e[_-]?mail)\b/i, piiType: 'email' },
    { regex: /\b(phone|tel|mobile|phone[_-]?number)\b/i, piiType: 'phone' },
    { regex: /\b(name|first[_-]?name|last[_-]?name|full[_-]?name|user[_-]?name)\b/i, piiType: 'name' },
    { regex: /\b(address|street|city|zip[_-]?code|postal)\b/i, piiType: 'address' },
    { regex: /\b(ssn|social[_-]?security|national[_-]?id)\b/i, piiType: 'national-id' },
    { regex: /\b(credit[_-]?card|card[_-]?number|cvv|ccn)\b/i, piiType: 'payment' },
    { regex: /\b(date[_-]?of[_-]?birth|dob|birth[_-]?date)\b/i, piiType: 'date-of-birth' },
    { regex: /\b(ip[_-]?address|ip[_-]?addr)\b/i, piiType: 'ip-address' },
    { regex: /\b(password|passwd|pwd)\b/i, piiType: 'password' },
];

// ─── Source Patterns (user input) ─────────────────────────────────

const SOURCE_PATTERNS = [
    // Form fields / input elements
    { regex: /(?:input|TextField|TextInput).*(?:name|type|id)\s*[=:]\s*['"`]([^'"`]+)/i, type: 'form-input' },
    // Request body / params
    { regex: /req\.body\.(\w+)/i, type: 'request-body' },
    { regex: /request\.form\[['"](\w+)['"]\]/i, type: 'request-form' },
    { regex: /params\[['"](\w+)['"]\]/i, type: 'request-params' },
    // Destructured body
    { regex: /const\s*\{[^}]*\}\s*=\s*req\.body/i, type: 'destructured-body' },
];

// ─── Storage Patterns ─────────────────────────────────────────────

const STORAGE_PATTERNS = [
    // Database columns
    { regex: /(?:column|field|Column)\s*\(\s*['"](\w+)['"]/i, type: 'db-column' },
    { regex: /(?:CREATE\s+TABLE|ALTER\s+TABLE).*?\b(\w+)\b.*?(?:VARCHAR|TEXT|INT)/i, type: 'sql-column' },
    // Prisma/Drizzle schema
    { regex: /(\w+)\s+String/i, type: 'orm-field' },
    // localStorage / cookies
    { regex: /localStorage\.setItem\s*\(\s*['"]([^'"]+)['"]/i, type: 'local-storage' },
    { regex: /document\.cookie\s*=\s*['"`](\w+)/i, type: 'cookie' },
    // Redis / cache
    { regex: /(?:redis|cache)\.set\s*\(\s*['"]([^'"]+)['"]/i, type: 'cache' },
];

// ─── Sink Patterns (data exits) ──────────────────────────────────

const SINK_PATTERNS = [
    // Tracker SDKs
    { regex: /(?:analytics|gtag|fbq|segment|mixpanel|amplitude)\s*\.\s*(?:track|identify|page|send)\s*\(/i, type: 'tracker-sdk' },
    // HTTP calls to external
    { regex: /(?:fetch|axios|got|request)\s*\(\s*['"`](https?:\/\/[^'"`]+)/i, type: 'http-external' },
    // Logging
    { regex: /(?:console\.log|logger\.\w+|winston\.\w+)\s*\(/i, type: 'logging' },
    // Email sending
    { regex: /(?:sendMail|sendEmail|transport\.send|ses\.send)/i, type: 'email-send' },
    // Webhook / API push
    { regex: /(?:webhook|callbackUrl|postback)\s*[=:]/i, type: 'webhook' },
];

// ─── Scanner ──────────────────────────────────────────────────────

const SCANNABLE_EXTS = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
    '.py', '.rb', '.go', '.java', '.rs',
    '.vue', '.svelte',
    '.prisma', '.sql',
]);

/**
 * Analyze data flow across files — find sources, storage, and sinks of PII.
 */
export function analyzeDataFlow(files: string[], directory: string): DataFlowMap {
    const nodes: FlowNode[] = [];
    const nodeIndex = new Map<string, number>(); // key → index

    for (const file of files) {
        if (!SCANNABLE_EXTS.has(extname(file))) continue;

        let content: string;
        try {
            content = readFileSync(join(directory, file), 'utf-8');
        } catch {
            continue;
        }

        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Check if line contains PII-related terms
            for (const pii of PII_PATTERNS) {
                if (!pii.regex.test(line)) continue;

                // Check sources
                for (const src of SOURCE_PATTERNS) {
                    if (src.regex.test(line)) {
                        const key = `source:${pii.piiType}:${file}:${i + 1}`;
                        if (!nodeIndex.has(key)) {
                            nodeIndex.set(key, nodes.length);
                            nodes.push({
                                type: 'source',
                                label: `User Input (${pii.piiType})`,
                                file,
                                line: i + 1,
                                piiType: pii.piiType,
                                detail: src.type,
                            });
                        }
                    }
                }

                // Check storage
                for (const store of STORAGE_PATTERNS) {
                    if (store.regex.test(line)) {
                        const key = `storage:${pii.piiType}:${file}:${i + 1}`;
                        if (!nodeIndex.has(key)) {
                            nodeIndex.set(key, nodes.length);
                            nodes.push({
                                type: 'storage',
                                label: `Storage (${pii.piiType})`,
                                file,
                                line: i + 1,
                                piiType: pii.piiType,
                                detail: store.type,
                            });
                        }
                    }
                }

                // Check sinks
                for (const sink of SINK_PATTERNS) {
                    if (sink.regex.test(line)) {
                        const key = `sink:${pii.piiType}:${file}:${i + 1}`;
                        if (!nodeIndex.has(key)) {
                            nodeIndex.set(key, nodes.length);
                            nodes.push({
                                type: 'sink',
                                label: `Sink (${pii.piiType})`,
                                file,
                                line: i + 1,
                                piiType: pii.piiType,
                                detail: sink.type,
                            });
                        }
                    }
                }
            }
        }
    }

    // Build edges: connect nodes of the same PII type: source → storage → sink
    const edges: FlowEdge[] = [];
    const byPii = new Map<string, { sources: number[]; storage: number[]; sinks: number[] }>();

    for (const [key, idx] of nodeIndex) {
        const [type, piiType] = key.split(':');
        if (!byPii.has(piiType)) byPii.set(piiType, { sources: [], storage: [], sinks: [] });
        const group = byPii.get(piiType)!;
        if (type === 'source') group.sources.push(idx);
        else if (type === 'storage') group.storage.push(idx);
        else if (type === 'sink') group.sinks.push(idx);
    }

    for (const [, group] of byPii) {
        // source → storage
        for (const src of group.sources) {
            for (const sto of group.storage) {
                edges.push({ from: src, to: sto, label: 'stores' });
            }
        }
        // storage → sink
        for (const sto of group.storage) {
            for (const sink of group.sinks) {
                edges.push({ from: sto, to: sink, label: 'sends' });
            }
        }
        // Direct: source → sink (if no storage)
        if (group.storage.length === 0) {
            for (const src of group.sources) {
                for (const sink of group.sinks) {
                    edges.push({ from: src, to: sink, label: 'direct' });
                }
            }
        }
    }

    return { nodes, edges };
}

// ─── Formatters ───────────────────────────────────────────────────

const NODE_SHAPES: Record<FlowNodeType, [string, string]> = {
    source: ['([', '])'],    // stadium shape
    storage: ['[(', ')]'],   // cylinder
    sink: ['[[', ']]'],      // rectangle
};

/**
 * Generate a Mermaid diagram from the data flow map.
 */
export function toMermaid(flow: DataFlowMap): string {
    if (flow.nodes.length === 0) return 'graph LR\n  empty[No PII data flows detected]';

    const lines = ['graph LR'];

    for (let i = 0; i < flow.nodes.length; i++) {
        const node = flow.nodes[i];
        const [open, close] = NODE_SHAPES[node.type];
        const label = `${node.label}\\n${node.file}:${node.line}`;
        lines.push(`  n${i}${open}"${label}"${close}`);
    }

    for (const edge of flow.edges) {
        const label = edge.label ? `|${edge.label}|` : '';
        lines.push(`  n${edge.from} -->${label} n${edge.to}`);
    }

    // Style by type
    lines.push('  classDef source fill:#4caf50,stroke:#2e7d32,color:#fff');
    lines.push('  classDef storage fill:#2196f3,stroke:#1565c0,color:#fff');
    lines.push('  classDef sink fill:#f44336,stroke:#c62828,color:#fff');

    const sources = flow.nodes.map((n, i) => n.type === 'source' ? `n${i}` : '').filter(Boolean);
    const storage = flow.nodes.map((n, i) => n.type === 'storage' ? `n${i}` : '').filter(Boolean);
    const sinks = flow.nodes.map((n, i) => n.type === 'sink' ? `n${i}` : '').filter(Boolean);

    if (sources.length) lines.push(`  class ${sources.join(',')} source`);
    if (storage.length) lines.push(`  class ${storage.join(',')} storage`);
    if (sinks.length) lines.push(`  class ${sinks.join(',')} sink`);

    return lines.join('\n');
}

/**
 * Generate a text summary of the data flow.
 */
export function toTextSummary(flow: DataFlowMap): string {
    if (flow.nodes.length === 0) return 'No PII data flows detected.';

    const lines: string[] = [];
    lines.push('PII Data Flow Analysis');
    lines.push('═══════════════════════════════════════════════════════\n');

    const byPii = new Map<string, FlowNode[]>();
    for (const node of flow.nodes) {
        if (!byPii.has(node.piiType)) byPii.set(node.piiType, []);
        byPii.get(node.piiType)!.push(node);
    }

    for (const [piiType, piiNodes] of byPii) {
        lines.push(`📌 ${piiType.toUpperCase()}`);
        lines.push('───────────────────────────────────────────────────────');

        const sources = piiNodes.filter(n => n.type === 'source');
        const storage = piiNodes.filter(n => n.type === 'storage');
        const sinks = piiNodes.filter(n => n.type === 'sink');

        if (sources.length) {
            lines.push('  Sources (user input):');
            for (const s of sources) lines.push(`    → ${s.detail} at ${s.file}:${s.line}`);
        }
        if (storage.length) {
            lines.push('  Storage:');
            for (const s of storage) lines.push(`    💾 ${s.detail} at ${s.file}:${s.line}`);
        }
        if (sinks.length) {
            lines.push('  Sinks (data exits):');
            for (const s of sinks) lines.push(`    ⬆️  ${s.detail} at ${s.file}:${s.line}`);
        }
        lines.push('');
    }

    lines.push(`Total: ${flow.nodes.length} nodes, ${flow.edges.length} data flows`);

    return lines.join('\n');
}
