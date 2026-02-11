# ETALON Privacy Audit — GitHub Action

Automatically scan code for privacy violations and GDPR compliance issues on every PR.

## Features

- 🔍 **Static analysis** — scans code, schemas, and configs for tracker SDKs, PII, and security issues
- 📊 **PR comments** — posts formatted results directly on the PR
- 🚫 **CI blocking** — fails the check when high-severity issues are introduced
- 📈 **Diff awareness** — shows only new issues introduced in the PR, not existing ones
- 🔬 **SARIF output** — integrates with GitHub Code Scanning

## Usage

### Basic

```yaml
name: Privacy Audit
on: [pull_request]

jobs:
  etalon:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history needed for baseline comparison

      - uses: ./.github/actions/audit
        with:
          fail-on: high
          comment-pr: true
```

### With Code Scanning

```yaml
name: Privacy Audit
on: [pull_request]

jobs:
  etalon:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      security-events: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: ./.github/actions/audit
        with:
          fail-on: high
          comment-pr: true

      - name: Upload SARIF
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: etalon-results.sarif
```

### Advanced Configuration

```yaml
- uses: ./.github/actions/audit
  with:
    fail-on: medium            # Block on medium+ severity
    comment-pr: true           # Post PR comments
    baseline-ref: develop      # Compare against develop branch
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `fail-on` | Severity threshold to block PR: `critical`, `high`, `medium`, `low` | `high` |
| `comment-pr` | Post results as PR comment | `true` |
| `github-token` | GitHub token for posting comments | `${{ github.token }}` |
| `baseline-ref` | Git ref to compare against | `main` |

## Outputs

| Output | Description |
|--------|-------------|
| `high-count` | Number of high + critical findings |
| `medium-count` | Number of medium findings |
| `low-count` | Number of low findings |
| `added-count` | Number of new findings in this PR |
| `should-block` | Whether PR should be blocked |
