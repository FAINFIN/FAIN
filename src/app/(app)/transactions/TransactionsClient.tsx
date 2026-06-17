'use client'

import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getDb } from '@/lib/db/schema'
import { formatCurrency } from '@/lib/utils/currency'
import { useLocale } from '@/lib/i18n/LocaleContext'
import type { Transaction, Currency } from '@/types'
import Link from 'next/link'

// ─── Category colour map ──────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  'Food & Dining':    '#FF8A65',
  'Transportation':   '#4DB6AC',
  'Shopping':         '#BA68C8',
  'Business':         '#4FC3F7',
  'Utilities':        '#FFD54F',
  'Entertainment':    '#F06292',
  'Healthcare':       '#81C784',
  'Education':        '#7986CB',
  'Travel':           '#4DD0E1',
  'Other':            '#B0BEC5',
}
function catColor(c: string) { return CAT_COLORS[c] ?? '#B0BEC5' }

// ─── Amount pill ──────────────────────────────────────────────────────────────
function AmountPill({ tx, fmt }: { tx: Transaction; fmt: (n: number) => string }) {
  const isCredit = tx.type === 'credit'
  return (
    <span style={{
      fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-num)',
      color: isCredit ? 'var(--pos)' : 'var(--text-primary)',
      whiteSpace: 'nowrap',
    }}>
      {isCredit ? '+' : '−'}{fmt(tx.amount)}
    </span>
  )
}

// ─── Category dot ─────────────────────────────────────────────────────────────
function CatDot({ cat }: { cat: string }) {
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: catColor(cat), flexShrink: 0, marginTop: 1,
    }} />
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function TransactionsClient() {
  const { locale } = useLocale()

  const [search,  setSearch]  = useState('')
  const [typeF,   setTypeF]   = useState<'all' | 'credit' | 'debit'>('all')
  const [catF,    setCatF]    = useState('all')
  const [months,  setMonths]  = useState(3)
  const [page,    setPage]    = useState(1)
  const PAGE_SIZE = 50

  const result = useLiveQuery(async () => {
    const db   = getDb()
    const accs = await db.accounts.toArray()
    if (!accs.length) return { txs: [], categories: [] as string[] }
    const ids  = accs.map(a => a.id)
    const from = new Date()
    from.setMonth(from.getMonth() - months)
    const all  = await db.transactions
      .where('date').between(from, new Date(), true, true)
      .filter(tx => ids.includes(tx.accountId))
      .reverse()
      .toArray()
    const cats = [...new Set(all.map(t => t.category ?? 'Other'))].sort()
    return { txs: all, categories: cats }
  }, [months])

  const fmt = (n: number) => formatCurrency(n, { currency: 'GEL', locale })

  const filtered = useMemo(() => {
    if (!result) return []
    let list = result.txs
    if (typeF !== 'all') list = list.filter(t => t.type === typeF)
    if (catF  !== 'all') list = list.filter(t => (t.category ?? 'Other') === catF)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.description.toLowerCase().includes(q) ||
        (t.merchantName ?? '').toLowerCase().includes(q) ||
        (t.category ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [result, typeF, catF, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const visible    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Reset page when filters change
  const resetPage = () => setPage(1)

  if (result === undefined) {
    return <div className="app-content"><p style={{ color: 'var(--text-low)' }}>Loading…</p></div>
  }

  if (!result.txs.length) {
    return (
      <div className="app-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, textAlign: 'center' }}>
        <div className="mark" style={{ width: 56, height: 56, fontSize: 24 }}>f</div>
        <h2 className="serif" style={{ margin: 0 }}>No transactions yet</h2>
        <p style={{ margin: 0, color: 'var(--text-low)' }}>Connect your bank to see your transactions here.</p>
        <Link href="/connect-bank" className="btn btn-primary" style={{ marginTop: 8 }}>Connect bank</Link>
      </div>
    )
  }

  return (
    <div className="app-content">
      <div className="app-header">
        <h1 className="page-title">Transactions</h1>
        <div style={{ fontSize: 13, color: 'var(--text-low)', background: 'var(--surface-secondary)', padding: '4px 12px', borderRadius: 99 }}>
          {filtered.length} of {result.txs.length}
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); resetPage() }}
          placeholder="Search transactions…"
          style={{ flex: '1 1 200px', padding: '8px 14px', border: '1.5px solid var(--border-subtle)', borderRadius: 10, fontSize: 14, outline: 'none', background: 'var(--surface-primary)', color: 'var(--text-primary)' }}
        />

        {/* Type */}
        <select
          value={typeF}
          onChange={e => { setTypeF(e.target.value as typeof typeF); resetPage() }}
          style={{ padding: '8px 14px', border: '1.5px solid var(--border-subtle)', borderRadius: 10, fontSize: 14, background: 'var(--surface-primary)', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          <option value="all">All types</option>
          <option value="credit">Income</option>
          <option value="debit">Expense</option>
        </select>

        {/* Category */}
        <select
          value={catF}
          onChange={e => { setCatF(e.target.value); resetPage() }}
          style={{ padding: '8px 14px', border: '1.5px solid var(--border-subtle)', borderRadius: 10, fontSize: 14, background: 'var(--surface-primary)', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          <option value="all">All categories</option>
          {result.categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Period */}
        <select
          value={months}
          onChange={e => { setMonths(Number(e.target.value)); resetPage() }}
          style={{ padding: '8px 14px', border: '1.5px solid var(--border-subtle)', borderRadius: 10, fontSize: 14, background: 'var(--surface-primary)', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          <option value={1}>Last month</option>
          <option value={3}>Last 3 months</option>
          <option value={6}>Last 6 months</option>
          <option value={12}>Last 12 months</option>
          <option value={24}>Last 24 months</option>
        </select>
      </div>

      {/* ── Transaction list ── */}
      <div style={{ background: 'var(--surface-primary)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        {visible.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-low)' }}>No matching transactions</div>
        ) : (
          visible.map((tx, i) => (
            <div
              key={tx.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px',
                borderBottom: i < visible.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}
            >
              {/* Date */}
              <div style={{ width: 50, flexShrink: 0, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1, fontFamily: 'var(--font-num)' }}>
                  {tx.date.getDate()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-low)', textTransform: 'uppercase' }}>
                  {tx.date.toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-GB', { month: 'short' })}
                </div>
              </div>

              {/* Category dot */}
              <CatDot cat={tx.category ?? 'Other'} />

              {/* Description */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tx.merchantName ?? tx.description}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-low)' }}>
                  {tx.category ?? 'Other'}
                  {tx.merchantName && tx.merchantName !== tx.description && (
                    <> · <span style={{ fontStyle: 'italic' }}>{tx.description}</span></>
                  )}
                </div>
              </div>

              {/* Amount */}
              <AmountPill tx={tx} fmt={fmt} />
            </div>
          ))
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid var(--border-subtle)', background: 'var(--surface-primary)', color: 'var(--text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontWeight: 600, fontSize: 13 }}
          >
            ← Prev
          </button>
          <span style={{ padding: '6px 14px', fontSize: 13, color: 'var(--text-low)' }}>
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid var(--border-subtle)', background: 'var(--surface-primary)', color: 'var(--text-primary)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontWeight: 600, fontSize: 13 }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
