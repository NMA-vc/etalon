# ETALON: CLI → Cloud → Public Trust Center
## Development Roadmap

---

## 🎯 GOAL

Connect the existing CLI to the existing Dashboard and create a Public Trust Center page.

**User Flow:**
```
Developer runs: etalon scan myapp.com
         ↓
Results upload to cloud automatically
         ↓
Dashboard shows scan history
         ↓
Public Trust Center: etalon.nma.vc/trust/mycompany
         ↓
Shareable with investors/customers
```

---

## 📋 PHASE 1: CLI → Cloud Sync

### Task 1.1: Add API Key Management to CLI
- `etalon auth login` — Prompt for API key, verify, save to `~/.etalon/config.json`
- `etalon auth logout` — Remove stored key
- `etalon auth status` — Check if logged in and key is valid

### Task 1.2: Add Cloud Upload to Scan Command
- Add `--upload` flag to `etalon scan`
- Add `--project <id>` flag for project targeting
- Upload results to `/api/ingest` endpoint

### Task 1.3: Create Cloud Ingest API Endpoint
- `POST /api/ingest` — Receive scan results from CLI
- `POST /api/auth/verify` — Verify API key validity
- API key verification helper (`lib/api-key.ts`)

---

## 📋 PHASE 2: Public Trust Center

### Task 2.1: Create Public Trust Center Page
- `/trust/[slug]` — Public page showing compliance status
- Hero with score gauge, vendor grid, scan timeline

### Task 2.2: Create Trust Center Components
- `hero.tsx` — Score gauge with grade
- `vendor-grid.tsx` — Third-party services grid
- `scan-timeline.tsx` — Verification history
- `request-access.tsx` — Lead capture form

### Task 2.3: Add Public Toggle to Dashboard
- Toggle in site settings to make Trust Center public
- Link to public Trust Center URL

---

## 📋 PHASE 3: Enhancements

### Task 3.1: `etalon push` Command
- Combined audit + upload in one command

### Task 3.2: Scheduled Scans (Cron)
- Cron worker for sites with `schedule` enabled

### Task 3.3: Embeddable Badge Widget
- `GET /api/badge/[slug]` — Dynamic SVG badge

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Add `slug` and `public` columns to `sites` table
- [ ] Deploy `/api/ingest` endpoint
- [ ] Deploy `/api/auth/verify` endpoint
- [ ] Deploy `/trust/[slug]` page
- [ ] Deploy `/api/badge/[slug]` endpoint
- [ ] Publish updated CLI to npm: `@etalon/cli@1.1.0`
- [ ] Test end-to-end flow
