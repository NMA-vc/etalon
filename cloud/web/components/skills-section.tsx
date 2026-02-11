import { Download, Code2, Zap } from 'lucide-react';

export function SkillsSection() {
    const agents = [
        { name: 'Claude Desktop', desc: 'Full MCP support' },
        { name: 'Cline', desc: 'VS Code extension' },
        { name: 'Claude Code', desc: 'Terminal agent' },
        { name: 'Cursor', desc: 'AI-first editor' },
        { name: 'Windsurf', desc: 'AI IDE' },
        { name: 'Any MCP Agent', desc: 'Universal protocol' },
    ];

    return (
        <section id="mcp-server" className="pt-16 pb-24 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="mx-auto max-w-5xl px-6">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Install ETALON as a skill for your AI coding agent
                    </h2>
                    <p className="mt-4 text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                        MCP server skill for automatic discovery and use
                    </p>
                </div>

                {/* What is MCP */}
                <div className="bg-white dark:bg-zinc-800/50 rounded-xl p-8 mb-12 border border-zinc-200 dark:border-zinc-700">
                    <h3 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">What is an MCP Server?</h3>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        Model Context Protocol (MCP) lets AI agents use external tools directly.
                        ETALON&apos;s MCP server enables Claude Desktop, Cline, and other agents to run audits,
                        generate policies, and fix violations automatically — no manual commands needed.
                    </p>
                </div>

                {/* 3 Steps */}
                <div className="grid md:grid-cols-3 gap-6 mb-16">
                    {/* Step 1: Install */}
                    <div className="bg-white dark:bg-zinc-800/50 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
                        <Download className="w-10 h-10 text-primary mb-4" />
                        <h3 className="text-lg font-bold mb-3 text-zinc-900 dark:text-zinc-50">1. Install</h3>
                        <div className="bg-zinc-950 rounded-lg p-4 font-mono text-sm text-zinc-100">
                            <span className="text-emerald-400">$</span> npm install -g @etalon/mcp-server
                        </div>
                    </div>

                    {/* Step 2: Configure */}
                    <div className="bg-white dark:bg-zinc-800/50 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
                        <Code2 className="w-10 h-10 text-primary mb-4" />
                        <h3 className="text-lg font-bold mb-3 text-zinc-900 dark:text-zinc-50">2. Configure</h3>
                        <div className="bg-zinc-950 rounded-lg p-4 font-mono text-xs text-zinc-100 leading-relaxed">
                            <p>{'{'}</p>
                            <p className="ml-3">&quot;mcpServers&quot;: {'{'}</p>
                            <p className="ml-6">&quot;etalon&quot;: {'{'}</p>
                            <p className="ml-9">&quot;command&quot;: &quot;etalon-mcp&quot;</p>
                            <p className="ml-6">{'}'}</p>
                            <p className="ml-3">{'}'}</p>
                            <p>{'}'}</p>
                        </div>
                    </div>

                    {/* Step 3: Use */}
                    <div className="bg-white dark:bg-zinc-800/50 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700">
                        <Zap className="w-10 h-10 text-primary mb-4" />
                        <h3 className="text-lg font-bold mb-3 text-zinc-900 dark:text-zinc-50">3. Use</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                            Your AI agent discovers ETALON automatically
                        </p>
                        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 text-sm space-y-2">
                            <p><span className="font-semibold text-zinc-900 dark:text-zinc-100">You:</span> <span className="text-zinc-600 dark:text-zinc-400">&quot;Check GDPR violations&quot;</span></p>
                            <p><span className="font-semibold text-primary">Claude:</span> <span className="text-zinc-600 dark:text-zinc-400">Found 3 issues. Want me to fix?</span></p>
                        </div>
                    </div>
                </div>

                {/* Available Tools */}
                <div className="bg-white dark:bg-zinc-800/50 rounded-xl p-8 mb-12 border border-zinc-200 dark:border-zinc-700">
                    <h3 className="text-xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">Available MCP Tools</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                        {[
                            { name: 'etalon_audit', desc: 'Scan codebase for privacy violations' },
                            { name: 'etalon_scan', desc: 'Scan website for third-party trackers' },
                            { name: 'etalon_generate_policy', desc: 'Auto-generate GDPR privacy policy' },
                            { name: 'etalon_consent_check', desc: 'Test cookie consent compliance' },
                            { name: 'etalon_policy_check', desc: 'Compare policy vs actual trackers' },
                            { name: 'etalon_data_flow', desc: 'Map PII data flows through codebase' },
                            { name: 'etalon_lookup', desc: 'Query vendor database (102 vendors)' },
                        ].map(tool => (
                            <div key={tool.name} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                                <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0 mt-0.5">{tool.name}</code>
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">{tool.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Compatible Agents */}
                <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-8 border border-primary/20">
                    <h3 className="text-2xl font-bold text-center mb-8 text-zinc-900 dark:text-zinc-50">
                        Works with these AI agents
                    </h3>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {agents.map(agent => (
                            <div key={agent.name} className="bg-white dark:bg-zinc-800 rounded-lg p-5 border border-zinc-200 dark:border-zinc-700 text-center">
                                <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{agent.name}</h4>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{agent.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
