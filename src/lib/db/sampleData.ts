/**
 * Realistic demo data for a Georgian SME — used when no real bank is connected.
 * Company: "TechFlow Georgia" — a 12-person SaaS startup in Tbilisi.
 * Covers 24 months of transactions across two accounts (BOG GEL + TBC USD).
 */
import type { Account, Transaction } from '@/types'

const NOW   = new Date()
const thisY = NOW.getFullYear()
const thisM = NOW.getMonth() // 0-indexed

function d(monthsAgo: number, day: number): Date {
  return new Date(thisY, thisM - monthsAgo, day)
}

function tx(
  id: string,
  accountId: string,
  date: Date,
  amount: number,
  type: 'credit' | 'debit',
  description: string,
  category: string,
  merchantName?: string,
): Transaction {
  return {
    id, accountId, date, amount, type, description, category,
    currency: accountId === 'sample-tbc-usd' ? 'USD' : 'GEL',
    pending: false,
    merchantName,
  }
}

// ─── Accounts ────────────────────────────────────────────────────────────────
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
    balance:          23_850,
    currency:         'USD',
    balanceUpdatedAt: new Date(),
  },
]

// ─── Transactions — 24 months ─────────────────────────────────────────────────
export const SAMPLE_TRANSACTIONS: Transaction[] = [

  // ── RECURRING INCOME: SaaS MRR growing ₾145k → ₾195k over 24 months ─────
  ...Array.from({ length: 24 }, (_, i) => tx(
    `inc-mrr-${i}`, 'sample-bog-main', d(23 - i, 5),
    145_000 + i * 2_100, 'credit',
    'Stripe MRR payout', 'SaaS Revenue', 'Stripe'
  )),

  // ── CONSULTING / SERVICES — one-off client projects ────────────────────────
  tx('inc-svc-1',  'sample-bog-main', d(22, 18), 24_000, 'credit', 'Consulting — Tegeta Motors', 'Services', 'Tegeta Motors'),
  tx('inc-svc-2',  'sample-bog-main', d(19, 9),  18_500, 'credit', 'Integration project — GreenCo', 'Services', 'GreenCo'),
  tx('inc-svc-3',  'sample-bog-main', d(16, 14), 31_000, 'credit', 'Custom dev — Carrefour GE', 'Services', 'Carrefour Georgia'),
  tx('inc-svc-4',  'sample-bog-main', d(13, 22), 27_500, 'credit', 'Consulting — Silknet', 'Services', 'Silknet'),
  tx('inc-svc-5',  'sample-bog-main', d(10, 7),  19_000, 'credit', 'Analytics dashboard — TBC', 'Services', 'TBC Bank'),
  tx('inc-svc-6',  'sample-bog-main', d( 7, 11), 38_000, 'credit', 'Platform migration — Geocell', 'Services', 'Geocell'),
  tx('inc-svc-7',  'sample-bog-main', d( 4, 19), 22_000, 'credit', 'API integration — Maxi', 'Services', 'Maxi'),
  tx('inc-svc-8',  'sample-bog-main', d( 1, 8),  45_000, 'credit', 'Enterprise deal — Wissol', 'Services', 'Wissol'),

  // ── USD INCOME: international clients via TBC USD ──────────────────────────
  tx('inc-usd-1',  'sample-tbc-usd', d(22, 15), 8_500, 'credit',  'Retainer — EU client Q1', 'SaaS Revenue'),
  tx('inc-usd-2',  'sample-tbc-usd', d(19, 15), 8_500, 'credit',  'Retainer — EU client Q2', 'SaaS Revenue'),
  tx('inc-usd-3',  'sample-tbc-usd', d(16, 15), 9_200, 'credit',  'Retainer + upsell', 'SaaS Revenue'),
  tx('inc-usd-4',  'sample-tbc-usd', d(13, 15), 9_200, 'credit',  'Retainer — EU client Q4', 'SaaS Revenue'),
  tx('inc-usd-5',  'sample-tbc-usd', d(10, 15), 11_000, 'credit', 'New contract — DE startup', 'SaaS Revenue'),
  tx('inc-usd-6',  'sample-tbc-usd', d( 7, 15), 11_000, 'credit', 'Retainer — DE + UK clients', 'SaaS Revenue'),
  tx('inc-usd-7',  'sample-tbc-usd', d( 4, 15), 13_500, 'credit', 'Q3 retainers', 'SaaS Revenue'),
  tx('inc-usd-8',  'sample-tbc-usd', d( 1, 15), 14_200, 'credit', 'Q4 retainers', 'SaaS Revenue'),

  // ── PAYROLL — growing from ₾88k → ₾112k as team grows ────────────────────
  ...Array.from({ length: 24 }, (_, i) => tx(
    `exp-payroll-${i}`, 'sample-bog-main', d(23 - i, 25),
    88_000 + i * 1_000, 'debit',
    'Payroll — team salaries', 'Payroll'
  )),

  // ── INFRASTRUCTURE: AWS ───────────────────────────────────────────────────
  ...Array.from({ length: 24 }, (_, i) => tx(
    `exp-aws-${i}`, 'sample-bog-main', d(23 - i, 3),
    7_800 + Math.round(i * 220), 'debit',
    'AWS invoice', 'Infrastructure', 'Amazon Web Services'
  )),

  // ── OFFICE RENT ───────────────────────────────────────────────────────────
  ...Array.from({ length: 18 }, (_, i) => tx(
    `exp-rent-old-${i}`, 'sample-bog-main', d(23 - i, 1),
    9_800, 'debit', 'Office rent — Saburtalo', 'Rent'
  )),
  // moved to bigger office 6 months ago
  ...Array.from({ length: 6 }, (_, i) => tx(
    `exp-rent-new-${i}`, 'sample-bog-main', d(5 - i, 1),
    14_500, 'debit', 'Office rent — Rustaveli HQ', 'Rent'
  )),

  // ── SAAS TOOLS ────────────────────────────────────────────────────────────
  ...Array.from({ length: 24 }, (_, i) => tx(
    `exp-tools-${i}`, 'sample-bog-main', d(23 - i, 8),
    2_850 + (i > 11 ? 600 : 0), 'debit',
    'SaaS tools — Slack, Notion, GitHub, Figma', 'Software'
  )),

  // ── MARKETING ─────────────────────────────────────────────────────────────
  tx('exp-mkt-1',  'sample-bog-main', d(23, 15), 9_000,  'debit', 'Google Ads', 'Marketing', 'Google'),
  tx('exp-mkt-2',  'sample-bog-main', d(21, 15), 11_000, 'debit', 'Google Ads + LinkedIn', 'Marketing', 'Google'),
  tx('exp-mkt-3',  'sample-bog-main', d(19, 15), 10_500, 'debit', 'Google Ads', 'Marketing', 'Google'),
  tx('exp-mkt-4',  'sample-bog-main', d(17, 15), 13_000, 'debit', 'Google Ads + event sponsorship', 'Marketing', 'Google'),
  tx('exp-mkt-5',  'sample-bog-main', d(15, 15), 12_000, 'debit', 'Google Ads', 'Marketing', 'Google'),
  tx('exp-mkt-6',  'sample-bog-main', d(13, 15), 15_000, 'debit', 'Google Ads + LinkedIn', 'Marketing', 'Google'),
  tx('exp-mkt-7',  'sample-bog-main', d(11, 15), 14_000, 'debit', 'Google Ads', 'Marketing', 'Google'),
  tx('exp-mkt-8',  'sample-bog-main', d( 9, 15), 17_000, 'debit', 'Google Ads + Product Hunt', 'Marketing', 'Google'),
  tx('exp-mkt-9',  'sample-bog-main', d( 7, 15), 16_000, 'debit', 'Google Ads', 'Marketing', 'Google'),
  tx('exp-mkt-10', 'sample-bog-main', d( 5, 15), 20_000, 'debit', 'Google Ads + conference booth', 'Marketing', 'Google'),
  tx('exp-mkt-11', 'sample-bog-main', d( 3, 15), 19_000, 'debit', 'Google Ads', 'Marketing', 'Google'),
  tx('exp-mkt-12', 'sample-bog-main', d( 1, 15), 22_000, 'debit', 'Google Ads + LinkedIn', 'Marketing', 'Google'),

  // ── LEGAL & ACCOUNTING ────────────────────────────────────────────────────
  ...Array.from({ length: 8 }, (_, i) => tx(
    `exp-legal-${i}`, 'sample-bog-main', d(23 - i * 3, 20),
    4_500, 'debit', 'Legal retainer — BGI Legal', 'Legal', 'BGI Legal'
  )),
  ...Array.from({ length: 8 }, (_, i) => tx(
    `exp-acct-${i}`, 'sample-bog-main', d(23 - i * 3, 21),
    1_800, 'debit', 'Accounting — Deloitte Georgia', 'Accounting', 'Deloitte'
  )),

  // ── EQUIPMENT / ONE-OFFS ──────────────────────────────────────────────────
  tx('exp-hw-1', 'sample-bog-main', d(22, 12), 9_200,  'debit', 'MacBook Pro × 2', 'Equipment', 'Apple Store'),
  tx('exp-hw-2', 'sample-bog-main', d(18, 9),  2_100,  'debit', 'Standing desks × 4', 'Equipment'),
  tx('exp-hw-3', 'sample-bog-main', d(14, 5),  4_800,  'debit', 'MacBook Air × 1 + monitor', 'Equipment', 'Apple Store'),
  tx('exp-hw-4', 'sample-bog-main', d( 6, 18), 3_400,  'debit', 'MacBook Pro × 1', 'Equipment', 'Apple Store'),
  tx('exp-hw-5', 'sample-bog-main', d( 2, 14), 11_500, 'debit', 'MacBook Pro × 2 + accessories', 'Equipment', 'Apple Store'),

  // ── TRAVEL ────────────────────────────────────────────────────────────────
  tx('exp-travel-1', 'sample-bog-main', d(21, 5),  7_200, 'debit', 'SaaStr Europe — flights + hotel', 'Travel'),
  tx('exp-travel-2', 'sample-bog-main', d(17, 8),  4_100, 'debit', 'Client visit — Warsaw', 'Travel'),
  tx('exp-travel-3', 'sample-bog-main', d(13, 3),  5_800, 'debit', 'Web Summit — Lisbon', 'Travel'),
  tx('exp-travel-4', 'sample-bog-main', d( 9, 6),  6_400, 'debit', 'Team offsite — Batumi', 'Travel'),
  tx('exp-travel-5', 'sample-bog-main', d( 5, 9),  3_900, 'debit', 'Client visit — Amsterdam', 'Travel'),
  tx('exp-travel-6', 'sample-bog-main', d( 1, 7),  8_100, 'debit', 'Collision Conf + client meetings', 'Travel'),

  // ── UTILITIES ─────────────────────────────────────────────────────────────
  ...Array.from({ length: 24 }, (_, i) => tx(
    `exp-util-${i}`, 'sample-bog-main', d(23 - i, 10),
    380 + Math.round(Math.sin(i) * 60), 'debit',
    'Office utilities', 'Utilities'
  )),

  // ── BANK FEES ─────────────────────────────────────────────────────────────
  ...Array.from({ length: 24 }, (_, i) => tx(
    `exp-fees-${i}`, 'sample-bog-main', d(23 - i, 28),
    120, 'debit', 'BOG business account fee', 'Banking Fees', 'Bank of Georgia'
  )),

  // ── FOOD & TEAM ───────────────────────────────────────────────────────────
  tx('exp-food-1',  'sample-bog-main', d(23, 16), 890,  'debit', 'Team lunch — Barbarestan', 'Food & Dining', 'Barbarestan'),
  tx('exp-food-2',  'sample-bog-main', d(21, 20), 1_100, 'debit', 'Team dinner + celebration', 'Food & Dining'),
  tx('exp-food-3',  'sample-bog-main', d(18, 12), 760,  'debit', 'Team lunch', 'Food & Dining'),
  tx('exp-food-4',  'sample-bog-main', d(15, 8),  950,  'debit', 'Team lunch — Shavi Lomi', 'Food & Dining', 'Shavi Lomi'),
  tx('exp-food-5',  'sample-bog-main', d(12, 17), 1_250, 'debit', 'New hire dinner', 'Food & Dining'),
  tx('exp-food-6',  'sample-bog-main', d( 9, 11), 840,  'debit', 'Team lunch', 'Food & Dining'),
  tx('exp-food-7',  'sample-bog-main', d( 6, 22), 1_800, 'debit', 'Anniversary dinner — full team', 'Food & Dining'),
  tx('exp-food-8',  'sample-bog-main', d( 3, 14), 920,  'debit', 'Team lunch', 'Food & Dining'),
  tx('exp-food-9',  'sample-bog-main', d( 1, 18), 1_100, 'debit', 'Team lunch — Café Littera', 'Food & Dining', 'Café Littera'),

  // ── USD EXPENSES: subscriptions paid from TBC USD ─────────────────────────
  ...Array.from({ length: 24 }, (_, i) => tx(
    `exp-usd-sub-${i}`, 'sample-tbc-usd', d(23 - i, 12),
    1_240 + (i > 11 ? 180 : 0), 'debit',
    'Intercom + HubSpot + Segment', 'Software'
  )),
  tx('exp-usd-conf-1', 'sample-tbc-usd', d(20, 5), 2_900, 'debit', 'Web Summit tickets × 2', 'Travel'),
  tx('exp-usd-conf-2', 'sample-tbc-usd', d( 8, 5), 3_400, 'debit', 'SaaStr EU tickets × 3', 'Travel'),
  tx('exp-usd-conf-3', 'sample-tbc-usd', d( 2, 5), 2_600, 'debit', 'Collision Conf tickets × 2', 'Travel'),
]

// ─── Loader ───────────────────────────────────────────────────────────────────

/**
 * Load demo data into Dexie. Clears existing demo data first (idempotent).
 * Pass force=true to reload even if real data already exists.
 */
export async function loadSampleData(force = false): Promise<void> {
  const { getDb } = await import('./schema')
  const db = getDb()

  if (!force) {
    const existing = await db.accounts.count()
    if (existing > 0) return
  }

  // Clear any previous demo data
  await db.transactions.where('accountId').anyOf(SAMPLE_ACCOUNTS.map(a => a.id)).delete()
  await db.accounts.where('id').anyOf(SAMPLE_ACCOUNTS.map(a => a.id)).delete()
  await db.connections.where('id').equals('sample-connection').delete()

  // Write the synthetic connection record
  await db.connections.add({
    id:                   'sample-connection',
    provider:             'bog',
    saltEdgeConnectionId: 'sample',
    saltEdgeToken:        'sample',
    accountIds:           SAMPLE_ACCOUNTS.map(a => a.id),
    connectedAt:          new Date(),
    expiresAt:            new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    lastSyncedAt:         new Date(),
  })

  await db.accounts.bulkAdd(SAMPLE_ACCOUNTS)
  await db.transactions.bulkAdd(SAMPLE_TRANSACTIONS)
}

export function isSampleData(): Promise<boolean> {
  return import('./schema').then(({ getDb }) =>
    getDb().connections.where('id').equals('sample-connection').count().then(n => n > 0)
  )
}
