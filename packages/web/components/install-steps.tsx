"use client";

import { useState } from "react";

const COMMANDS = {
    step1: "npm install -g @etalon/cli",
    step2: "etalon audit ./",
};

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    function handleCopy() {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <button
            onClick={handleCopy}
            className="flex-shrink-0 p-2 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Copy to clipboard"
            title="Copy to clipboard"
        >
            {copied ? (
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            )}
        </button>
    );
}

export function InstallCommand({ label, command, light = false }: { label?: string, command: string, light?: boolean }) {
    return (
        <div className="w-full max-w-xl mx-auto">
            {label && <p className="text-sm text-muted-foreground mb-2 font-medium text-center md:text-left">{label}</p>}
            <div className={`flex items-center gap-3 rounded-lg px-4 py-3 border text-left ${light ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'}`}>
                <span className="text-emerald-400 font-mono text-sm select-none flex-shrink-0">$</span>
                <code className={`flex-1 font-mono text-sm overflow-x-auto ${light ? 'text-zinc-800' : 'text-zinc-100'}`}>
                    {command}
                </code>
                <CopyButton text={command} />
            </div>
        </div>
    );
}

function TerminalPreview() {
    return (
        <div className="mt-8 rounded-xl border border-zinc-200 dark:border-border/60 bg-zinc-950 shadow-2xl shadow-black/20 dark:shadow-black/40 overflow-hidden text-left mx-auto max-w-3xl">
            {/* Tab bar */}
            <div className="flex items-center border-b border-zinc-800 bg-zinc-900/80">
                <div className="flex gap-1.5 px-4 py-3">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-zinc-500 text-xs font-mono ml-2">terminal — AI agent can run this</span>
            </div>
            {/* Terminal body */}
            <div className="p-5 font-mono text-sm leading-relaxed min-h-[260px]">
                <div className="flex gap-2 mb-1">
                    <span className="text-emerald-400">$</span>
                    <span className="text-zinc-100">npx etalon audit ./ --format json</span>
                </div>
                <div className="mt-4 text-zinc-400">
                    <p className="text-blue-400">// Machine-readable output for AI agents</p>
                    <p className="mt-2 text-zinc-300">{'{"violations": ['}</p>
                    <p className="text-zinc-300 ml-4">{'{"severity": "critical", "rule": "tracker-without-consent", "file": "src/tracking.ts:12"},'}</p>
                    <p className="text-zinc-300 ml-4">{'{"severity": "high", "rule": "insecure-cookie", "file": "src/auth/session.ts:45"},'}</p>
                    <p className="text-zinc-300 ml-4">{'{"severity": "medium", "rule": "pii-without-encryption", "file": "prisma/schema.prisma:23"}'}</p>
                    <p className="text-zinc-300">{']}'}</p>
                    <p className="mt-4 text-emerald-400">✓ AI agent can parse, prioritize, and auto-fix</p>
                </div>
            </div>
        </div>
    );
}

export function InstallSteps() {
    return (
        <div className="mt-14 w-full">
            <h3 className="text-center text-2xl md:text-3xl font-bold tracking-tight mb-2">
                Two steps. That&apos;s it.
            </h3>
            <p className="text-center text-muted-foreground mb-8 text-lg">
                Install the CLI and run audits from Claude Code, Cursor, or any AI agent.
            </p>

            <div className="space-y-6 max-w-2xl mx-auto">
                <InstallCommand label="1. Install the CLI" command={COMMANDS.step1} />
                <InstallCommand label="2. Run in your project" command={COMMANDS.step2} />
            </div>

            <TerminalPreview />

            <p className="text-center text-muted-foreground text-sm mt-8">
                ...and watch it work.
            </p>
        </div>
    );
}
