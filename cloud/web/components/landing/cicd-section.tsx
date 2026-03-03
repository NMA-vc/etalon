"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

/* ═══════════════════════════════════════════════════════════
   CI/CD Section — GitHub Action showcase
   Shows mock PR comment and YAML config snippet
   ═══════════════════════════════════════════════════════════ */

export function CiCdSection() {
    return (
        <section className="py-24 border-t border-border/40 bg-muted/5">
            <div className="mx-auto max-w-6xl px-6">
                <div className="text-center mb-16">
                    <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                        CI/CD Integration
                    </Badge>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                        Compliance gates in{" "}
                        <span className="text-[#1a6b7a]">every pull request</span>
                    </h2>
                    <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
                        Fail builds on high-severity findings and auto-comment on PRs. No tracker ships without review.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                    {/* Mock PR Comment */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.4 }}
                        className="rounded-xl border border-border/50 bg-card overflow-hidden"
                    >
                        {/* PR header */}
                        <div className="px-5 py-3 border-b border-border/40 bg-muted/30 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <svg className="w-4 h-4 text-primary" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-semibold">etalon-bot</p>
                                <p className="text-xs text-muted-foreground">commented on PR #42</p>
                            </div>
                            <Badge variant="outline" className="ml-auto text-xs border-primary/30 text-primary">
                                bot
                            </Badge>
                        </div>

                        {/* Comment body */}
                        <div className="p-5 text-sm space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🛡️</span>
                                <span className="font-bold">ETALON Privacy Audit</span>
                            </div>

                            <div className="rounded-lg border border-border/40 overflow-hidden">
                                <div className="grid grid-cols-4 gap-px bg-border/30">
                                    <div className="bg-card p-3 text-center">
                                        <p className="text-2xl font-bold text-foreground">B+</p>
                                        <p className="text-xs text-muted-foreground">Grade</p>
                                    </div>
                                    <div className="bg-card p-3 text-center">
                                        <p className="text-2xl font-bold text-red-500">1</p>
                                        <p className="text-xs text-muted-foreground">Critical</p>
                                    </div>
                                    <div className="bg-card p-3 text-center">
                                        <p className="text-2xl font-bold text-orange-500">2</p>
                                        <p className="text-xs text-muted-foreground">High</p>
                                    </div>
                                    <div className="bg-card p-3 text-center">
                                        <p className="text-2xl font-bold text-yellow-500">3</p>
                                        <p className="text-xs text-muted-foreground">Medium</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div className="flex items-start gap-2 text-red-600">
                                    <span>❌</span>
                                    <div>
                                        <p className="font-medium">CRITICAL: Tracker without consent</p>
                                        <p className="text-muted-foreground">
                                            <code className="bg-muted px-1 rounded">src/analytics.ts:15</code> — Google Analytics loaded before consent
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 text-orange-600">
                                    <span>⚠️</span>
                                    <div>
                                        <p className="font-medium">HIGH: Insecure cookie configuration</p>
                                        <p className="text-muted-foreground">
                                            <code className="bg-muted px-1 rounded">src/auth.ts:32</code> — Missing SameSite attribute
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-border/40 text-xs text-muted-foreground flex items-center gap-2">
                                <span className="text-red-500 font-medium">❌ Build failed</span>
                                <span>— 1 critical finding exceeds threshold</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* YAML Config */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                        className="flex flex-col gap-6"
                    >
                        {/* GitHub Action YAML */}
                        <div className="rounded-xl border border-border/50 bg-zinc-950 overflow-hidden flex-1">
                            <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center gap-2">
                                <svg className="w-4 h-4 text-zinc-500" viewBox="0 0 16 16" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                                </svg>
                                <span className="font-mono text-xs text-zinc-400">.github/workflows/etalon.yml</span>
                            </div>
                            <div className="p-5 font-mono text-[13px] leading-relaxed">
                                <div className="text-purple-400">name: <span className="text-zinc-200">Privacy Audit</span></div>
                                <div className="text-purple-400 mt-1">on: <span className="text-zinc-400">[pull_request]</span></div>
                                <div className="mt-3 text-purple-400">jobs:</div>
                                <div className="text-purple-400 pl-4">audit:</div>
                                <div className="text-purple-400 pl-8">runs-on: <span className="text-zinc-200">ubuntu-latest</span></div>
                                <div className="text-purple-400 pl-8">steps:</div>
                                <div className="text-zinc-400 pl-10">- uses: <span className="text-zinc-200">actions/checkout@v4</span></div>
                                <div className="text-zinc-400 pl-10 mt-2">- name: <span className="text-emerald-400">Privacy audit</span></div>
                                <div className="text-zinc-400 pl-12">uses: <span className="text-cyan-400">etalon/action@v1</span></div>
                                <div className="text-zinc-400 pl-12">with:</div>
                                <div className="text-zinc-400 pl-14">fail-on: <span className="text-amber-400">&apos;high&apos;</span></div>
                                <div className="text-zinc-400 pl-14">comment-pr: <span className="text-amber-400">&apos;true&apos;</span></div>
                                <div className="text-zinc-400 pl-14">github-token: <span className="text-zinc-500">{"${{ github.token }}"}</span></div>
                            </div>
                        </div>

                        {/* Callouts */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-border/50 bg-card/50 p-4 text-center">
                                <p className="text-2xl font-bold text-foreground">SARIF</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    GitHub Security tab integration
                                </p>
                            </div>
                            <div className="rounded-xl border border-border/50 bg-card/50 p-4 text-center">
                                <p className="text-2xl font-bold text-foreground">Pre-Commit</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Block violations before push
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
