# MCP Server

ETALON provides a [Model Context Protocol](https://modelcontextprotocol.io/) server that allows AI assistants to query the vendor/tracker registry natively.

## Installation

```bash
cargo install etalon-mcp-server
```

## Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "etalon": {
      "command": "etalon-mcp-server"
    }
  }
}
```

### Cursor / Other MCP Clients

```json
{
  "mcpServers": {
    "etalon": {
      "command": "etalon-mcp-server",
      "args": []
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `etalon_lookup_vendor` | Check if a domain is a known tracker |
| `etalon_search_vendors` | Search vendor registry by name or company |
| `etalon_get_vendor_info` | Get detailed vendor information by ID |
| `etalon_registry_stats` | Get registry metadata and statistics |

## Example Interaction

An AI agent can use the MCP server to automatically assess the privacy posture of a codebase:

> "What tracking services does this project use? Check if `analytics.google.com`, `cdn.segment.com`, and `api.mixpanel.com` are known trackers."

The agent calls `etalon_lookup_vendor` for each domain and receives structured vendor metadata including risk scores, GDPR compliance status, and data collection details.

## Skills Marketplace

Available on [skills.sh](https://skills.sh) for one-click install into compatible AI assistants.
