import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SkillsSection } from "@/components/skills-section";
import { AIFeatures } from "@/components/ai-features";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { InstallSteps, InstallCommand } from "@/components/install-steps";

/* ═══════════════════════════════════════════════════════════
   ETALON · Landing Page — "Secure Clarity" Design
   Professional GDPR scanner with teal brand identity (#1a6b7a)
   ═══════════════════════════════════════════════════════════ */

// ── SVG Icons (inline for zero-dep) ──────────────────────
function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconScan({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  );
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconCode({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function IconAlertTriangle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function IconGlobe({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

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

function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}


// ── Page ──────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <SkillsSection />
      <AIFeatures />
      <ValueProp />
      <CommandsGrid />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}


// ════════════════════════════════════════════════════════════
// HERO
// ════════════════════════════════════════════════════════════
function HeroTerminalTabs() {
  const tabs = [
    {
      id: "audit",
      label: "Code Audit",
      content: (
        <>
          <div className="text-emerald-400">$</div>
          <div className="flex-1">
            <span className="text-zinc-100">npx etalon audit ./</span>
            <div className="mt-3 text-zinc-400">
              <p>Scanning 247 files...</p>
              <p className="mt-2 text-red-400">❌ CRITICAL: Google Analytics without consent</p>
              <p className="text-zinc-500 ml-4">src/tracking.ts:12</p>
              <p className="mt-2 text-orange-400">❌ HIGH: Insecure cookie (missing httpOnly)</p>
              <p className="text-zinc-500 ml-4">src/auth/session.ts:45</p>
              <p className="mt-2 text-yellow-400">⚠️  MEDIUM: PII field without encryption</p>
              <p className="text-zinc-500 ml-4">prisma/schema.prisma:23</p>
              <p className="mt-4 text-zinc-400">Found 3 violations in 0.8s</p>
            </div>
          </div>
        </>
      ),
    },
    {
      id: "policy",
      label: "Auto-Generate Policy",
      content: (
        <>
          <div className="text-emerald-400">$</div>
          <div className="flex-1">
            <span className="text-zinc-100">npx etalon generate-policy ./ \</span>
            <br />
            <span className="text-zinc-100 ml-4">--company &quot;Acme Inc&quot; \</span>
            <br />
            <span className="text-zinc-100 ml-4">--email privacy@acme.com</span>
            <div className="mt-3 text-zinc-400">
              <p>Scanning codebase...</p>
              <p>Analyzing data flows...</p>
              <p>Detecting third-party services...</p>
              <p className="mt-2 text-emerald-400">✅ Generated 8-section GDPR privacy policy</p>
              <p className="text-zinc-500 ml-4">→ privacy-policy.md (2,847 words)</p>
              <p className="mt-2 text-zinc-400">Sections included:</p>
              <p className="text-emerald-400 ml-2">  ✓ Data Controller</p>
              <p className="text-emerald-400 ml-2">  ✓ Data Collection</p>
              <p className="text-emerald-400 ml-2">  ✓ Third-Party Services (5 vendors)</p>
              <p className="text-emerald-400 ml-2">  ✓ Cookies &amp; Tracking</p>
              <p className="text-emerald-400 ml-2">  ✓ International Transfers</p>
              <p className="text-emerald-400 ml-2">  ✓ Data Retention</p>
              <p className="text-emerald-400 ml-2">  ✓ GDPR Rights (Art. 15-22)</p>
              <p className="text-emerald-400 ml-2">  ✓ Contact Information</p>
              <p className="mt-2 text-zinc-300">Ready to publish. No lawyer needed.</p>
            </div>
          </div>
        </>
      ),
    },
    {
      id: "scan",
      label: "Network Scan",
      content: (
        <>
          <div className="text-emerald-400">$</div>
          <div className="flex-1">
            <span className="text-zinc-100">npx etalon scan https://acme.com --deep</span>
            <div className="mt-3 text-zinc-400">
              <p>Launching browser...</p>
              <p>Analyzing network traffic...</p>
              <p className="mt-2">Found 7 third-party trackers:</p>
              <p className="text-red-400 ml-2">  ❌ Google Analytics (analytics.google.com)</p>
              <p className="text-red-400 ml-2">  ❌ Facebook Pixel (facebook.com/tr)</p>
              <p className="text-red-400 ml-2">  ❌ Hotjar (script.hotjar.com)</p>
              <p className="text-orange-400 ml-2">  ⚠️  Intercom (widget.intercom.io)</p>
              <p className="text-orange-400 ml-2">  ⚠️  Cloudflare (cloudflare.com) — CDN</p>
              <p className="text-emerald-400 ml-2">  ✓  Plausible (plausible.io) — Privacy-friendly</p>
              <p className="text-emerald-400 ml-2">  ✓  Google Fonts (fonts.googleapis.com)</p>
              <p className="mt-2 text-zinc-300">4 require GDPR consent</p>
              <p className="text-zinc-400">Scan completed in 8.3s</p>
            </div>
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="rounded-xl border border-border/60 bg-zinc-950 shadow-2xl shadow-black/40 overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center border-b border-zinc-800 bg-zinc-900/80">
        <div className="flex gap-1.5 px-4 py-3">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            className={`px-4 py-3 text-xs font-mono transition-colors ${i === 0
              ? "text-zinc-100 bg-zinc-800/50 border-b-2 border-primary"
              : "text-zinc-500 hover:text-zinc-300"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Terminal body — show first tab */}
      <div className="p-5 font-mono text-sm leading-relaxed text-left flex items-start gap-2 min-h-[280px]">
        {tabs[0].content}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-10 md:pt-40 md:pb-16">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[rgb(26,107,122)] opacity-[0.06] blur-[120px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-sm">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-muted-foreground">AI-native privacy compliance · 10 commands · MCP server</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] text-zinc-900 dark:text-zinc-50">
          Privacy audit tool built for
          <br />
          AI coding agents
        </h1>
        <p className="text-2xl sm:text-3xl md:text-4xl font-bold mt-3 text-zinc-500 dark:text-zinc-400">
          (and developers)
        </p>

        <p className="mx-auto mt-6 max-w-3xl text-lg md:text-xl text-muted-foreground leading-relaxed">
          Free CLI for GDPR compliance.
          <br className="hidden md:block" />
          Built for <strong className="text-zinc-800 dark:text-zinc-200">Claude Code</strong>, <strong className="text-zinc-800 dark:text-zinc-200">Cursor</strong>, <strong className="text-zinc-800 dark:text-zinc-200">Antigravity</strong>, and AI workflows.
        </p>

        {/* Two-step install (Main Action) */}
        <InstallSteps />
      </div>
    </section>
  );
}


// ════════════════════════════════════════════════════════════
// VALUE PROPOSITION (Why ETALON)
// ════════════════════════════════════════════════════════════
function ValueProp() {
  return (
    <section className="py-24 border-y border-border/40 bg-muted/5">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">Why ETALON</Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Stop paying $15K/year for GDPR compliance
          </h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
            ETALON replaces expensive enterprise tools and legal consultants with free, open-source automation
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          {/* OneTrust */}
          <Card className="bg-card/50 border-border/40 p-8">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-2xl font-bold mb-4">OneTrust</h3>
            <p className="text-3xl font-bold text-red-500 mb-6">$5,000+/year</p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="text-red-500">✗</span> Scans websites (after deployment)</li>
              <li className="flex gap-2"><span className="text-red-500">✗</span> No code analysis</li>
              <li className="flex gap-2"><span className="text-red-500">✗</span> No policy generation</li>
              <li className="flex gap-2"><span className="text-red-500">✗</span> No consent testing</li>
              <li className="flex gap-2"><span className="text-red-500">✗</span> Enterprise-only pricing</li>
            </ul>
          </Card>

          {/* Manual */}
          <Card className="bg-card/50 border-border/40 p-8">
            <div className="text-4xl mb-4">⏰</div>
            <h3 className="text-2xl font-bold mb-4">Manual Audits</h3>
            <p className="text-3xl font-bold text-orange-500 mb-6">Weeks of work</p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="text-orange-500">⚠️</span> Developer code review</li>
              <li className="flex gap-2"><span className="text-orange-500">⚠️</span> Lawyer privacy policy drafts ($10K)</li>
              <li className="flex gap-2"><span className="text-orange-500">⚠️</span> Manual tracker inventory</li>
              <li className="flex gap-2"><span className="text-orange-500">⚠️</span> No automation</li>
              <li className="flex gap-2"><span className="text-orange-500">⚠️</span> Human error</li>
            </ul>
          </Card>

          {/* ETALON */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary p-8">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-2xl font-bold mb-4">ETALON</h3>
            <p className="text-3xl font-bold text-emerald-500 mb-6">$0/year forever</p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="text-emerald-500">✓</span> Code + network scanning</li>
              <li className="flex gap-2"><span className="text-emerald-500">✓</span> Auto-generate policies</li>
              <li className="flex gap-2"><span className="text-emerald-500">✓</span> Test consent flows</li>
              <li className="flex gap-2"><span className="text-emerald-500">✓</span> Policy vs reality check</li>
              <li className="flex gap-2"><span className="text-emerald-500">✓</span> Setup in 5 minutes</li>
            </ul>
          </Card>
        </div>

        {/* Cost breakdown */}
        <Card className="bg-card/50 border-border/40 p-8 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold mb-6 text-center">Cost Comparison</h3>
          <div className="space-y-3 mb-6 font-mono text-sm">
            <div className="text-muted-foreground">Traditional GDPR Compliance:</div>
            <div className="pl-4 space-y-1 text-muted-foreground">
              <div className="flex justify-between"><span>├─ OneTrust subscription</span><span>$5,000/year</span></div>
              <div className="flex justify-between"><span>├─ Legal consultant (policy)</span><span>$10,000</span></div>
              <div className="flex justify-between"><span>├─ Developer time (audits)</span><span>$8,000</span></div>
              <div className="flex justify-between pt-2 border-t border-border/40 font-bold text-red-500"><span>└─ Total:</span><span>$23,000/year</span></div>
            </div>
          </div>
          <div className="space-y-3 font-mono text-sm">
            <div className="text-muted-foreground">ETALON:</div>
            <div className="pl-4 space-y-1 text-muted-foreground">
              <div className="flex justify-between"><span>├─ Installation</span><span>Free</span></div>
              <div className="flex justify-between"><span>├─ Usage</span><span>Free</span></div>
              <div className="flex justify-between"><span>├─ Updates</span><span>Free</span></div>
              <div className="flex justify-between pt-2 border-t border-border/40 font-bold text-emerald-500"><span>└─ Total:</span><span>$0 forever</span></div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-border/40 text-center">
            <p className="text-2xl font-bold text-primary">ROI: ∞</p>
          </div>
        </Card>

        <div className="text-center mt-12">
          <a
            href="#get-started"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-lg bg-primary text-primary-foreground font-semibold text-base shadow-lg shadow-primary/20 dark:shadow-[0_0_20px_rgb(26_107_122/0.3)] transition-all"
          >
            Get Started Free — No credit card. No account. Just code.
          </a>
        </div>
      </div>
    </section>
  );
}


// ════════════════════════════════════════════════════════════
// THE 10 COMMANDS
// ════════════════════════════════════════════════════════════
function CommandsGrid() {
  const commands = [
    {
      icon: "🔍", title: "Code Audit", name: "etalon audit",
      description: "Scan your codebase for privacy violations. Detects tracker SDKs, PII in schemas, insecure cookies, and security config issues.",
      command: "$ etalon audit ./",
      features: ["JavaScript, TypeScript, Python, Rust", "6 ORM formats", "175+ vendors"],
    },
    {
      icon: "🌐", title: "Network Scanner", name: "etalon scan",
      description: "Launch headless browser and intercept all network requests to identify third-party trackers.",
      command: "$ etalon scan https://yoursite.com --deep",
      features: ["Live website testing", "Consent dialog interaction", "SARIF output"],
    },
    {
      icon: "🍪", title: "Consent Testing", name: "etalon consent-check",
      description: "Test if trackers fire before consent and after rejecting cookies. Catch GDPR violations.",
      command: "$ etalon consent-check https://yoursite.com",
      features: ["Auto-detects cookie banners", "Clicks \"reject\" button", "Validates compliance"],
      badge: "Unique",
    },
    {
      icon: "📄", title: "Policy vs Reality", name: "etalon policy-check",
      description: "Cross-reference your privacy policy against actual trackers detected. Find undisclosed vendors.",
      command: "$ etalon policy-check https://yoursite.com",
      features: ["Auto-discovers privacy policy", "Finds discrepancies", "Generates disclosure snippets"],
      badge: "Unique",
    },
    {
      icon: "📝", title: "Auto-Generate Policy", name: "etalon generate-policy",
      description: "Create a complete 8-section GDPR privacy policy from your actual code and trackers.",
      command: "$ etalon generate-policy ./ --company \"Acme\"",
      features: ["No lawyer needed", "Production-ready", "MD/HTML/TXT output"],
      badge: "Killer Feature",
      highlight: true,
    },
    {
      icon: "🗺️", title: "Data Flow Mapper", name: "etalon data-flow",
      description: "Map how PII flows through your app: sources → storage → sinks.",
      command: "$ etalon data-flow ./ --format mermaid",
      features: ["Mermaid diagrams", "Text summaries", "JSON export"],
      badge: "Unique",
    },
    {
      icon: "🔧", title: "Project Setup", name: "etalon init",
      description: "Add ETALON to your project: config, CI/CD, and pre-commit hooks.",
      command: "$ etalon init ./ --ci github",
      features: ["GitHub Actions", "GitLab CI", "Pre-commit hooks"],
    },
    {
      icon: "🔎", title: "Vendor Lookup", name: "etalon lookup",
      description: "Look up any domain in ETALON's vendor database. Get full metadata.",
      command: "$ etalon lookup analytics.google.com",
      features: ["175+ vendors", "475+ domains", "Risk scores + GDPR info"],
    },
    {
      icon: "🏅", title: "Compliance Badge", name: "etalon badge",
      description: "Generate SVG compliance badge for your README. Show your privacy grade.",
      command: "$ etalon badge ./",
      features: ["A-F grading", "Score (0-100)", "SVG output"],
    },
    {
      icon: "ℹ️", title: "Registry Stats", name: "etalon info",
      description: "Show ETALON vendor registry metadata.",
      command: "$ etalon info",
      features: ["Vendor count", "Domain count", "Last updated"],
    },
  ];

  return (
    <section id="commands" className="pt-24 pb-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">10 Commands</Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            All 10 commands for AI agents and developers
          </h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
            Every command works in terminal or via AI agent API
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto mb-12">
          {commands.map((cmd) => (
            <Card
              key={cmd.name}
              className={`relative group bg-card/50 p-6 transition-all duration-200 ${cmd.highlight
                ? "border-2 border-primary bg-gradient-to-br from-primary/10 to-transparent"
                : "border-border/40 hover:border-primary/30"
                }`}
            >
              {cmd.badge && (
                <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold ${cmd.highlight
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
                  }`}>
                  {cmd.badge}
                </span>
              )}

              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-lg text-xl ${cmd.highlight ? "bg-primary/10" : "bg-muted"
                  }`}>
                  {cmd.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold mb-1">{cmd.title}</h3>
                  <p className="text-sm text-muted-foreground">{cmd.description}</p>
                </div>
              </div>

              <div className="bg-zinc-950 rounded p-3 mb-4 font-mono text-sm text-zinc-100">
                {cmd.command}
              </div>

              <ul className="space-y-1">
                {cmd.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-6">
            All commands work locally. No cloud dependencies.
            <br />
            Your code never leaves your machine.
          </p>
          <a
            href="https://github.com/NMA-vc/etalon#readme"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-lg border-2 border-zinc-700 hover:border-zinc-600 font-semibold text-base transition-colors"
          >
            View Full Documentation
          </a>
        </div>
      </div>
    </section>
  );
}


// ════════════════════════════════════════════════════════════
// PRICING
// ════════════════════════════════════════════════════════════
function Pricing() {
  const plans = [
    {
      name: "Open Source",
      price: "Free",
      period: "forever",
      description: "For developers who want to run scans locally.",
      features: [
        { text: "CLI scanner", included: true },
        { text: "10 cloud scans / month", included: true },
        { text: "3 monitored sites", included: true },
        { text: "50+ tracker database", included: true },
        { text: "Email alerts", included: false },
        { text: "API access", included: false },
        { text: "Scheduled scans", included: false },
      ],
      cta: "Start now!",
      variant: "outline" as const,
      highlighted: false,
    },
    {
      name: "Cloud",
      price: "€29",
      period: "/ month",
      description: "For teams monitoring production websites.",
      features: [
        { text: "Everything in Free", included: true },
        { text: "100 cloud scans / month", included: true },
        { text: "20 monitored sites", included: true },
        { text: "Email alerts", included: true },
        { text: "API access", included: true },
        { text: "Scheduled daily scans", included: true },
        { text: "Priority support", included: false },
      ],
      cta: "Start now!",
      variant: "default" as const,
      highlighted: true,
    },
    {
      name: "Pro",
      price: "€99",
      period: "/ month",
      description: "For organizations with strict compliance needs.",
      features: [
        { text: "Everything in Cloud", included: true },
        { text: "1,000 cloud scans / month", included: true },
        { text: "Unlimited sites", included: true },
        { text: "Webhook integrations", included: true },
        { text: "Custom scan schedules", included: true },
        { text: "Team management", included: true },
        { text: "Priority support", included: true },
      ],
      cta: "Start now!",
      variant: "outline" as const,
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="pt-8 pb-24 border-t border-border/40">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">Pricing</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Start free with the CLI. Upgrade for hosted scanning, monitoring, and team features.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col bg-card/50 ${plan.highlighted
                ? "border-primary/50 shadow-lg shadow-primary/5"
                : "border-border/40"
                }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground shadow-md">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <Separator className="mb-6" />
                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-3 text-sm">
                      {f.included ? (
                        <IconCheck className="w-4 h-4 text-primary shrink-0" />
                      ) : (
                        <IconMinus className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={f.included ? "" : "text-muted-foreground/60"}>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-4">
                <Link href="/login" className="w-full">
                  <Button variant={plan.variant} className="w-full" size="lg">
                    {plan.cta}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}


// ════════════════════════════════════════════════════════════
// FAQ
// ════════════════════════════════════════════════════════════
function FAQ() {
  const faqs = [
    {
      q: "What does ETALON detect?",
      a: "ETALON identifies 175+ known tracking vendors across 475+ domains, including Google Analytics, Facebook Pixel, Hotjar, TikTok, LinkedIn, and more. It scans both your codebase (tracker SDKs, PII, insecure cookies) and live website (network requests, consent flows). Unknown third-party domains are also flagged.",
    },
    {
      q: "How is this different from OneTrust or CookieBot?",
      a: "ETALON is open-source, free, and does far more: code auditing, policy generation, consent testing, data flow mapping, and policy-vs-reality checking. Traditional tools only scan deployed websites and cost $5K+/year. ETALON catches issues before deployment and generates your privacy policy automatically.",
    },
    {
      q: "Can ETALON really generate my privacy policy?",
      a: "Yes. The generate-policy command analyzes your codebase, detects third-party services, maps data flows, and produces a complete 8-section GDPR-compliant privacy policy. Output in Markdown, HTML, or plain text. It replaces $10K+ in legal consulting fees.",
    },
    {
      q: "Is my data safe?",
      a: "The CLI runs entirely on your machine — no data is sent anywhere. All 10 commands work locally with zero cloud dependencies. Your code never leaves your machine.",
    },
    {
      q: "How do I add ETALON to CI/CD?",
      a: "Run `etalon init ./ --ci github` to auto-generate GitHub Actions workflows with fail conditions. Also supports GitLab CI and pre-commit hooks. Break the build on critical violations.",
    },
  ];

  return (
    <section className="py-24 border-t border-border/40 bg-muted/5">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">FAQ</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Frequently asked questions
          </h2>
        </div>

        <div className="space-y-6">
          {faqs.map((faq) => (
            <div key={faq.q} className="rounded-xl border border-border/40 bg-card/30 p-6">
              <h3 className="font-semibold mb-2">{faq.q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


// ════════════════════════════════════════════════════════════
// CTA
// ════════════════════════════════════════════════════════════
function CTA() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/5 via-transparent to-transparent p-12 md:p-16 text-center overflow-hidden">
          {/* Glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary opacity-[0.06] blur-[80px] rounded-full" />
          </div>

          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Ready to replace $23K in<br />compliance costs?
            </h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto mb-8">
              Install in 30 seconds. 10 commands. Complete GDPR coverage. No credit card required.
            </p>
            <InstallCommand label="Install the CLI" command="npm install -g @etalon/cli" />
          </div>
        </div>
      </div>
    </section>
  );
}


// ════════════════════════════════════════════════════════════
// FOOTER
// ════════════════════════════════════════════════════════════
