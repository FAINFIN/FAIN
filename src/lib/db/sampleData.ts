/**
 * Realistic sample data for a Georgian SME — used when no real bank is connected.
 * All amounts in GEL. Company: "TechFlow Georgia" — a 12-person SaaS startup.
 */
import type { Account, Transaction } from '@/types'

const NOW    = new Date()
const thisY  = NOW.getFullYear()
const thisM  = NOW.getMonth() // 0-indexed

function d(monthsAgo: number, day: number): Date {
  const dt = new Date(thisY, thisM - monthsAgo, day)
  return dt
}

function tx(
  id: string, accountId: string, date: Date,
  amount: number, type: 'credit' | 'debit',
  description: string, category: string
): Transaction {
  return { id, accountId, date, amount, type, description, category, currency: 'GEL', pending: false }
}

export const SAMPLE_ACCOUNTS: Account[] = [
  {
    id:               'sample-bog-main',
    connectionId:     'sample-connection',
    provider:         'bog',
    name:             'BOG Business Current',
    type:             'checking',
    balance:          487_320,
    currency:         'GEL',
    balanceUpdatedAt: new Date(),
  },
  {
    id:               'sample-tbc-usd',
    connectionId:     'sample-connection',
    provider:         'tbc',
    name:             'TBC Business USD',
    type:             'checking',
    balance:          62_500,
    currency:         'USD',
    balanceUpdatedAt: new Date(),
  },
]

// Generate 12 months of transactions
export const SAMPLE_TRANSACTIONS: Transaction[] = [
  // ── RECURRING INCOME ──────────────────────────────────
  // SaaS MRR — grows from ₾155k → ₾195k over 12 months
  ...Array.from({ length: 12 }, (_, i) => tx(
    `inc-mrr-${i}`, 'sample-bog-main', d(11 - i, 5),
    155_000 + i * 3_400, 'credit', 'Stripe MRR payout', 'SaaS Revenue'
  )),

  // Services/consulting — occasional
  tx('inc-svc-1', 'sample-bog-main', d(10, 14), 18_500, 'credit', 'Consulting — Tegeta Motors', 'Services'),
  tx('inc-svc-2', 'sample-bog-main', d( 7, 22), 24_000, 'credit', 'Implementation — GreenCo', 'Services'),
  tx('inc-svc-3', 'sample-bog-main', d( 3, 11), 31_000, 'credit', 'Integration project', 'Services'),

  // ── PAYROLL ───────────────────────────────────────────
  ...Array.from({ length: 12 }, (_, i) => tx(
    `exp-payroll-${i}`, 'sample-bog-main', d(11 - i, 25),
    94_500 + i * 1_200, 'debit', 'Payroll — 12 employees', 'Payroll'
  )),

  // ── INFRASTRUCTURE ────────────────────────────────────
  ...Array.from({ length: 12 }, (_, i) => tx(
    `exp-aws-${i}`, 'sample-bog-main', d(11 - i, 3),
    8_200 + Math.round(i * 180), 'debit', 'AWS invoice', 'Infrastructure'
  )),

  // ── OFFICE ────────────────────────────────────────────
  ...Array.from({ length: 12 }, (_, i) => tx(
    `exp-rent-${i}`, 'sample-bog-main', d(11 - i, 1),
    12_000, 'debit', 'Office rent — Rustaveli HQ', 'Rent'
  )),

  // ── SAAS TOOLS ────────────────────────────────────────
  ...Array.from({ length: 12 }, (_, i) => tx(
    `exp-tools-${i}`, 'sample-bog-main', d(11 - i, 8),
    3_450, 'debit', 'SaaS subscriptions (Slack, Notion, GitHub)', 'Software'
  )),

  // ── MARKETING ─────────────────────────────────────────
  tx('exp-mkt-1', 'sample-bog-main', d(11, 15), 14_000, 'debit', 'Google Ads', 'Marketing'),
  tx('exp-mkt-2', 'sample-bog-main', d( 9, 15), 18_500, 'debit', 'Google Ads + LinkedIn', 'Marketing'),
  tx('exp-mkt-3', 'sample-bog-main', d( 7, 15), 16_000, 'debit', 'Google Ads', 'Marketing'),
  tx('exp-mkt-4', 'sample-bog-main', d( 5, 15), 22_000, 'debit', 'Google Ads + event sponsorship', 'Marketing'),
  tx('exp-mkt-5', 'sample-bog-main', d( 3, 15), 19_000, 'debit', 'Google Ads', 'Marketing'),
  tx('exp-mkt-6', 'sample-bog-main', d( 1, 15), 21_000, 'debit', 'Google Ads + Product Hunt', 'Marketing'),

  // ── LEGAL / ACCOUNTING ────────────────────────────────
  tx('exp-legal-1', 'sample-bog-main', d(11, 20), 4_500, 'debit', 'Legal retainer', 'Legal'),
  tx('exp-legal-2', 'sample-bog-main', d( 8, 20), 4_500, 'debit', 'Legal retainer', 'Legal'),
  tx('exp-legal-3', 'sample-bog-main', d( 5, 20), 4_500, 'debit', 'Legal retainer', 'Legal'),
  tx('exp-legal-4', 'sample-bog-main', d( 2, 20), 4_500, 'debit', 'Legal retainer', 'Legal'),
  tx('exp-acct-1',  'sample-bog-main', d(11, 21), 1_800, 'debit', 'Accounting firm', 'Accounting'),
  tx('exp-acct-2',  'sample-bog-main', d( 6, 21), 1_800, 'debit', 'Accounting firm', 'Accounting'),
  tx('exp-acct-3',  'sample-bog-main', d( 1, 21), 1_800, 'debit', 'Accounting firm', 'Accounting'),

  // ── HARDWARE / ONE-OFFS ───────────────────────────────
  tx('exp-hw-1', 'sample-bog-main', d(10, 12), 8_900, 'debit', 'MacBook Pro × 2', 'Equipment'),
  tx('exp-hw-2', 'sample-bog-main', d( 4, 18), 3_200, 'debit', 'Monitor + accessories', 'Equipment'),

  // ── TRAVEL ────────────────────────────────────────────
  tx('exp-travel-1', 'sample-bog-main', d(9, 5), 6_400, 'debit', 'SaaStr Europe — flights + hotel', 'Travel'),
  tx('exp-travel-2', 'sample-bog-main', d(3, 8), 4_800, 'debit', 'Web Summit Lisbon', 'Travel'),
]

/**
 * Load sample data into Dexie. Call this when user skips bank connection.
 * Idempotent — checks first to avoid duplicates.
 */
export async function loadSampleData(): Promise<void> {
  const { getDb } = await import('./schema')
  const db = getDb()

  const existing = await db.accounts.count()
  if (existing > 0) return // already have data

  // Write a synthetic connection record
  await db.connections.add({
    id:                   'sample-connection',
    provider:             'bog',
    saltEdgeConnectionId: 'sample',
    saltEdgeToken:        'sample',
    accountIds:           SAMPLE_ACCOUNTS.map(a => a.id),
    connectedAt:          new Date(),
    expiresAt:            new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  })

  await db.accounts.bulkAdd(SAMPLE_ACCOUNTS)
  await db.transactions.bulkAdd(SAMPLE_TRANSACTIONS)
}

export function isSampleData(): Promise<boolean> {
  return import('./schema').then(({ getDb }) =>
    getDb().connections.where('id').equals('sample-connection').count().then(n => n > 0)
  )
}
