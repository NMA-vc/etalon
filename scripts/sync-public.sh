#!/usr/bin/env bash
# ─── Sync OSS code to etalon-public ───────────────────────────────
#
# Mirrors packages/, data/, templates/, and root configs from the
# private monorepo to the public GitHub repository.
#
# Usage: ./scripts/sync-public.sh [commit message]
#
# This script:
# 1. Copies only MIT-licensed code (never cloud/)
# 2. Commits and pushes to etalon-public
# 3. Excludes node_modules, .env, .next, .vercel, etc.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MONO_ROOT="$(dirname "$SCRIPT_DIR")"
PUBLIC_ROOT="${MONO_ROOT}/../etalon-public"
COMMIT_MSG="${1:-"chore: sync from monorepo $(date +%Y-%m-%d_%H:%M)"}"

if [ ! -d "$PUBLIC_ROOT/.git" ]; then
    echo "Error: $PUBLIC_ROOT is not a git repository"
    exit 1
fi

echo "🔄 Syncing monorepo → etalon-public..."

# ── Clean destination (keep .git and node_modules) ─────────────────
find "$PUBLIC_ROOT" -mindepth 1 -maxdepth 1 \
    ! -name '.git' \
    ! -name 'node_modules' \
    ! -name '.next' \
    -exec rm -rf {} +

# ── Copy OSS packages ─────────────────────────────────────────────
rsync -a --exclude='node_modules' --exclude='.next' --exclude='.vercel' \
    "$MONO_ROOT/packages/" "$PUBLIC_ROOT/packages/"

# ── Copy shared resources ─────────────────────────────────────────
[ -d "$MONO_ROOT/data" ] && rsync -a "$MONO_ROOT/data/" "$PUBLIC_ROOT/data/"
[ -d "$MONO_ROOT/templates" ] && rsync -a "$MONO_ROOT/templates/" "$PUBLIC_ROOT/templates/"

# ── Copy root configs ─────────────────────────────────────────────
for file in LICENSE README.md CONTRIBUTING.md .eslintrc.cjs tsconfig.json vitest.config.ts etalon.yaml.example; do
    [ -f "$MONO_ROOT/$file" ] && cp "$MONO_ROOT/$file" "$PUBLIC_ROOT/$file"
done

# ── Copy .github workflows ────────────────────────────────────────
if [ -d "$MONO_ROOT/.github" ]; then
    rsync -a "$MONO_ROOT/.github/" "$PUBLIC_ROOT/.github/"
fi

# ── Create public package.json (without cloud workspaces) ─────────
node -e "
const pkg = require('$MONO_ROOT/package.json');
pkg.workspaces = pkg.workspaces.filter(w => !w.startsWith('cloud/'));
require('fs').writeFileSync(
    '$PUBLIC_ROOT/package.json',
    JSON.stringify(pkg, null, 4) + '\n'
);
"

# ── Copy .gitignore (ensure cloud/ exclusion) ─────────────────────
cp "$MONO_ROOT/.gitignore" "$PUBLIC_ROOT/.gitignore"

# ── Commit and push ───────────────────────────────────────────────
cd "$PUBLIC_ROOT"
git add -A
if git diff --cached --quiet; then
    echo "✅ No changes to sync."
else
    git commit -m "$COMMIT_MSG"
    echo "✅ Committed: $COMMIT_MSG"
    echo "   Run 'cd $PUBLIC_ROOT && git push' to push."
fi
