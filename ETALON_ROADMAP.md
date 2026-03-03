# ETALON: CLI → Cloud → Public Trust Center
## Development Roadmap

---

## 🎯 GOAL

Connect the existing CLI to the existing Dashboard and create a Public Trust Center page.

**User Flow:**
```
Developer runs: etalon scan myapp.com --upload --site <id>
         ↓
Results upload to cloud automatically
         ↓
Dashboard shows scan history + Trust Center toggle
         ↓
Public Trust Center: etalon.nma.vc/trust/mycompany
         ↓
Shareable with investors/customers (page + embeddable badge)
```

---

## ✅ PHASE 1: CLI → Cloud Sync — COMPLETE

### Task 1.1: Add API Key Management to CLI ✅
- `etalon auth login` — Prompt for API key, verify, save to `~/.etalon/config.json`
- `etalon auth logout` — Remove stored key
- `etalon auth status` — Check if logged in and key is valid

### Task 1.2: Add Cloud Upload to Scan Command ✅
- `--upload` flag on `etalon scan`
- `--site <id>` flag for site targeting
- Upload results to `/api/ingest` endpoint

### Task 1.3: Create Cloud Ingest API Endpoint ✅
- `POST /api/ingest` — Receive scan results from CLI
- `POST /api/auth/verify` — Verify API key validity
- API key verification helper (`lib/api-key.ts`)

---

## ✅ PHASE 2: Public Trust Center — COMPLETE

### Task 2.1: Create Public Trust Center Page ✅
- `/trust/[slug]` — Public page showing compliance status
- Hero with score gauge, vendor grid, scan timeline

### Task 2.2: Create Trust Center Components ✅
- `trust-hero.tsx` — Score gauge with grade badge
- `trust-vendor-grid.tsx` — Third-party services grid with risk scores
- `trust-timeline.tsx` — Verification history with grade circles
- `trust-request-form.tsx` — Lead capture form for compliance report

### Task 2.3: Add Public Toggle to Dashboard ✅
- `TrustCenterSettings` widget in site detail page
- Toggle switch, copyable Trust Center URL, badge markdown, live preview
- `PATCH /api/sites/[id]` for updating settings

---

## ✅ PHASE 3: Enhancements — COMPLETE

### Task 3.1: `etalon push` Command ✅
- Combined scan + audit + upload in one step
- `etalon push <url> [dir] --site <id>`

### Task 3.2: `etalon sites` Command ✅
- List cloud sites with IDs for `--site` flag
- `GET /api/sites` endpoint with API key auth

### Task 3.3: Scheduled Scans (Cron) ✅
- `scheduler.ts` in worker — checks for due scans every 5 min
- Supports hourly, daily, weekly, monthly schedules
- Deduplicates pending scans

### Task 3.4: Embeddable Badge Widget ✅
- `GET /api/badge/[slug]` — Dynamic SVG badge (shields.io style)
- Cached 1 hour, grade-colored

---

## 🚀 DEPLOYMENT CHECKLIST

- [x] Add `slug` and `public` columns to `sites` table
- [x] Deploy `/api/ingest` endpoint
- [x] Deploy `/api/auth/verify` endpoint
- [x] Deploy `/trust/[slug]` page
- [x] Deploy `/api/badge/[slug]` endpoint
- [x] Deploy `/api/sites` endpoint
- [x] Deploy `PATCH /api/sites/[id]` endpoint
- [ ] Publish updated CLI to npm: `@etalon/cli@1.1.0`
- [x] Verify deployment (404 page, badge API, auth redirect)
- [ ] Test end-to-end flow with real scan

---

## 📁 FILES CREATED/MODIFIED

### Cloud Web (Next.js)
| File | Purpose |
|------|---------|
| `app/trust/[slug]/page.tsx` | Public Trust Center page |
| `app/api/auth/verify/route.ts` | API key verification endpoint |
| `app/api/ingest/route.ts` | CLI scan upload endpoint |
| `app/api/badge/[slug]/route.ts` | Dynamic SVG badge |
| `app/api/sites/route.ts` | List user sites (API key auth) |
| `app/api/sites/[id]/route.ts` | Update site settings |
| `components/trust/trust-hero.tsx` | Score gauge hero |
| `components/trust/trust-vendor-grid.tsx` | Vendor cards grid |
| `components/trust/trust-timeline.tsx` | Scan history timeline |
| `components/trust/trust-request-form.tsx` | Report request form |
| `components/dashboard/trust-center-settings.tsx` | Dashboard toggle + URL |
| `lib/api-key.ts` | SHA-256 key verification helper |

### CLI (`packages/cli`)
| File | Purpose |
|------|---------|
| `src/commands/cloud.ts` | Auth, upload, list sites |
| `src/commands/push.ts` | Combined push command |
| `src/index.ts` | Wired auth, push, sites commands |

### Worker (`cloud/worker`)
| File | Purpose |
|------|---------|
| `src/scheduler.ts` | Scheduled scan cron logic |
| `src/index.ts` | Integrated scheduler into main loop |

### CLI Commands (v1.1.0)
```
etalon scan <url> [--upload --site <id>]   Scan + optional cloud upload
etalon push <url> [dir] --site <id>        Scan + audit + upload
etalon sites                                List cloud sites & IDs
etalon auth login                           Login with API key
etalon auth logout                          Remove API key
etalon auth status                          Check auth status
```

---

## 🧠 Intelligence Layer ✅ Complete (All 7 Phases)

### Phase 1: Auto-Fix Library (AST Upgrade)
- [x] Install Babel dependencies
- [x] Create AST parser infrastructure
- [x] Port Google Analytics to AST template
- [ ] Port remaining 19 trackers (Backlog)

### Phase 2: Framework-Specific Detection
- [x] Create React detector
- [x] Create Next.js detector
- [x] Create Vue detector
- [x] Integrate into Audit Engine

### Phase 3: Pattern Library
- [x] Create Safe Patterns whitelist (50+ patterns)
- [x] Create False Positives database (20+ rules)
- [x] Create Context Rules (severity reducers + amplifiers)

### Phase 4: Context-Aware Risk Scoring
- [x] Context Detector (industry, region, data sensitivity)
- [x] Industry Rules (10 industries)
- [x] Region Rules (8 regions with regulations)
- [x] Combined Scoring Engine

### Phase 5: Detection Intelligence Engine
- [x] Opt-in Telemetry
- [x] Learning Engine
- [x] Feedback Collector

### Phase 6: Automated Policy Generation
- [x] Policy Generator engine
- [x] GDPR template (via region-aware generator)
- [x] CCPA template (via region-aware generator)
- [x] UK GDPR template (via region-aware generator)
- [x] Section generators (data collection, cookies, third parties, user rights, contact)
- [x] Markdown formatter
- [x] HTML formatter

### Phase 7: CI/CD Integration
- [x] GitHub Action (action.yml + runner)
- [x] Pre-commit hook installer
- [x] Example workflow file
