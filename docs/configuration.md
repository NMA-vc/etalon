# Configuration

ETALON is configured via an `etalon.yaml` file in your project root. Generate one with:

```bash
etalon init ./
```

## Full Reference

```yaml
version: "1.0"

# Approved vendors that should not trigger findings
allowlist:
  - vendor_id: google-analytics
    reason: "Required for business analytics"
    approved_by: "legal@company.com"
  - domain: cdn.shopify.com
    reason: "Shopify CDN, not tracking"

# Scan behavior
scan:
  # Wait for network idle before capturing requests (live URL scans)
  wait_for_network_idle: true
  # Navigation timeout in milliseconds
  timeout: 30000

# Directories to exclude from code audits
exclude:
  - node_modules
  - .git
  - target
  - dist
  - build
  - __pycache__
```

## Allowlisting

When a vendor is approved by your legal/privacy team, add it to the allowlist to suppress findings:

```yaml
allowlist:
  # By vendor ID (matches all domains for that vendor)
  - vendor_id: sentry
    reason: "Approved for error tracking by DPO"
    approved_by: "dpo@company.com"

  # By specific domain
  - domain: fonts.googleapis.com
    reason: "Google Fonts served via CDN, no tracking cookies"
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ETALON_DATA_DIR` | Path to vendor registry data | Built-in |
| `ETALON_TEMPLATE_DIR` | Path to legal templates | Built-in |
| `ETALON_CONFIG` | Path to config file | `./etalon.yaml` |
