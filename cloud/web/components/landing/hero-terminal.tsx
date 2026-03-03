"use client";

import { useState } from "react";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════
   HeroTerminal — Copy CTA above, terminal below.
   Findings calibrated for a realistic A- (92/100) score:
   0 critical, 0 high, 2 medium, 1 low.
   ═══════════════════════════════════════════════════════════ */

const LINES = [
    { text: "$ etalon audit ./", style: "command" },
    { text: "", style: "blank" },
    { text: "  ● Scanning 247 files across 3 languages…", style: "muted" },
    { text: "  ● Running 6 scanners: code, schema, config, server, cname, custom", style: "muted" },
    { text: "", style: "blank" },
    { text: "  CODE       ⚠️  MEDIUM    tracker-without-consent", style: "medium" },
    { text: "                          src/tracking.ts:12 — Plausible script loaded before consent check", style: "file" },
    { text: "                          → GDPR Art. 6(1)(a)", style: "gdpr" },
    { text: "", style: "blank" },
    { text: "  CNAME      ⚠️  MEDIUM    cname-cloaking", style: "medium" },
    { text: "                          vercel.json:8 — CNAME rewrite to analytics subdomain", style: "file" },
    { text: "                          → GDPR Art. 5(1)(a)", style: "gdpr" },
    { text: "", style: "blank" },
    { text: "  CONFIG     ℹ️  LOW       cookie-samesite", style: "low" },
    { text: "                          src/auth/session.ts:45 — SameSite=Lax recommended over None", style: "file" },
    { text: "", style: "blank" },
    { text: "  ────────────────────────────────────────────────────", style: "separator" },
    { text: "  ETALON SCORE:  A-  (92/100)", style: "score" },
    { text: "  3 findings · 0 critical · 0 high · 2 medium · 1 low · 0.8s", style: "summary" },
];

function lineClass(style: string): string {
    switch (style) {
        case "command": return "text-zinc-100 font-semibold";
        case "muted": return "text-zinc-500";
        case "blank": return "h-2";
        case "critical": return "text-red-400 font-medium";
        case "high": return "text-orange-400 font-medium";
        case "medium": return "text-yellow-400 font-medium";
        case "low": return "text-blue-400 font-medium";
        case "file": return "text-zinc-500 pl-2";
        case "gdpr": return "text-blue-400/70 pl-2 text-xs";
        case "separator": return "text-zinc-700";
        case "score": return "text-emerald-400 font-bold text-base";
        case "summary": return "text-zinc-400";
        default: return "text-zinc-400";
    }
}

function InstallBar() {
    const [copied, setCopied] = useState(false);
    const cmd = "cargo install etalon-cli";

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            await navigator.clipboard.writeText(cmd);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-baseline mb-1 text-sm">
                <p className="font-semibold text-foreground">Install via Cargo</p>
                <p className="text-muted-foreground text-xs"><span className="text-zinc-500">or via npm:</span> npx etalon-cli</p>
            </div>
            <button
                onClick={handleCopy}
                className="w-full group flex items-center justify-between rounded-xl px-5 py-3.5 bg-zinc-900 border border-zinc-800 hover:border-[#1a6b7a]/50 transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-mono text-sm select-none">$</span>
                    <code className="font-mono text-sm text-zinc-100">{cmd}</code>
                </div>
                {copied ? (
                    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                )}
            </button>
        </div>
    );
}

export function HeroTerminal() {
    return (
        <div className="flex flex-col gap-4">
            {/* Install CTA — above terminal, full width */}
            <InstallBar />

            {/* Terminal */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-950 shadow-2xl shadow-black/20 overflow-hidden">
                {/* Terminal chrome */}
                <div className="flex items-center border-b border-zinc-800 bg-zinc-900/80">
                    <div className="flex gap-1.5 px-4 py-3">
                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-zinc-500 text-xs font-mono ml-2">etalon audit</span>
                    <div className="flex-1" />
                    <span className="text-zinc-600 text-xs font-mono pr-4">zsh</span>
                </div>

                {/* Terminal body */}
                <div className="p-5 font-mono text-[13px] leading-relaxed text-left min-h-[320px]">
                    {LINES.map((line, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.04, duration: 0.15 }}
                            className={lineClass(line.style)}
                        >
                            {line.text || "\u00A0"}
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
