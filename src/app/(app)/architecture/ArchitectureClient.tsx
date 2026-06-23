'use client'

import { useState } from 'react'
import { MermaidDiagram } from '@/components/ui/MermaidDiagram'

// ─── Diagram definitions ──────────────────────────────────────────────────────

const DIAGRAMS = [
  {
    id: 'system',
    label: 'System Overview',
    description: 'Browser vs. server split — the privacy boundary',
    chart: `
flowchart TB
  subgraph Browser["🌐  Browser  (user's device)"]
    direction TB
    IDB[(IndexedDB\nDexie)]
    SALT_CB[Salt Edge\nConnect Widget]
    AI_CTX[buildAiContext\naggregates only]
    UI[Next.js UI\nReact 19]

    UI --> IDB
    IDB --> AI_CTX
    UI --> SALT_CB
  end

  subgraph Server["🖥  Next.js Server  (Vercel)"]
    direction TB
    AUTH[better-auth\nSession]
    API_AI[POST /api/ai/chat\nSSE stream]
    API_BANK[/api/bank/*\nSalt Edge proxy]
    API_CONV[/api/conversations\nNeon Postgres]
    CRYPTO[AES-256-GCM\nencrypt.server.ts]

    AUTH --> API_AI
    AUTH --> API_BANK
    AUTH --> API_CONV
    API_AI --> CRYPTO
    API_CONV --> CRYPTO
  end

  subgraph External["☁  External Services"]
    NEON[(Neon\nPostgres)]
    SALTEDGE[Salt Edge\nAPI]
    CLAUDE[Anthropic\nClaude Sonnet]
    RESEND[Resend\nEmail]
    TWILIO[Twilio\nSMS]
  end

  AI_CTX -- "category totals\n(no raw txns)" --> API_AI
  API_AI --> CLAUDE
  CLAUDE -- SSE chunks --> API_AI
  CRYPTO --> NEON
  API_BANK --> SALTEDGE
  SALTEDGE -- accounts + txns --> Browser
  AUTH --> RESEND
  AUTH --> TWILIO

  style Browser fill:#faf8f5,stroke:#d4cfc8,color:#29261b
  style Server fill:#f0ece6,stroke:#b5af9e,color:#29261b
  style External fill:#e8e2da,stroke:#a09890,color:#29261b
`,
  },
  {
    id: 'auth',
    label: 'Auth Flow',
    description: 'Registration, login, 2FA — all paths through better-auth',
    chart: `
sequenceDiagram
  actor User
  participant UI as Next.js UI
  participant BA as better-auth\n/api/auth/[...all]
  participant DB as Neon Postgres
  participant Email as Resend
  participant SMS as Twilio

  Note over User,SMS: Registration path
  User->>UI: Email + password
  UI->>BA: POST /api/auth/sign-up/email
  BA->>DB: INSERT user, account
  BA->>Email: Verification link (Resend)
  Email-->>User: Verify email
  User->>BA: GET /verify?token=…
  BA->>DB: emailVerified = true

  Note over User,SMS: Login path
  User->>UI: Google / Microsoft OAuth
  UI->>BA: GET /api/auth/google
  BA->>DB: Upsert user + account\n(accountLinking enabled)
  BA->>DB: INSERT session
  BA-->>UI: Set session cookie (30 days)

  Note over User,SMS: Magic link path
  User->>UI: Enter email
  UI->>BA: POST /api/auth/magic-link/send
  BA->>Email: Magic link (15 min TTL)
  Email-->>User: Click link
  User->>BA: GET /api/auth/magic-link/verify
  BA->>DB: INSERT session

  Note over User,SMS: 2FA (TOTP or SMS)
  User->>BA: Submit TOTP code
  BA->>DB: Validate TOTP secret
  BA-->>UI: Session upgraded

  User->>UI: Enable SMS 2FA
  UI->>BA: POST /api/auth/phone-number/send-otp
  BA->>SMS: 6-digit OTP (10 min, Twilio)
  SMS-->>User: SMS received
  User->>BA: POST /api/auth/phone-number/verify
`,
  },
  {
    id: 'bank',
    label: 'Bank Connection',
    description: 'Salt Edge connect flow — data stays in browser',
    chart: `
sequenceDiagram
  actor User
  participant UI as Browser UI
  participant API as /api/bank/*
  participant SE as Salt Edge API
  participant DB as Neon Postgres\nbankConnections
  participant IDB as IndexedDB\n(Dexie)

  User->>UI: Click "Connect Bank"
  UI->>API: POST /api/bank/connect
  API->>DB: SELECT saltEdgeCustomerId\n(reuse if exists)
  alt First connect
    API->>SE: createCustomer(userId)
    SE-->>API: { customer_id }
    API->>DB: INSERT bankConnections\n(status: pending)
  end
  API->>SE: createConnectSession(customerId)
  SE-->>API: { connect_url, expires_at }
  API-->>UI: { connect_url }

  UI->>SE: Redirect → Salt Edge widget
  User->>SE: Select bank + credentials
  SE-->>UI: Redirect → /connect-bank/callback

  UI->>API: POST /api/bank/register\n{ connectionId }
  API->>SE: GET connection details
  SE-->>API: connection object
  API->>DB: UPDATE bankConnections\n(status: connected)
  API-->>UI: { success }

  UI->>API: GET /api/bank/accounts
  API->>SE: List accounts
  SE-->>API: accounts[]
  API-->>UI: accounts[]
  UI->>IDB: db.accounts.bulkPut(accounts)

  UI->>API: GET /api/bank/transactions
  API->>SE: List transactions (24 mo)
  SE-->>API: transactions[]
  API-->>UI: transactions[]
  UI->>IDB: db.transactions.bulkPut(txns)
  Note over IDB: Raw data stays in browser ONLY
`,
  },
  {
    id: 'ai',
    label: 'AI Pipeline',
    description: 'How a user question becomes a Claude response',
    chart: `
flowchart TD
  Q([User question\nin /ask]) --> CTX

  subgraph Browser["Browser"]
    CTX["getAiContext()\nuseAiContext.ts"]
    IDB[(IndexedDB\nDexie)]
    CTX --> Q1[getCashPosition]
    CTX --> Q2[getMonthlyTotals]
    CTX --> Q3[getTransactionsByCategory]
    IDB --> Q1 & Q2 & Q3
    Q1 & Q2 & Q3 --> SUMMARY["buildAiContext()\nPlain-text summary\ncategory totals only"]
  end

  SUMMARY -- "POST /api/ai/chat\n{ message, context, history }" --> ROUTE

  subgraph Server["Next.js Server"]
    ROUTE["/api/ai/chat\nroute.ts"]
    RL[rateLimit\n30 req / min]
    AUTH2[auth.getSession\nverify ownership]
    ENC[encrypt(userMessage)\nAES-256-GCM]
    NEON[(Neon Postgres\nconversations +\nchatMessages)]
    CLAUDE_CALL[anthropic.messages\n.stream()]
    SAVE[encrypt(response)\nsave to Neon]

    ROUTE --> AUTH2 --> RL
    RL --> ENC --> NEON
    ROUTE --> CLAUDE_CALL
    CLAUDE_CALL --> SAVE --> NEON
  end

  subgraph System["System Prompt"]
    SP["You are Fain…\nBlock syntax: :::prose\n:::metrics :::hbars\n:::opts :::verdict\n:::followups"]
  end

  SP --> CLAUDE_CALL
  CLAUDE_CALL -- "SSE chunks\ndata: {text}" --> Browser
  Browser -- "Render FainResponse\nparsed block syntax" --> UI([Rendered answer\nwith metrics])
`,
  },
  {
    id: 'db-browser',
    label: 'IndexedDB Schema',
    description: 'Dexie tables — lives in browser, never on server',
    chart: `
erDiagram
  FainUser {
    string id PK
  }
  BankConnection {
    string id PK
    string provider
    string status
    date expiresAt
  }
  Account {
    string id PK
    string connectionId FK
    string provider
    string type
    float balance
    string currency
  }
  Transaction {
    string id PK
    string accountId FK
    date date
    string type
    float amount
    string category
    string currency
  }
  SyncMeta {
    string id PK
    date lastSyncedAt
    int transactionCount
  }
  Scenario {
    string id PK
    date createdAt
  }

  BankConnection ||--o{ Account : "has"
  Account ||--o{ Transaction : "has"
  Account ||--|| SyncMeta : "tracks"
`,
  },
  {
    id: 'db-server',
    label: 'Postgres Schema',
    description: 'Neon tables — managed by Drizzle ORM, chat encrypted at rest',
    chart: `
erDiagram
  user {
    text id PK
    text email
    text name
    bool emailVerified
    bool twoFactorEnabled
  }
  session {
    text id PK
    text userId FK
    text token
    timestamp expiresAt
  }
  account {
    text id PK
    text userId FK
    text providerId
    text accountId
  }
  twoFactor {
    text id PK
    text userId FK
    text secret
    text backupCodes
  }
  passkey {
    text id PK
    text userId FK
    text publicKey
    text credentialID
  }
  userProfiles {
    text id PK
    text userId FK
    text jobRole
    text organisation
    text language
    text currencyPref
    json notifPrefs
  }
  bankConnections {
    text id PK
    text userId FK
    text saltEdgeCustomerId
    text saltEdgeConnectionId
    text status
    text providerName
  }
  syncLog {
    text id PK
    text connectionId FK
    int transactionsCount
    text status
  }
  conversations {
    text id PK
    text userId FK
    text title
    timestamp updatedAt
  }
  chatMessages {
    text id PK
    text conversationId FK
    text userId
    text role
    text contentEnc
    text iv
  }
  waitlist {
    text id PK
    text email
    text status
  }

  user ||--o{ session : "has"
  user ||--o{ account : "linked"
  user ||--o| twoFactor : "2FA"
  user ||--o{ passkey : "passkeys"
  user ||--o| userProfiles : "profile"
  user ||--o{ bankConnections : "connects"
  bankConnections ||--o{ syncLog : "logs"
  user ||--o{ conversations : "chats"
  conversations ||--o{ chatMessages : "messages"
`,
  },
  {
    id: 'routes',
    label: 'App Routes',
    description: 'Next.js App Router — all pages and route groups',
    chart: `
flowchart TD
  ROOT["/  Landing page"] --> AUTH_G & APP_G & ONBOARD & ADMIN

  subgraph AUTH_G["(auth) group — no session required"]
    LOGIN["/login\nLoginForm"]
    REGISTER["/register\nRegisterForm"]
    FORGOT["/forgot-password"]
    RESET["/forgot-password/reset"]
    CONNECT["/connect-bank\nConnectBankClient"]
    CALLBACK["/connect-bank/callback"]
  end

  subgraph APP_G["(app) group — session required, app shell"]
    ASK["/ask\nAskClient\nuseAiChat"]
    DASHBOARD["/dashboard\nDashboardClient"]
    CASHFLOW["/cash-flow\nCashFlowClient"]
    TRANSACTIONS["/transactions\nTransactionsClient"]
    ACCOUNTS["/accounts\nAccountsClient"]
    FEED["/feed\nFeedClient"]
    COMMAND["/command\nCommandClient"]
    SETTINGS["/settings\nSettingsClient"]
    ARCH["/architecture\n← you are here"]
  end

  ONBOARD["/onboarding\nOnboardingWizard"]
  ADMIN["/admin\nAdmin panel"]

  subgraph API["API Routes"]
    API_AUTH["/api/auth/[...all]\nbetter-auth handler"]
    API_CHAT["/api/ai/chat\nSSE stream"]
    API_CONV["/api/conversations\nconversation CRUD"]
    API_MSG["/api/conversations/id/messages\nmessage list"]
    API_BC["/api/bank/connect\ncreate SE session"]
    API_BR["/api/bank/register\npost-callback"]
    API_BA["/api/bank/accounts\nfetch + sync"]
    API_BT["/api/bank/transactions\nfetch + sync"]
    API_BD["/api/bank/disconnect"]
    API_BW["/api/bank/webhook\nSE events"]
    API_WL["/api/waitlist"]
    API_ON["/api/onboarding"]
    API_HE["/api/health"]
  end
`,
  },
  {
    id: 'components',
    label: 'Component Tree',
    description: 'UI component hierarchy and data dependencies',
    chart: `
flowchart TD
  ROOT_LAYOUT["app/layout.tsx\nLocaleBody · ToastProvider\nServiceWorkerRegistration"]

  ROOT_LAYOUT --> AUTH_LAYOUT & APP_LAYOUT

  AUTH_LAYOUT["(auth)/layout.tsx\nclean shell"]
  AUTH_LAYOUT --> LoginForm & RegisterForm & ForgotPasswordForm

  APP_LAYOUT["(app)/layout.tsx\nUserProvider · UserGuard"]
  APP_LAYOUT --> SIDEBAR & TOPBAR & MOBILENAV & MAIN

  SIDEBAR["Sidebar\nuseServerConversations\nuseLiveQuery(connections)"]
  TOPBAR["TopBar"]
  MOBILENAV["MobileNav"]
  MAIN["main\nErrorBoundary"]

  MAIN --> ASK_C & DASH_C & CASH_C & TX_C & ACC_C

  ASK_C["AskClient\nuseAiChat()\nFainResponse renderer\nblock syntax parser"]
  DASH_C["DashboardClient\nuseLiveQuery\nRecharts AreaChart"]
  CASH_C["CashFlowClient\nuseLiveQuery\nRecharts"]
  TX_C["TransactionsClient\nuseLiveQuery"]
  ACC_C["AccountsClient\nuseLiveQuery"]

  subgraph UI_LIB["ui/ component library"]
    CARD["Card · CardHeader\nCardTitle"]
    BUTTON["Button"]
    INPUT["Input"]
    CHIP["Chip"]
    METRIC["MetricCard"]
    CHARTCARD["ChartCard"]
    BRAND["Brand / Mark"]
    TOAST["Toast · useToast"]
    MERMAID["MermaidDiagram ← new"]
  end

  subgraph LIB["lib/ utilities"]
    AI_HOOK["useAiChat\nSSE consumer"]
    AI_CTX["useAiContext\nbuildAiContext"]
    DB_Q["queries.ts\ngetCashPosition\ngetMonthlyTotals\ngetTransactionsByCategory"]
    DB_S["schema.ts\nDexie FainDatabase"]
    AUTH_C["auth/client.ts\nbetter-auth client"]
    I18N["LocaleContext\nstrings.ts"]
    UTILS["cn · currency\ncategories · dates"]
  end

  ASK_C --> AI_HOOK --> AI_CTX --> DB_Q --> DB_S
  DASH_C & CASH_C & TX_C & ACC_C --> DB_Q
`,
  },
]

// ─── Tab types ────────────────────────────────────────────────────────────────

type DiagramId = typeof DIAGRAMS[number]['id']

// ─── Component ────────────────────────────────────────────────────────────────

export function ArchitectureClient() {
  const [active, setActive] = useState<DiagramId>('system')
  const current = DIAGRAMS.find(d => d.id === active) ?? DIAGRAMS[0]!

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontSize: 28,
          fontWeight: 400,
          color: 'var(--text-primary)',
          margin: 0,
          letterSpacing: '-0.02em',
        }}>
          Architecture
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '6px 0 0' }}>
          Live system diagrams — generated from the actual codebase
        </p>
      </div>

      {/* Tab row */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 24,
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: 16,
      }}>
        {DIAGRAMS.map(d => (
          <button
            key={d.id}
            onClick={() => setActive(d.id as DiagramId)}
            style={{
              padding: '5px 13px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: active === d.id ? 'var(--color-tangerine-500, #E8650A)' : 'var(--border-subtle)',
              background: active === d.id ? 'var(--tan-soft, #fff4ee)' : 'transparent',
              color: active === d.id ? 'var(--color-tangerine-500, #E8650A)' : 'var(--text-secondary)',
              fontSize: 12.5,
              fontWeight: active === d.id ? 600 : 400,
              cursor: 'pointer',
              transition: 'all .12s',
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Active diagram */}
      <div>
        <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', margin: '0 0 16px' }}>
          {current.description}
        </p>
        <MermaidDiagram
          key={active}   /* re-mount on tab change so Mermaid re-renders */
          chart={current.chart}
          title={current.label}
        />
      </div>

      {/* Footer */}
      <p style={{ marginTop: 32, fontSize: 11.5, color: 'var(--text-tertiary)', textAlign: 'center' }}>
        Diagrams reflect the current <code style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11 }}>src/</code> codebase · rendered with Mermaid · update charts in <code style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11 }}>ArchitectureClient.tsx</code>
      </p>
    </div>
  )
}
