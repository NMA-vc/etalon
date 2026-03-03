# Contributing to ETALON

Thank you for your interest in contributing to ETALON! 🔍

## Prerequisites

- [Rust](https://rustup.rs/) (latest stable, edition 2024)
- [Node.js](https://nodejs.org/) 22+ (for the cloud dashboard)
- [Chromium](https://www.chromium.org/) (for live URL scanning — `etalon scan`)

## Development Setup

```bash
# Clone the repo
git clone https://github.com/NMA-vc/etalon.git
cd etalon

# Build the Rust workspace
cargo build --workspace

# Run tests
cargo test --workspace

# Check formatting
cargo fmt --all -- --check

# Lint
cargo clippy --workspace --all-targets --all-features -- -D warnings
```

### Cloud Dashboard (optional)

```bash
cd cloud/web
npm ci
npm run dev      # Start dev server at localhost:3000
npm run lint     # ESLint
npx tsc --noEmit # Type check
```

## Project Structure

```
etalon/
├── crates/
│   ├── core/          # etalon-core — vendor matching + scoring engine
│   ├── techscan/      # etalon-techscan — async technology fingerprinting
│   ├── cli/           # etalon-cli — 10-command CLI scanner
│   └── mcp-server/    # etalon-mcp-server — MCP server for AI agents
├── cloud/
│   └── web/           # Next.js 16 cloud dashboard
├── data/
│   ├── vendors.json           # 26,800+ vendor profiles
│   └── tracker-patterns.json  # 137 detection patterns
├── templates/                 # GDPR legal templates
├── docs/                      # Documentation
└── Dockerfile                 # Container image
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

3. Run `cargo test --workspace` to verify
4. Submit a PR using the [Vendor Submission](https://github.com/NMA-vc/etalon/issues/new?template=vendor_submission.md) template

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

- Rust: `cargo fmt` + `cargo clippy` with `-D warnings`
- TypeScript: ESLint strict mode
- Run checks before committing

## Pull Request Guidelines

1. Keep PRs focused — one feature or fix per PR
2. Add tests for new functionality
3. Update `data/vendors.json` if adding trackers
4. Update `CHANGELOG.md` for user-facing changes
5. Ensure `cargo fmt`, `cargo clippy`, and `cargo test` pass
