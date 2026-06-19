'use client'

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

// ─── Sample data ──────────────────────────────────────────────────────────────

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
  { id: 'cat',   label: 'Categorize 6 txns',     href: '/transactions' },
  { id: 'ar',    label: 'Chase 3 open invoices',  href: '/ask' },
  { id: 'bills', label: 'Approve 5 bills due',    href: '/ask' },
]

// ─── Data hook ────────────────────────────────────────────────────────────────

function useCommandData() {
  return useLiveQuery(async () => {
    const db   = getDb()
    const accs = await db.accounts.toArray()
    const ids  = accs.map((a) => a.id)
    if (!ids.length) return null
    const [cash, monthly, categories] = await Promise.all([
      getCashPosition(ids),
      getMonthlyTotals(ids, MONTHS),
      getTransactionsByCategory(ids, RANGE.from, RANGE.to),
    ])
    return { cash, monthly, categories }
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
      flex: '1 1 110px',
      background: 'var(--surface-primary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
      padding: '11px 14px',
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase' as const, color: 'var(--text-low)', marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-num)',
        color: neg ? 'var(--neg)' : 'var(--text-high)', lineHeight: 1.1,
      }}>
        {value}
      </div>
    </div>
  )
}

function ExpenseBar({ cat, amount, pct, fmt }: {
  cat: string; amount: number; pct: number; fmt: (n: number) => string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 80, fontSize: 12, color: 'var(--text-high)', fontWeight: 500,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, flexShrink: 0,
      }}>
        {cat}
      </div>
      <div style={{ flex: 1, height: 5, background: 'var(--stone-3)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--tan-9)', borderRadius: 3 }} />
      </div>
      <div style={{
        minWidth: 64, textAlign: 'right' as const, fontSize: 12, fontWeight: 700,
        fontFamily: 'var(--font-num)', color: 'var(--text-high)', flexShrink: 0,
      }}>
        {fmt(amount)}
      </div>
    </div>
  )
}

function DeptRow({ name, spent, budget, fmt }: {
  name: string; spent: number; budget: number; fmt: (n: number) => string
}) {
  const pct  = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0
  const over = pct > 90
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 36, fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', flexShrink: 0 }}>
        {name}
      </div>
      <div style={{ flex: 1, height: 5, background: 'var(--stone-3)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: over ? 'var(--neg)' : 'var(--tan-9)', borderRadius: 3,
        }} />
      </div>
      <div style={{
        minWidth: 90, textAlign: 'right' as const, fontSize: 11.5,
        color: 'var(--text-low)', flexShrink: 0,
      }}>
        {fmt(spent)} / {fmt(budget)}
      </div>
    </div>
  )
}

function ActionItem({ label, href, idx }: { label: string; href: string; idx: number }) {
  return (
    <Link href={href} style={{
      display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
      padding: '8px 0', borderBottom: '1px solid var(--border-subtle)',
    }}>
      <span style={{
        width: 20, height: 20, borderRadius: 6,
        background: 'var(--tan-soft)', border: '1px solid var(--tan-9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 800, color: 'var(--tan-11)', flexShrink: 0,
      }}>
        {idx + 1}
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-high)', flex: 1 }}>
        {label}
      </span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke="var(--text-low)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  )
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

interface GridProps {
  pills: { label: string; neg?: boolean }[]
  kpi: { cash: number; burn: number; runway: number; mrr: number }
  chartData: { month: string; cash: number; fore?: boolean }[]
  expenses: { cat: string; amount: number; pct: number }[]
  depts: { name: string; spent: number; budget: number }[]
  actions: { id: string; label: string; href: string }[]
  isSample: boolean
  fmt: (n: number) => string
}

function CommandGrid({ pills, kpi, chartData, expenses, depts, actions, isSample, fmt }: GridProps) {
  const nowIdx   = chartData.findIndex((d) => d.fore)
  const nowMonth = nowIdx > 0 ? chartData[nowIdx - 1]?.month : undefined

  return (
    <>
      {/* Metric pills strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
        <span style={{
          fontSize: 10.5, fontWeight: 800, letterSpacing: '0.1em',
          textTransform: 'uppercase' as const, color: 'var(--tan-11)', marginRight: 4,
        }}>
          FAIN ▸
        </span>
        {pills.map((p) => <MetricPill key={p.label} label={p.label} neg={p.neg} />)}
        {isSample && (
          <span style={{
            marginLeft: 'auto', padding: '2px 8px', borderRadius: 6,
            fontSize: 10.5, fontWeight: 700,
            background: 'var(--tan-soft)', color: 'var(--tan-11)',
            letterSpacing: '0.05em', textTransform: 'uppercase' as const,
          }}>
            SAMPLE
          </span>
        )}
      </div>

      {/* KPI row */}
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
        <DenseKpi label="Cash on hand"  value={fmt(kpi.cash)} />
        <DenseKpi label="Net burn / mo" value={fmt(kpi.burn)} neg />
        <DenseKpi label="Runway"        value={`${kpi.runway} mo`} />
        <DenseKpi label="MRR"           value={fmt(kpi.mrr)} />
      </div>

      {/* Two-column: chart + expenses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Chart */}
        <div style={{
          background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)',
          borderRadius: 14, padding: '12px 14px',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)', marginBottom: 10 }}>
            Cash &amp; forecast
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="cmdGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="var(--tan-9)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--tan-9)" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <XAxis dataKey="month"
                tick={{ fontSize: 10, fill: 'var(--text-low)' }}
                axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number) => [`₾${(v / 1000).toFixed(0)}k`, 'Cash']}
                contentStyle={{
                  background: 'var(--surface-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8, fontSize: 11,
                }}
              />
              {nowMonth && (
                <ReferenceLine x={nowMonth}
                  stroke="var(--border-subtle)" strokeDasharray="3 3"
                  label={{ value: 'now', position: 'top', fontSize: 9, fill: 'var(--text-low)' }}
                />
              )}
              <Area dataKey="cash" stroke="var(--tan-9)" fill="url(#cmdGrad)"
                strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top expenses */}
        <div style={{
          background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)',
          borderRadius: 14, padding: '12px 14px',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)', marginBottom: 10 }}>
            Top expenses
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {expenses.map((e) => (
              <ExpenseBar key={e.cat} cat={e.cat} amount={e.amount} pct={e.pct} fmt={fmt} />
            ))}
          </div>
        </div>
      </div>

      {/* Three-column: AR/AP + budgets + actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {/* AR / AP */}
        <div style={{
          background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)',
          borderRadius: 14, padding: '12px 14px',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
            textTransform: 'uppercase' as const, color: 'var(--text-low)', marginBottom: 8,
          }}>AR outstanding</div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-num)', color: 'var(--text-high)' }}>₾24k</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 3 }}>3 invoices · 2 overdue</div>
          <div style={{
            marginTop: 14, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
            textTransform: 'uppercase' as const, color: 'var(--text-low)', marginBottom: 6,
          }}>AP due (7d)</div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-num)', color: 'var(--neg)' }}>₾11k</div>
          <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 3 }}>5 bills pending</div>
        </div>

        {/* Dept budgets */}
        <div style={{
          background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)',
          borderRadius: 14, padding: '12px 14px',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
            textTransform: 'uppercase' as const, color: 'var(--text-low)', marginBottom: 10,
          }}>Dept budgets</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {depts.map((d) => (
              <DeptRow key={d.name} name={d.name} spent={d.spent} budget={d.budget} fmt={fmt} />
            ))}
          </div>
        </div>

        {/* Fain · do next */}
        <div style={{
          background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)',
          borderRadius: 14, padding: '12px 14px',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
            textTransform: 'uppercase' as const, color: 'var(--tan-11)', marginBottom: 4,
          }}>Fain · do next</div>
          {actions.map((a, i) => (
            <ActionItem key={a.id} label={a.label} href={a.href} idx={i} />
          ))}
        </div>
      </div>

      {/* Sample nudge */}
      {isSample && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 10,
          background: 'var(--tan-soft)', border: '1px dashed var(--tan-9)',
          fontSize: 13, color: 'var(--tan-11)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <span>
            Sample data.{' '}
            <Link href="/connect-bank" style={{ color: 'var(--tan-11)', fontWeight: 600 }}>
              Connect your bank
            </Link>{' '}
            to see your real numbers.
          </span>
        </div>
      )}
    </>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function CommandClient() {
  const data       = useCommandData()
  const { locale } = useLocale()

  const fmt = (n: number) => formatCurrency(n, { currency: 'GEL', compact: true, locale })

  if (data === undefined) {
    return (
      <div className="app-content">
        <div style={{ color: 'var(--text-low)', fontSize: 14 }}>Loading…</div>
      </div>
    )
  }

  const header = (
    <div className="app-header">
      <h1 className="page-title" style={{
        fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: 22,
      }}>
        Command
      </h1>
    </div>
  )

  // No bank connected — show sample
  if (!data) {
    return (
      <div className="app-content">
        {header}
        <CommandGrid
          pills={SAMPLE_PILLS}
          kpi={SAMPLE_KPI}
          chartData={SAMPLE_CHART}
          expenses={SAMPLE_TOP_EXP}
          depts={SAMPLE_DEPT}
          actions={SAMPLE_ACTIONS}
          isSample
          fmt={fmt}
        />
      </div>
    )
  }

  // Live data
  const { cash, monthly, categories } = data
  const avgBurn    = monthly.length
    ? monthly.reduce((s, m) => s + m.expenses, 0) / monthly.length : 0
  const avgRevenue = monthly.length
    ? monthly.reduce((s, m) => s + m.income, 0)   / monthly.length : 0
  const runway     = avgBurn > 0 ? Math.floor(cash.totalCash / avgBurn) : 0

  const chartData = monthly.map((m, i) => ({
    month: monthLabel(yearMonthToDate(m), locale),
    cash: Math.max(0, cash.totalCash - avgBurn * (monthly.length - 1 - i)),
  }))

  const expenses = categories.slice(0, 4).map((c) => ({
    cat: c.category, amount: c.amount, pct: c.percentage,
  }))

  const pills = [
    { label: `Burn ₾${(avgBurn / 1000).toFixed(0)}k`,  neg: true  },
    { label: `Runway ${runway}mo`,                       neg: false },
    { label: `Rev ₾${(avgRevenue / 1000).toFixed(0)}k`, neg: false },
  ]

  return (
    <div className="app-content">
      {header}
      <CommandGrid
        pills={pills}
        kpi={{ cash: cash.totalCash, burn: avgBurn, runway, mrr: avgRevenue }}
        chartData={chartData}
        expenses={expenses}
        depts={SAMPLE_DEPT}
        actions={SAMPLE_ACTIONS}
        isSample={false}
        fmt={fmt}
      />
    </div>
  )
}
