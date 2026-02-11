# Contributing to ETALON

Thank you for your interest in contributing to ETALON! 🔍

## Development Setup

```bash
# Clone the repo
git clone https://github.com/NMA-vc/etalon.git
cd etalon

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Run tests
npm test

# Run lint
npm run lint

# Build all packages
npm run build
```

## Project Structure

```
etalon/
├── packages/
│   ├── core/          # Shared vendor matching engine
│   ├── cli/           # CLI scanner (etalon on npm)
│   └── mcp-server/    # MCP server (etalon-mcp on npm)
├── data/
│   └── vendors.json   # Vendor/tracker database
└── templates/         # Compliance templates
```

## Adding a Vendor

1. Edit `data/vendors.json`
2. Add a new entry following the existing schema:

```json
{
  "id": "vendor-name",
  "domains": ["vendor.com", "cdn.vendor.com"],
  "name": "Vendor Name",
  "company": "Vendor Co.",
  "category": "analytics",
  "gdpr_compliant": true,
  "purpose": "What the vendor does",
  "data_collected": ["cookies", "IP address"],
  "risk_score": 3
}
```

3. Run `npm test` to verify
4. Submit a PR

## Categories

Valid categories: `analytics`, `advertising`, `social`, `cdn`, `payments`, `chat`, `heatmaps`, `ab_testing`, `error_tracking`, `tag_manager`, `consent`, `video`, `fonts`, `security`, `other`.

## Risk Scoring

| Score | Level | Criteria |
|-------|-------|----------|
| 1-2 | Low | CDN, error tracking, consent tools |
| 3-5 | Medium | Analytics with consent, social widgets |
| 6-8 | High | Advertising, behavioral tracking |
| 9-10 | Critical | No privacy policy, known violations |

## Code Style

- TypeScript strict mode
- ESLint + Prettier formatting
- Run `npm run lint:fix` before committing

## Pull Request Guidelines

1. Keep PRs focused - one feature or fix per PR
2. Add tests for new functionality
3. Update `data/vendors.json` if adding trackers
4. Ensure `npm test` and `npm run lint` pass
