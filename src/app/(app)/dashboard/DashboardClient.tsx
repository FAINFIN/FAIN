'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { getDb } from '@/lib/db/schema'
import {
  getCashPosition, getMonthlyTotals, getTransactionsByCategory, getRecentTransactions,
} from '@/lib/db/queries'
import { formatCurrency } from '@/lib/utils/currency'
import { last6MonthsRange, rangeToMonths, monthLabel, yearMonthToDate } from '@/lib/utils/dates'
import { useLocale } from '@/lib/i18n/LocaleContext'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

const RANGE  = last6MonthsRange()
const MONTHS = rangeToMonths(RANGE)

// ─── Sample data (no bank connected) ─────────────────────────────────────────
const SAMPLE_KPI = {
  cash:    482000,
  burn:    61000,
  runway:  14,
  mrr:     38000,
}

const SAMPLE_CHART = [
  { month: 'Jan', cash: 680000, forecast: false },
  { month: 'Feb', cash: 640000, forecast: false },
  { month: 'Mar', cash: 610000, forecast: false },
  { month: 'Apr', cash: 570000, forecast: false },
  { month: 'May', cash: 530000, forecast: false },
  { month: 'Jun', cash: 482000, forecast: false },
  { month: 'Jul', cash: 421000, forecast: true },
  { month: 'Aug', cash: 360000, forecast: true },
  { month: 'Sep', cash: 299000, forecast: true },
]

const SAMPLE_INSIGHTS = [
  { id: 'saas',    label: 'SaaS spend up 18% — 4 new tools', action1: 'Review', action2: 'Ask why' },
  { id: 'hire',    label: 'Runway drops 2 mo if you hire now', action1: 'Model it', action2: null },
]

const SAMPLE_TXNS = [
  { id: 't1', desc: 'Payroll', cat: 'Payroll',  amount: -48200, date: 'Jun 28' },
  { id: 't2', desc: 'AWS',     cat: 'SaaS',     amount: -3240,  date: 'Jun 27' },
  { id: 't3', desc: 'Revenue', cat: 'Revenue',  amount: 38000,  date: 'Jun 26' },
  { id: 't4', desc: 'Notion',  cat: 'SaaS',     amount: -320,   date: 'Jun 25' },
  { id: 't5', desc: 'Figma',   cat: 'SaaS',     amount: -480,   date: 'Jun 24' },
]

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useDashboardData() {
  return useLiveQuery(async () => {
    const db   = getDb()
    const accs = await db.accounts.toArray()
    const ids  = accs.map(a => a.id)
    if (!ids.length) return null

    const [cash, monthly, categories, recent] = await Promise.all([
      getCashPosition(ids),
      getMonthlyTotals(ids, MONTHS),
      getTransactionsByCategory(ids, RANGE.from, RANGE.to),
      getRecentTransactions(ids, 6),
    ])
    return { accounts: accs, cash, monthly, categories, recent }
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiTile({ label, value, sub, neg }: {
  label: string; value: string; sub?: string; neg?: boolean
}) {
  return (
    <div style={{
      flex: '1 1 140px',
      background: 'var(--surface-primary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 14,
      padding: '14px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-low)' }}>
        {label}
      </span>
      <span style={{
        fontSize: 22,
        fontWeight: 700,
        fontFamily: 'var(--font-num)',
        color: neg ? 'var(--neg)' : 'var(--text-high)',
        lineHeight: 1.15,
      }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: 11, color: 'var(--text-low)' }}>{sub}</span>}
    </div>
  )
}

function InsightCard({ label, action1, action2 }: {
  label: string; action1: string; action2: string | null
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '11px 14px',
      borderRadius: 10,
      background: 'var(--stone-2)',
      border: '1px solid var(--border-subtle)',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: 'var(--tan-9)', flexShrink: 0,
      }} />
      <span style={{ flex: 1, fontSize: 13, color: 'var(--text-high)', fontWeight: 500 }}>
        {label}
      </span>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button style={{
          padding: '4px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600,
          background: 'var(--tan-9)', color: '#fff', border: 'none', cursor: 'pointer',
        }}>
          {action1}
        </button>
        {action2 && (
          <button style={{
            padding: '4px 10px', borderRadius: 7, fontSize: 12, fontWeight: 500,
            background: 'none', color: 'var(--text-mid)',
            border: '1px solid var(--border-subtle)', cursor: 'pointer',
          }}>
            {action2}
          </button>
        )}
      </div>
    </div>
  )
}

function TxnRow({ desc, cat, amount, date, currency }: {
  desc: string; cat: string; amount: number; date: string; currency: string
}) {
  const fmt = (n: number) => formatCurrency(Math.abs(n), { currency: currency as 'GEL' | 'USD', compact: false, locale: 'en' })
  const isPos = amount > 0
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '9px 0', borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, background: 'var(--stone-3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: 'var(--text-mid)', flexShrink: 0,
      }}>
        {desc[0]?.toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {desc}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 1 }}>
          <span style={{
            display: 'inline-block', padding: '1px 6px', borderRadius: 5,
            background: 'var(--stone-3)', fontSize: 10.5, fontWeight: 600,
            letterSpacing: '0.03em',
          }}>
            {cat}
          </span>
          <span style={{ marginLeft: 6 }}>{date}</span>
        </div>
      </div>
      <span style={{
        fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-num)',
        color: isPos ? 'var(--pos)' : 'var(--text-high)',
        flexShrink: 0,
      }}>
        {isPos ? '+' : '−'}{fmt(amount)}
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DashboardClient() {
  const data = useDashboardData()
  const { locale, t } = useLocale()

  const fmt = (n: number, compact = false) =>
    formatCurrency(n, { currency: 'GEL', compact, locale })

  // ── Loading ──
  if (data === undefined) return (
    <div className="app-content">
      <div style={{ color: 'var(--text-low)', fontSize: 14 }}>{t.loading}</div>
    </div>
  )

  // ── No bank — show sample ──
  if (!data) {
    const today = new Date()
    const timeLabel = `as of today · ${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`
    return (
      <div className="app-content">
        <DashboardView
          timeLabel={timeLabel}
          kpi={{
            cash:   `₾${(SAMPLE_KPI.cash / 1000).toFixed(0)}k`,
            burn:   `₾${(SAMPLE_KPI.burn / 1000).toFixed(0)}k`,
            runway: `${SAMPLE_KPI.runway} mo`,
            mrr:    `$${(SAMPLE_KPI.mrr / 1000).toFixed(0)}k`,
          }}
          chartData={SAMPLE_CHART}
          insights={SAMPLE_INSIGHTS}
          txns={SAMPLE_TXNS.map(tx => ({ ...tx, currency: 'GEL' }))}
          isSample
        />
      </div>
    )
  }

  // ── Real data ──
  const { cash, monthly, recent } = data
  const avgBurn    = monthly.length ? monthly.reduce((s, m) => s + m.expenses, 0) / monthly.length : 0
  const avgRevenue = monthly.length ? monthly.reduce((s, m) => s + m.income, 0)   / monthly.length : 0
  const runway     = avgBurn > 0 ? Math.floor(cash.totalCash / avgBurn) : null

  const today = new Date()
  const timeLabel = `as of today · ${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`

  // Build cash balance chart: monthly cumulative + 3-month forecast
  let balance = cash.totalCash
  const historicalMonths = [...monthly].reverse()
  const historicalChart = historicalMonths.map(m => {
    balance += m.expenses - m.income  // add back (expenses is stored positive)
    return {
      month: monthLabel(yearMonthToDate(m), locale),
      cash: Math.max(0, balance),
      forecast: false,
    }
  }).reverse()

  const forecastChart = [1, 2, 3].map(i => ({
    month: `+${i}mo`,
    cash: Math.max(0, cash.totalCash - avgBurn * i),
    forecast: true,
  }))

  const chartData = [...historicalChart, ...forecastChart]

  const txns = (recent ?? []).map(tx => ({
    id:       tx.id,
    desc:     tx.description,
    cat:      tx.category ?? 'Uncategorized',
    amount:   tx.type === 'credit' ? tx.amount : -tx.amount,
    date:     tx.date instanceof Date ? tx.date.toLocaleDateString(locale, { month: 'short', day: 'numeric' }) : new Date(tx.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
    currency: tx.currency,
  }))

  return (
    <div className="app-content">
      <DashboardView
        timeLabel={timeLabel}
        kpi={{
          cash:   fmt(cash.totalCash, true),
          burn:   fmt(avgBurn, true),
          runway: runway !== null ? `${runway} mo` : '—',
          mrr:    fmt(avgRevenue, true),
        }}
        chartData={chartData}
        insights={[]}
        txns={txns}
        isSample={false}
      />
    </div>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────

function DashboardView({ timeLabel, kpi, chartData, insights, txns, isSample }: {
  timeLabel: string
  kpi: { cash: string; burn: string; runway: string; mrr: string }
  chartData: { month: string; cash: number; forecast: boolean }[]
  insights: typeof SAMPLE_INSIGHTS
  txns: { id: string; desc: string; cat: string; amount: number; date: string; currency: string }[]
  isSample: boolean
}) {
  // Find where forecast starts for the reference line
  const nowIdx = chartData.findIndex(d => d.forecast)
  const nowMonth = nowIdx >= 0 ? chartData[nowIdx - 1]?.month : undefined

  return (
    <>
      {/* Header */}
      <div className="app-header">
        <h1 className="page-title" style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: 22 }}>
          Overview
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isSample && (
            <span style={{
              padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
              background: 'var(--tan-soft)', color: 'var(--tan-11)',
              letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              SAMPLE
            </span>
          )}
          <span style={{ fontSize: 12, color: 'var(--text-low)' }}>{timeLabel}</span>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <KpiTile label="Cash on hand" value={kpi.cash} />
        <KpiTile label="Net burn" value={kpi.burn} neg />
        <KpiTile label="Runway" value={kpi.runway} sub={kpi.runway !== '—' ? 'to ' + fwdDate(kpi.runway) : undefined} />
        <KpiTile label="MRR" value={kpi.mrr} />
      </div>

      {/* Cash chart */}
      <div style={{
        background: 'var(--surface-primary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 14,
        padding: '16px 18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>
            Cash — last 6 months + forecast
          </span>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--text-low)' }}>
              <span style={{ width: 12, height: 2.5, background: 'var(--tan-9)', borderRadius: 2, display: 'inline-block' }} />
              Burn
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--text-low)' }}>
              <span style={{ width: 12, height: 2.5, background: 'var(--stone-5)', borderRadius: 2, display: 'inline-block', borderStyle: 'dashed' }} />
              Forecast
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="cashGradReal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--tan-9)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--tan-9)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="cashGradFore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--stone-5)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="var(--stone-5)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-low)' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              formatter={(v: number) => [`₾${(v / 1000).toFixed(0)}k`, 'Cash']}
              contentStyle={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: 10, fontSize: 12 }}
            />
            {nowMonth && (
              <ReferenceLine x={nowMonth} stroke="var(--border-subtle)" strokeDasharray="4 3" label={{ value: 'now', position: 'top', fontSize: 10, fill: 'var(--text-low)' }} />
            )}
            <Area
              dataKey="cash"
              stroke="var(--tan-9)"
              fill="url(#cashGradReal)"
              strokeWidth={2.2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Fain flagged insights */}
      {insights.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-high)' }}>Fain flagged</span>
            <span style={{ fontSize: 11, color: 'var(--text-low)', fontStyle: 'italic' }}>auto-detected insights</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {insights.map(ins => (
              <InsightCard key={ins.id} label={ins.label} action1={ins.action1} action2={ins.action2} />
            ))}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div style={{
        background: 'var(--surface-primary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 14,
        padding: '14px 18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>Recent transactions</span>
          <span style={{ fontSize: 11, color: 'var(--text-low)', fontStyle: 'italic' }}>auto-categorized by Fain</span>
        </div>
        {txns.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-low)', fontSize: 13 }}>
            No transactions yet.{' '}
            <Link href="/connect-bank" style={{ color: 'var(--tan-11)' }}>Connect your bank →</Link>
          </div>
        ) : (
          txns.map(tx => (
            <TxnRow key={tx.id} desc={tx.desc} cat={tx.cat} amount={tx.amount} date={tx.date} currency={tx.currency} />
          ))
        )}
        {txns.length > 0 && (
          <Link href="/transactions" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 12.5, color: 'var(--tan-11)', textDecoration: 'none', fontWeight: 500 }}>
            View all transactions →
          </Link>
        )}
      </div>

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
            This is sample data.{' '}
            <Link href="/connect-bank" style={{ color: 'var(--tan-11)', fontWeight: 600 }}>Connect your bank</Link>
            {' '}to see your real numbers.
          </span>
        </div>
      )}
    </>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fwdDate(runway: string): string {
  const mo = parseInt(runway)
  if (isNaN(mo)) return ''
  const d = new Date()
  d.setMonth(d.getMonth() + mo)
  return d.toLocaleString('en', { month: 'short', year: 'numeric' })
}
