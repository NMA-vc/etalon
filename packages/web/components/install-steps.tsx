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

export function InstallSteps() {
    return (
        <div className="mt-14 max-w-2xl mx-auto">
            <h3 className="text-center text-2xl md:text-3xl font-bold tracking-tight mb-2">
                Two steps. That&apos;s it.
            </h3>
            <p className="text-center text-muted-foreground mb-8">
                Install the CLI and run audits from Claude Code, Cursor, or any AI agent.
            </p>

            <div className="space-y-5">
                {/* Step 1 */}
                <div>
                    <p className="text-sm text-muted-foreground mb-2 font-medium">1. Install the CLI</p>
                    <div className="flex items-center gap-3 bg-zinc-900 rounded-lg px-4 py-3 border border-zinc-800 text-left">
                        <span className="text-emerald-400 font-mono text-sm select-none flex-shrink-0">$</span>
                        <code className="flex-1 text-zinc-100 font-mono text-sm overflow-x-auto">
                            {COMMANDS.step1}
                        </code>
                        <CopyButton text={COMMANDS.step1} />
                    </div>
                </div>

                {/* Step 2 */}
                <div>
                    <p className="text-sm text-muted-foreground mb-2 font-medium">2. Run in your project</p>
                    <div className="flex items-center gap-3 bg-zinc-900 rounded-lg px-4 py-3 border border-zinc-800 text-left">
                        <span className="text-emerald-400 font-mono text-sm select-none flex-shrink-0">$</span>
                        <code className="flex-1 text-zinc-100 font-mono text-sm overflow-x-auto">
                            {COMMANDS.step2}
                        </code>
                        <CopyButton text={COMMANDS.step2} />
                    </div>
                </div>
            </div>

            <p className="text-center text-muted-foreground text-sm mt-6">
                ...and watch it work.
            </p>
        </div>
    );
}
