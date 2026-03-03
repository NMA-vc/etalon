"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/dashboard/score-ring";

/* ═══════════════════════════════════════════════════════════
   Trust Center Preview — The Cloud Outcome
   High-fidelity preview of /trust/[slug] in a browser frame
   Conversion: "From Terminal to Trust"
   ═══════════════════════════════════════════════════════════ */

const mockVendors = [

    { name: "AWS", category: "infrastructure", gdpr: true, risk: 1 },
    { name: "Plausible", category: "analytics", gdpr: true, risk: 1 },
    { name: "Resend", category: "email", gdpr: true, risk: 2 },
    { name: "Vercel", category: "infrastructure", gdpr: true, risk: 1 },
    { name: "Sentry", category: "error_tracking", gdpr: true, risk: 2 },
];

const riskColor = (risk: number) => {
    if (risk <= 1) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (risk <= 3) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
};

export function TrustCenterPreview() {
    return (
        <section className="py-24">
            <div className="mx-auto max-w-6xl px-6">
                <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                    Continuous Monitoring
                </Badge>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                    From Audit to{" "}
                    <span className="text-[#1a6b7a]">Artifact</span>
                </h2>
                <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
                    Generate public, verifiable compliance reports. Shareable proof that your privacy practices are real.
                </p>
            </div>

            {/* Browser frame preview */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl mx-auto"
            >
                <div className="rounded-xl border border-border/50 bg-card shadow-xl overflow-hidden">
                    {/* Browser chrome */}
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-muted/30">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400/60" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                            <div className="w-3 h-3 rounded-full bg-green-400/60" />
                        </div>
                        <div className="flex-1 mx-4">
                            <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-1.5 text-xs text-muted-foreground font-mono max-w-md mx-auto">
                                <svg className="w-3 h-3 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                etalon.nma.vc/trust/acme-inc
                            </div>
                        </div>
                    </div>

                    {/* Trust Center content */}
                    <div className="p-6 md:p-10">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 mb-10">
                            <ScoreRing score={97} grade="A" size={120} strokeWidth={8} />
                            <div className="text-center md:text-left">
                                <h3 className="text-2xl font-bold">Acme Inc</h3>
                                <p className="text-muted-foreground mt-1">Privacy Trust Center</p>
                                <div className="flex items-center gap-2 mt-3 justify-center md:justify-start">
                                    <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/10">
                                        GDPR Compliant
                                    </Badge>
                                    <Badge variant="outline" className="border-primary/30 text-primary">
                                        Score: 97/100
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Vendor grid */}
                        <div>
                            <h4 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
                                Third-Party Services ({mockVendors.length})
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {mockVendors.map((vendor) => (
                                    <div
                                        key={vendor.name}
                                        className="rounded-lg border border-border/40 bg-muted/20 p-3 flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">{vendor.name}</p>
                                            <p className="text-xs text-muted-foreground">{vendor.category}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${riskColor(vendor.risk)}`}>
                                            {vendor.gdpr ? "✓ GDPR" : "⚠ Review"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Last scan */}
                        <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Last scan: Feb 14, 2026 · 09:30 AM</span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Monitored daily
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
