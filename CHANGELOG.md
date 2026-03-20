# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- OpenClaw skill (`skills/openclaw/SKILL.md`) — autonomous GDPR auditing
  for OpenClaw agents. Teaches agents to run scans, consent checks,
  codebase audits, and policy generation. Listed on LobstrHunt.
- Claude Code skill (`skills/claude-code/SKILL.md`) — ETALON integration
  for Claude Code, Cursor, and Codex CLI coding agents.
- `skills/README.md` — documentation for the skills directory.

### Changed
- `README.md` — added OpenClaw skill to "Built for AI Coding Agents" section.
- `mcp-setup.md` — added note clarifying MCP server scope and linking to
  OpenClaw skill for full audit capability.

## [0.9.0] - 2026-03-03

### 🎉 First Open Source Release

Complete ground-up rewrite from Python/Node.js to **Rust** for speed, safety, and portability.

### Added

#### CLI (`etalon-cli`)
- `etalon audit [dir]` — 6-scanner static code audit with GDPR article mapping
- `etalon scan <url>` — Live website network tracker detection via headless Chromium
- `etalon consent-check <url>` — Verify trackers respect cookie consent banners
- `etalon policy-check <url>` — Cross-reference privacy policies against detected trackers
- `etalon generate-policy [dir]` — Auto-generate 8-section GDPR privacy policies from code
- `etalon data-flow [dir]` — PII data flow mapping with Mermaid diagram output
- `etalon badge [dir]` — Generate compliance score badges for READMEs
- `etalon init [dir]` — Scaffold config, CI workflow, and pre-commit hooks
- `etalon lookup <domain>` — Vendor/tracker domain lookup
- `etalon info` — Registry statistics
- Output formats: `text`, `json`, `sarif`, `html`, `mermaid`

#### MCP Server (`etalon-mcp-server`)
- Model Context Protocol server for AI agent integration
- Tools: `etalon_lookup_vendor`, `etalon_search_vendors`, `etalon_get_vendor_info`, `etalon_registry_stats`

#### Cloud Dashboard
- Next.js 16 web dashboard for continuous monitoring
- Trust Center public pages (`/trust/[slug]`)
- API key management and scan history
- Alert system for new tracker detections and score drops

#### Vendor Registry
- 26,800+ vendor profiles
- 111,000+ tracked domains
- 23 categories (advertising, analytics, heatmaps, chat, CDN, etc.)
- 137 detection patterns across npm, pip, cargo, env, HTML, and imports

### Security
- SSRF protection with DNS resolution validation and private IP blocking
- Atomic database operations for scan quota management
- Streaming request body parsing with size limits (no unbounded memory allocation)
- Rate limiting with configurable trusted proxy support
- IDOR prevention via explicit user-scoping on all queries

### Infrastructure
- Multi-stage Dockerfile for containerized deployments
- GitHub Actions CI (fmt, clippy, audit, test, build)
- GitHub Actions release workflow (crates.io + GitHub Releases + Docker)
- SARIF output for GitHub Code Scanning integration
