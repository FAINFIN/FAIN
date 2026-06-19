# Fain — Development Task List
> Aligned to `sitemap.html` v1.0 · June 2026  
> 15 routes · 3 route groups · primary flow: `/` → `/register` → `/onboarding` → `/connect-bank` → `/connect-bank/callback` → `/ask ★`

---

## Legend
- `[ ]` Not started · `[~]` In progress · `[x]` Done
- **P0** Critical path (blocks first user reaching `/ask`)
- **P1** Core product (full app group)
- **P2** Auth completeness (password reset flow)
- **P3** Infrastructure, polish, admin

---

## Phase 0 — Project Foundation
_Required before any route works._

- [ ] **P0** Initialise Next.js 16 App Router project with TypeScript + pnpm
- [ ] **P0** Configure Tailwind CSS with Fain design tokens (stone palette, `--tan-9: #FD5400`, CSS vars)
- [ ] **P0** Add Mulish + Instrument Serif + Geist Mono + Familjen Grotesk via `next/font`
- [ ] **P0** Set up `[locale]` dynamic segment for `/ka` (default) and `/en` — next-intl or custom `LocaleContext`
- [ ] **P0** `src/lib/i18n/strings.ts` — EN + ქართული string map with `t()` helper
- [ ] **P0** Neon Postgres connection + Drizzle ORM setup (`drizzle.config.ts`)
- [ ] **P0** Drizzle schema — auth tables only: `users`, `sessions`, `accounts`, `verifications` (no financial data)
- [ ] **P0** Run initial migration (`pnpm drizzle-kit push`)
- [ ] **P0** better-auth config (`src/lib/auth/auth.ts`) — magic link + Google OAuth + Drizzle adapter
- [ ] **P0** `src/app/api/auth/[...all]/route.ts` — mount better-auth handler
- [ ] **P0** Dexie schema (`src/lib/db/schema.ts`) — tables: `accounts`, `transactions`, `categories`, `categoryRules`, `syncState`
- [ ] **P0** Dexie query helpers (`src/lib/db/queries.ts`) — `getTransactions`, `getAccountBalances`, `getCategoryTotals`, `getSyncState`
- [ ] **P0** Vercel Edge middleware (`src/middleware.ts`) — auth guard for `(app)` group + locale redirect
- [ ] **P0** `src/app/layout.tsx` — root layout with font vars, `LocaleBody`, `ServiceWorker`
- [ ] **P0** `src/styles/globals.css` — design tokens, typography scale
- [ ] **P0** `.env.example` with all required + optional vars documented

---

## Phase 1 — Primary User Flow (P0 Critical Path)
_Every task here is a blocker. A user cannot reach `/ask` without all of these._

### `/` — Landing Page
- [ ] **P0** Hero section — headline, sub, waitlist CTA (`<input type="email">` → Postgres `waitlist` table)
- [ ] **P0** Bank carousel — BOG, TBC + "5 000+ banks" logos, auto-scrolling, Fain stone palette
- [ ] **P0** Waitlist form submission — POST `/api/waitlist`, deduplicate by email
- [ ] **P0** Responsive layout (mobile-first, sidebar hidden on landing)

### `/register` — Create Account
- [ ] **P0** Email + password form with better-auth `signUp.email()` 
- [ ] **P0** Field validation (Zod) — email format, password ≥ 8 chars
- [ ] **P0** On success: redirect to `/onboarding`
- [ ] **P0** Link to `/login` for returning users

### `/login` — Sign In
- [ ] **P0** Magic link tab — email input → `signIn.magicLink()`, confirm-email state
- [ ] **P0** Google OAuth tab — `signIn.social({ provider: "google" })` button
- [ ] **P0** Email + password tab — `signIn.email()` fallback
- [ ] **P0** After sign-in redirect logic: → `/onboarding` if no workspace, → `/connect-bank` if no bank, → `/ask` otherwise

### `/onboarding` — Workspace Setup (auth required)
- [ ] **P0** Step 1: Currency selector (GEL default, USD, EUR, GBP, others)
- [ ] **P0** Step 2: Locale selector (ქართული default, English)
- [ ] **P0** Step 3: Business type (SaaS, retail, services, other)
- [ ] **P0** Persist workspace prefs to Postgres (`workspace_settings` table)
- [ ] **P0** Progress indicator (step 1 of 3 …)
- [ ] **P0** On complete: redirect to `/connect-bank`
- [ ] **P0** Skip + "Load sample data" path → loads TechFlow Georgia IndexedDB fixture → redirect to `/ask`

### `/connect-bank` — Connect Bank (auth required)
- [ ] **P0** Source picker grid — BOG logo card, TBC logo card, "Other bank" search
- [ ] **P0** Salt Edge OAuth handshake — POST `/api/salt-edge/connect` → returns redirect URL
- [ ] **P0** Loading / connecting state with animated indicator
- [ ] **P0** `src/app/api/salt-edge/connect/route.ts` — create Salt Edge customer + login, return `connect_url`
- [ ] **P0** Store Salt Edge `connection_id` + `customer_id` in Postgres `bank_connections` table (no financial data)

### `/connect-bank/callback` — Bank Callback (system, no UI)
- [ ] **P0** `src/app/(auth)/connect-bank/callback/page.tsx` — spinner-only page
- [ ] **P0** On mount: call `/api/salt-edge/sync` → streams NDJSON to client
- [ ] **P0** `src/app/api/salt-edge/sync/route.ts` — fetch 24 months transactions from Salt Edge → NDJSON stream
- [ ] **P0** Client: receive NDJSON chunks → bulk-insert to Dexie (transactions + accounts)
- [ ] **P0** Apply Salt Edge category taxonomy → populate `categories` table
- [ ] **P0** On sync complete: redirect to `/ask`
- [ ] **P0** Salt Edge HMAC-SHA256 webhook handler at `/api/salt-edge/webhook` — validate signature, update `syncState`

### `/ask` — Ask Fain ★ (PRIMARY — auth + bank required)
- [ ] **P0** Chat layout — message thread + composer, sidebar nav
- [ ] **P0** `buildAiContext()` (`src/lib/ai/buildAiContext.ts`) — reads IndexedDB → produces category-level aggregates JSON (never raw transactions)
- [ ] **P0** `src/app/api/ai/stream/route.ts` — accepts `{ question, context }`, streams Claude Sonnet response via SSE
- [ ] **P0** Vercel KV token-bucket rate limiter (20 req/user/day); graceful degradation without KV
- [ ] **P0** Streaming SSE consumer in `useChat` hook — appends chunks to message state
- [ ] **P0** `[[Label | value]]` parser → renders as `<MetricChip>` inline in AI response
- [ ] **P0** `<MetricChip>` component — tangerine pill with label + value, tooltip on hover
- [ ] **P0** Example prompt suggestions on empty state ("What's my runway?", "Where did I spend most last quarter?", "How's my burn rate?")
- [ ] **P0** `useLiveQuery` subscription so new sync data refreshes context automatically
- [ ] **P0** Error state (rate limit hit, API error, no context)
- [ ] **P0** EN / ქართული prompt handling — pass locale to system prompt

---

## Phase 2 — Full App Group (P1)

### `/dashboard` — Dashboard
- [ ] **P1** KPI tiles row — Total Cash (from IndexedDB `accounts`), Burn Rate (avg monthly expenses 3mo), Runway (cash ÷ burn), MoM delta badge
- [ ] **P1** Recharts `AreaChart` — cumulative cash balance over 12 months
- [ ] **P1** Top-5 categories by spend — horizontal bar or ranked list
- [ ] **P1** `useLiveQuery` — all tiles update when sync completes
- [ ] **P1** Currency formatting util (`formatGEL`, `formatCurrency`) using workspace locale + currency

### `/cash-flow` — Cash Flow
- [ ] **P1** Recharts `BarChart` — income (positive) vs expense (negative) bars, 12-month rolling
- [ ] **P1** Net cash `LineChart` overlay
- [ ] **P1** Period selector (3m / 6m / 12m / custom range)
- [ ] **P1** Month labels in selected locale (EN: Jan Feb … / KA: იან თებ …)
- [ ] **P1** Summary row — total in, total out, net for period

### `/transactions` — Transactions
- [ ] **P1** Paginated list — 50 rows/page, Dexie offset query with `useLiveQuery`
- [ ] **P1** Search — text filter on description field
- [ ] **P1** Type filter — income / expense / transfer
- [ ] **P1** Category filter — multi-select from categories in IndexedDB
- [ ] **P1** Period filter — date range picker
- [ ] **P1** Row: date · description · category chip · amount (colour-coded +/–)
- [ ] **P1** Pagination controls (prev / next / page N of M)

### `/accounts` — Accounts
- [ ] **P1** Account cards — bank name, account number (masked), currency, current balance
- [ ] **P1** All data from Dexie `accounts` table — zero server reads
- [ ] **P1** "Last synced" timestamp from `syncState`
- [ ] **P1** "Sync now" button — triggers fresh Salt Edge fetch for active connections

### `/settings` — Settings
- [ ] **P1** Locale toggle — EN / ქართული — writes to `localStorage('fain-locale')` + `LocaleContext`
- [ ] **P1** Currency display selector — GEL / USD / EUR (display preference only, does not convert)
- [ ] **P1** Disconnect bank — DELETE `/api/salt-edge/disconnect` → clears `bank_connections` row + IndexedDB wipe
- [ ] **P1** Delete account — cascade: session, user, bank_connections, workspace_settings rows
- [ ] **P1** Sign out — `signOut()` → redirect to `/`

---

## Phase 3 — Auth Completeness (P2)

### `/forgot-password` — Forgot Password
- [ ] **P2** Email input form
- [ ] **P2** POST `/api/auth/forgot-password` → better-auth `forgetPassword()` → Resend email with reset link
- [ ] **P2** Confirm-sent state ("Check your inbox")

### `/forgot-password/reset` — Reset Password
- [ ] **P2** Read `token` from URL search params
- [ ] **P2** New password + confirm password fields
- [ ] **P2** POST → better-auth `resetPassword({ token, newPassword })`
- [ ] **P2** On success → redirect to `/login`
- [ ] **P2** Token-expired / invalid error state

---

## Phase 4 — Infrastructure & Polish (P3)

### PWA
- [ ] **P3** `public/manifest.json` — Fain brand colours, icons (192 + 512)
- [ ] **P3** `public/sw.js` via Workbox — cache-first shell (dashboard, ask, cash-flow); network-first for `/api/` and `/auth/`
- [ ] **P3** `ServiceWorker` component — registers SW in production only
- [ ] **P3** Install prompt (`beforeinstallprompt`) for mobile

### Sample Data
- [ ] **P3** `src/lib/db/sampleData.ts` — TechFlow Georgia fixture (12 months, realistic GEL transactions, SaaS categories)
- [ ] **P3** `loadSampleData()` — bulk-inserts fixture into Dexie; clears on "Disconnect / clear data"
- [ ] **P3** `<SampleDataBanner>` — dismissible warning shown when using sample data

### Admin Panel (`/admin`)
- [ ] **P3** Session guard — redirect if not admin email (env var `ADMIN_EMAIL`)
- [ ] **P3** Waitlist table — columns: email, joined_at, status (pending/approved/rejected), actions
- [ ] **P3** Approve / reject actions — PATCH `/api/admin/waitlist/:id`
- [ ] **P3** Connection monitor — list of active `bank_connections` rows with status + last sync
- [ ] **P3** No-frills, functional UI — Fain tokens but minimal chrome

### Shared Components
- [ ] **P3** `<Sidebar>` — nav links (Ask, Dashboard, Cash Flow, Transactions, Accounts, Settings), locale toggle, sign-out
- [ ] **P3** `<ErrorBoundary>` — catches render errors, shows retry UI
- [ ] **P3** `<Toast>` system — success / error / info toasts, auto-dismiss
- [ ] **P3** `<LocaleBody>` — applies `lang` + `data-locale` to `<body>`, triggers Georgian font switch

### Observability & Ops
- [ ] **P3** Structured logging on all API routes (request id, user id — no financial data in logs)
- [ ] **P3** `/api/health` endpoint — DB ping + env-var check
- [ ] **P3** Vercel deployment config — env vars in project settings, no database provisioning needed
- [ ] **P3** `CONTRIBUTING.md` — local dev setup, env vars, sample data walkthrough

---

## Route Coverage Checklist

| Route | Group | Priority | Status |
|---|---|---|---|
| `/` | Public | P0 | `[ ]` |
| `/onboarding` | Public (auth required) | P0 | `[ ]` |
| `/login` | `(auth)` | P0 | `[ ]` |
| `/register` | `(auth)` | P0 | `[ ]` |
| `/forgot-password` | `(auth)` | P2 | `[ ]` |
| `/forgot-password/reset` | `(auth)` | P2 | `[ ]` |
| `/connect-bank` | `(auth)` | P0 | `[ ]` |
| `/connect-bank/callback` | `(auth)` system | P0 | `[ ]` |
| `/ask` ★ | `(app)` | P0 | `[ ]` |
| `/dashboard` | `(app)` | P1 | `[ ]` |
| `/cash-flow` | `(app)` | P1 | `[ ]` |
| `/transactions` | `(app)` | P1 | `[ ]` |
| `/accounts` | `(app)` | P1 | `[ ]` |
| `/settings` | `(app)` | P1 | `[ ]` |
| `/admin` | Admin | P3 | `[ ]` |

---

_Source of truth: `sitemap.html` v1.0 · Last synced: June 2026_
