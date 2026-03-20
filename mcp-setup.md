# ETALON MCP Server Configuration

To connect the new lightning-fast Rust ETALON MCP server to your AI assistants, add the following configuration block to your client.

## Claude Desktop Configuration

Open your Claude Desktop configuration file (typically `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS) and add:

```json
{
  "mcpServers": {
    "etalon-mcp-server": {
      "command": "/Users/nico/etalon/target/release/etalon-mcp-server",
      "args": []
    }
  }
}
```

## Cursor Configuration

1. Open Cursor Settings -> Features -> MCP Servers (or search for "MCP" in settings).
2. Click **Add New MCP Server**.
3. Set the name to `ETALON System`.
4. Set the Type to `Command`.
5. Enter the command path: `/Users/nico/etalon/target/release/etalon-mcp-server`
6. Click **Save**.

The agent will immediately have access to `etalon_lookup_vendor`, `etalon_search_vendors`, `etalon_get_vendor_info`, `etalon_registry_stats`, and `etalon_scan_domain`.

## OpenClaw Skill (Full Audit Capability)

The ETALON MCP server covers vendor lookups only (4 tools).
For full audit capability with OpenClaw agents — scanning websites,
testing consent violations, auditing codebases, generating policies —
use the OpenClaw skill instead:

```bash
clawhub install rednix/etalon-gdpr
```

The skill teaches your OpenClaw agent to:
- Run `etalon scan` autonomously when you share a URL
- Check consent violations before you launch a product
- Audit your codebase when new dependencies are added
- Deliver structured reports to your WhatsApp/Telegram

[View on LobstrHunt →](https://lobstrhunt.com/skills/rednix/etalon-gdpr)
[OpenClaw documentation →](https://lobstrhunt.com/docs/agents)
