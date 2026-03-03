"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

/* ═══════════════════════════════════════════════════════════
   BentoGrid — 3 cards: 6-Point Audit, AST Auto-Fix, 111k+ Registry
   ═══════════════════════════════════════════════════════════ */

const scanners = [
    {
        name: "Code Scanner",
        icon: "📦",
        desc: "Tracker SDKs in npm, pip, cargo. Import patterns, API calls, env vars.",
    },
    {
        name: "Schema Scanner",
        icon: "🗄️",
        desc: "PII in Prisma, SQL, Django, SQLAlchemy, TypeORM, Diesel schemas.",
    },
    {
        name: "Config Scanner",
        icon: "⚙️",
        desc: "Cookie settings, CORS, CSP headers, security misconfigurations.",
    },
    {
        name: "Server Tracker",
        icon: "🖥️",
        desc: "Server-side tracking patterns that bypass ad blockers.",
    },
    {
        name: "CNAME Cloaking",
        icon: "🔗",
        desc: "DNS-based tracking cloaked behind first-party CNAME records.",
    },
    {
        name: "Custom Rules",
        icon: "🔧",
        desc: "Your own detection rules via .etalon/rules/ plugin system.",
    },
];



const container = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export function BentoGrid() {
    return (
        <section id="features" className="py-24 border-t border-border/40 bg-muted/5">
            <div className="mx-auto max-w-6xl px-6">
                <div className="text-center mb-16">
                    <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                        The Trust Heartbeat
                    </Badge>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                        Not a linter. A 6-scanner{" "}
                        <span className="text-[#1a6b7a]">intelligence engine</span>.
                    </h2>
                    <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
                        Every finding is enriched with GDPR references, git blame, and context-aware severity scoring.
                    </p>
                </div>

                <motion.div
                    className="grid grid-cols-12 gap-4 md:gap-6"
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-80px" }}
                >
                    {/* ── Large Card: 6-Point Static Audit (8 cols) ── */}
                    <motion.div
                        variants={item}
                        className="col-span-12 md:col-span-8 rounded-2xl border border-border/50 bg-card/50 p-6 md:p-8 hover:border-primary/30 transition-colors"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                                🔍
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">6-Point Static Audit</h3>
                                <p className="text-sm text-muted-foreground">
                                    Parallel scanners analyze every layer of your stack
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {scanners.map((s) => (
                                <div
                                    key={s.name}
                                    className="group rounded-xl border border-border/30 bg-muted/30 p-4 hover:border-primary/30 hover:bg-primary/5 transition-all"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-lg">{s.icon}</span>
                                        <span className="font-semibold text-sm">{s.name}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {s.desc}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Terminal preview */}
                        <div className="mt-6 rounded-lg bg-zinc-950 border border-zinc-800 p-4 font-mono text-xs">
                            <span className="text-zinc-500">$</span>{" "}
                            <span className="text-zinc-200">etalon audit ./ --include-blame</span>
                            <div className="mt-2 text-zinc-500">
                                6 scanners · 3 languages · 6 ORM formats · Context-aware scoring
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Medium Card: Privacy Policy Generator (4 cols) ── */}
                    <motion.div
                        variants={item}
                        className="col-span-12 md:col-span-4 rounded-2xl border border-border/50 bg-card/50 p-6 md:p-8 hover:border-primary/30 transition-colors flex flex-col"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-lg">
                                📜
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Policy Generator</h3>
                                <p className="text-sm text-muted-foreground">Code-aware GDPR policies</p>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4">
                            Scans your actual codebase and generates a complete 8-section GDPR privacy policy that matches what your code really does. No more lawyer guesswork.
                        </p>

                        <div className="flex-1">
                            <div className="text-xs text-muted-foreground space-y-1.5">
                                <p>✓ Data Controller &amp; DPO Contact</p>
                                <p>✓ Third-Party Services (auto-detected)</p>
                                <p>✓ Cookies &amp; Tracking Technologies</p>
                                <p>✓ International Data Transfers</p>
                                <p>✓ Your Rights (Art. 15–22)</p>
                            </div>
                        </div>

                        {/* Terminal preview */}
                        <div className="mt-6 rounded-lg bg-zinc-950 border border-zinc-800 p-4 font-mono text-xs">
                            <span className="text-zinc-500">$</span>{" "}
                            <span className="text-zinc-200">etalon generate-policy ./ --company &quot;Acme&quot;</span>
                            <div className="mt-2 text-emerald-400">
                                ✓ Generated privacy-policy.md (8 sections)
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Medium Card: Live Website Scanner / Tech Fingerprinting (6 cols) ── */}
                    <motion.div
                        variants={item}
                        className="col-span-12 md:col-span-6 rounded-2xl border border-border/50 bg-card/50 p-6 md:p-8 hover:border-primary/30 transition-colors flex flex-col"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-lg">
                                ⚡
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Tech Framework Scanner</h3>
                                <p className="text-sm text-muted-foreground">Blazing fast async fingerprinting</p>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4">
                            Live website tracking via headless Chromium. Detects framework technologies, intercepts network requests, and verifies if third-party trackers are actually respecting cookie consent banners.
                        </p>

                        <div className="flex-1 text-xs text-muted-foreground space-y-2 mt-2">
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                                React, Next.js, Vue, Nuxt, Angular detection
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                                Consent banner bypass validation
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                                Headless JS execution &amp; network interception
                            </div>
                        </div>

                        {/* Terminal preview */}
                        <div className="mt-6 rounded-lg bg-zinc-950 border border-zinc-800 p-4 font-mono text-xs">
                            <span className="text-zinc-500">$</span>{" "}
                            <span className="text-zinc-200">etalon scan https://example.com</span>
                            <div className="mt-2 text-blue-400">
                                Stack: Next.js, Tailwind · Found 4 trackers (2 without consent)
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Medium Card: MCP Server (6 cols) ── */}
                    <motion.div
                        variants={item}
                        className="col-span-12 md:col-span-6 rounded-2xl border border-border/50 bg-card/50 p-6 md:p-8 hover:border-primary/30 transition-colors flex flex-col"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-lg">
                                🤖
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">AI Agent Native</h3>
                                <p className="text-sm text-muted-foreground">Model Context Protocol Server</p>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4">
                            Give your AI coding assistants (Claude Desktop, Cursor, Cline) native access to the ETALON intelligence engine. They can autonomously audit PRs and fix privacy violations.
                        </p>

                        <div className="flex-1 flex gap-3 mt-2">
                            <Badge variant="outline" className="bg-muted/50">etalon_lookup_vendor</Badge>
                            <Badge variant="outline" className="bg-muted/50">etalon_search_vendors</Badge>
                        </div>

                        {/* Terminal preview */}
                        <div className="mt-6 rounded-lg bg-zinc-950 border border-zinc-800 p-4 font-mono text-xs">
                            <div className="text-zinc-400 mb-1">Claude Code (via MCP):</div>
                            <div className="text-zinc-300">
                                &gt; &quot;I found a call to mixpanel in auth.ts. Mixpanel is an analytics tracker (High Risk) that requires consent. Shall I wrap it in a consent check?&quot;
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Small Card: 111k+ Domain Registry (full width) ── */}
                    <motion.div
                        variants={item}
                        className="col-span-12 rounded-2xl border border-border/50 bg-card/50 p-6 md:p-8 hover:border-primary/30 transition-colors"
                    >
                        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                                    🌐
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">111k+ Domain Registry</h3>
                                    <p className="text-sm text-muted-foreground">The live intelligence moat</p>
                                </div>
                            </div>

                            {/* Counters */}
                            <div className="flex flex-wrap gap-6 md:gap-10">
                                <div>
                                    <p className="text-3xl font-bold text-foreground tabular-nums">26,886</p>
                                    <p className="text-xs text-muted-foreground">Vendor Profiles</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-foreground tabular-nums">111,603</p>
                                    <p className="text-xs text-muted-foreground">Tracked Domains</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-foreground tabular-nums">23</p>
                                    <p className="text-xs text-muted-foreground">Categories</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-foreground tabular-nums">138</p>
                                    <p className="text-xs text-muted-foreground">Detection Patterns</p>
                                </div>
                            </div>
                        </div>

                        {/* Terminal preview */}
                        <div className="mt-6 rounded-lg bg-zinc-950 border border-zinc-800 p-4 font-mono text-xs">
                            <span className="text-zinc-500">$</span>{" "}
                            <span className="text-zinc-200">etalon lookup analytics.google.com</span>
                            <div className="mt-2 text-zinc-400">
                                Google Analytics · analytics · <span className="text-red-400">risk: high</span> · GDPR: consent required · DPA: available
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
