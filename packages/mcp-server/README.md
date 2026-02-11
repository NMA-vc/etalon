# ETALON MCP Server

Expose the ETALON privacy vendor registry to AI agents via [Model Context Protocol](https://modelcontextprotocol.io).

## Installation

```bash
npm install -g etalon-mcp
```

## Claude Desktop Setup

Add to `~/.config/claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "optic": {
      "command": "optic-mcp",
      "args": []
    }
  }
}
```

Restart Claude Desktop. You can now ask:

- "Is google-analytics.com a tracker?"
- "What trackers are in the advertising category?"
- "How many vendors are in the ETALON registry?"

## Available Tools

| Tool | Description |
|------|-------------|
| `etalon_lookup_vendor` | Check if a domain is a known tracker |
| `etalon_search_vendors` | Search by name/company/ID |
| `etalon_get_vendor_info` | Get details for a vendor ID |
| `etalon_registry_stats` | Registry metadata and counts |

## Available Resources

| URI | Description |
|-----|-------------|
| `optic://registry/vendors` | All vendors |
| `optic://registry/vendors/{category}` | Filter by category |
| `optic://registry/vendors/compliant` | GDPR-compliant only |
| `optic://registry/categories` | All categories |

## License

MIT
