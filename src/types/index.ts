// ─── Auth ───────────────────────────────────────────────
export interface FainUser {
  id: string          // sha256 of email, never raw email on server
  email: string       // stored client-side only
  name?: string
  company?: string
  createdAt: Date
}

// ─── Bank connections ────────────────────────────────────
export type Provider = 'bog' | 'tbc' | 'nbg' | 'quickbooks' | 'xero'

export interface BankConnection {
  id: string
  provider: Provider
  saltEdgeConnectionId: string
  saltEdgeToken: string          // stored in IndexedDB, never server
  accountIds: string[]
  connectedAt: Date
  expiresAt: Date                // 90-day consent window
  lastSyncedAt?: Date
}

// ─── Accounts ────────────────────────────────────────────
export type Currency = 'GEL' | 'USD' | 'EUR'
export type AccountType = 'checking' | 'savings' | 'credit' | 'loan'

export interface Account {
  id: string
  connectionId: string
  provider: Provider
  name: string
  currency: Currency
  type: AccountType
  balance: number
  balanceUpdatedAt: Date
}

// ─── Transactions ─────────────────────────────────────────
export type TransactionType = 'debit' | 'credit'

export interface Transaction {
  id: string
  accountId: string
  date: Date
  amount: number                 // always positive; use type for direction
  type: TransactionType
  currency: Currency
  description: string
  category?: string
  merchantName?: string
  pending: boolean
}

// ─── Aggregates (used for AI context) ────────────────────
export interface MonthlyTotal {
  year: number
  month: number                  // 1-12
  income: number
  expenses: number
  net: number
  currency: Currency
}

export interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
  currency: Currency
  period: { from: Date; to: Date }
}

export interface CashPosition {
  totalCash: number
  currency: Currency
  byAccount: { accountId: string; balance: number }[]
  asOf: Date
}

// ─── What-if scenarios ────────────────────────────────────
export interface ScenarioLever {
  label: string
  monthlyAmount: number          // positive = cost, negative = savings
  startMonth?: number            // months from now (default 0)
}

export interface Scenario {
  id: string
  name: string
  levers: ScenarioLever[]
  createdAt: Date
}

export interface RunwayProjection {
  monthsRemaining: number
  zeroDate: Date
  cashAtLowest: number
  lowestDate: Date
  projectedBalances: { month: Date; balance: number }[]
}

// ─── AI conversation ──────────────────────────────────────
export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  metrics?: InlineMetric[]
  followUps?: string[]
  createdAt: Date
}

export interface InlineMetric {
  key: string
  value: string
  delta?: string
  deltaPositive?: boolean
}

// ─── UI ───────────────────────────────────────────────────
export type Locale = 'en' | 'ka' | 'ru'
