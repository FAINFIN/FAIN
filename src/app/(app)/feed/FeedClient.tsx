'use client'

import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getDb } from '@/lib/db/schema'
import { getCashPosition, getMonthlyTotals } from '@/lib/db/queries'
import { formatCurrency } from '@/lib/utils/currency'
import { last6MonthsRange, rangeToMonths } from '@/lib/utils/dates'
import { useLocale } from '@/lib/i18n/LocaleContext'
import Link from 'next/link'

const RANGE  = last6MonthsRange()
const MONTHS = rangeToMonths(RANGE)

// ─── Feed item types ──────────────────────────────────────────────────────────

type FeedTag = 'alert' | 'win' | 'fyi'

interface FeedItem {
  id: string
  tag: FeedTag
  headline: string
  detail?: string
  action1?: { label: string; href?: string }
  action2?: { label: string; href?: string }
}

// ─── Sample feed items (shown when no bank connected) ─────────────────────────

const SAMPLE_ITEMS: FeedItem[] = [
  {
    id: 'burn-up',
    tag: 'alert',
    headline: 'Burn climbed 8% this month',
    detail: 'Monthly expenses rose from ₾56k to ₾61k. Payroll and SaaS are the main drivers.',
    action1: { label: 'See drivers' },
    action2: { label: 'Ask Fain', href: '/ask' },
  },
  {
    id: 'mrr-win',
    tag: 'win',
    headline: 'MRR crossed $38k — best month yet',
    detail: 'Revenue grew 12% MoM. New enterprise customer added $4.2k ARR.',
    action1: { label: 'Ask Fain', href: '/ask' },
  },
  {
    id: 'uncategorized',
    tag: 'fyi',
    headline: '6 transactions need categorization',
    detail: 'Auto-categorization confidence was low. Quick review takes ~1 min.',
    action1: { label: 'Categorize now', href: '/transactions' },
    action2: { label: 'Let Fain guess' },
  },
  {
    id: 'runway-drop',
    tag: 'alert',
    headline: 'Runway drops 2 mo if you hire now',
    detail: 'Adding a mid-level engineer at $120k would reduce runway from 14 to 12 months.',
    action1: { label: 'Model it', href: '/cash-flow' },
    action2: { label: 'Ask Fain', href: '/ask' },
  },
  {
    id: 'saas-up',
    tag: 'alert',
    headline: 'SaaS spend up 18% — 4 new tools',
    detail: 'Notion, Loom, Figma seats and a new analytics tool added last month.',
    action1: { label: 'Review', href: '/transactions' },
    action2: { label: 'Ask Fain', href: '/ask' },
  },
]

// ─── Key numbers strip ────────────────────────────────────────────────────────

function useKeyNumbers() {
  return useLiveQuery(async () => {
    const db   = getDb()
    const accs = await db.accounts.toArray()
    const ids  = accs.map(a => a.id)
    if (!ids.length) return null
    const [cash, monthly] = await Promise.all([
      getCashPosition(ids),
      getMonthlyTotals(ids, MONTHS),
    ])
    const avgBurn   = monthly.length ? monthly.reduce((s, m) => s + m.expenses, 0) / monthly.length : 0
    const runway    = avgBurn > 0 ? Math.floor(cash.totalCash / avgBurn) : null
    return { cash: cash.totalCash, burn: avgBurn, runway }
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const TAG_CONFIG: Record<FeedTag, { label: string; bg: string; color: string }> = {
  alert: { label: 'needs attention', bg: 'oklch(96% 0.02 30)',  color: 'oklch(45% 0.15 30)'  },
  win:   { label: 'good news',       bg: 'oklch(96% 0.03 140)', color: 'oklch(40% 0.15 140)' },
  fyi:   { label: 'fyi',             bg: 'var(--stone-3)',       color: 'var(--text-low)'     },
}

function FeedCard({ item }: { item: FeedItem }) {
  const cfg = TAG_CONFIG[item.tag]
  return (
    <div style={{
      background: 'var(--surface-primary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 14,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      {/* Tag */}
      <div>
        <span style={{
          display: 'inline-block',
          padding: '2px 8px', borderRadius: 6,
          background: cfg.bg, color: cfg.color,
          fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
        }}>
          {cfg.label}
        </span>
      </div>
      {/* Headline */}
      <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-high)', lineHeight: 1.35 }}>
        {item.headline}
      </div>
      {/* Detail */}
      {item.detail && (
        <div style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.5 }}>
          {item.detail}
        </div>
      )}
      {/* Actions */}
      {(item.action1 || item.action2) && (
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          {item.action1 && (
            item.action1.href
              ? <Link href={item.action1.href} style={{
                  padding: '5px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                  background: 'var(--tan-9)', color: '#fff', textDecoration: 'none',
                }}>
                  {item.action1.label}
                </Link>
              : <button style={{
                  padding: '5px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                  background: 'var(--tan-9)', color: '#fff', border: 'none', cursor: 'pointer',
                }}>
                  {item.action1.label}
                </button>
          )}
          {item.action2 && (
            item.action2.href
              ? <Link href={item.action2.href} style={{
                  padding: '5px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 500,
                  border: '1px solid var(--border-subtle)', color: 'var(--text-mid)', textDecoration: 'none',
                }}>
                  {item.action2.label}
                </Link>
              : <button style={{
                  padding: '5px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 500,
                  border: '1px solid var(--border-subtle)', color: 'var(--text-mid)',
                  background: 'none', cursor: 'pointer',
                }}>
                  {item.action2.label}
                </button>
          )}
        </div>
      )}
    </div>
  )
}

type TabValue = 'all' | 'alerts' | 'wins'

function TabBar({ active, onChange }: { active: TabValue; onChange: (v: TabValue) => void }) {
  const tabs: { value: TabValue; label: string }[] = [
    { value: 'all',    label: 'All' },
    { value: 'alerts', label: 'Alerts' },
    { value: 'wins',   label: 'Wins' },
  ]
  return (
    <div style={{
      display: 'flex', gap: 4,
      background: 'var(--stone-2)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 10,
      padding: 3,
      width: 'fit-content',
    }}>
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          style={{
            padding: '5px 14px', borderRadius: 7, fontSize: 12.5, fontWeight: 600,
            border: 'none', cursor: 'pointer',
            background: active === tab.value ? 'var(--surface-primary)' : 'transparent',
            color: active === tab.value ? 'var(--text-high)' : 'var(--text-low)',
            boxShadow: active === tab.value ? '0 1px 3px rgba(0,0,0,.07)' : 'none',
            transition: 'all .12s',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function KeyNumbersStrip({ cash, burn, runway, fmt }: {
  cash: number; burn: number; runway: number | null; fmt: (n: number) => string
}) {
  const tiles = [
    { label: 'Runway',   value: runway !== null ? `${runway} mo` : '—' },
    { label: 'Net burn', value: fmt(burn)                               },
    { label: 'Cash',     value: fmt(cash)                               },
  ]
  return (
    <div style={{
      background: 'var(--surface-primary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 14,
      padding: '14px 18px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: 10 }}>
        Key numbers
      </div>
      <div style={{ display: 'flex', gap: 24 }}>
        {tiles.map(t => (
          <div key={t.label}>
            <div style={{ fontSize: 10.5, color: 'var(--text-low)', marginBottom: 2 }}>{t.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-num)', color: 'var(--text-high)' }}>{t.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function FeedClient() {
  const [tab, setTab] = useState<TabValue>('all')
  const numbers = useKeyNumbers()
  const { locale } = useLocale()

  const fmt = (n: number) => formatCurrency(n, { currency: 'GEL', compact: true, locale })

  const isSample = numbers === null || numbers === undefined

  const kpi = isSample
    ? { cash: 482000, burn: 61000, runway: 14 }
    : (numbers ?? { cash: 0, burn: 0, runway: null })

  const items = SAMPLE_ITEMS.filter(item => {
    if (tab === 'all')    return true
    if (tab === 'alerts') return item.tag === 'alert'
    if (tab === 'wins')   return item.tag === 'win'
    return true
  })

  const today = new Date()
  const dateLabel = today.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="app-content">

      {/* Header */}
      <div className="app-header">
        <div>
          <h1 className="page-title" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: 22, marginBottom: 2 }}>
            Feed
          </h1>
          <div style={{ fontSize: 12, color: 'var(--text-low)' }}>Today, from Fain · {dateLabel}</div>
        </div>
        {isSample && (
          <span style={{
            padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
            background: 'var(--tan-soft)', color: 'var(--tan-11)',
            letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            SAMPLE
          </span>
        )}
      </div>

      {/* Tab filter */}
      <TabBar active={tab} onChange={setTab} />

      {/* Feed cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-low)', fontSize: 13 }}>
            No items for this filter.
          </div>
        ) : (
          items.map(item => <FeedCard key={item.id} item={item} />)
        )}
      </div>

      {/* Key numbers strip */}
      <KeyNumbersStrip
        cash={'cash' in kpi ? kpi.cash : 0}
        burn={'burn' in kpi ? kpi.burn : 0}
        runway={'runway' in kpi ? kpi.runway : null}
        fmt={fmt}
      />

      {/* Sample nudge */}
      {isSample && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 10,
          background: 'var(--tan-soft)', border: '1px dashed var(--tan-9)',
          fontSize: 13, color: 'var(--tan-11)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          <span>
            Fain generates real insights from your data.{' '}
            <Link href="/connect-bank" style={{ color: 'var(--tan-11)', fontWeight: 600 }}>Connect your bank →</Link>
          </span>
        </div>
      )}
    </div>
  )
}
