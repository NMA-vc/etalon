# CI/CD Integration

ETALON is designed to run as a quality gate in your CI/CD pipeline. The `audit` command exits with code 1 if critical or high findings are found.

## GitHub Actions

```yaml
name: Privacy Audit

on: [push, pull_request]

jobs:
  etalon:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install ETALON
        run: cargo install etalon-cli

      - name: Run privacy audit
        run: etalon audit ./ --format sarif > results.sarif

      - name: Upload SARIF to GitHub Code Scanning
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: results.sarif
```

## GitLab CI

```yaml
privacy-audit:
  image: ghcr.io/nma-vc/etalon:latest
  stage: test
  script:
    - etalon audit ./ --format json > etalon-report.json
  artifacts:
    reports:
      codequality: etalon-report.json
```

## Docker-based CI

For CI environments without Rust toolchains:

```yaml
- name: Privacy audit
  run: |
    docker run --rm -v ${{ github.workspace }}:/workspace \
      ghcr.io/nma-vc/etalon:latest audit /workspace --format sarif > results.sarif
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | No critical/high findings |
| 1 | Critical or high findings detected |
| 2 | Configuration or runtime error |

## Pre-commit Hook

```bash
etalon init ./ --ci github
```

This sets up a pre-commit hook that runs `etalon audit` before each commit, preventing privacy regressions from entering the codebase.
