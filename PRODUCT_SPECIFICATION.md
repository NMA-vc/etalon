# ETALON — Product Specification Artifact

> *Derived from a full codebase deep-dive. February 2026.*

---

## 1. Core Value Proposition

### The Single Most Important Problem ETALON Solves

**GDPR compliance is manual, expensive, and instantly outdated.**

Every time a developer runs `npm install some-analytics-sdk` or a marketing team adds a new tracking pixel, the company's privacy posture silently degrades. Lawyers charge €5K–€15K for a single compliance audit that becomes stale the moment new code is deployed.

**ETALON automates the entire GDPR/CCPA privacy compliance lifecycle — from detection to remediation to documentation — in seconds, not months.**

It is the first privacy audit tool **built for AI coding agents** (Claude Code, Cursor, Antigravity, Windsurf, Cline, Aider) while remaining fully usable by human developers. A single CLI command (`etalon audit ./`) replaces an entire compliance team's manual review process.

### One-Liner

> **"GDPR compliance on autopilot. Scan, fix, and certify — before your next deploy."**

---

## 2. Technical Deep-Dive

### How the Three Core Commands Work

#### `etalon scan <url>` — Network Tracker Scanner

**Under the hood:**
1. Launches a headless Chromium browser via **Playwright**
2. Navigates to the target URL and **intercepts all network requests** in real-time
3. Extracts domains from each request
4. Looks up each domain against the **VendorRegistry** — an O(1) HashMap built from 111,603 domain→vendor mappings
5. Classifies every third-party request as either **Detected Vendor** (with full metadata: risk score, category, GDPR status, DPA URL) or **Unknown Domain** (flagged for investigation)
6. Deep scan mode: scrolls the page, interacts with consent dialogs, triggers lazy-loaded trackers
7. Outputs results as colorized text, machine-readable JSON, or GitHub SARIF

**Key technical detail:** Domain resolution walks up parent domains (`ssl.google-analytics.com` → `google-analytics.com` → `google.com`) ensuring subdomain coverage without requiring an entry for every subdomain variant.

#### `etalon audit [dir]` — Static Code Analysis

**Under the hood — 6 specialized scanners running in parallel:**

| Scanner | File | Size | What It Detects |
|---------|------|------|-----------------|
| **Code Scanner** | `code-scanner.ts` | 24KB | Tracker SDKs in npm/pip/cargo, import patterns, API calls, env vars, hardcoded tracking snippets |
| **Schema Scanner** | `schema-scanner.ts` | 19KB | PII fields in database schemas (Prisma, SQL, Django, SQLAlchemy, TypeORM, Diesel) |
| **Config Scanner** | `config-scanner.ts` | 20KB | Cookie settings (SameSite, Secure, HttpOnly), CORS misconfigs, CSP issues, missing security headers |
| **Server Tracker Scanner** | `server-tracker-scanner.ts` | 7.5KB | Server-side tracking patterns that bypass ad blockers |
| **CNAME Cloaking Scanner** | `cname-cloaking-scanner.ts` | 15KB | DNS-based tracking via CNAME cloaking in proxy/rewrite configs |
| **Stack Detector** | `stack-detector.ts` | 6.7KB | Framework detection (Next.js, Nuxt, React, Vue, etc.) for context-aware analysis |

Each finding is enriched with:
- **GDPR article references** (28 rule mappings → 11+ unique GDPR articles with direct links to `gdpr-info.eu`)
- **Git blame data** (who introduced the tracker, when)
- **Context-aware severity** (adjusted by industry + region + data sensitivity)
- **Auto-fix suggestions** with AST-based code patches

#### `etalon generate-policy [dir]` — Privacy Policy Generator

**Under the hood:**
1. Runs a full code audit via `auditProject()`
2. Optionally runs a network scan via `scanSite()`
3. Analyzes PII data flows via `analyzeDataFlow()`
4. Feeds all three into `generatePolicy()` which produces an **8-section, region-aware GDPR privacy policy**:
   - Data Controller info
   - Data collection (detected PII types)
   - Third-party services (each vendor with purpose, data collected, DPA URL, GDPR status)
   - Cookies & tracking
   - International transfers (non-EU vendor flagging)
   - Data retention
   - User rights (mapped to GDPR Art. 15–22, or CCPA/LGPD equivalents)
   - Contact & DPO
5. Outputs as **Markdown** (with table of contents) or **standalone HTML** (with embedded CSS)

**This is not a template.** It is a dynamically generated policy based on **what your code actually does**.

---

### The Unique "Moat" — What Makes ETALON Different from a Standard Linter

ETALON is not a linter. It is a **7-layer intelligence engine** that operates across the entire detection→remediation→documentation lifecycle:

| Layer | Capability | Standard Linter? |
|-------|-----------|-----------------|
| **1. Auto-Fix Engine** | AST-based consent-wrapping for 20 tracker types across 4 frameworks (React, Next.js, Vue, Vanilla JS) | ❌ Linters flag, not fix |
| **2. Framework Detection** | AST-aware detection of React, Next.js, Vue patterns — understands component lifecycle, middleware hooks, and framework-specific tracking patterns | ❌ Linters are framework-agnostic |
| **3. Pattern Library** | 54 known-safe domains (CDN, payment, auth, etc.), 20 false positive suppression rules, 12 context-based severity adjusters | ❌ Linters have binary pass/fail |
| **4. Context-Aware Scoring** | Adjusts severity based on **industry** (10 industries: healthcare +2, government +3, finance +2), **region** (8 jurisdictions: GDPR, CCPA, UK GDPR, PIPEDA, LGPD, etc.), and **data sensitivity** | ❌ Linters use static severity |
| **5. Intelligence Engine** | Opt-in telemetry, learning engine that discovers new safe patterns from usage data, false-positive feedback loop | ❌ No learning capability |
| **6. Policy Generation** | Generates legally-structured privacy policies from actual code behavior — not templates | ❌ Completely absent |
| **7. CI/CD Integration** | GitHub Action with PR comments, fail thresholds, SARIF output for GitHub Security tab, pre-commit hooks | ⚠️ Partial (some linters have CI support) |

**Estimated time to replicate: 12+ months** (per the codebase's own competitive analysis). The learning engine is **irreplicable** without usage data.

---

## 3. User Personas

### Persona 1: **The Privacy Officer / DPO**
> *"I need to know what data we collect, who we share it with, and whether we're compliant — without reading a single line of code."*

- **Primary commands:** `etalon scan`, `etalon policy-check`, `etalon generate-policy`
- **Primary surface:** Cloud Dashboard (etalon.nma.vc) + Trust Center
- **"Aha!" moment:** Running `etalon policy-check https://our-site.com` and seeing that 3 vendors are active on the site but **not mentioned in the privacy policy** — with exact disclosure snippets generated automatically.
- **Buying trigger:** The auto-generated privacy policy that maps real detected vendors to GDPR-compliant disclosure language, saving weeks of legal review.

### Persona 2: **The Solo Dev / Indie Hacker**
> *"I just want to ship my SaaS without getting a GDPR fine. I don't have a legal team."*

- **Primary commands:** `npx @etalon/cli audit ./ --fix`, `etalon generate-policy`, `etalon badge`
- **Primary surface:** CLI + MCP server in their AI coding agent
- **"Aha!" moment:** Typing "Check my app for GDPR violations" in Claude Code, seeing ETALON flag their raw `gtag('config', 'G-XXX')` call, and watching it auto-wrap it in a consent check — in 3 seconds.
- **Buying trigger:** The compliance badge SVG they can embed in their README + the public Trust Center page they can share with customers. Instant credibility, zero effort.

### Persona 3: **The CTO / Engineering Lead**
> *"I need GDPR compliance baked into CI/CD so no tracker ships without review. And I need proof for our investors' due diligence."*

- **Primary commands:** GitHub Action, `etalon init`, scheduled scans
- **Primary surface:** GitHub Security tab (SARIF), Cloud Dashboard, Trust Center
- **"Aha!" moment:** After `etalon init ./`, their CI pipeline now **blocks PRs that introduce high-risk trackers** and posts a compliance report as a PR comment — automatically. The Trust Center at `etalon.nma.vc/trust/their-company` becomes a shareable compliance certificate for investor due diligence.
- **Buying trigger:** Continuous compliance-as-code that replaces annual €15K manual audits with always-on, automated enforcement.

---

## 4. Feature Inventory — Top 5 High-Impact Features

### Feature 1: **One-Command Full Privacy Audit**
| | |
|---|---|
| **Technical Fact** | 6 specialized scanners (code, schema, config, server tracking, CNAME cloaking, stack detection) analyze a codebase in parallel, producing findings enriched with GDPR article references and git blame attribution. |
| **Marketing Benefit** | Know exactly who introduced every tracker, which GDPR article it violates, and how to fix it — in under 10 seconds. Replace a €15K manual audit with a single CLI command. |

### Feature 2: **AI-Native Architecture (MCP Server + Programmatic API)**
| | |
|---|---|
| **Technical Fact** | Published `@etalon/mcp-server` on npm with 4 tools + structured resources. Full programmatic API via `@etalon/core` with typed exports. JSON and SARIF output formats for machine consumption. |
| **Marketing Benefit** | The first privacy tool designed for AI coding agents. Your AI assistant can audit, fix, and generate policies without human intervention. Works natively with Claude Code, Cursor, Windsurf, Cline, and Antigravity. |

### Feature 3: **Auto-Generated, Code-Aware Privacy Policies**
| | |
|---|---|
| **Technical Fact** | `policy-generator.ts` (488 lines) combines code audit results, network scan data, and data flow analysis to produce an 8-section, region-aware privacy policy with per-vendor disclosures, DPA links, and user rights (GDPR Art. 15–22, CCPA, LGPD). |
| **Marketing Benefit** | Your privacy policy writes itself — and it's actually accurate. No more "we may collect data" boilerplate. Instead, a living document that reflects exactly what your code does today. |

### Feature 4: **Public Trust Center + Compliance Badge**
| | |
|---|---|
| **Technical Fact** | Dynamic server-rendered page at `/trust/[slug]` showing compliance score gauge, vendor grid with risk scores, scan timeline, and lead capture form. Embeddable SVG badge via `/api/badge/[slug]` (shields.io style, cached 1 hour). |
| **Marketing Benefit** | Turn compliance into a competitive advantage. Share a public, verifiable Trust Center page with customers and investors. Embed a live compliance badge in your README. Social proof that your privacy practices are real, not just words. |

### Feature 5: **CI/CD Compliance Gate (GitHub Action)**
| | |
|---|---|
| **Technical Fact** | GitHub Action (`etalon/action@v1`) runs audit on every PR, posts violation summaries as PR comments, uploads SARIF to GitHub Security tab, fails the build on configurable severity thresholds. Pre-commit hook prevents committing tracked changes. |
| **Marketing Benefit** | GDPR compliance shifts left. No tracker ships without review. Every PR gets an automated privacy impact assessment. Compliance is no longer a quarterly audit — it's a continuous guarantee. |

---

## 5. Social Proof Data (Hard Numbers from the Codebase)

| Metric | Value | Source |
|--------|-------|--------|
| **Known vendor profiles** | **26,886** | `data/vendors.json` (v3.0.0) |
| **Tracked domains** | **111,603** | Domain→vendor HashMap entries |
| **Vendor categories** | **23** | analytics, advertising, social, cdn, payments, chat, heatmaps, ab_testing, error_tracking, tag_manager, consent, video, fonts, security, push, forms, referral, booking, maps, web3, b2b_intelligence, email_marketing, other |
| **Tracker patterns (code)** | **138** | npm (52) + PyPI (17) + Cargo (7) + env vars (39) + HTML patterns (15) + import patterns (8) |
| **PII field patterns** | **36** | Schema scanner recognizes 36 PII field name patterns |
| **Database schema formats** | **6** | Prisma, raw SQL, Django, SQLAlchemy, TypeORM, Diesel |
| **Languages scanned** | **3** | JavaScript/TypeScript, Python, Rust |
| **Frameworks detected** | **10+** | React, Next.js, Vue, Nuxt, Angular, Svelte, Remix, Astro, etc. |
| **GDPR rules mapped** | **28** | 28 finding types mapped to specific GDPR articles |
| **GDPR articles referenced** | **11+** | Art. 5(1)(a–f), 6(1)(a), 7, 7(1), 12, 13(2)(a), 25, 32 |
| **Industry-specific rules** | **10** | Healthcare, Finance, Education, E-commerce, SaaS, Media, Government, Gaming, Social, General |
| **Regional regulations** | **8** | EU (GDPR), UK (UK GDPR + PECR), US (CCPA/CPRA), Canada (PIPEDA), Australia (Privacy Act), Brazil (LGPD), Global, Unknown |
| **Safe pattern domains** | **54** | Known-safe domains across 9 categories (CDN, payment, auth, maps, media, font, dev, infra, functional) |
| **False positive rules** | **20** | Suppression rules for patterns that look like tracking but aren't |
| **Context adjustment rules** | **12** | Severity modifiers based on file location, code context, and framework |
| **Auto-fix templates** | **20** | Consent-wrapping templates for 20 trackers across 4 frameworks |
| **CLI commands** | **16** | scan, audit, consent-check, policy-check, generate-policy, data-flow, badge, init, lookup, info, push, sites, auth (login/logout/status), report-fp, intelligence |
| **Output formats** | **7** | Text, JSON, SARIF, HTML, Mermaid, Markdown, SVG |
| **Integration tests** | **40/40** | All passing across all 7 intelligence layers |
| **Traditional audit cost replaced** | **€15,000** | Privacy policy + tracker audit + consent testing + data flow mapping + policy verification |

---

## 6. Suggested Hero Section

### Headline Option A (Impact-first)
> # Your code has trackers. Your privacy policy doesn't mention them.
> **ETALON finds every tracker, fixes violations, and generates your privacy policy — automatically.**

### Headline Option B (AI-native)
> # Privacy compliance for AI-first teams.
> **26,886 vendor profiles. 111,603 domains. One command.**
> `npx @etalon/cli audit ./ --fix`

### Headline Option C (Cost-framing)
> # €15,000 privacy audits are dead.
> **Scan. Fix. Certify. In seconds, not months.**

### Recommended Sub-headline (works with any variant)
> The open-source GDPR/CCPA compliance engine built for AI coding agents, CLI power users, and modern dev teams. Works with Claude Code, Cursor, Windsurf, and CI/CD pipelines.

---

## 7. Three Value Pillars for the Landing Page

### 🔍 Pillar 1: **Detect Everything**
> *"See what lawyers can't."*

From network requests to server-side tracking to CNAME cloaking — ETALON's 6-scanner engine catches what manual audits miss. Powered by the largest open vendor database in privacy tech: **26,886 vendors, 111,603 domains, 23 categories**.

**Key proof points:**
- Headless browser scan catches trackers that fire dynamically
- Static analysis detects tracker SDKs across JS/TS, Python, and Rust
- CNAME cloaking detection exposes DNS-based tracking evasion
- Schema scanner finds PII in 6 database formats (Prisma, SQL, Django, etc.)
- Git blame integration shows who introduced each violation

---

### 🔧 Pillar 2: **Fix Automatically**
> *"From violation to compliant in one command."*

ETALON doesn't just report problems — it solves them. AST-based auto-fix wraps trackers in consent checks. Region-aware policy generation creates legally-structured privacy policies from your actual code. Context-aware scoring adjusts severity for your industry and jurisdiction.

**Key proof points:**
- `--fix` flag auto-wraps 20 tracker types in consent gates
- Privacy policy generated from real code analysis, not templates
- 10 industry rulesets (healthcare +HIPAA, finance +PCI-DSS, education +COPPA)
- 8 regional regulation engines (GDPR, CCPA, UK GDPR, LGPD, PIPEDA, etc.)
- Learning engine reduces false positives over time

---

### 🛡️ Pillar 3: **Prove Compliance**
> *"Trust is your competitive advantage."*

Ship a public Trust Center page, embed a live compliance badge, and gate every PR with automated privacy checks. Turn compliance from a cost center into proof your customers can see.

**Key proof points:**
- Public Trust Center page with score gauge, vendor grid, and scan timeline
- Embeddable SVG compliance badge (A/B/C/D/F grading)
- GitHub Action blocks PRs that introduce high-risk trackers
- SARIF output integrates with GitHub Security tab
- Scheduled scans verify compliance continuously (hourly/daily/weekly)
- API key management for team-wide CI/CD integration

---

## 8. Competitive Positioning Summary

| | **Manual Audit** | **Cookie Scanners** (CookieBot etc.) | **ETALON** |
|---|---|---|---|
| **Code-level detection** | ❌ | ❌ | ✅ 6 scanners |
| **Network scanning** | ⚠️ Manual | ✅ | ✅ Playwright |
| **Auto-fix** | ❌ | ❌ | ✅ AST-based |
| **Policy generation** | ✅ Manual | ❌ | ✅ Code-aware |
| **CI/CD integration** | ❌ | ❌ | ✅ GitHub Action |
| **AI agent support** | ❌ | ❌ | ✅ MCP + API |
| **Context-aware scoring** | ❌ | ❌ | ✅ Industry + Region |
| **Cost** | €15K+ | €30–300/mo | **Free (CLI)** |
| **Time to result** | 2–4 weeks | Minutes | **Seconds** |

---

*End of Product Specification Artifact.*
