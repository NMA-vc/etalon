---
description: How to deploy the etalon web app to production at etalon.nma.vc
---

# Deploy ETALON Web App

## Prerequisites
- The Vercel CLI is installed (`vercel`)
- The repo root `/Users/nico/etalon` is linked to the `etalon` Vercel project (check `.vercel/project.json`)
- The Vercel project has its root directory set to `cloud/web` in project settings

## Deployment Steps

// turbo-all

1. Build locally to verify no errors:
```bash
cd /Users/nico/etalon/cloud/web && npx next build
```

2. Deploy to production **from the repo root** (not from `cloud/web`):
```bash
cd /Users/nico/etalon && vercel --prod
```

## Important Notes

- **Always deploy from `/Users/nico/etalon`** (repo root), NOT from `cloud/web`. The Vercel project settings already handle the `cloud/web` subdirectory.
- The `.vercelignore` at the repo root excludes large directories (`data/`, unused packages) to stay under Vercel's 15k file limit.
- **Never overwrite `.env.local`** — it contains Stripe live keys and other secrets needed for local dev.
- The project is `etalon` on Vercel (NOT `web`). Domain: `etalon.nma.vc`
- Stripe keys are set both in `.env.local` (local) and in Vercel env vars (production).
