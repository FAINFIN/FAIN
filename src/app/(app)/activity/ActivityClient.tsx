'use client'

import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getDb } from '@/lib/db/schema'
import { getCashPosition, getMonthlyTotals, getTransactionsByCategory } from '@/lib/db/queries'
import { formatCurrency } from '@/lib/utils/currency'
import { last6MonthsRange, rangeToMonths, monthLabel, yearMonthToDate } from '@/lib/utils/dates'
import { useLocale } from '@/lib/i18n/LocaleContext'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

const RANGE  = last6MonthsRange()
const MONTHS = rangeToMonths(RANGE)

// ─── Types ────────────────────────────────────────────────────────────────────

type FeedTag = 'alert' | 'win' | 'fyi'

interface FeedItem {
  id: string
  tag: FeedTag
  headline: string
  detail?: string
  action1?: { label: string; href?: string }
  action2?: { label: string; href?: string }
}

// ─── Sample data ──────────────────────────────────────────────────────────────

const SAMPLE_FEED: FeedItem[] = [
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

const SAMPLE_PILLS = [
  { label: 'Burn ↑8%',    neg: true  },
  { label: 'Runway 14mo', neg: false },
  { label: 'SaaS +18%',   neg: true  },
  { label: 'MRR $38k ↑',  neg: false },
]

const SAMPLE_KPI = { cash: 482000, burn: 61000, runway: 14, mrr: 38000 }

const SAMPLE_CHART = [
  { month: 'Jan', cash: 680000 }, { month: 'Feb', cash: 640000 },
  { month: 'Mar', cash: 610000 }, { month: 'Apr', cash: 570000 },
  { month: 'May', cash: 530000 }, { month: 'Jun', cash: 482000 },
  { month: 'Jul', cash: 421000, fore: true }, { month: 'Aug', cash: 360000, fore: true },
]

const SAMPLE_TOP_EXP = [
  { cat: 'Payroll', amount: 48200, pct: 79 },
  { cat: 'SaaS',    amount:  6100, pct: 10 },
  { cat: 'Office',  amount:  3600, pct:  6 },
  { cat: 'Travel',  amount:  1800, pct:  3 },
]

const SAMPLE_DEPT = [
  { name: 'Eng',   spent: 32000, budget: 40000 },
  { name: 'Sales', spent: 12000, budget: 15000 },
  { name: 'Ops',   spent:  8000, budget: 10000 },
]

const SAMPLE_ACTIONS = [
  { id: 'cat',   label: 'Categorize 6 txns',    href: '/transactions' },
  { id: 'ar',    label: 'Chase 3 open invoices', href: '/ask' },
  { id: 'bills', label: 'Approve 5 bills due',   href: '/ask' },
]

// ─── Data hooks ───────────────────────────────────────────────────────────────

function useActivityData() {
  return useLiveQuery(async () => {
    const db   = getDb()
    const accs = await db.accounts.toArray()
    const ids  = accs.map(a => a.id)
    if (!ids.length) return null
    const [cash, monthly, categories] = await Promise.all([
      getCashPosition(ids),
      getMonthlyTotals(ids, MONTHS),
      getTransactionsByCategory(ids, RANGE.from, RANGE.to),
    ])
    return { cash, monthly, categories }
  })
}

// ─── Feed sub-components ──────────────────────────────────────────────────────

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
      borderRadius: 14, padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div>
        <span style={{
          display: 'inline-block', padding: '2px 8px', borderRadius: 6,
          background: cfg.bg, color: cfg.color,
          fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
        }}>
          {cfg.label}
        </span>
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-high)', lineHeight: 1.35 }}>
        {item.headline}
      </div>
      {item.detail && (
        <div style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.5 }}>
          {item.detail}
        </div>
      )}
      {(item.action1 || item.action2) && (
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          {item.action1 && (
            item.action1.href
              ? <Link href={item.action1.href} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: 'var(--tan-9)', color: '#fff', textDecoration: 'none' }}>
                  {item.action1.label}
                </Link>
              : <button style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: 'var(--tan-9)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  {item.action1.label}
                </button>
          )}
          {item.action2 && (
            item.action2.href
              ? <Link href={item.action2.href} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 500, border: '1px solid var(--border-subtle)', color: 'var(--text-mid)', textDecoration: 'none' }}>
                  {item.action2.label}
                </Link>
              : <button style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 500, border: '1px solid var(--border-subtle)', color: 'var(--text-mid)', background: 'none', cursor: 'pointer' }}>
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
      background: 'var(--stone-2)', border: '1px solid var(--border-subtle)',
      borderRadius: 10, padding: 3, width: 'fit-content',
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

// ─── Command sub-components ───────────────────────────────────────────────────

function MetricPill({ label, neg }: { label: string; neg?: boolean }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 999,
      background: neg ? 'oklch(95% 0.025 30)' : 'var(--stone-2)',
      border: `1px solid ${neg ? 'oklch(85% 0.05 30)' : 'var(--border-subtle)'}`,
      color: neg ? 'oklch(45% 0.15 30)' : 'var(--text-high)',
      fontSize: 11.5, fontWeight: 700, fontFamily: 'var(--font-num)',
      letterSpacing: '0.02em', whiteSpace: 'nowrap' as const,
    }}>
      {label}
    </span>
  )
}

function DenseKpi({ label, value, neg }: { label: string; value: string; neg?: boolean }) {
  return (
    <div style={{
      flex: '1 1 110px', background: 'var(--surface-primary)',
      border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '11px 14px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-low)', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-num)', color: neg ? 'var(--neg)' : 'var(--text-high)', lineHeight: 1.1 }}>
        {value}
      </div>
    </div>
  )
}

function ExpenseBar({ cat, amount, pct, fmt }: { cat: string; amount: number; pct: number; fmt: (n: number) => string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 80, fontSize: 12, color: 'var(--text-high)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
        {cat}
      </div>
      <div style={{ flex: 1, height: 5, background: 'var(--stone-3)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--tan-9)', borderRadius: 3 }} />
      </div>
      <div style={{ minWidth: 64, textAlign: 'right' as const, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-num)', color: 'var(--text-high)', flexShrink: 0 }}>
        {fmt(amount)}
      </div>
    </div>
  )
}

function DeptRow({ name, spent, budget, fmt }: { name: string; spent: number; budget: number; fmt: (n: number) => string }) {
  const pct  = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0
  const over = pct > 90
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 36, fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', flexShrink: 0 }}>{name}</div>
      <div style={{ flex: 1, height: 5, background: 'var(--stone-3)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: over ? 'var(--neg)' : 'var(--tan-9)', borderRadius: 3 }} />
      </div>
      <div style={{ minWidth: 90, textAlign: 'right' as const, fontSize: 11.5, color: 'var(--text-low)', flexShrink: 0 }}>
        {fmt(spent)} / {fmt(budget)}
      </div>
    </div>
  )
}

function ActionItem({ label, href, idx }: { label: string; href: string; idx: number }) {
  return (
    <Link href={href} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <span style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--tan-soft)', border: '1px solid var(--tan-9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'var(--tan-11)', flexShrink: 0 }}>
        {idx + 1}
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)', flex: 1 }}>{label}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-low)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ActivityClient() {
  const [tab, setTab]   = useState<TabValue>('all')
  const data            = useActivityData()
  const { locale }      = useLocale()

  const fmt = (n: number) => formatCurrency(n, { currency: 'GEL', compact: true, locale })

  const today     = new Date()
  const dateLabel = today.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })
  const isSample  = data === null || data === undefined

  // ── Resolve KPI values ─────────────────────────────────────────────────────
  let kpi   = SAMPLE_KPI
  let pills = SAMPLE_PILLS
  let chartData = SAMPLE_CHART
  let expenses  = SAMPLE_TOP_EXP

  if (data) {
    const { cash, monthly, categories } = data
    const avgBurn    = monthly.length ? monthly.reduce((s, m) => s + m.expenses, 0) / monthly.length : 0
    const avgRevenue = monthly.length ? monthly.reduce((s, m) => s + m.income,   0) / monthly.length : 0
    const runway     = avgBurn > 0 ? Math.floor(cash.totalCash / avgBurn) : 0

    kpi = { cash: cash.totalCash, burn: avgBurn, runway, mrr: avgRevenue }

    chartData = monthly.map((m, i) => ({
      month: monthLabel(yearMonthToDate(m), locale),
      cash: Math.max(0, cash.totalCash - avgBurn * (monthly.length - 1 - i)),
    }))

    expenses = categories.slice(0, 4).map(c => ({ cat: c.category, amount: c.amount, pct: c.percentage }))

    pills = [
      { label: `Burn ₾${(avgBurn    / 1000).toFixed(0)}k`, neg: true  },
      { label: `Runway ${runway}mo`,                         neg: false },
      { label: `Rev ₾${(avgRevenue  / 1000).toFixed(0)}k`,  neg: false },
    ]
  }

  // ── Filtered feed items ────────────────────────────────────────────────────
  const feedItems = SAMPLE_FEED.filter(item => {
    if (tab === 'all')    return true
    if (tab === 'alerts') return item.tag === 'alert'
    if (tab === 'wins')   return item.tag === 'win'
    return true
  })

  const nowIdx   = chartData.findIndex((d: { fore?: boolean }) => d.fore)
  const nowMonth = nowIdx > 0 ? (chartData[nowIdx - 1] as { month: string })?.month : undefined

  return (
    <div className="app-content">

      {/* Header */}
      <div className="app-header">
        <div>
          <h1 className="page-title" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: 22, marginBottom: 2 }}>
            Activity &amp; Feed
          </h1>
          <div style={{ fontSize: 12, color: 'var(--text-low)' }}>{dateLabel}</div>
        </div>
        {isSample && (
          <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'var(--tan-soft)', color: 'var(--tan-11)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            SAMPLE
          </span>
        )}
      </div>

      {/* ── Metric pills strip ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--tan-11)', marginRight: 4 }}>
          FAIN ▸
        </span>
        {pills.map(p => <MetricPill key={p.label} label={p.label} neg={p.neg} />)}
      </div>

      {/* ── KPI row ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
        <DenseKpi label="Cash on hand"  value={fmt(kpi.cash)} />
        <DenseKpi label="Net burn / mo" value={fmt(kpi.burn)} neg />
        <DenseKpi label="Runway"        value={`${kpi.runway} mo`} />
        <DenseKpi label="MRR"           value={fmt(kpi.mrr)} />
      </div>

      {/* ── Chart + Top expenses ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)', marginBottom: 10 }}>Cash &amp; forecast</div>
          <ResponsiveContainer width="100%" height={130}>
            <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="var(--tan-9)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--tan-9)" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-low)' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: unknown) => [`₾${((v as number) / 1000).toFixed(0)}k`, 'Cash']}
                contentStyle={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 11 }}
              />
              {nowMonth && (
                <ReferenceLine x={nowMonth} stroke="var(--border-subtle)" strokeDasharray="3 3"
                  label={{ value: 'now', position: 'top', fontSize: 9, fill: 'var(--text-low)' }} />
              )}
              <Area dataKey="cash" stroke="var(--tan-9)" fill="url(#actGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)', marginBottom: 10 }}>Top expenses</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {expenses.map(e => <ExpenseBar key={e.cat} cat={e.cat} amount={e.amount} pct={e.pct} fmt={fmt} />)}
          </div>
        </div>
      </div>

      {/* ── AR/AP + Dept budgets + Do next ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: 'var(--text-low)', marginBottom: 8 }}>AR outstanding</div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-num)', color: 'var(--text-high)' }}>₾24k</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 3 }}>3 invoices · 2 overdue</div>
          <div style={{ marginTop: 14, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: 'var(--text-low)', marginBottom: 6 }}>AP due (7d)</div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-num)', color: 'var(--neg)' }}>₾11k</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 3 }}>5 bills pending</div>
        </div>

        <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: 'var(--text-low)', marginBottom: 10 }}>Dept budgets</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {SAMPLE_DEPT.map(d => <DeptRow key={d.name} name={d.name} spent={d.spent} budget={d.budget} fmt={fmt} />)}
          </div>
        </div>

        <div style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: 'var(--tan-11)', marginBottom: 4 }}>Fain · do next</div>
          {SAMPLE_ACTIONS.map((a, i) => <ActionItem key={a.id} label={a.label} href={a.href} idx={i} />)}
        </div>
      </div>

      {/* ── Feed section ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>Feed</div>
        <TabBar active={tab} onChange={setTab} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {feedItems.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-low)', fontSize: 13 }}>
            No items for this filter.
          </div>
        ) : (
          feedItems.map(item => <FeedCard key={item.id} item={item} />)
        )}
      </div>

      {/* Sample nudge */}
      {isSample && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'var(--tan-soft)', border: '1px dashed var(--tan-9)', fontSize: 13, color: 'var(--tan-11)' }}>
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
