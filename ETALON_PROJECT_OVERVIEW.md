# ETALON Projekt-Übersicht

## Architektur

```
etalon/
├── packages/
│   ├── core/          ← Shared library (Vendor Registry, Audit Engine, Policy Generator)
│   ├── cli/           ← CLI tool (`etalon` command) — v1.1.0
│   └── mcp-server/    ← MCP Server for AI agents
├── cloud/
│   ├── web/           ← Next.js Dashboard (Vercel) — etalon.nma.vc
│   └── worker/        ← Scan Worker (Railway) + Scheduled Scans
└── data/
    └── vendors.json   ← 26,886 Vendors, 111,603 Domains, 23 Kategorien
```

---

## 1. CLI-Features

Das CLI hat **16 Commands** (v1.1.0):

| Command | Was es tut | Input | Methode |
|---------|-----------|-------|---------|
| `etalon scan <url>` | Website von außen scannen | URL | Playwright (Headless Browser), fängt Network Requests ab |
| `etalon scan <url> --upload --site <id>` | Scan + Cloud Upload | URL + Site ID | Wie scan, plus Upload an `/api/ingest` |
| `etalon audit [dir]` | Codebase scannen | Verzeichnis | Statische Analyse: Code, Schemas, Configs, Server-Tracking, CNAME Cloaking |
| `etalon push <url> [dir]` | Scan + Audit + Upload | URL + Verzeichnis | One-step combined command |
| `etalon sites` | Cloud Sites auflisten | — | `GET /api/sites` mit API Key Auth |
| `etalon auth login` | API Key speichern | API Key | Verifiziert gegen `/api/auth/verify`, speichert in `~/.etalon/config.json` |
| `etalon auth logout` | API Key entfernen | — | Löscht `~/.etalon/config.json` |
| `etalon auth status` | Auth-Status prüfen | — | Prüft ob Key vorhanden und gültig |
| `etalon consent-check <url>` | Cookie-Consent testen | URL | Playwright: CMP/Banner erkennen, "Reject All" klicken, prüfen |
| `etalon policy-check <url>` | Privacy Policy vs. Realität | URL | Scan + Privacy Policy cross-referenzieren |
| `etalon generate-policy [dir]` | GDPR Privacy Policy generieren | Verzeichnis | Code-Audit + Network-Scan + Data Flow → Markdown/HTML Policy |
| `etalon data-flow [dir]` | PII-Datenflüsse visualisieren | Verzeichnis | Statische Analyse → Text/Mermaid/JSON |
| `etalon badge [dir]` | Compliance-Badge erzeugen | Verzeichnis | SVG Badge basierend auf Score |
| `etalon init [dir]` | Projekt-Setup | Verzeichnis | Erzeugt `etalon.yaml`, GitHub Action, Pre-commit Hook |
| `etalon report-fp` | False Positive melden | Domain + Rule | Lokales Telemetry |
| `etalon intelligence [dir]` | Intelligence Engine Status | Verzeichnis | Zeigt Patterns, Feedback, Learning Stats |

### Was wird im `scan` gescannt?
Die **Website von außen** via Playwright:
- Öffnet URL im Headless Chromium
- Fängt **alle Network Requests** ab
- Extrahiert Domains → Lookup gegen `VendorRegistry` (O(1) HashMap)
- Klassifiziert in: **Detected Vendor** vs. **Unknown Domain**
- Optional: Deep Scan (scrollt, wartet auf Lazy-Load)

### Was wird im `audit` gescannt?
Die **Codebase** statisch:
- **Code Scanner** (`code-scanner.ts`, 24KB): Tracker-SDKs, Pixel, Fingerprinting-Patterns
- **Schema Scanner** (`schema-scanner.ts`, 19KB): PII in DB-Schemas (email, phone, SSN etc.)
- **Config Scanner** (`config-scanner.ts`, 20KB): Cookie-Settings, CSP, CORS, SameSite etc.
- **Server Tracker Scanner** (`server-tracker-scanner.ts`): Server-side Tracking Patterns
- **CNAME Cloaking Scanner** (`cname-cloaking-scanner.ts`, 15KB): DNS-basiertes Tracking
- **Stack Detector**: Erkennt Framework (Next.js, Nuxt, React etc.)
- **Git Blame Integration**: Wer hat was eingebaut

---

## 2. Output-Formate

| Format | Command(s) | Details |
|--------|-----------|---------| 
| **Text** | scan, audit, consent-check, policy-check | Colorized Terminal Output (chalk) |
| **JSON** | scan, audit, consent-check, policy-check, data-flow | Strukturierter JSON-Export |
| **SARIF** | scan, audit | GitHub Security Tab kompatibel |
| **HTML** | audit | Standalone HTML Report (`etalon-report.html`) |
| **Mermaid** | data-flow | Mermaid Diagram für Datenflüsse |
| **Markdown** | generate-policy | Privacy Policy als `.md` |
| **SVG** | badge | Compliance Badge |

---

## 3. Policy Generator

**Voll implementiert** (`policy-generator.ts`, 488 Zeilen / 18KB).

### Input → Output:
```
Code Audit + Network Scan + Data Flow Analysis + Company Info
    ↓
generatePolicy({
    input: { companyName, companyEmail, companyCountry },
    audit: AuditReport,              // von auditProject()
    networkVendorIds: Set<string>,   // von scanSite()
    dataFlow: DataFlowMap            // von analyzeDataFlow()
})
    ↓
GeneratedPolicy {
    sections: PolicySection[]   // Intro, Data Collection, Third Parties, Cookies, 
                                // Data Transfers, Retention, Rights, Contact
    vendors: PolicyVendorEntry[] // Jeder Vendor mit source: 'code' | 'network' | 'both'
    piiTypes: string[]          // Erkannte PII-Typen
    fullText: string            // Assemblierter Markdown-Text
}
```

### Generierte Sektionen:
1. **Einleitung** (Company Info)
2. **Datenerhebung** (erkannte PII-Typen: Email, IP, Name, Cookies etc.)
3. **Drittanbieter** (je Vendor: Name, Zweck, Daten, DPA-URL, GDPR-Status)
4. **Cookies** (Cookie-setzende Vendors)
5. **Datentransfer** (non-EU Vendors)
6. **Aufbewahrung** (Retention Periods)
7. **Betroffenenrechte** (DSGVO Art. 15-22)
8. **Kontakt** (DPO/Company)

---

## 4. Datenbank & API

### Tracker-Datenbank
**Integriert als `vendors.json`:**
- **26,886 Vendors** mit 111,603 Domains
- 23 Kategorien (analytics, advertising, social, cdn, payments, etc.)
- Pro Vendor: `id`, `domains[]`, `name`, `company`, `category`, `gdpr_compliant`, `risk_score`, `data_collected[]`, `dpa_url`, `privacy_policy`, `alternatives[]`
- Lookup via `VendorRegistry.lookupDomain()` — O(1) HashMap

### API / Backend

| Komponente | Stack | Status |
|-----------|-------|--------|
| **Dashboard** (`cloud/web/`) | Next.js + Supabase | ✅ Live auf `etalon.nma.vc` |
| **Scan Worker** (`cloud/worker/`) | Node.js + Playwright auf Railway | ✅ Läuft |
| **Scheduled Scans** | Cron im Worker (5-min Intervall) | ✅ Implementiert |
| **API Routes** | Next.js API Routes | ✅ Live |
| **Auth** | Supabase Auth (GitHub + Email) | ✅ Funktioniert |
| **Stripe Billing** | Stripe Checkout + Webhooks | ✅ Konfiguriert (Test Mode) |
| **API Keys** | `api_keys` Table mit SHA-256 Hash/Prefix | ✅ Vollständig |
| **Trust Center** | Public page + Badge + Toggle | ✅ Live |

### API Routes:
- `POST /api/scan` — Cloud Scan triggern
- `POST /api/ingest` — CLI Scan-Ergebnisse hochladen
- `GET /api/sites` — Sites auflisten (API Key Auth)
- `PATCH /api/sites/[id]` — Site-Settings aktualisieren
- `POST /api/auth/verify` — API Key verifizieren
- `GET /api/badge/[slug]` — Dynamischer SVG Badge
- `POST /api/api-keys` — API Key erstellen
- `POST /api/stripe/checkout` — Checkout Session
- `POST /api/stripe/portal` — Billing Portal
- `POST /api/stripe/webhook` — Stripe Events

### Public Pages:
- `/trust/[slug]` — Öffentliche Trust Center Seite (Score, Vendors, Timeline)

### MCP Server
**`@etalon/mcp-server` veröffentlicht auf npm.** 4 Tools + Resources:
- `etalon_lookup_vendor` — Domain-Lookup
- `etalon_search_vendors` — Suche
- `etalon_get_vendor_info` — Detail-Info
- `etalon_registry_stats` — Statistiken
- Resources: Alle Vendors, nach Kategorie

---

## 5. Konfiguration

**`etalon.yaml`** (erzeugt via `etalon init`):

```yaml
version: "1.0"

allowlist:
  - vendor_id: google-analytics
    reason: "Required for analytics — consent collected via CMP"
    approved_by: "privacy@company.com"
    approved_date: "2025-01-15"

audit:
  severity: low
  include_blame: false

scan:
  timeout: 30000
  wait_for_network_idle: true
```

Config-Suche: `etalon.yaml`, `etalon.yml`, `.etalon.yaml`, `.etalon.yml` im aktuellen Verzeichnis.

CLI-Flags überschreiben Config: `--format`, `--severity`, `--timeout`, `--idle`, `--config <path>`.

---

## 6. Feature-Status

### CLI → Cloud Sync ✅
| Feature | Status |
|---------|--------|
| CLI lokal scannen | ✅ Existiert |
| Cloud Scan via Dashboard | ✅ Worker pollt `scans` Table |
| CLI → Cloud Upload (Scan-Ergebnisse hochladen) | ✅ `--upload` Flag + `/api/ingest` |
| API Key Auth im CLI | ✅ `etalon auth login/logout/status` |
| `etalon push` Command | ✅ Scan + Audit + Upload |
| `etalon sites` Command | ✅ Sites auflisten |

### Dashboard Integration ✅
| Feature | Status |
|---------|--------|
| Sites verwalten | ✅ CRUD vorhanden |
| Scans einsehen (Ergebnisse, Score, Grade) | ✅ Vorhanden |
| Cloud Scan triggern | ✅ Funktioniert |
| Alerts (new_tracker, score_drop) | ✅ Schema + Alert Generator |
| Settings / Billing | ✅ Stripe integration |
| API Key Management | ✅ UI + Generierung + Verification |
| Trust Center Toggle | ✅ In Site Detail Page |
| Scheduled Scans (cron) | ✅ Worker prüft alle 5 Min |

### Public Trust Center ✅
| Feature | Status |
|---------|--------|
| Trust Center Page | ✅ `/trust/[slug]` — Score, Vendors, Timeline |
| Dynamic Badge | ✅ `/api/badge/[slug]` — SVG shields.io style |
| Lead Capture Form | ✅ Request compliance report |
| Embeddable Badge Code | ✅ Markdown + HTML Copy in Dashboard |
