# Fain

**AI financial controller for SME founders.** Ask plain-language questions about your cash, burn, and runway — Fain answers with numbers, not guesses.

Built for Georgian founders first (Georgian script UI, GEL formatting, BOG/TBC integration) — works globally.

---

## Architecture at a glance

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 15 App Router | React Server Components + streaming |
| Auth | better-auth (magic link + Google OAuth) | No password DB |
| Sessions | HTTP-only signed cookies | Zero token leakage |
| **Financial data** | **Client-side only (Dexie / IndexedDB)** | **Privacy by design — no server DB** |
| Bank aggregation | Salt Edge API v5 | Georgian banks + 5 000+ global |
| AI | Anthropic Claude claude-sonnet-4-6 (SSE) | Gets category summaries only, never raw transactions |
| Rate limiting | Upstash Redis (optional) | Prevents abuse; app degrades gracefully without it |
| Charts | Recharts | BarChart · AreaChart · LineChart |
| i18n | Custom LocaleContext | EN + ქართული (Georgian) |

> **Privacy guarantee**: the server is stateless with respect to financial data. Every transaction, balance, and account lives in the user's browser IndexedDB. The server never writes financial data to any database.

---

## Local development

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 (`npm i -g pnpm`)
- A [Resend](https://resend.com) account for magic-link email
- (Optional) [Salt Edge](https://www.saltedge.com) sandbox credentials for bank connections
- (Optional) [Upstash](https://console.upstash.com) Redis for rate limiting

### 1 — Clone and install

```bash
git clone https://github.com/your-org/fain.git
cd fain
pnpm install
```

### 2 — Environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`. The only **required** keys for local dev are:

| Key | Where to get it |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |
| `BETTER_AUTH_SECRET` | Any 32-char random string (`openssl rand -hex 16`) |
| `RESEND_API_KEY` | [resend.com → API keys](https://resend.com/api-keys) |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |

`SALT_EDGE_*` and `UPSTASH_*` are optional — the app runs without them (bank connection is unavailable; rate limiting falls back to in-memory).

### 3 — Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4 — Try without a bank connection

On the "Connect your bank" onboarding step, click **Skip for now** then **Load sample data**. This loads 12 months of realistic Georgian SaaS startup data (TechFlow Georgia) into your browser's IndexedDB — no network calls required.

---

## Project structure

```
src/
├── app/
│   ├── (auth)/              # register · login · connect-bank
│   ├── (app)/               # dashboard · ask · cash-flow · settings
│   └── api/                 # auth routes · salt-edge webhooks · AI stream
├── components/
│   ├── app/                 # Sidebar · SampleDataBanner
│   └── ui/                  # ErrorBoundary · Toast · ServiceWorker · LocaleBody
├── lib/
│   ├── ai/                  # buildAiContext · useAiContext · stream route
│   ├── auth/                # better-auth config
│   ├── db/                  # Dexie schema · queries · sampleData
│   ├── i18n/                # LocaleContext · strings (EN/KA)
│   └── utils/               # dates · currency · formatting
└── styles/
    ├── globals.css           # design tokens · typography
    └── app.css               # layout · mobile responsive
public/
├── manifest.json            # PWA manifest
└── sw.js                    # Service worker (cache-first shell)
```

---

## Key conventions

### Date types

```typescript
type DateRange = { from: Date; to: Date }   // use for query ranges
type YearMonth = { year: number; month: number }  // use for chart axes

// Conversions
rangeToMonths(range)     // DateRange → YearMonth[]
yearMonthToDate(ym)      // YearMonth → Date (first of month)
monthLabel(date, locale) // Date → 'Jan' or 'იან'
```

### CashPosition

```typescript
interface CashPosition {
  totalCash: number   // ← always totalCash, never .total
  accounts: AccountBalance[]
}
```

### AI context

`buildAiContext(accountIds, from, to)` sends **category-level aggregates** to Claude — never individual transactions or account numbers.

### Inline metrics in AI replies

Claude can embed `[[label|value]]` tags in responses. The chat UI parses and renders these as highlighted metric chips client-side.

---

## i18n

Toggle language with the EN / ქა buttons in the sidebar. The locale is:
- stored in `localStorage('fain-locale')`
- auto-detected from `navigator.language` on first load
- applied to the DOM via `data-locale` and `lang` attributes (for Georgian font switching)

To add a string, edit `src/lib/i18n/strings.ts` — add to both `STRINGS.en` and `STRINGS.ka`.

---

## PWA

The service worker (`public/sw.js`) is registered in production only. It caches the app shell (dashboard · ask · cash-flow) for offline access and network-firsts all `/api/` and `/auth/` routes.

---

## Deployment

```bash
pnpm build
pnpm start
```

Or deploy to Vercel — set the environment variables in the project settings. No database provisioning needed; the server has no persistent state.

---

## Licence

Private — all rights reserved © 2026 Fain.
