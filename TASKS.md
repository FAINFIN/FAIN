# Fain — Development Task List
> Aligned to `sitemap.html` v1.0 · June 2026  
> 15 routes · 3 route groups · primary flow: `/` → `/register` → `/onboarding` → `/connect-bank` → `/connect-bank/callback` → `/ask ★`
> Last updated: 2026-06-19 (reflects actual codebase state)

---

## Legend
- `[ ]` Not started · `[~]` In progress · `[x]` Done
- **P0** Critical path (blocks first user reaching `/ask`)
- **P1** Core product (full app group)
- **P2** Auth completeness (password reset flow)
- **P3** Infrastructure, polish, admin

---

## Phase 0 — Project Foundation
_All done and deployed to production._

- [x] **P0** Initialise Next.js 16 App Router project with TypeScript + pnpm
- [x] **P0** Configure Tailwind CSS with Fain design tokens (stone palette, `--tan-9: #FD5400`, CSS vars)
- [x] **P0** Add Mulish + Instrument Serif + Geist Mono + Familjen Grotesk via `next/font`
- [x] **P0** `src/lib/i18n/strings.ts` — EN + ქართული string map with `t()` helper + `LocaleContext`
- [x] **P0** Neon Postgres connection + Drizzle ORM setup (`drizzle.config.ts`)
- [x] **P0** Drizzle schema — auth + bank_connections + user_profiles + waitlist (no financial data)
- [x] **P0** Run initial migration (`pnpm drizzle-kit push`) — live on Neon
- [x] **P0** better-auth config (`src/lib/auth/config.ts`) — magic link + Google OAuth + Drizzle adapter
- [x] **P0** `src/app/api/auth/[...all]/route.ts` — better-auth handler mounted
- [x] **P0** Dexie schema (`src/lib/db/schema.ts`) — accounts, transactions, connections, syncMeta, conversations, messages
- [x] **P0** Dexie query helpers (`src/lib/db/queries.ts`) — cash position, monthly totals, category breakdown, MoM trend
- [x] **P0** Auth guard at `(app)/layout.tsx` level (server component, redirects to `/login`)
- [x] **P0** `src/app/layout.tsx` — root layout with font vars, LocaleBody, ServiceWorker
- [x] **P0** `src/styles/globals.css` — design tokens, typography scale, component classes
- [x] **P0** `.env.example` with all required + optional vars documented

---

## Phase 1 — Primary User Flow (P0 Critical Path)
_All routes built and live at fain.ge._

### `/` — Landing Page
- [x] **P0** Hero section — headline, sub, waitlist CTA → Postgres `waitlist` table
- [x] **P0** Bank carousel — BOG, TBC + "5,000+ banks" logos, auto-scrolling
- [x] **P0** Waitlist form — POST `/api/waitlist`, deduplicates by email
- [x] **P0** Responsive layout (mobile-first)

### `/register` — Create Account
- [x] **P0** Email + password + Google OAuth via better-auth
- [x] **P0** Field validation — email format, password strength (8 chars, number, uppercase, special)
- [x] **P0** On success → redirect to `/onboarding`
- [x] **P0** Link to `/login` for returning users

### `/login` — Sign In
- [x] **P0** Google OAuth — `signIn.social({ provider: "google" })`
- [x] **P0** Email + password — `signIn.email()`
- [x] **P0** After sign-in → `/ask`

### `/onboarding` — Workspace Setup
- [x] **P0** 4-step wizard: role, company size, goal, workspace name
- [x] **P0** Persists to Postgres `user_profiles` via `/api/onboarding`
- [x] **P0** Progress indicator
- [x] **P0** On complete → `/ask` (connect-bank nudge shown inline on /ask)

### `/connect-bank` — Connect Bank
- [x] **P0** Source picker — BOG, TBC, other banks
- [x] **P0** POST `/api/bank/connect` → creates Salt Edge customer + connect session → returns `connect_url`
- [x] **P0** Pending-row pattern: stores real Salt Edge customer ID before redirect
- [x] **P0** Loading / connecting state
- [x] **P0** `getCustomerByIdentifier()` fallback for DB-reset edge case

### `/connect-bank/callback` — Bank Callback
- [x] **P0** Spinner page — receives `?connection_id=` from Salt Edge redirect
- [x] **P0** Calls `/api/bank/register` → promotes pending row → saves real connectionId
- [x] **P0** Fetches accounts + 24 months transactions from Salt Edge → streams to IndexedDB via Dexie
- [x] **P0** On sync complete → `/ask?q=What%27s+my+runway%3F`

### `/ask` — Ask Fain ★
- [x] **P0** Chat layout — message thread + composer + KPI chips row
- [x] **P0** `buildAiContext()` → reads IndexedDB → category-level aggregates only (never raw transactions)
- [x] **P0** `/api/ai/chat` — Claude Sonnet SSE streaming, rate limit 30/min
- [x] **P0** `[[Label | value]]` parser → `<InlineMetric>` tangerine chips
- [x] **P0** Prompt suggestions on empty state (EN + ქართული)
- [x] **P0** Sample data fallback + connect-bank nudge when no accounts
- [x] **P0** Auto-sends `?q=` URL param from callback redirect
- [x] **P0** Conversation + message history persisted to Dexie

---

## Phase 2 — Full App Group (P1)
_All built and live._

### `/dashboard`
- [x] **P1** KPI tiles — Total Cash, Burn Rate, Runway, MoM delta badge
- [x] **P1** Recharts AreaChart — cash balance over 6 months
- [x] **P1** Top categories by spend — bar chart
- [x] **P1** `useLiveQuery` — updates when sync completes
- [x] **P1** Currency formatting with GEL/locale support

### `/cash-flow`
- [x] **P1** Recharts BarChart — income vs expenses, 6-month rolling
- [x] **P1** Net cash AreaChart overlay
- [x] **P1** Month labels in selected locale (EN / ქართული)
- [x] **P1** Summary row — total in, total out, net for period

### `/transactions`
- [x] **P1** Paginated list — Dexie offset query with `useLiveQuery`
- [x] **P1** Search — text filter on description
- [x] **P1** Type filter — income / expense / transfer
- [x] **P1** Period filter — 1m / 3m / 6m / 12m
- [x] **P1** Row: date · description · category chip · amount (colour-coded +/–)
- [x] **P1** Pagination controls

### `/accounts`
- [x] **P1** Account cards — bank name, masked number, currency, balance
- [x] **P1** All data from Dexie — zero server reads
- [x] **P1** "Last synced" timestamp
- [x] **P1** "Sync now" button

### `/settings`
- [x] **P1** Locale toggle — EN / ქართული
- [x] **P1** Connected sources list with disconnect per-source (IndexedDB only)
- [x] **P1** Clear all data button → wipes IndexedDB → `/connect-bank`
- [x] **P1** Sign out

---

## Phase 3 — Auth Completeness (P2)
_Built._

### `/forgot-password`
- [x] **P2** Email input → better-auth `forgetPassword()` → Resend email
- [x] **P2** Confirm-sent state

### `/forgot-password/reset`
- [x] **P2** Token from URL params → `resetPassword({ token, newPassword })`
- [x] **P2** On success → `/login`
- [x] **P2** Token-expired error state

---

## Phase 4 — Infrastructure & Polish (P3)

### PWA
- [x] **P3** `public/manifest.json` — Fain brand colours, icons (192 + 512)
- [x] **P3** `public/sw.js` — service worker (cache-first shell)
- [x] **P3** `ServiceWorker` component — registers SW in production

### Sample Data
- [x] **P3** `src/lib/db/sampleData.ts` — TechFlow Georgia fixture (GEL transactions, SaaS categories)
- [x] **P3** `loadSampleData()` — bulk-inserts into Dexie
- [x] **P3** `<SampleDataBanner>` — dismissible warning when using sample data

### Admin Panel (`/admin`)
- [x] **P3** Waitlist table — email, status, approve/reject actions
- [x] **P3** Connection monitor — active `bank_connections` with status + last sync
- [x] **P3** PATCH `/api/admin/waitlist/:id` + GET `/api/admin/clients`

### Shared Components
- [x] **P3** `<Sidebar>` — nav links, locale toggle, sign-out
- [x] **P3** `<ErrorBoundary>` — catches render errors
- [x] **P3** `<Toast>` system — success / error / info, auto-dismiss
- [x] **P3** `<LocaleBody>` — applies `lang` + `data-locale` to `<body>`

### Observability & Ops
- [x] **P3** `/api/health` — DB ping + env-var check + version hash
- [ ] **P3** Structured logging on all API routes (currently `console.error` only)
- [ ] **P3** `CONTRIBUTING.md` — local dev setup guide

---

## Outstanding Items

### Deploy / Env
- [x] `SALT_EDGE_APP_ID` + `SALT_EDGE_SECRET` — confirmed in Production (health endpoint 2026-06-19)
- [x] `NEXT_PUBLIC_APP_URL=https://fain.ge` — confirmed present
- [x] Vercel running version `2df0c87` — latest commit live
- [ ] Optional: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — rate limiter has graceful fallback without it

### E2E Verification
- [x] Health endpoint shows all required + Salt Edge vars in `present`
- [ ] End-to-end: register → onboarding → connect-bank (BOG/TBC) → callback → `/ask` with real data
- [ ] Verify `/api/bank/webhook` receives Salt Edge notifications

### Disconnect bank — server-side (P1 gap)
- [x] `DELETE /api/bank/disconnect` — remove `bank_connections` row + call Salt Edge `deleteConnection()`.
      SettingsClient calls server endpoint before clearing IndexedDB. Committed as `d6ae4f3`.

---

## Route Coverage

| Route | Group | Priority | Status |
|---|---|---|---|
| `/` | Public | P0 | ✅ Live |
| `/onboarding` | Public (auth) | P0 | ✅ Live |
| `/login` | `(auth)` | P0 | ✅ Live |
| `/register` | `(auth)` | P0 | ✅ Live |
| `/forgot-password` | `(auth)` | P2 | ✅ Live |
| `/forgot-password/reset` | `(auth)` | P2 | ✅ Live |
| `/connect-bank` | `(auth)` | P0 | ✅ Live |
| `/connect-bank/callback` | `(auth)` system | P0 | ✅ Live |
| `/ask` ★ | `(app)` | P0 | ✅ Live |
| `/dashboard` | `(app)` | P1 | ✅ Live |
| `/cash-flow` | `(app)` | P1 | ✅ Live |
| `/transactions` | `(app)` | P1 | ✅ Live |
| `/accounts` | `(app)` | P1 | ✅ Live |
| `/settings` | `(app)` | P1 | ✅ Live |
| `/admin` | Admin | P3 | ✅ Live |

---

_Source of truth: `sitemap.html` v1.0 · Last synced: 2026-06-19_
