import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { HeroTerminal } from "@/components/landing/hero-terminal";
import { BentoGrid } from "@/components/landing/bento-grid";

/* ═══════════════════════════════════════════════════════════
   ETALON · Landing Page — "De-Cluttered" Redesign
   Hero → Bento Grid → Trust Center → Pricing
   ═══════════════════════════════════════════════════════════ */

// ── Inline SVG Icons ──────────────────────────────────────
function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconMinus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <BentoGrid />
      <Footer />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// HERO
// ══════════════════════════════════════════════════════════════
function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-6 md:pt-40 md:pb-10">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[rgb(26,107,122)] opacity-[0.06] blur-[120px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Status badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-sm">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-muted-foreground">Open-source · Rust-native CLI · MCP server for AI agents</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] text-zinc-900">
          Privacy Engineering for
          <br />
          <span className="text-[#1a6b7a]">AI Agents</span> & Developers
        </h1>

        <p className="mx-auto mt-6 max-w-3xl text-center text-lg md:text-xl text-muted-foreground leading-relaxed">
          Audit code, scan websites, detect{" "}
          <strong className="text-zinc-800">111k+ trackers</strong>, map data flows, and generate GDPR policies — in one command.
        </p>

        {/* Hero Terminal */}
        <div className="mt-12 max-w-4xl mx-auto">
          <HeroTerminal />
        </div>
      </div>
    </section>
  );
}


