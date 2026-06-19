'use client'

import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getDb } from '@/lib/db/schema'
import { formatCurrency } from '@/lib/utils/currency'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { catColor } from '@/lib/utils/categories'
import type { Transaction, Currency } from '@/types'
import Link from 'next/link'

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
  const { locale, t } = useLocale()

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
    return <div className="app-content"><p style={{ color: 'var(--text-low)' }}>{t.loading}</p></div>
  }

  if (!result.txs.length) {
    return (
      <div className="app-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, textAlign: 'center' }}>
        <div className="mark" style={{ width: 56, height: 56, fontSize: 24 }}>f</div>
        <h2 className="serif" style={{ margin: 0 }}>{t.transactions.empty}</h2>
        <p style={{ margin: 0, color: 'var(--text-low)' }}>{t.transactions.emptySub}</p>
        <Link href="/connect-bank" className="btn btn-primary" style={{ marginTop: 8 }}>{t.transactions.connectBank}</Link>
      </div>
    )
  }

  return (
    <div className="app-content">
      <div className="app-header">
        <h1 className="page-title">{t.transactions.title}</h1>
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
          placeholder={t.transactions.search}
          style={{ flex: '1 1 200px', padding: '8px 14px', border: '1.5px solid var(--border-subtle)', borderRadius: 10, fontSize: 14, outline: 'none', background: 'var(--surface-primary)', color: 'var(--text-primary)' }}
        />

        {/* Type */}
        <select
          value={typeF}
          onChange={e => { setTypeF(e.target.value as typeof typeF); resetPage() }}
          style={{ padding: '8px 14px', border: '1.5px solid var(--border-subtle)', borderRadius: 10, fontSize: 14, background: 'var(--surface-primary)', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          <option value="all">{t.transactions.allTypes}</option>
          <option value="credit">{t.transactions.income}</option>
          <option value="debit">{t.transactions.expense}</option>
        </select>

        {/* Category */}
        <select
          value={catF}
          onChange={e => { setCatF(e.target.value); resetPage() }}
          style={{ padding: '8px 14px', border: '1.5px solid var(--border-subtle)', borderRadius: 10, fontSize: 14, background: 'var(--surface-primary)', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          <option value="all">{t.transactions.allCats}</option>
          {result.categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Period */}
        <select
          value={months}
          onChange={e => { setMonths(Number(e.target.value)); resetPage() }}
          style={{ padding: '8px 14px', border: '1.5px solid var(--border-subtle)', borderRadius: 10, fontSize: 14, background: 'var(--surface-primary)', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          <option value={1}>{t.transactions.lastMonth}</option>
          <option value={3}>{t.transactions.last3}</option>
          <option value={6}>{t.transactions.last6}</option>
          <option value={12}>{t.transactions.last12}</option>
          <option value={24}>{t.transactions.last24}</option>
        </select>
      </div>

      {/* ── Transaction list ── */}
      <div style={{ background: 'var(--surface-primary)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        {visible.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-low)' }}>{t.transactions.noResults}</div>
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
            {t.transactions.prev}
          </button>
          <span style={{ padding: '6px 14px', fontSize: 13, color: 'var(--text-low)' }}>
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid var(--border-subtle)', background: 'var(--surface-primary)', color: 'var(--text-primary)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontWeight: 600, fontSize: 13 }}
          >
            {t.transactions.next}
          </button>
        </div>
      )}
    </div>
  )
}
