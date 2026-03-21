# ETALON Skills

This directory contains SKILL.md files for AI coding agents.
Each skill teaches an agent how to use the ETALON CLI autonomously.

## Directory structure

```
skills/
  openclaw/
    SKILL.md              → GDPR audit (autonomous, messaging-app output)
    SKILL-techscan.md     → Tech stack detection (autonomous)
  claude-code/
    SKILL.md              → GDPR audit (IDE context)
    SKILL-techscan.md     → Tech stack detection (IDE context)
```

## Install

### OpenClaw
```bash
clawhub install rednix/etalon-gdpr
clawhub install rednix/etalon-techscan
```
[View on LobstrHunt](https://lobstrhunt.com/skills/rednix/etalon-gdpr)

### Claude Code / Cursor / Codex CLI
```bash
# Copy skill files to your agent's skills directory
# Claude Code: ~/.claude/skills/etalon-gdpr/SKILL.md
# Claude Code: ~/.claude/skills/etalon-techscan/SKILL.md
# Cursor:      ~/.cursor/skills/etalon-*/SKILL.md
```

## Available skills

### etalon-gdpr
- Run `etalon scan <URL>` to detect trackers (111k+ domain database)
- Run `etalon consent-check <URL>` to test for consent violations
- Run `etalon audit ./` to audit codebases for PII handling
- Run `etalon generate-policy` to create GDPR-compliant privacy policies

### etalon-techscan
- Run `etalon techscan <domain>` to detect 5,259 technologies
- Run `etalon techscan --batch <file>` to scan many domains
- Detects frameworks, CDNs, CMS, analytics, payment, hosting, and more
- MIT-licensed fingerprint database (wappalyzergo + hand-curated)

No API key required. ETALON runs entirely locally.

## Contributing

To suggest improvements to these skills, open a PR or issue.
Skills follow the open SKILL.md format: https://agentskills.io
