/**
 * Query helpers for the Fain IndexedDB.
 * All reads go through here — keeps the aggregation logic in one place
 * and makes it easy to feed the AI pipeline clean summaries.
 */
import { getDb } from './schema'
import { startOfMonth, endOfMonth } from 'date-fns'
import type {
  Transaction,
  MonthlyTotal,
  CategoryBreakdown,
  CashPosition,
  Currency,
} from '@/types'

// ── Transactions ─────────────────────────────────────────

export async function getTransactionsByRange(
  accountIds: string[],
  from: Date,
  to: Date
): Promise<Transaction[]> {
  const db = getDb()
  return db.transactions
    .where('date')
    .between(from, to, true, true)
    .filter((tx) => accountIds.includes(tx.accountId))
    .toArray()
}

export async function getTransactionsByCategory(
  accountIds: string[],
  from: Date,
  to: Date
): Promise<CategoryBreakdown[]> {
  const txs = await getTransactionsByRange(accountIds, from, to)
  const expenses = txs.filter((tx) => tx.type === 'debit')
  const total = expenses.reduce((s, tx) => s + tx.amount, 0)

  const byCategory: Record<string, number> = {}
  for (const tx of expenses) {
    const cat = tx.category ?? 'Uncategorised'
    byCategory[cat] = (byCategory[cat] ?? 0) + tx.amount
  }

  return Object.entries(byCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      currency: 'GEL' as Currency,
      period: { from, to },
    }))
    .sort((a, b) => b.amount - a.amount)
}

// ── Monthly totals ────────────────────────────────────────

export async function getMonthlyTotals(
  accountIds: string[],
  months: { year: number; month: number }[]
): Promise<MonthlyTotal[]> {
  const db = getDb()
  const results: MonthlyTotal[] = []

  for (const { year, month } of months) {
    const date = new Date(year, month - 1, 1)
    const from = startOfMonth(date)
    const to   = endOfMonth(date)

    const txs = await db.transactions
      .where('date').between(from, to, true, true)
      .filter((tx) => accountIds.includes(tx.accountId))
      .toArray()

    const income   = txs.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0)
    const expenses = txs.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0)

    results.push({ year, month, income, expenses, net: income - expenses, currency: 'GEL' })
  }

  return results
}

// ── Cash position ─────────────────────────────────────────

export async function getCashPosition(accountIds?: string[]): Promise<CashPosition> {
  const db = getDb()
  const accounts = accountIds
    ? await db.accounts.where('id').anyOf(accountIds).toArray()
    : await db.accounts.toArray()

  const total = accounts.reduce((s, a) => s + a.balance, 0)

  return {
    totalCash: total,
    currency: 'GEL',
    byAccount: accounts.map((a) => ({ accountId: a.id, balance: a.balance })),
    asOf: new Date(),
  }
}

// ── AI context summary ────────────────────────────────────
// Returns a structured, anonymised summary safe to send to the Claude API.
// Privacy contract: never includes raw transaction IDs, account numbers,
// merchant names, or personal identifiers. Only category-level aggregates
// and monthly totals.

// ── Recent transactions ───────────────────────────────────

export async function getRecentTransactions(
  accountIds: string[],
  limit = 8
): Promise<Transaction[]> {
  const db = getDb()
  return db.transactions
    .orderBy('date')
    .reverse()
    .filter((tx) => accountIds.includes(tx.accountId))
    .limit(limit)
    .toArray()
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export async function buildAiContext(
  accountIds: string[],
  from: Date,
  to: Date
): Promise<string> {
  const db = getDb()

  // ── Gather all data in parallel ──────────────────────────
  const monthList: { year: number; month: number }[] = []
  const cursor = new Date(from)
  while (cursor <= to) {
    monthList.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  // 6-month window for category detail (more recent = more relevant)
  const sixMonthsAgo = new Date(to)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const catFrom = sixMonthsAgo < from ? from : sixMonthsAgo

  const [position, expenseCategories, incomeCategories, monthly, accounts] = await Promise.all([
    getCashPosition(accountIds),
    getTransactionsByCategory(accountIds, catFrom, to),
    // Income breakdown (credits)
    (async () => {
      const txs = await getTransactionsByRange(accountIds, catFrom, to)
      const credits = txs.filter(tx => tx.type === 'credit')
      const total   = credits.reduce((s, tx) => s + tx.amount, 0)
      const byCat: Record<string, number> = {}
      for (const tx of credits) {
        const cat = tx.category ?? 'Uncategorised'
        byCat[cat] = (byCat[cat] ?? 0) + tx.amount
      }
      return Object.entries(byCat)
        .map(([category, amount]) => ({ category, amount, pct: total > 0 ? (amount / total) * 100 : 0 }))
        .sort((a, b) => b.amount - a.amount)
    })(),
    getMonthlyTotals(accountIds, monthList),
    db.accounts.where('id').anyOf(accountIds).toArray(),
  ])

  // ── Key metrics ──────────────────────────────────────────
  const n          = monthly.length
  const avgRevenue = n ? monthly.reduce((s, m) => s + m.income,   0) / n : 0
  const avgBurn    = n ? monthly.reduce((s, m) => s + m.expenses, 0) / n : 0
  const avgNet     = avgRevenue - avgBurn

  // Runway: only meaningful if net burn is negative (cash is depleting)
  const netBurnPerMonth = avgBurn - avgRevenue   // positive = losing cash
  const runwayMonths    = netBurnPerMonth > 0
    ? Math.floor(position.totalCash / netBurnPerMonth)
    : null   // null = cash-positive / growing

  // MoM signal: last month vs prior month
  const last  = monthly.at(-1)
  const prior = monthly.at(-2)

  // Account type summary (no IDs or names)
  const typeCount: Record<string, number> = {}
  for (const acc of accounts) {
    typeCount[acc.type] = (typeCount[acc.type] ?? 0) + 1
  }
  const accountSummary = Object.entries(typeCount)
    .map(([type, count]) => `${count} ${type}`)
    .join(', ')

  // ── Build output ─────────────────────────────────────────
  const today      = new Date().toISOString().split('T')[0]
  const periodFrom = `${from.toLocaleString('en-US', { month: 'short', year: 'numeric' })}`
  const periodTo   = `${to.toLocaleString('en-US',   { month: 'short', year: 'numeric' })}`

  const lines: string[] = [
    '=== FAIN FINANCIAL CONTEXT ===',
    `As of: ${today}`,
    `Period: ${periodFrom} – ${periodTo} (${n} months)`,
    '',
    'ACCOUNTS',
    `  Breakdown: ${accountSummary || `${accountIds.length} account(s)`}`,
    `  Total cash on hand: ₾${fmt(position.totalCash)}`,
    '',
    `TRAILING AVERAGES (${n}-month)`,
    `  Avg monthly revenue:  ₾${fmt(avgRevenue)}`,
    `  Avg monthly expenses: ₾${fmt(avgBurn)}`,
    `  Avg net cash flow:    ${avgNet >= 0 ? '+' : ''}₾${fmt(avgNet)}/mo`,
    runwayMonths !== null
      ? `  Runway at current burn: ${runwayMonths} month${runwayMonths !== 1 ? 's' : ''}`
      : `  Runway: cash-positive (revenue exceeds expenses on average)`,
    '',
  ]

  if (last && prior) {
    lines.push('RECENT MONTHS')
    lines.push(
      `  ${prior.year}-${String(prior.month).padStart(2,'0')}: revenue ₾${fmt(prior.income)}, expenses ₾${fmt(prior.expenses)}, net ${prior.net >= 0 ? '+' : ''}₾${fmt(prior.net)}`
    )
    lines.push(
      `  ${last.year}-${String(last.month).padStart(2,'0')}: revenue ₾${fmt(last.income)}, expenses ₾${fmt(last.expenses)}, net ${last.net >= 0 ? '+' : ''}₾${fmt(last.net)}`
    )
    // Trend signal
    const burnTrend = last.expenses > prior.expenses ? '↑ burn increasing' : '↓ burn decreasing'
    const revTrend  = last.income  > prior.income   ? '↑ revenue increasing' : '↓ revenue decreasing'
    lines.push(`  Trend: ${revTrend}, ${burnTrend}`)
    lines.push('')
  }

  lines.push(`MONTHLY HISTORY (${n} months, ₾):`)
  for (const m of monthly) {
    lines.push(
      `  ${m.year}-${String(m.month).padStart(2,'0')}: revenue ₾${fmt(m.income)}, expenses ₾${fmt(m.expenses)}, net ${m.net >= 0 ? '+' : ''}₾${fmt(m.net)}`
    )
  }

  lines.push('')
  lines.push('TOP EXPENSE CATEGORIES (last 6 months):')
  for (const c of expenseCategories.slice(0, 10)) {
    lines.push(`  ${c.category}: ₾${fmt(c.amount)} (${c.percentage.toFixed(1)}%)`)
  }

  if (incomeCategories.length > 0) {
    lines.push('')
    lines.push('TOP INCOME SOURCES (last 6 months):')
    for (const c of incomeCategories.slice(0, 5)) {
      lines.push(`  ${c.category}: ₾${fmt(c.amount)} (${c.pct.toFixed(1)}%)`)
    }
  }

  lines.push('')
  lines.push('NOTE: This context contains only aggregated category totals and monthly summaries. Raw transactions, account numbers, and merchant names are never sent.')

  return lines.join('\n')
}
