import { Database, Wrench, Code2, GitBranch, CheckCircle, Zap } from 'lucide-react';

export function AIFeatures() {
    const features = [
        {
            icon: Database,
            title: 'Machine-Readable Output',
            desc: 'JSON and SARIF formats for AI parsing and downstream processing',
            code: 'npx etalon audit ./ --format json',
        },
        {
            icon: Wrench,
            title: 'Auto-Fix Capabilities',
            desc: 'AI agents apply privacy patches automatically with preview',
            code: 'npx etalon audit ./ --fix',
        },
        {
            icon: Code2,
            title: 'Programmatic API',
            desc: 'Node.js library for custom workflows and integrations',
            code: "import { auditProject } from 'etalon-core'",
        },
        {
            icon: GitBranch,
            title: 'MCP Integration',
            desc: 'Native support for Claude Desktop, Cline, and MCP agents',
            code: 'npm install -g @etalon/mcp-server',
        },
        {
            icon: CheckCircle,
            title: 'Exit Codes',
            desc: 'Agents know pass/fail status for CI/CD and automated decisions',
            code: '# 0 = clean  |  1 = violations found',
        },
        {
            icon: Zap,
            title: 'Fast Performance',
            desc: '~100 files/second scanning — agents get results instantly',
            code: '✓ 247 files scanned in 0.8s',
        },
    ];

    return (
        <section className="py-24">
            <div className="mx-auto max-w-6xl px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Why AI agents love ETALON
                    </h2>
                    <p className="mt-4 text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                        Designed for programmatic access and automation
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {features.map(f => (
                        <div
                            key={f.title}
                            className="group bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-8 border border-zinc-200 dark:border-zinc-700 hover:border-primary/40 transition-colors"
                        >
                            <f.icon className="w-10 h-10 text-primary mb-5" />
                            <h3 className="text-xl font-bold mb-3 text-zinc-900 dark:text-zinc-50">{f.title}</h3>
                            <p className="text-zinc-600 dark:text-zinc-400 mb-5 text-sm leading-relaxed">{f.desc}</p>
                            <div className="bg-zinc-950 rounded-lg p-3 font-mono text-xs text-zinc-300">
                                {f.code}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
