---
name: etalon-gdpr
version: 0.9.4
description: >
  GDPR compliance auditing for Claude Code. Scans websites for trackers
  (111k+ domains), tests consent violations, audits codebases for PII
  handling issues, and generates GDPR privacy policies. Requires
  etalon-cli (cargo install etalon-cli). Free, local, no API key.
author: rednix
homepage: https://etalon.nma.vc
tags: [gdpr, compliance, privacy, security, eu, trackers, pii, audit]
category: security
compatible_with:
  - claude-code
  - cursor
  - codex-cli
  - openclaw

requires_bins:
  - etalon

triggers:
  - "check [URL] for GDPR compliance"
  - "audit this codebase for privacy issues"
  - "generate a privacy policy"
  - "scan [URL] for trackers"
  - "does [URL] have cookie consent violations"
  - "map PII data flows in this project"
  - "run etalon on [URL]"
  - "check if we're GDPR compliant"
  - "pre-launch privacy audit"
---

# ETALON GDPR Skill for Claude Code

Use the ETALON CLI for privacy engineering tasks during development.

## Install check
Run `etalon info` first. If missing: `cargo install etalon-cli`

## Key commands for development context

```bash
# Scan a URL
etalon scan <URL> --format json

# Check consent violations
etalon consent-check <URL> --format json

# Audit the current project
etalon audit ./ --format json

# Auto-fix issues (preview first)
etalon audit ./ --fix

# Generate privacy policy
etalon generate-policy ./ \
  --company "<name>" --email <email> --format md

# Map data flows (outputs Mermaid)
etalon data-flow ./ --format mermaid

# Look up a specific domain
etalon lookup <domain>
```

## Output format

Always use `--format json` for machine-readable output.
For `data-flow` use `--format mermaid` to generate diagrams.
For `generate-policy` use `--format md` for markdown output.

## Common development scenarios

**New dependency added:** run `etalon audit ./ --format json --severity high`
to check if the new package includes tracker SDKs.

**Pre-commit hook:** `etalon audit ./ --severity critical` exits 1 on findings.
Use with `etalon init ./ --ci github` to set up automatically.

**Privacy policy out of date:** run `etalon policy-check <URL>` to find
undisclosed vendors, then `etalon generate-policy` to regenerate.

**Code review:** run `etalon audit ./` on the changed files.
Report findings as inline comments with file path and line number.
