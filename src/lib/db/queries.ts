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
// Returns a compact, anonymised summary safe to send to the Claude API.
// Never includes merchant names, raw transaction IDs, or personal identifiers.

export async function buildAiContext(
  accountIds: string[],
  from: Date,
  to: Date
): Promise<string> {
  const [position, categories, monthly] = await Promise.all([
    getCashPosition(accountIds),
    getTransactionsByCategory(accountIds, from, to),
    (async () => {
      const months: { year: number; month: number }[] = []
      const cursor = new Date(from)
      while (cursor <= to) {
        months.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 })
        cursor.setMonth(cursor.getMonth() + 1)
      }
      return getMonthlyTotals(accountIds, months)
    })(),
  ])

  const lines = [
    `Current cash: ₾${position.totalCash.toLocaleString()} across ${accountIds.length} account(s).`,
    '',
    'Monthly income vs expenses (₾):',
    ...monthly.map((m) =>
      `  ${m.year}-${String(m.month).padStart(2, '0')}: income ₾${m.income.toLocaleString()}, expenses ₾${m.expenses.toLocaleString()}, net ₾${m.net.toLocaleString()}`
    ),
    '',
    'Top spending categories (period total, ₾):',
    ...categories.slice(0, 10).map((c) =>
      `  ${c.category}: ₾${c.amount.toLocaleString()} (${c.percentage.toFixed(1)}%)`
    ),
  ]

  return lines.join('\n')
}
