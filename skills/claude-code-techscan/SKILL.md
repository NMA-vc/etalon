---
name: etalon-techscan
version: 0.9.5
description: >
  Technology stack detection for Claude Code. Identify frameworks, CDNs,
  CMS platforms, analytics, and 5200+ technologies on any domain from
  HTTP signals. Requires etalon-cli (cargo install etalon-cli).
  Free, local, no API key. MIT licensed fingerprint database.
author: rednix
homepage: https://etalon.nma.vc
tags: [techscan, framework-detection, stack, reconnaissance, competitive-intel]
category: intelligence

compatible_with:
  - claude-code
  - cursor
  - codex-cli
  - openclaw

requires_bins:
  - etalon

triggers:
  - "what tech stack does [URL] use"
  - "scan [URL] for technologies"
  - "techscan [domain]"
  - "what's [URL] built with"
  - "detect frameworks on [URL]"
  - "competitive tech analysis"
---

# ETALON Techscan Skill for Claude Code

Detect the technology stack of any domain in under 2 seconds.
Don't guess tech stacks — scan them.

## Install check
Run `etalon --version` first. If missing: `cargo install etalon-cli`

## Key commands

```bash
# Scan a single domain (95% use case)
etalon techscan example.com

# Batch scan from file
etalon techscan --batch domains.txt

# Batch with concurrency control
etalon techscan --batch domains.txt -c 5

# Save batch results to database
etalon techscan --batch domains.txt --db-url "postgres://..."
```

## Output format

Each detected technology shows:
- **Name** — the technology (Next.js, Cloudflare, Stripe, etc.)
- **Confidence** — 100 (header/cookie), 90 (meta), 75 (HTML)
- **Via** — detection method (header:server, cookie:_ga, script, meta, html, dns, implied)

## Development scenarios

**Evaluating a library or framework:** scan sites that use it to
understand the ecosystem and common pairings.

**Competitor analysis:** scan the competitor's domain before making
architecture recommendations. Evidence beats assumptions.

**Due diligence:** scan a startup's domain to understand their
technical maturity and infrastructure costs.

**Migration planning:** scan the reference implementation to know
exactly what you're migrating from.

## Chaining with GDPR

```bash
# Tech reconnaissance first
etalon techscan example.com

# Then compliance audit
etalon scan https://example.com
```

## Database

5,259 fingerprints covering frameworks, CMS, CDNs, analytics, payment,
hosting, security, consent managers, chat widgets, marketing tools.
Sources: MIT-licensed wappalyzergo + hand-curated entries.
