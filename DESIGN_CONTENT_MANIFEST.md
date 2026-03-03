# ETALON Landing Page — Design & Content Manifest

> *Extracted from `cloud/web/` and `packages/cli/` on 2026-02-14.*

---

## 1. Colors & Branding

**Source:** `cloud/web/app/globals.css`

### Theme Identity
The theme is called **"Secure Clarity"** — Zinc base + Teal primary (extracted from the ETALON logo `#1a6b7a`). All values use **oklch** color space for shadcn v4 compatibility.

### Primary Brand Color
| Token | Light Mode | Dark Mode | Notes |
|-------|-----------|-----------|-------|
| `--primary` | `oklch(0.45 0.08 200)` | `oklch(0.58 0.10 200)` | ETALON Teal `#1a6b7a` — THE brand color |
| `--primary-foreground` | `oklch(0.98 0 0)` | `oklch(0.145 0.005 286)` | White text on primary in light, dark zinc in dark |
| `--ring` | `oklch(0.45 0.08 200)` | `oklch(0.58 0.10 200)` | Focus rings match primary |

### Background & Foreground
| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--background` | `oklch(0.985 0 0)` | `oklch(0.145 0.005 286)` |
| `--foreground` | `oklch(0.145 0.005 286)` | `oklch(0.985 0 0)` |
| `--card` | `oklch(1 0 0)` | `oklch(0.195 0.005 286)` |
| `--card-foreground` | `oklch(0.145 0.005 286)` | `oklch(0.985 0 0)` |

### Secondary & Accents
| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--secondary` | `oklch(0.967 0.001 286)` | `oklch(0.27 0.005 286)` |
| `--secondary-foreground` | `oklch(0.21 0.006 286)` | `oklch(0.985 0 0)` |
| `--accent` | `oklch(0.967 0.001 286)` | `oklch(0.27 0.005 286)` |
| `--accent-foreground` | `oklch(0.45 0.08 200)` | `oklch(0.985 0 0)` |
| `--muted` | `oklch(0.967 0.001 286)` | `oklch(0.27 0.005 286)` |
| `--muted-foreground` | `oklch(0.553 0.013 286)` | `oklch(0.64 0.01 286)` |

### Destructive
| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` |
| `--destructive-foreground` | `oklch(0.985 0 0)` | `oklch(0.985 0 0)` |

### Borders & Input
| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--border` | `oklch(0.92 0.004 286)` | `oklch(0.27 0.005 286)` |
| `--input` | `oklch(0.92 0.004 286)` | `oklch(0.27 0.005 286)` |

### Chart Colors (for data visualizations)
| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--chart-1` | `oklch(0.45 0.08 200)` | `oklch(0.58 0.10 200)` | Primary teal |
| `--chart-2` | `oklch(0.696 0.17 162)` | `oklch(0.696 0.17 162)` | Green |
| `--chart-3` | `oklch(0.553 0.013 286)` | `oklch(0.64 0.01 286)` | Zinc muted |
| `--chart-4` | `oklch(0.828 0.189 84)` | `oklch(0.828 0.189 84)` | Yellow/amber |
| `--chart-5` | `oklch(0.577 0.245 27)` | `oklch(0.704 0.191 22)` | Red/destructive |

### Severity Colors (scan results — use for landing page badges/tags)
| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--severity-critical` | `oklch(0.50 0.24 25)` | `oklch(0.60 0.26 25)` |
| `--severity-critical-bg` | `oklch(0.96 0.10 25)` | `oklch(0.25 0.12 25)` |
| `--severity-high` | `oklch(0.58 0.22 25)` | `oklch(0.68 0.24 25)` |
| `--severity-high-bg` | `oklch(0.96 0.10 25)` | `oklch(0.25 0.12 25)` |
| `--severity-medium` | `oklch(0.75 0.15 85)` | `oklch(0.80 0.16 85)` |
| `--severity-medium-bg` | `oklch(0.96 0.08 85)` | `oklch(0.25 0.08 85)` |
| `--severity-low` | `oklch(0.70 0.12 240)` | `oklch(0.75 0.13 240)` |
| `--severity-low-bg` | `oklch(0.95 0.06 240)` | `oklch(0.25 0.08 240)` |
| `--severity-pass` | `oklch(0.60 0.14 145)` | `oklch(0.70 0.16 145)` |
| `--severity-pass-bg` | `oklch(0.94 0.08 145)` | `oklch(0.25 0.08 145)` |

### CLI Output Colors (for terminal preview sections)
| Token | Value | Use |
|-------|-------|-----|
| `--cli-success` | `oklch(0.70 0.16 145)` | Green check marks |
| `--cli-error` | `oklch(0.70 0.24 25)` | Red errors |
| `--cli-warning` | `oklch(0.80 0.16 85)` | Yellow warnings |
| `--cli-info` | `oklch(0.75 0.12 200)` | Info/teal text |
| `--cli-muted` | `oklch(0.60 0.02 0)` | Dim/secondary text |

### Typography
| Property | Value | Source |
|----------|-------|--------|
| **Primary font** | `Inter` | Google Fonts, loaded in `layout.tsx` |
| **Sans variable** | `--font-inter` / `--font-geist-sans` | CSS custom property |
| **Mono variable** | `--font-geist-mono` | CSS custom property |
| **Body class** | `font-sans antialiased` | Applied to `<body>` |

### Border Radius
| Token | Value |
|-------|-------|
| `--radius` | `0.5rem` (base) |
| `--radius-sm` | `calc(var(--radius) - 4px)` |
| `--radius-md` | `calc(var(--radius) - 2px)` |
| `--radius-lg` | `var(--radius)` |
| `--radius-xl` | `calc(var(--radius) + 4px)` |

### CLI Banner Colors (for hero terminal mockup)
From `packages/cli/src/index.ts`:
| Element | Hex | Used For |
|---------|-----|----------|
| `blue` | `#3B82F6` | ASCII art logo (top) |
| `cyan` | `#06B6D4` | ASCII art logo (bottom), links |
| `dim` | `#64748B` | Version text, separators |

---

## 2. Existing shadcn/ui Components

**Source:** `cloud/web/components/ui/`

All 16 shadcn components currently installed:

| Component | File | Actively Used In |
|-----------|------|-----------------|
| **Avatar** | `avatar.tsx` | `app-sidebar.tsx` (user avatar) |
| **Badge** | `badge.tsx` | Landing page, sidebar, sites-client, trust-hero, trust-vendor-grid, trust-timeline, api-keys-client |
| **Button** | `button.tsx` | Everywhere — landing page, navbar, login, scan-trigger, billing, trust, 404 |
| **Card** | `card.tsx` | Landing page, login, api-keys, sites-client, trust-request-form, trust-vendor-grid, trust-timeline |
| **Dialog** | `dialog.tsx` | api-keys-client (create key), sites-client (add site) |
| **Dropdown Menu** | `dropdown-menu.tsx` | app-sidebar (user menu) |
| **Input** | `input.tsx` | Login, sites-client, api-keys, trust-center-settings, trust-request-form |
| **Label** | `label.tsx` | Login, sites-client, api-keys, trust-center-settings |
| **Separator** | `separator.tsx` | Login page, footer, sidebar internal |
| **Sheet** | `sheet.tsx` | Sidebar internal (mobile) |
| **Sidebar** | `sidebar.tsx` | Dashboard layout |
| **Skeleton** | `skeleton.tsx` | Sidebar internal (loading states) |
| **Sonner** | `sonner.tsx` | Root layout (toast notifications) |
| **Table** | `table.tsx` | api-keys-client (API key list) |
| **Tabs** | `tabs.tsx` | *(installed, available for landing page)* |
| **Tooltip** | `tooltip.tsx` | Root layout (global TooltipProvider), sidebar |

### Components Most Relevant for a CLI-Focused Landing Page
1. **Badge** — severity tags, feature labels, "free" / "pro" markers
2. **Button** — CTAs, install buttons, GitHub link
3. **Card** — feature cards, command cards, pricing tiers
4. **Tabs** — for switching between scan/audit/policy terminal previews
5. **Separator** — section dividers
6. **Tooltip** — hover explanations on technical features

### Custom Components (non-shadcn, reusable)
| Component | File | Description |
|-----------|------|-------------|
| **AiFeatures** | `components/ai-features.tsx` | AI/MCP integration showcase |
| **CookieBanner** | `components/cookie-banner.tsx` | GDPR cookie consent banner |
| **Footer** | `components/footer.tsx` | Site-wide footer |
| **InstallSteps** | `components/install-steps.tsx` | Numbered install flow |
| **Navbar** | `components/navbar.tsx` | Top navigation |
| **SkillsSection** | `components/skills-section.tsx` | Skills marketplace section |
| **ScoreRing** | `components/dashboard/score-ring.tsx` | Animated compliance score gauge |

---

## 3. CLI Audit Metrics (Landing Page Feature Claims)

**Source:** `packages/core/src/audit/index.ts` → `auditProject()` function

The `audit` command runs **6 specialized scanners** sequentially. Here are the exact, code-verified claims you should highlight:

### The 6 Scanners (lines 86–90 of `audit/index.ts`)

| # | Scanner | Source File | Size | Landing Page Claim |
|---|---------|-------------|------|--------------------|
| 1 | **Code Scanner** | `code-scanner.ts` | 24KB | "Detects tracker SDKs in npm, pip, and cargo dependencies — plus import patterns, API calls, env vars, and hardcoded tracking snippets" |
| 2 | **Schema Scanner** | `schema-scanner.ts` | 19KB | "Finds PII in database schemas — email, phone, SSN, IP address across Prisma, SQL, Django, SQLAlchemy, TypeORM, and Diesel" |
| 3 | **Config Scanner** | `config-scanner.ts` | 20KB | "Audits cookie settings (Secure, HttpOnly, SameSite), CORS configs, CSP headers, and security misconfigurations" |
| 4 | **Server Tracker Scanner** | `server-tracker-scanner.ts` | 7.5KB | "Catches server-side tracking patterns that bypass ad blockers" |
| 5 | **CNAME Cloaking Scanner** | `cname-cloaking-scanner.ts` | 15KB | "Exposes DNS-based tracking cloaked behind first-party CNAME records" |
| 6 | **Custom Rules** | `plugin-loader.ts` | 4.9KB | "Extend with your own rules via `.etalon/rules/`" |

**Plus:** Stack Detector (`stack-detector.ts`, 6.7KB) auto-detects the framework for context-aware analysis.

### Enrichment Pipeline (what happens after detection)
After scanning, every finding goes through:
1. **GDPR Article Enrichment** → Maps each finding to specific GDPR articles (e.g., Art. 6(1)(a), Art. 32)
2. **Git Blame Enrichment** (optional) → Shows who introduced each tracker and when
3. **Context-Aware Scoring** → Adjusts severity based on detected industry (10), region (8), and data sensitivity
4. **Compliance Scoring** → Generates A–F grade with 0–100 score

### Audit Summary Metrics (from `AuditSummary` type)
These are the exact fields the CLI and dashboard report. Use them as landing page proof points:

| Metric | Type | Use on Landing Page |
|--------|------|-------------------|
| `totalFindings` | `number` | "Found X issues in Y seconds" |
| `critical` | `number` | Severity breakdown bar |
| `high` | `number` | " |
| `medium` | `number` | " |
| `low` | `number` | " |
| `info` | `number` | " |
| `trackerSdksFound` | `number` | "Detected X unique tracker SDKs" |
| `piiColumnsFound` | `number` | "Found X PII columns in your database" |
| `configIssues` | `number` | "Identified X security misconfigurations" |

### Finding Rule Types (from `gdpr-articles.ts` — 28 rules)
Exact rule IDs the code detects and maps to GDPR:

| Category | Rules | Landing Page Angle |
|----------|-------|--------------------|
| **Tracker detection** | `tracker-dependency`, `tracker-import`, `tracker-api-call`, `tracker-http-call`, `tracker-env-var`, `hardcoded-tracker`, `inline-tracker`, `tracker-middleware`, `unconditional-tracker`, `analytics-proxy` | "10 distinct tracker detection patterns" |
| **Server-side & CNAME** | `server-side-tracking`, `cname-cloaking` | "Catches what ad blockers can't" |
| **PII & Data** | `pii-column`, `pii-field-type`, `storage-pii`, `logging-pii`, `no-retention-policy` | "Scans schemas for sensitive data leaks" |
| **Cookies** | `cookie-no-consent`, `cookie-insecure`, `cookie-samesite` | "Audits every cookie setting" |
| **Security / Config** | `missing-csp`, `csp-unsafe-inline`, `csp-unsafe-eval`, `cors-wildcard`, `cors-credentials-wildcard`, `missing-security-headers`, `no-ssl`, `debug-mode` | "8 security configuration checks" |

### Auto-Fix Capabilities (from CLI lines 200–256)
Two types of auto-fix:
1. **Config patches** — fixes cookie-samesite, CSP, etc. (`generatePatches` + `applyPatches`)
2. **Tracker consent wrapping** — AST-based, wraps tracker calls in consent gates (`AutoFixEngine.scanFiles` → `applyAllFixes`)

**Claim:** "Auto-fix wraps 20 tracker types in consent gates across React, Next.js, Vue, and vanilla JS"

---

## 4. Proof Points — Live Intelligence Counters

**Source:** `data/vendors.json` (verified via `node` script from live data)

| Counter | Exact Value | Display Format | Notes |
|---------|-------------|---------------|-------|
| **Vendor profiles** | **26,886** | `26,800+` or `26,886` | `data/vendors.json` → `vendors.length` |
| **Tracked domains** | **111,603** | `111,000+` or `111,603` | Sum of all `vendor.domains.length` |
| **Vendor categories** | **23** | `23` | `data/vendors.json` → `categories.length` |
| **Registry version** | **3.0.0** | `v3.0` | `data/vendors.json` → `version` |
| **Last updated** | **2026-02-11** | "Updated Feb 2026" | `data/vendors.json` → `last_updated` |
| **Tracker patterns** | **138** | `137+` | npm(52) + pypi(17) + cargo(7) + env(39) + html(15) + import(8) |
| **GDPR rule mappings** | **28** | `28` | 28 detection rules mapped to GDPR articles |
| **GDPR articles referenced** | **11+** | `30+` (including sub-articles) | Art. 5–32 covered |
| **Supported languages** | **3** | `JS/TS, Python, Rust` | From code-scanner patterns |
| **Schema formats** | **6** | `Prisma, SQL, Django, SQLAlchemy, TypeORM, Diesel` | schema-scanner.ts |
| **Frameworks detected** | **11** | `Next.js, Express, Fastify, Nuxt, Svelte, Django, Flask, FastAPI, Actix, Axum, Rocket` | From `Framework` type in types.ts |
| **ORMs supported** | **8** | `Prisma, TypeORM, Drizzle, Sequelize, Django ORM, SQLAlchemy, Diesel, Sea-ORM` | From `ORM` type in types.ts |
| **Industry rules** | **10** | `Healthcare, Finance, Education, …` | scoring/industry-rules.ts |
| **Regional regulations** | **8** | `GDPR, UK GDPR, CCPA, PIPEDIA, LGPD, …` | scoring/region-rules.ts |
| **Auto-fix templates** | **20** | `20 trackers × 4 frameworks` | auto-fix/templates.ts |
| **Safe-pattern domains** | **54** | `54 whitelisted domains` | patterns/safe-patterns.ts (473 lines) |
| **False positive rules** | **20** | `20 suppression rules` | patterns/false-positives.ts (305 lines) |
| **Context rules** | **12** | `12 severity adjusters` | patterns/context-rules.ts (255 lines) |

### Suggested "Live Intelligence" Counter Bar

```
┌─────────────────┬──────────────────┬──────────────────┬────────────────┐
│  26,886          │  111,603          │  23               │  138            │
│  Vendor Profiles │  Domains Tracked  │  Categories       │  Detection      │
│                  │                   │                   │  Patterns       │
└─────────────────┴──────────────────┴──────────────────┴────────────────┘
```

### Dynamic Counter API
You can pull these live from the existing `etalon info` command or directly from the `VendorRegistry.getMetadata()` method:

```typescript
import { VendorRegistry } from '@etalon/core';
const registry = VendorRegistry.load();
const meta = registry.getMetadata();
// meta.vendorCount === 26886
// meta.domainCount === 111603
// meta.categoryCount === 23
```

---

## 5. Current Landing Page Structure (for reference)

**Source:** `cloud/web/app/page.tsx` (748 lines)

The existing page has these sections, each as a separate component:

| Section | Component | Lines | Notes |
|---------|-----------|-------|-------|
| Hero | `Hero()` + `HeroTerminalTabs()` | 132–285 | Terminal mockup with tabs, "Privacy audit for AI agents" headline |
| Value Prop | `ValueProp()` | 288–386 | "Why ETALON" — 3 cards |
| Commands Grid | `CommandsGrid()` | 389–535 | All 10 CLI commands displayed |
| Pricing | `Pricing()` | 538–662 | Free / Pro tiers |
| FAQ | `FAQ()` | 665–713 | Expandable FAQ |
| CTA | `CTA()` | 716–742 | Bottom call-to-action |

The page uses inline SVG icons (10 custom icon components) for zero-dependency rendering.

---

*End of Design & Content Manifest.*
