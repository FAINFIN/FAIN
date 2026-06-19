# Fain — System Architecture

> AI financial controller for SME founders. Privacy-first: all financial data lives in the browser.
> Solo dev · Vercel · Early stage (MVP → 1K users)

---

## Table of contents

1. [System overview](#1-system-overview)
2. [Architecture layers](#2-architecture-layers)
3. [Data flows](#3-data-flows)
4. [API contracts](#4-api-contracts)
5. [Data models](#5-data-models)
6. [File & folder structure](#6-file--folder-structure)
7. [Environment variables](#7-environment-variables)
8. [Security model](#8-security-model)
9. [PWA & offline strategy](#9-pwa--offline-strategy)
10. [i18n architecture](#10-i18n-architecture)
11. [Key decisions & trade-offs](#11-key-decisions--trade-offs)
12. [Scaling path](#12-scaling-path)

---

## 1. System overview

Fain is a **client-first, privacy-by-design** fintech PWA. The central constraint that drives every architectural decision:

> **Financial data (transactions, balances, account numbers) never leaves the user's browser.** The server is stateless with respect to financial data. The AI only ever receives category-level aggregates.

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌───────────────────┐   │
│  │  Next.js PWA │   │  Dexie /     │   │  Aggregate        │   │
│  │  App Shell   │◄──│  IndexedDB   │──►│  Builder          │   │
│  │  (ka / en)   │   │  (ALL txns)  │   │  (AI context)     │   │
│  └──────┬───────┘   └──────────────┘   └────────┬──────────┘   │
│         │                                        │              │
└─────────┼────────────────────────────────────────┼─────────────┘
          │ HTTPS                                  │ aggregates only
          ▼                                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                     VERCEL (serverless)                         │
│                                                                 │
│  /api/auth/*          /api/saltedge/*        /api/ai/chat       │
│  (better-auth)        (proxy only)           (Claude Sonnet)    │
│         │                    │                      │           │
└─────────┼────────────────────┼──────────────────────┼──────────┘
          │                    │                      │
          ▼                    ▼                      ▼
    Neon Postgres          Salt Edge API        Anthropic API
   (auth + connections    (bank data →          (receives only
    metadata only)         streams to client)    aggregates)
```

**Key principle**: The server acts as a thin proxy. It holds API keys, manages auth sessions, and forwards bank transaction data directly to the client. It never stores, processes, or logs financial data.

---

## 2. Architecture layers

### Layer 1 — Client interface (PWA shell)

Handles all user-facing UI. Runs entirely in the browser, installable as a PWA.

| Component | Technology | Responsibility |
|-----------|-----------|----------------|
| App shell | Next.js 16 App Router | Page routing, layouts, RSC |
| Georgian UI | Noto Serif Georgian + Mulish | Fonts, Georgian script rendering |
| Chat interface | React + Tailwind | Question input, streaming answer display |
| Data viz | Recharts | Cash flow, category, runway charts |
| Locale switcher | next-intl | `/ka/` and `/en/` routing |
| PWA manifest | next-pwa | Installable, standalone display mode |

**Sub-components:**
- `ChatMessage` — renders AI responses, parses `[[Metric | value]]` into interactive chips
- `MetricChip` — inline metric display (e.g. `[[Runway | 14 months]]`)
- `CashFlowChart` — 12-month area chart (revenue vs. expenses)
- `CategoryPieChart` — top spending categories
- `ConnectWizard` — multi-step bank connection flow
- `SyncProgress` — real-time transaction sync progress bar

---

### Layer 2 — Client intelligence (AI interaction)

Runs in the browser. Prepares what goes to the AI — never raw data.

| Component | Responsibility |
|-----------|----------------|
| Aggregate Builder | Reads IndexedDB → produces category-level summary (no raw txns) |
| Context Serializer | Formats aggregates into Claude-ready JSON payload |
| Streaming Chat Engine | POSTs to `/api/ai/chat`, reads SSE stream, renders tokens |
| Metric Parser | Extracts `[[Label \| value]]` tokens from AI response |
| History Manager | Keeps last N turns in memory for conversation context |

**What the AI context payload contains (never more):**
```
totalRevenue, totalExpenses, netCashFlow, currentBalance,
burnRate, runway (months), topCategories[], monthlyTrends[],
currency, periodLabel, locale
```

**What it never contains:**
- Individual transaction amounts or descriptions
- Account numbers, IBANs, or bank names
- Merchant names or payment references

---

### Layer 3 — Client data (IndexedDB)

The single source of truth for all financial data. Managed by Dexie.js with reactive hooks.

| Store | Contents |
|-------|----------|
| `transactions` | All bank transactions (24-month rolling window) |
| `accounts` | Bank accounts with current balances |
| `categories` | Category taxonomy (auto + custom) |
| `categoryRules` | Regex-based auto-categorization rules |
| `syncState` | Per-connection sync cursor (last transaction ID, last sync time) |

**Reactive queries** via `Dexie.useLiveQuery` — UI re-renders automatically when data changes during a sync.

**24-month rolling window**: On each sync, transactions older than 24 months are pruned. Keeps IndexedDB size manageable (~5–15 MB for a typical SME).

**Category engine**: On each new transaction, rules are evaluated in priority order. If no rule matches, transaction is assigned to `Uncategorized`. Users can override categories; overrides are stored on the transaction record and never overwritten by future syncs.

---

### Layer 4 — API layer (Next.js route handlers)

Thin server-side proxy. All handlers run as Vercel serverless functions. No financial data is logged, stored, or cached here.

| Route | Method | Runtime | Purpose |
|-------|--------|---------|---------|
| `/api/auth/[...all]` | ALL | Node.js | better-auth catch-all handler |
| `/api/saltedge/connect` | POST | Node.js | Create Salt Edge customer + return connect URL |
| `/api/saltedge/callback` | GET | Node.js | Post-authorization redirect handler |
| `/api/saltedge/sync` | POST | Node.js | Fetch txns from Salt Edge, stream NDJSON to client |
| `/api/saltedge/webhook` | POST | Node.js | Salt Edge push notifications (connection status) |
| `/api/ai/chat` | POST | Node.js | Receive aggregates → stream Claude response via SSE |

**Middleware** (Edge runtime, runs before every request):
- Locale detection and routing (`/` → `/ka/` or `/en/`)
- Auth session validation (redirect unauthenticated users to `/login`)
- Rate limiting headers check (Vercel KV token bucket)

---

### Layer 5 — Server infrastructure (Vercel + Neon)

| Service | Provider | What's stored |
|---------|----------|---------------|
| Serverless functions | Vercel | API route handlers (stateless) |
| Edge middleware | Vercel | Auth guard + locale routing |
| PostgreSQL | Neon (serverless) | Auth tables + connection metadata only |
| Rate limiting | Vercel KV | AI query counters per user |
| Static assets | Vercel CDN | JS bundles, fonts, icons, PWA assets |

**Neon Postgres** is used exclusively for:
- `users`, `sessions`, `accounts`, `verification` (better-auth schema)
- `salt_edge_connections` (connection IDs, status — not transaction data)
- `user_preferences` (locale, currency, onboarding state)

**Nothing financial is ever written to Postgres.**

---

### Layer 6 — External dependencies

| Service | Purpose | Auth method |
|---------|---------|-------------|
| Salt Edge API | Bank connectivity (BOG, TBC, 5000+ global) | App ID + Secret (server env) |
| Anthropic Claude Sonnet | AI responses | API key (server env) |
| Google OAuth | Social login via better-auth | Client ID + Secret (server env) |
| Neon | Serverless Postgres | `DATABASE_URL` connection string |

---

## 3. Data flows

### 3.1 — Bank connection flow

```
1. User clicks "Connect bank"
2. Client → POST /api/saltedge/connect
3. Server creates Salt Edge customer (if first time)
4. Server requests connection token from Salt Edge API
5. Server stores customer_id in Postgres (salt_edge_connections)
6. Server returns { connectUrl } to client
7. Client redirects user to Salt Edge hosted connect UI
8. User selects BOG/TBC, enters credentials (on Salt Edge's domain)
9. Salt Edge authenticates with bank
10. Salt Edge POSTs to /api/saltedge/webhook → server updates connection status
11. Salt Edge redirects user back to /api/saltedge/callback
12. Server confirms connection active → redirects to /dashboard
13. Client triggers POST /api/saltedge/sync
14. Server fetches 24 months of accounts + transactions from Salt Edge
15. Server streams NDJSON to client (accounts first, then transactions)
16. Client writes each record to IndexedDB via Dexie (live progress)
17. Category engine runs on each transaction
18. Dashboard re-renders reactively via useLiveQuery
```

### 3.2 — Incremental sync flow

```
1. User opens app (or refreshes)
2. Client reads syncState from IndexedDB → gets lastTransactionId + lastSyncedAt
3. Client → POST /api/saltedge/sync { connectionId, fromDate: lastSyncedAt }
4. Server fetches only new transactions since last sync
5. New transactions streamed to client → appended to IndexedDB
6. syncState updated with new cursor
```

### 3.3 — AI chat flow

```
1. User types "What's my runway?"
2. Aggregate Builder reads IndexedDB:
   - Totals by category (last 3/6/12 months)
   - Monthly revenue vs expense trends
   - Current total balance across all accounts
   - Computes burnRate (avg monthly expenses last 3mo)
   - Computes runway (currentBalance / burnRate)
3. Client → POST /api/ai/chat { question, context: {aggregates}, locale, history }
4. Server validates session (no financial data logged)
5. Server builds system prompt (with Georgian language support if locale=ka)
6. Server calls Claude Sonnet with streaming enabled
7. Server pipes SSE stream back to client
8. Client renders tokens in real-time
9. Metric parser extracts [[Label | value]] → renders as MetricChip components
10. Message added to in-memory conversation history
```

### 3.4 — Authentication flow

```
Magic link (primary):
1. User enters email on /login
2. Client → POST /api/auth/sign-in/magic-link { email }
3. better-auth generates token, sends email via configured SMTP/Resend
4. User clicks link → /api/auth/verify?token=...
5. better-auth validates token, creates session, sets httpOnly cookie
6. Middleware detects session → allows access to (app) route group

Google OAuth (secondary):
1. User clicks "Continue with Google"
2. better-auth redirects to Google consent screen
3. Google redirects to /api/auth/callback/google
4. better-auth upserts user record, creates session
5. Redirect to dashboard
```

---

## 4. API contracts

### POST `/api/saltedge/connect`

```typescript
// Request
// Body: empty (auth via session cookie)

// Response 200
{ connectUrl: string }

// Response 401
{ error: "Unauthorized" }
```

### POST `/api/saltedge/sync`

```typescript
// Request
{
  connectionId: string
  fromDate?: string    // ISO 8601, omit for full 24-month sync
  toDate?: string      // ISO 8601, defaults to today
}

// Response: Content-Type: application/x-ndjson (streaming)
// Each line is a JSON object:
{ type: "account";      data: SaltEdgeAccount }
{ type: "transaction";  data: SaltEdgeTransaction }
{ type: "progress";     fetched: number; total: number }
{ type: "done";         totalAccounts: number; totalTransactions: number }
{ type: "error";        message: string; retryable: boolean }
```

### POST `/api/saltedge/webhook`

```typescript
// Called by Salt Edge (not by client)
// Request (Salt Edge signature validated via header)
{
  data: {
    connection_id: string
    customer_id: string
    stage: "start" | "connect" | "fetch" | "finish" | "error"
  }
  meta: {
    version: string
    time: string
  }
}

// Response 200
{ received: true }
```

### POST `/api/ai/chat`

```typescript
// Request
{
  question: string                 // max 500 chars
  context: {
    periodLabel: string            // "Last 3 months"
    totalRevenue: number           // in user's base currency
    totalExpenses: number
    netCashFlow: number
    currentBalance: number
    currency: "GEL" | "USD" | string
    burnRate: number               // avg monthly expenses
    runway: number                 // months (currentBalance / burnRate)
    categories: Array<{
      name: string
      total: number
      percentage: number
    }>
    monthlyTrends: Array<{
      month: string                // "2025-01"
      revenue: number
      expenses: number
    }>
  }
  locale: "en" | "ka"
  history: Array<{
    role: "user" | "assistant"
    content: string
  }>                               // last 6 turns max
}

// Response: Content-Type: text/event-stream (SSE)
data: {"token": "Your "}
data: {"token": "runway "}
data: {"token": "is "}
data: {"token": "[[Runway | 14 months]]"}
data: {"token": " based on..."}
data: {"done": true, "inputTokens": 312, "outputTokens": 87}

// Error response
data: {"error": "rate_limit_exceeded", "retryAfter": 3600}
```

**Inline metric format** — Claude is instructed to wrap key metrics as:
```
[[Label | value]]
```
Examples: `[[Runway | 14 months]]`, `[[Burn rate | ₾8,400/mo]]`, `[[Net cash flow | +₾12,300]]`

The client parses these and renders them as `<MetricChip>` components.

---

## 5. Data models

### 5.1 — Postgres schema (Drizzle, auth + metadata only)

```typescript
// lib/db/schema.ts

import { pgTable, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core"

// ── better-auth tables (auto-managed) ──────────────────────────

export const users = pgTable("users", {
  id:            text("id").primaryKey(),
  name:          text("name").notNull(),
  email:         text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image:         text("image"),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
  updatedAt:     timestamp("updated_at").notNull().defaultNow(),
})

export const sessions = pgTable("sessions", {
  id:          text("id").primaryKey(),
  userId:      text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token:       text("token").notNull().unique(),
  expiresAt:   timestamp("expires_at").notNull(),
  ipAddress:   text("ip_address"),
  userAgent:   text("user_agent"),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
  updatedAt:   timestamp("updated_at").notNull().defaultNow(),
})

export const accounts = pgTable("accounts", {
  id:                  text("id").primaryKey(),
  userId:              text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId:           text("account_id").notNull(),
  providerId:          text("provider_id").notNull(),
  accessToken:         text("access_token"),
  refreshToken:        text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  createdAt:           timestamp("created_at").notNull().defaultNow(),
  updatedAt:           timestamp("updated_at").notNull().defaultNow(),
})

export const verifications = pgTable("verifications", {
  id:         text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value:      text("value").notNull(),
  expiresAt:  timestamp("expires_at").notNull(),
  createdAt:  timestamp("created_at").defaultNow(),
})

// ── Fain-specific tables ────────────────────────────────────────

// Salt Edge connection metadata (NOT transaction data)
export const saltEdgeConnections = pgTable("salt_edge_connections", {
  id:              text("id").primaryKey(),
  userId:          text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  customerId:      text("customer_id").notNull(),        // Salt Edge customer ID
  connectionId:    text("connection_id").notNull().unique(), // Salt Edge connection ID
  providerCode:    text("provider_code").notNull(),      // e.g. "bog_ge"
  providerName:    text("provider_name").notNull(),      // e.g. "Bank of Georgia"
  status:          text("status").notNull().default("active"), // active | inactive | expired
  lastSyncedAt:    timestamp("last_synced_at"),
  createdAt:       timestamp("created_at").notNull().defaultNow(),
  updatedAt:       timestamp("updated_at").notNull().defaultNow(),
})

export const userPreferences = pgTable("user_preferences", {
  id:                  text("id").primaryKey(),
  userId:              text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  defaultCurrency:     text("default_currency").notNull().default("GEL"),
  locale:              text("locale").notNull().default("ka"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  createdAt:           timestamp("created_at").notNull().defaultNow(),
  updatedAt:           timestamp("updated_at").notNull().defaultNow(),
})
```

### 5.2 — IndexedDB schema (Dexie, all financial data)

```typescript
// lib/dexie/schema.ts

export interface Transaction {
  id:              string          // Salt Edge transaction ID
  accountId:       string          // references Account.id
  connectionId:    string          // references salt_edge_connections.connectionId
  amount:          number          // original amount (may be negative for expenses)
  currencyCode:    string          // "GEL", "USD", etc.
  amountInGel:     number          // converted to GEL at time of sync
  exchangeRate:    number          // rate used for conversion
  description:     string          // bank-provided description
  madeOn:          Date            // transaction date
  category:        string          // auto-assigned category ID
  customCategory:  string | null   // user override (never cleared by sync)
  categorySource:  "auto" | "user" // who set the category
  merchant:        string | null   // extracted merchant name
  extra:           Record<string, unknown> // Salt Edge extra fields
  createdAt:       Date            // when added to IndexedDB
}

export interface Account {
  id:              string          // Salt Edge account ID
  connectionId:    string
  name:            string          // e.g. "საქმიანი ანგარიში"
  nature:          string          // "account" | "savings" | "card" | "credit" | "debit"
  currencyCode:    string
  balance:         number          // current balance in original currency
  balanceInGel:    number          // converted balance
  iban:            string | null
  syncedAt:        Date
}

export interface Category {
  id:              string          // e.g. "salaries", "rent", "utilities"
  name:            string          // English name
  nameKa:          string          // Georgian name
  parentId:        string | null   // for sub-categories
  color:           string          // hex color for charts
  icon:            string          // ti-* icon name
  isSystem:        boolean         // system vs user-created
}

export interface CategoryRule {
  id:              string
  pattern:         string          // regex pattern matched against description
  categoryId:      string
  priority:        number          // higher = checked first
  createdAt:       Date
}

export interface SyncState {
  connectionId:    string          // primary key
  lastTransactionId: string | null // cursor for incremental sync
  lastSyncedAt:    Date | null
  nextRefreshAt:   Date | null     // Salt Edge rate limit window
  totalTransactions: number
}

// Dexie database definition
// lib/dexie/db.ts
import Dexie, { type EntityTable } from "dexie"

export class FainDatabase extends Dexie {
  transactions!: EntityTable<Transaction, "id">
  accounts!:     EntityTable<Account, "id">
  categories!:   EntityTable<Category, "id">
  categoryRules!: EntityTable<CategoryRule, "id">
  syncState!:    EntityTable<SyncState, "connectionId">

  constructor() {
    super("fain-db")
    this.version(1).stores({
      transactions:  "id, accountId, connectionId, madeOn, category, customCategory, amount",
      accounts:      "id, connectionId",
      categories:    "id, parentId",
      categoryRules: "id, priority",
      syncState:     "connectionId",
    })
  }
}

export const db = new FainDatabase()
```

---

## 6. File & folder structure

```
fain/
├── app/
│   ├── [locale]/                         # Locale-scoped routes
│   │   ├── (auth)/                       # Public auth pages
│   │   │   ├── login/
│   │   │   │   └── page.tsx              # Magic link + Google OAuth
│   │   │   └── verify/
│   │   │       └── page.tsx              # Email verification landing
│   │   ├── (app)/                        # Authenticated pages
│   │   │   ├── layout.tsx                # App shell (nav, sidebar)
│   │   │   ├── page.tsx                  # Main: chat + dashboard
│   │   │   ├── connect/
│   │   │   │   └── page.tsx              # Bank connection wizard
│   │   │   └── settings/
│   │   │       └── page.tsx              # Account, connections, preferences
│   │   └── layout.tsx                    # Locale root layout (fonts, providers)
│   └── api/
│       ├── auth/
│       │   └── [...all]/
│       │       └── route.ts              # better-auth universal handler
│       ├── saltedge/
│       │   ├── connect/
│       │   │   └── route.ts              # POST: initiate connection
│       │   ├── callback/
│       │   │   └── route.ts              # GET: post-auth redirect handler
│       │   ├── sync/
│       │   │   └── route.ts              # POST: fetch + stream transactions
│       │   └── webhook/
│       │       └── route.ts              # POST: Salt Edge push events
│       └── ai/
│           └── chat/
│               └── route.ts              # POST: SSE stream from Claude
│
├── lib/
│   ├── auth/
│   │   ├── config.ts                     # better-auth configuration
│   │   └── client.ts                     # createAuthClient() for browser
│   ├── db/
│   │   ├── schema.ts                     # Drizzle schema (auth + metadata)
│   │   ├── client.ts                     # Neon + Drizzle client instance
│   │   └── migrations/                   # Drizzle migration files
│   ├── saltedge/
│   │   ├── client.ts                     # Salt Edge REST API wrapper
│   │   ├── types.ts                      # Salt Edge response types
│   │   └── webhook.ts                    # Webhook signature validation
│   ├── ai/
│   │   ├── prompt.ts                     # System prompt builder (en/ka)
│   │   ├── parser.ts                     # [[Label | value]] token parser
│   │   └── rate-limit.ts                 # Vercel KV token bucket
│   ├── dexie/
│   │   ├── db.ts                         # FainDatabase Dexie instance
│   │   ├── schema.ts                     # TypeScript interfaces
│   │   └── hooks.ts                      # useLiveQuery wrappers (useTransactions, etc.)
│   ├── aggregates/
│   │   ├── builder.ts                    # Reads IndexedDB → builds AI context payload
│   │   ├── formatter.ts                  # GEL/currency formatting utilities
│   │   └── runway.ts                     # Runway + burn rate calculations
│   └── i18n/
│       ├── config.ts                     # next-intl routing config
│       └── request.ts                    # Server-side getRequestConfig
│
├── components/
│   ├── chat/
│   │   ├── ChatPanel.tsx                 # Main chat container
│   │   ├── ChatInput.tsx                 # Textarea + send button
│   │   ├── ChatMessage.tsx               # Renders message with metric parsing
│   │   ├── MetricChip.tsx                # [[Label | value]] inline chip
│   │   ├── StreamingMessage.tsx          # SSE token accumulator + renderer
│   │   └── SuggestedQuestions.tsx        # Contextual quick-ask prompts
│   ├── charts/
│   │   ├── CashFlowChart.tsx             # 12-month area chart (Recharts)
│   │   ├── CategoryBreakdown.tsx         # Pie/donut chart
│   │   ├── RunwayGauge.tsx               # Runway visualization
│   │   └── MonthlyCompare.tsx            # Month-over-month bar chart
│   ├── connect/
│   │   ├── ConnectWizard.tsx             # Multi-step bank connection flow
│   │   ├── BankPicker.tsx                # BOG / TBC / other bank selector
│   │   ├── SyncProgress.tsx              # Real-time sync progress
│   │   └── ConnectionCard.tsx            # Connected bank summary card
│   ├── dashboard/
│   │   ├── KpiStrip.tsx                  # Top metrics row (balance, runway, burn)
│   │   ├── TransactionList.tsx           # Recent transactions (local only)
│   │   └── CategorySummary.tsx           # Spending by category
│   └── ui/                               # Fain design system components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Badge.tsx
│       └── ...
│
├── messages/
│   ├── en.json                           # English UI strings
│   └── ka.json                           # Georgian UI strings
│
├── public/
│   ├── manifest.json                     # PWA manifest
│   ├── sw.js                             # Generated service worker (next-pwa)
│   └── icons/                            # PWA icons (192, 512, maskable)
│
├── middleware.ts                          # Edge: auth guard + locale routing
├── next.config.ts                         # Next.js + next-pwa config
├── drizzle.config.ts                      # Drizzle Kit config
├── tailwind.config.ts
└── ARCHITECTURE.md                        # This file
```

---

## 7. Environment variables

```bash
# ── Server-only (never sent to client) ──────────────────────────

# Neon Postgres
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/fain?sslmode=require"

# better-auth
BETTER_AUTH_SECRET="<32-char random string>"
BETTER_AUTH_URL="https://fain.app"

# Google OAuth
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"

# Resend (transactional email for magic links)
RESEND_API_KEY="re_xxx"
EMAIL_FROM="no-reply@fain.app"

# Salt Edge
SALT_EDGE_APP_ID="xxx"
SALT_EDGE_SECRET="xxx"
SALT_EDGE_RETURN_TO="https://fain.app/api/saltedge/callback"
SALT_EDGE_BASE_URL="https://www.saltedge.com/api/v5"

# Anthropic
ANTHROPIC_API_KEY="sk-ant-xxx"
ANTHROPIC_MODEL="claude-sonnet-4-6"

# Vercel KV (rate limiting)
KV_REST_API_URL="https://xxx.kv.vercel-storage.com"
KV_REST_API_TOKEN="xxx"

# ── Public (safe for client) ─────────────────────────────────────

NEXT_PUBLIC_APP_URL="https://fain.app"
NEXT_PUBLIC_DEFAULT_LOCALE="ka"
```

---

## 8. Security model

### Financial data

| Vector | Protection |
|--------|-----------|
| Financial data on server | **Impossible by design** — only aggregates sent to `/api/ai/chat` |
| Financial data in logs | Middleware strips body from `/api/saltedge/sync` responses before any logging |
| Financial data in Postgres | Never written — Postgres only holds auth + connection IDs |
| Raw transactions to Claude | Blocked at aggregate builder — only category totals sent |
| Sync data in transit | HTTPS only (Vercel enforces TLS 1.3) |

### Auth & sessions

| Mechanism | Detail |
|-----------|--------|
| Session storage | httpOnly, Secure, SameSite=Lax cookies (better-auth default) |
| Session expiry | 7 days, rolling (refreshed on activity) |
| Magic link expiry | 10 minutes, single-use |
| CSRF protection | better-auth includes CSRF token validation |
| Salt Edge API key | Server env var only — never exposed to client |
| Anthropic API key | Server env var only — never in client bundle |

### Salt Edge webhook validation

```typescript
// lib/saltedge/webhook.ts
// Every webhook POST validated with Salt Edge's HMAC-SHA256 signature
import { createHmac } from "crypto"

export function validateWebhookSignature(
  body: string,
  signatureHeader: string,
  secret: string
): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex")
  return expected === signatureHeader
}
```

### AI rate limiting

- Vercel KV token bucket: **20 AI queries per user per day** (configurable)
- Per-IP rate limit on `/api/ai/chat`: 30 requests/hour
- Max question length: 500 characters
- Max history turns sent: 6 (prevents prompt injection via long history)

### Content Security Policy

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-eval';         # Next.js requires unsafe-eval in dev
  connect-src 'self' https://www.saltedge.com https://api.anthropic.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob:;
  frame-src https://www.saltedge.com;      # Salt Edge hosted connect UI
```

---

## 9. PWA & offline strategy

### Service worker (next-pwa + Workbox)

| Resource type | Cache strategy | TTL |
|---------------|---------------|-----|
| HTML shell (`/`, `/ka/`, `/en/`) | `NetworkFirst` → fallback to cache | 24h |
| JS/CSS bundles (versioned) | `CacheFirst` | Forever (immutable) |
| Fonts (Noto Serif Georgian, Mulish) | `CacheFirst` | 30 days |
| API routes `/api/*` | `NetworkOnly` | — |
| Images / icons | `CacheFirst` | 7 days |
| Offline fallback page | Pre-cached on SW install | — |

**Financial data is never cached by the service worker.** It lives only in IndexedDB, which persists independently of the SW cache.

### Offline capabilities

| Feature | Offline behavior |
|---------|-----------------|
| Dashboard charts | ✅ Full access (reads IndexedDB) |
| Transaction list | ✅ Full access (IndexedDB) |
| AI chat | ❌ Disabled — toast: "AI chat requires connection" |
| Bank sync | ❌ Disabled — queued for next connection |
| Settings | ✅ Available (reads local preferences) |

### PWA manifest

```json
{
  "name": "Fain — AI Financial Controller",
  "short_name": "ფეინი",
  "description": "AI ფინანსური კონტროლი SME-სთვის",
  "start_url": "/ka/",
  "display": "standalone",
  "background_color": "#fafaf9",
  "theme_color": "#1c1917",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "shortcuts": [
    {
      "name": "ჩეთი",
      "url": "/ka/",
      "description": "AI-სთან საუბარი"
    }
  ]
}
```

---

## 10. i18n architecture

**Library**: `next-intl` (native App Router support)

### Route structure

```
https://fain.app/          → 301 → /ka/ (or /en/ based on Accept-Language)
https://fain.app/ka/       → Georgian UI
https://fain.app/en/       → English UI
https://fain.app/ka/connect → Bank connection (Georgian)
https://fain.app/en/connect → Bank connection (English)
```

### Locale detection order (middleware)

1. `NEXT_LOCALE` cookie (user's explicit choice)
2. `Accept-Language` header
3. Default: `ka` (Georgian first)

### Message file structure

```json
// messages/ka.json (excerpt)
{
  "nav": {
    "dashboard": "დაფა",
    "connect": "ბანკის დაკავშირება",
    "settings": "პარამეტრები"
  },
  "chat": {
    "placeholder": "დასვი შეკითხვა...",
    "examples": [
      "რა არის ჩემი Runway?",
      "სად დავხარჯე ყველაზე მეტი?",
      "გაჩვენე გასული კვარტლის Burn Rate"
    ]
  },
  "metrics": {
    "runway": "Runway",
    "burnRate": "Burn Rate",
    "netCashFlow": "წმინდა ფულადი ნაკადი"
  }
}
```

### Currency formatting

```typescript
// lib/aggregates/formatter.ts

export function formatGEL(amount: number, locale: "ka" | "en"): string {
  return new Intl.NumberFormat(locale === "ka" ? "ka-GE" : "en-US", {
    style: "currency",
    currency: "GEL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
// ka-GE: ₾12,450
// en-US: GEL 12,450
```

### Font loading strategy

```typescript
// app/[locale]/layout.tsx
import { Mulish, Noto_Serif_Georgian } from "next/font/google"

const mulish = Mulish({
  subsets: ["latin"],
  variable: "--font-mulish",
  display: "swap",
})

// Noto Serif Georgian is large (~2MB) — only load for Georgian locale
const notoGeorgian = Noto_Serif_Georgian({
  subsets: ["georgian"],
  variable: "--font-georgian",
  display: "swap",
  preload: locale === "ka",  // only preload if on Georgian locale
})
```

---

## 11. Key decisions & trade-offs

### Decision 1: IndexedDB-only for financial data

**Why**: Core privacy differentiator. No server = no breach risk for financial data.

**Trade-offs**:
- ✅ Zero server-side financial data liability
- ✅ Faster dashboard (no network round-trip for reads)
- ❌ No multi-device sync (data on one browser only)
- ❌ Data lost if browser storage is cleared
- ❌ No server-side search or analytics

**Mitigation**: CSV/JSON export feature. Clear warning before storage clear. In v2: optional end-to-end encrypted cloud backup (user-controlled key).

---

### Decision 2: Next.js App Router + Vercel

**Why**: Best DX for solo dev. RSC reduces client bundle. Vercel gives instant deploys, edge middleware, and KV with zero config.

**Trade-offs**:
- ✅ ~0 DevOps overhead
- ✅ Edge middleware for auth + i18n in one place
- ✅ ISR + RSC for marketing pages
- ❌ Vercel vendor lock-in (mitigated by avoiding Vercel-specific APIs)
- ❌ Cold starts on serverless (100–300ms) — acceptable for auth + sync routes

---

### Decision 3: Drizzle + Neon Postgres

**Why**: Drizzle is the most TypeScript-idiomatic ORM. Neon is serverless-native with built-in connection pooling — no PgBouncer config needed. Free tier handles MVP comfortably.

**Trade-offs**:
- ✅ Type-safe queries without verbosity
- ✅ Neon's HTTP driver works in Edge runtime
- ❌ Drizzle migrations require `drizzle-kit push` or manual migration files
- **Rule**: migrations are additive-only for MVP. No column drops until v2.

---

### Decision 4: Dexie.js for IndexedDB

**Why**: Best TypeScript experience for IndexedDB. `useLiveQuery` makes reactive UI trivial — dashboard re-renders automatically as transactions stream in.

**Trade-offs**:
- ✅ Reactive queries = no manual re-fetch logic
- ✅ IndexedDB upgrade migrations built-in (versioned schema)
- ❌ Dexie is client-only (no SSR) — components using `useLiveQuery` must be `"use client"`

---

### Decision 5: Salt Edge for bank connectivity

**Why**: Supports BOG and TBC natively. Covers 5000+ global banks for future expansion. Established compliance (PSD2/open banking).

**Trade-offs**:
- ✅ Georgian banks supported out of the box
- ✅ Handles bank auth UX (no need to build screen-scraping)
- ❌ Per-connection pricing at scale
- ❌ Salt Edge controls the connect UI (limited branding inside their flow)
- **Mitigation at scale**: evaluate switching to direct open banking APIs for BOG/TBC to reduce cost.

---

### Decision 6: better-auth

**Why**: Modern, actively maintained, TypeScript-first auth library. Magic link + Google OAuth covers all SME founder auth patterns. Drizzle adapter works natively.

**Trade-offs**:
- ✅ No external auth service fees
- ✅ Full control over auth schema
- ❌ Smaller community than NextAuth/Clerk — less StackOverflow coverage
- ❌ You own email deliverability (use Resend for reliability)

---

### Decision 7: Claude Sonnet for AI

**Why**: Best intelligence-to-cost ratio. Handles Georgian language natively. Streaming works with Vercel's SSE response.

**Trade-offs**:
- ✅ Native Georgian support
- ✅ Strong financial reasoning
- ❌ Per-token cost — mitigate with rate limiting (20 queries/user/day on free tier)
- ❌ Anthropic dependency — mitigate by keeping prompt logic abstracted behind `lib/ai/`

---

## 12. Scaling path

### Phase 1: MVP (0–1K users)

Current architecture is sufficient. No changes needed.

- Neon free tier: 512MB storage, 0.5 compute units — handles auth for 1K users easily
- Vercel Hobby/Pro: handles traffic
- Salt Edge: Starter plan

### Phase 2: Growth (1K–20K users)

- Add **Vercel KV** for AI rate limiting (already in architecture, just enable)
- Add **Sentry** for error tracking (`@sentry/nextjs`)
- Add **PostHog** for analytics (self-hostable, privacy-compliant)
- Add **Resend** webhooks for email delivery monitoring
- Consider **Salt Edge webhook queue** via Upstash QStash (if webhook volume increases)
- Neon: upgrade to paid plan for more compute + connection pooling

### Phase 3: Scale (20K–100K users)

- Move Salt Edge sync to **background jobs** (Vercel Cron or Inngest) — take sync off the request path
- Add **Redis** (Upstash) for AI context caching (users who ask similar questions)
- Consider **direct BOG/TBC APIs** alongside Salt Edge to reduce per-connection cost
- Evaluate **end-to-end encrypted cloud backup** for IndexedDB (user-managed key) — unlocks multi-device
- Add **Vercel Analytics** + Web Vitals monitoring
- Add **Cloudflare** in front of Vercel for DDoS protection

### What should NOT change

- Financial data in IndexedDB only — this is the product's core trust guarantee
- AI receives only aggregates — this must survive every scaling phase
- Server stateless w.r.t. financial data — never store transactions in Postgres regardless of scale

---

*Generated by Fain architecture session — June 2026*
*Stack: Next.js 16 · better-auth · Dexie/IndexedDB · Salt Edge · Claude Sonnet · Drizzle · Neon · Vercel · next-intl · next-pwa · Recharts*
