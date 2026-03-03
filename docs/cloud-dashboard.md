# Cloud Dashboard

The ETALON cloud dashboard provides a web interface for continuous privacy monitoring, scan history, and public Trust Center pages.

## Features

- **Dashboard**: Overview of all monitored sites with privacy scores and trends
- **Scan History**: Detailed results for every audit, with finding breakdowns
- **Alerts**: Notifications when new trackers appear or scores drop
- **Trust Center**: Public `/trust/[slug]` pages showing your privacy posture
- **API Keys**: Manage keys for CLI authentication and programmatic access
- **Compliance Badges**: Dynamic score badges for external embedding

## Connecting the CLI

```bash
# Authenticate your CLI with the cloud dashboard
etalon auth login

# Push scan results to the cloud
etalon audit ./ --push

# Deploy your public Trust Center page
etalon badge ./
```

## Trust Center

The Trust Center is a public page that displays your site's privacy score, detected third-party services, and GDPR compliance status. Share it with customers, partners, or investors:

```
https://etalon.nma.vc/trust/your-company
```

## Self-Hosting

See [Self-Hosting Guide](self-hosting.md) for deploying the dashboard on your own infrastructure.
