# ETALON Skills

This directory contains SKILL.md files for AI coding agents.
Each skill teaches an agent how to use the ETALON CLI autonomously.

## Directory structure

```
skills/
  openclaw/
    SKILL.md    → For OpenClaw agents (autonomous, messaging-app output)
  claude-code/
    SKILL.md    → For Claude Code (IDE context, no heartbeat)
```

## Install

### OpenClaw
```bash
clawhub install rednix/etalon-gdpr
```
[View on LobstrHunt](https://lobstrhunt.com/skills/rednix/etalon-gdpr)

### Claude Code / Cursor / Codex CLI
```bash
# Copy skills/claude-code/SKILL.md to your agent's skills directory
# Claude Code: ~/.claude/skills/etalon-gdpr/SKILL.md
# Cursor:      ~/.cursor/skills/etalon-gdpr/SKILL.md
```

## What the skills do

Both skills teach the agent to:
- Run `etalon scan <URL>` to detect trackers (111k+ domain database)
- Run `etalon consent-check <URL>` to test for consent violations
- Run `etalon audit ./` to audit codebases for PII handling
- Run `etalon generate-policy` to create GDPR-compliant privacy policies

No API key required. ETALON runs entirely locally.

## Contributing

To suggest improvements to these skills, open a PR or issue.
Skills follow the open SKILL.md format: https://agentskills.io
