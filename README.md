# ETALON

**Privacy audit tool built for AI coding agents (and developers)**

Free CLI for GDPR compliance. Built for Claude Code, Cursor, Antigravity, and AI workflows.

[![CI](https://github.com/NMA-vc/etalon/actions/workflows/ci.yml/badge.svg)](https://github.com/NMA-vc/etalon/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/etalon.svg)](https://www.npmjs.com/package/etalon)
[![ETALON Score](https://img.shields.io/badge/ETALON-A%20(97%2F100)-brightgreen?style=flat-square)](https://etalon.nma.vc)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/NMA-vc/etalon.svg?style=social)](https://github.com/NMA-vc/etalon)

```bash
# AI agents can run this automatically
npx @etalon/cli audit ./ --format json
npx @etalon/cli audit ./ --fix
npx @etalon/cli generate-policy ./ --company "Acme"
```

**Works with:** Claude Code • Cursor • Windsurf • Cline • Antigravity • Aider

---

## Built for AI Coding Agents

ETALON is designed for AI coding agents like Claude Code, Cursor, and Windsurf.

**Why AI agents love ETALON:**
- 🤖 **MCP server integration** - Claude Desktop, Cline
- 📊 **Machine-readable output** - JSON, SARIF
- 🔧 **Auto-fix capabilities** - Apply patches automatically
- 📦 **Programmatic API** - @etalon/core
- ✅ **Exit codes** - Check success/failure
- 🎯 **Skills marketplace** - One-click install

**Example with Claude Code:**
```typescript
import { auditProject } from '@etalon/core';
const results = await auditProject('./src');
if (results.violations.length > 0) {
  await autoFix('./src');
}
```

**Example with MCP:**
```
You: "Check my app for GDPR violations"
Claude: *uses ETALON* Found 3 issues. Should I fix?
You: "Yes"
Claude: *runs etalon audit ./ --fix* Fixed 2/3 issues.
```

---

## Quick Start

### For AI Agents

**MCP Server (Claude Desktop, Cline):**
```bash
npm install -g @etalon/mcp-server
```

Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "etalon": {
      "command": "etalon-mcp-server"
    }
  }
}
```

### For Developers

```bash
# Install globally
npm install -g @etalon/cli

# Scan a website for trackers
etalon scan https://example.com

# Audit your codebase for GDPR issues
etalon audit ./

# Auto-generate a GDPR privacy policy
etalon generate-policy ./ --company "Acme Inc" --email privacy@acme.com

# Verify cookie consent compliance
etalon consent-check https://example.com
```

Or use without installing:

```bash
npx @etalon/cli scan https://example.com
```

---

## Why ETALON?

GDPR compliance typically costs **€5K–€15K** in privacy lawyers, consultants, and manual audits. ETALON does it in seconds, for free.

| Task | Traditional Cost | ETALON |
|------|-----------------|-------|
| Privacy policy review | €5,000 | `etalon generate-policy` |
| Tracker audit | €3,000 | `etalon scan` + `etalon audit` |
| Cookie consent testing | €2,000 | `etalon consent-check` |
| Data flow mapping | €3,000 | `etalon data-flow` |
| Policy vs reality check | €2,000 | `etalon policy-check` |
| **Total** | **€15,000** | **€0** |

## What You Get

```
ETALON Privacy Audit
═══════════════════════════════════════════════════════
Site:       https://example.com
Scanned:    2025-02-10 14:23:11
Duration:   4.2 seconds

📊 Summary
─────────────────────────────────────────────────────
✓ 14 third-party requests
✓ 11 matched to known vendors
⚠ 3 unknown domains
✗ 2 high-risk trackers detected

🔴 High Risk (2)
─────────────────────────────────────────────────────
facebook.com                    Facebook Pixel
├─ Category:   advertising
├─ GDPR:       Compliant (with DPA)
├─ Data:       cookies, IP address, browsing behavior
└─ DPA:        https://www.facebook.com/legal/terms/dataprocessing

💡 Recommendations
─────────────────────────────────────────────────────
1. Facebook Pixel is a high-risk tracker (score: 7/10).
2. 3 unknown domain(s) detected. Review and submit to the ETALON registry.
```

---

## All 10 Commands

### `etalon scan <url>` - Network Tracker Scanner

Launch a headless browser, intercept all network requests, identify third-party trackers.

```bash
etalon scan https://example.com
etalon scan https://example.com --deep --format json
```

| Option | Description | Default |
|--------|-------------|---------|
| `-f, --format` | `text`, `json`, `sarif` | `text` |
| `-d, --deep` | Scroll page, interact with consent dialogs | `false` |
| `-t, --timeout <ms>` | Navigation timeout | `30000` |
| `--no-idle` | Don't wait for network idle | - |
| `--config <path>` | Path to etalon.yaml config | auto-detect |

---

### `etalon audit [dir]` - Code Audit

Static analysis of your codebase for tracker SDKs, PII in schemas, security misconfigurations, server-side tracking, and CNAME cloaking.

```bash
etalon audit ./
etalon audit ./src --format sarif --severity high
etalon audit ./ --fix
```

| Option | Description | Default |
|--------|-------------|---------|
| `-f, --format` | `text`, `json`, `sarif`, `html` | `text` |
| `-s, --severity` | Filter: `info`, `low`, `medium`, `high`, `critical` | all |
| `--include-blame` | Attach git blame to each finding | `false` |
| `--fix` | Auto-fix simple issues (preview before applying) | `false` |

**What it scans:**
- 📦 Package manifests (npm, pip, cargo) for tracker SDKs
- 🔍 Source code for tracker imports and API calls (JS/TS, Python, Rust)
- 🗄️ Database schemas for PII fields (Prisma, SQL, Django, SQLAlchemy, TypeORM, Diesel)
- ⚙️ Config files for security issues (cookies, CORS, CSP)
- 🕵️ Server-side tracking calls that bypass ad blockers
- 🔗 CNAME cloaking patterns in DNS/proxy/rewrite configs

---

### `etalon consent-check <url>` - Cookie Consent Verification

Test if trackers fire **before** user interaction and **after** cookie rejection. Detects GDPR consent violations.

```bash
etalon consent-check https://example.com
```

| Option | Description | Default |
|--------|-------------|---------|
| `-f, --format` | `text`, `json` | `text` |
| `-t, --timeout <ms>` | Navigation timeout | `15000` |

---

### `etalon policy-check <url>` - Privacy Policy vs Reality

Cross-reference your privacy policy text against actual detected trackers. Find undisclosed vendors and generate disclosure snippets.

```bash
etalon policy-check https://example.com
etalon policy-check https://example.com --policy-url https://example.com/privacy
```

| Option | Description | Default |
|--------|-------------|---------|
| `-f, --format` | `text`, `json` | `text` |
| `-t, --timeout <ms>` | Navigation timeout | `30000` |
| `--policy-url <url>` | Specify the privacy policy URL | auto-discover |

---

### `etalon generate-policy [dir]` - Auto-Generate Privacy Policy ⭐

Combine code audit + network scan + data flow analysis to generate a complete 8-section GDPR privacy policy.

```bash
etalon generate-policy ./ --company "Acme Inc" --email privacy@acme.com
etalon generate-policy ./ --url https://acme.com --company "Acme Inc" --email privacy@acme.com
```

| Option | Description | Default |
|--------|-------------|---------|
| `--company <name>` | Company name **(required)** | - |
| `--email <email>` | DPO / privacy contact **(required)** | - |
| `--url <url>` | Also scan a live URL for network trackers | - |
| `--country <country>` | Jurisdiction (e.g. "EU", "Germany") | - |
| `-o, --output <file>` | Output file | `privacy-policy.md` |
| `-f, --format` | `md`, `html`, `txt` | `md` |

**Generated sections:** Data Controller • Data We Collect • Third-Party Services • Cookies & Tracking • International Transfers • Data Retention • Your Rights (Art. 15–22) • Contact & DPO

---

### `etalon data-flow [dir]` - PII Data Flow Mapper

Map how personal data flows through your codebase: sources → storage → sinks.

```bash
etalon data-flow ./
etalon data-flow ./ --format mermaid
```

| Option | Description | Default |
|--------|-------------|---------|
| `-f, --format` | `text`, `mermaid`, `json` | `text` |

---

### `etalon badge [dir]` - Compliance Badge

Generate an SVG compliance badge (grade + score) for your README. Also outputs a shields.io badge URL you can embed directly.

```bash
etalon badge ./
etalon badge ./ -o shields/privacy.svg
```

**Add the ETALON Score badge to your README:**

```markdown
[![ETALON Score](https://img.shields.io/badge/ETALON-A%20(95%2F100)-brightgreen?style=flat-square)](https://etalon.nma.vc)
```

Grade colors: **A** = brightgreen, **B** = green, **C** = orange, **D** = red, **F** = critical

---

### `etalon init [dir]` - Project Setup

Scaffold ETALON config, CI workflow, and pre-commit hook.

```bash
etalon init ./
etalon init ./ --ci github
```

| Option | Description | Default |
|--------|-------------|---------|
| `--ci <provider>` | `github`, `gitlab`, `none` | `github` |
| `--no-precommit` | Skip pre-commit hook | - |
| `--force` | Overwrite existing files | `false` |

---

### `etalon lookup <domain>` - Vendor Lookup

Check if a domain is a known tracker. Returns full vendor metadata.

```bash
etalon lookup analytics.google.com
```

---

### `etalon info` - Registry Stats

Show registry metadata: version, vendor count, domain count, category count.

---

## MCP Server (Model Context Protocol)

ETALON provides an MCP server for AI agents.

### Installation
```bash
npm install -g @etalon/mcp-server
```

### Configuration

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "etalon": {
      "command": "etalon-mcp-server"
    }
  }
}
```

### Available Tools

- `etalon_audit` - Scan codebase for privacy violations
- `etalon_scan` - Scan website for third-party trackers
- `etalon_generate_policy` - Auto-generate GDPR privacy policy
- `etalon_consent_check` - Test cookie consent compliance
- `etalon_policy_check` - Compare privacy policy vs actual trackers
- `etalon_data_flow` - Map PII data flows
- `etalon_lookup` - Query vendor database

### Skills Marketplace

Available on [skills.sh](https://skills.sh) for one-click install.

---

## Programmatic API

```typescript
import { auditProject, scanUrl, generatePolicy } from '@etalon/core';

// Audit codebase
const results = await auditProject('./src', { format: 'json' });

// Scan website
const scan = await scanUrl('https://example.com', { deep: true });

// Generate policy
const policy = await generatePolicy('./src', {
  company: 'Acme Inc',
  email: 'privacy@acme.com'
});
```

---

## Detection Engine

| Metric | Count |
|--------|-------|
| Known vendor profiles | **26,800+** |
| Tracked domains | **111,000+** |
| Vendor categories | **23** |
| Tracker patterns (npm, pip, cargo, env, HTML, imports) | **137** |
| PII field patterns | **36** |
| Schema formats supported | **6** |
| Languages scanned | **3** (JS/TS, Python, Rust) |
| Frameworks detected | **10+** |
| GDPR articles mapped | **30+** |

### Vendor Categories

| Category | Count | Risk | Examples |
|----------|-------|------|----------|
| Advertising | 19 | 🔴 High | Facebook Pixel, Google Ads, TikTok Pixel |
| Analytics | 18 | 🟡 Medium | Google Analytics, Mixpanel, Amplitude, PostHog |
| Heatmaps | 7 | 🟡 Medium | Hotjar, FullStory, LogRocket, Clarity |
| Chat | 7 | 🟡 Medium | Intercom, Zendesk, Crisp, Drift |
| CDN | 7 | 🟢 Low | Cloudflare, Fastly, AWS CloudFront |
| Social | 6 | 🟡 Medium | Facebook SDK, Twitter/X, LinkedIn |
| A/B Testing | 6 | 🟢 Low | Optimizely, LaunchDarkly, VWO |
| Consent | 6 | 🟢 Low | OneTrust, Cookiebot, Cookiepro |
| Error Tracking | 5 | 🟢 Low | Sentry, Rollbar, Bugsnag |
| Security | 4 | 🟢 Low | reCAPTCHA, hCaptcha, Turnstile |
| Fonts | 3 | 🟢 Low | Google Fonts, Adobe Fonts |
| Video | 3 | 🟡 Medium | YouTube, Vimeo, Wistia |
| Payments | 3 | 🟢 Low | Stripe, PayPal, Braintree |
| Tag Manager | 2 | 🟡 Medium | Google Tag Manager, Tealium |
| Other | 6 | - | Google Maps, Calendly, Typeform |

## Output Formats

| Format | Use Case |
|--------|----------|
| `text` | Terminal output with colors and severity indicators |
| `json` | Machine-readable, pipe to `jq` or downstream tools |
| `sarif` | GitHub Code Scanning integration (SARIF 2.1.0) |
| `html` | Self-contained report file |
| `mermaid` | Data flow diagrams for docs/READMEs |

## Configuration

Create `etalon.yaml` in your project root:

```yaml
version: "1.0"

allowlist:
  - vendor_id: google-analytics
    reason: "Required for business analytics"
    approved_by: "legal@company.com"
  - domain: cdn.shopify.com
    reason: "Shopify CDN, not tracking"

scan:
  wait_for_network_idle: true
  timeout: 30000
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Privacy audit
  run: npx etalon audit ./ --format sarif > results.sarif

- name: Upload SARIF
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: results.sarif
```

### ETALON GitHub Action

```yaml
- uses: etalon/action@v1
  with:
    fail-on: 'high'
    comment-pr: 'true'
    github-token: ${{ github.token }}
    baseline-ref: 'main'
```

The `audit` command exits with code 1 if critical/high findings are found.

## Architecture

```
etalon/
├── packages/
│   ├── core/        # @etalon/core - detection engine
│   ├── cli/         # etalon CLI (10 commands)
│   └── mcp-server/  # MCP server for AI assistants
├── data/
│   ├── vendors.json          # 26,800+ vendors, 111,000+ domains
│   └── tracker-patterns.json # 137 patterns
└── templates/                # GDPR legal templates
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

MIT - see [LICENSE](LICENSE).

---

**Made with ❤️ and 🤖 by [nma.vc](https://nma.vc)**
