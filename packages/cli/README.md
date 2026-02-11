# ETALON Scanner CLI

**Scan websites for third-party trackers and GDPR compliance.**

## Installation

```bash
npm install -g etalon
```

## Usage

```bash
# Scan a website
optic scan https://example.com

# JSON output
optic scan https://example.com --format json

# SARIF for CI/CD (GitHub Code Scanning)
optic scan https://example.com --format sarif

# Deep scan — scroll page, click consent dialogs
optic scan https://example.com --deep

# Look up a single domain
optic lookup google-analytics.com

# Registry stats
optic info
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-f, --format` | `text`, `json`, `sarif` | `text` |
| `-d, --deep` | Scroll + consent interaction | `false` |
| `-t, --timeout` | Nav timeout in ms | `30000` |
| `--no-idle` | Skip network idle wait | `false` |
| `--config` | Path to `etalon.yaml` | auto-detect |

## CI/CD

The `scan` command exits with code **1** if high-risk trackers are found.

```yaml
# GitHub Actions
- run: npx etalon scan https://your-site.com --format sarif > results.sarif
- uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: results.sarif
```

## Configuration

See the root [etalon.yaml](../../etalon.yaml.example) for a complete config example.

## License

MIT
