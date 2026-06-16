'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { getDb } from '@/lib/db/schema'
import { getCashPosition, getMonthlyTotals, getTransactionsByCategory } from '@/lib/db/queries'
import { formatCurrency } from '@/lib/utils/currency'
import { last6MonthsRange, rangeToMonths, monthLabel, yearMonthToDate } from '@/lib/utils/dates'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { MetricCard } from '@/components/ui/MetricCard'
import { ChartCard } from '@/components/ui/ChartCard'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import Link from 'next/link'
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const RANGE  = last6MonthsRange()
const MONTHS = rangeToMonths(RANGE)

function useDashboardData() {
  return useLiveQuery(async () => {
    const db = getDb()
    const accounts = await db.accounts.toArray()
    const ids      = accounts.map(a => a.id)
    if (!ids.length) return null

    const [cash, monthly, categories] = await Promise.all([
      getCashPosition(ids),
      getMonthlyTotals(ids, MONTHS),
      getTransactionsByCategory(ids, RANGE.from, RANGE.to),
    ])
    return { accounts, cash, monthly, categories }
  })
}

export function DashboardClient() {
  const data = useDashboardData()
  const { locale, t } = useLocale()

  const fmt = (n: number, compact = false) =>
    formatCurrency(n, { currency: 'GEL', compact, locale })

  if (data === undefined) return (
    <div className="app-content">
      <div style={{ color: 'var(--text-low)', fontSize: 14 }}>{t.loading}</div>
    </div>
  )

  if (!data) return (
    <div className="app-content">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 16, textAlign: 'center' }}>
        <div className="mark" style={{ width: 56, height: 56, fontSize: 24 }}>f</div>
        <h2 className="serif" style={{ margin: 0 }}>{t.dash.noAccounts}</h2>
        <p style={{ margin: 0, color: 'var(--text-low)' }}>{t.dash.noAccountsSub}</p>
        <Link href="/connect-bank" className="btn btn-primary" style={{ marginTop: 8 }}>{t.dash.connectBank}</Link>
      </div>
    </div>
  )

  const { cash, monthly, categories } = data
  const latestMonth = monthly.at(-1)
  const prevMonth   = monthly.at(-2)
  const burnTrend   = latestMonth && prevMonth
    ? latestMonth.expenses > prevMonth.expenses ? 'down' : 'up'
    : undefined

  const avgBurn     = monthly.length ? monthly.reduce((s, m) => s + m.expenses, 0) / monthly.length : 0
  const avgRevenue  = monthly.length ? monthly.reduce((s, m) => s + m.income, 0)   / monthly.length : 0
  const runwayMonths = avgBurn > 0 ? Math.floor(cash.totalCash / avgBurn) : null

  const chartData = monthly.map(m => ({
    month:    monthLabel(yearMonthToDate(m), locale),
    income:   m.income,
    expenses: m.expenses,
    net:      m.income - m.expenses,
  }))

  return (
    <div className="app-content">
      <div className="app-header">
        <h1 className="page-title">{t.dash.title}</h1>
        <div className="sync-badge"><span className="sync-dot" />{t.liveLabel}</div>
      </div>

      {/* Metric row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12 }}>
        <MetricCard label={t.dash.cashOnHand}  value={fmt(cash.totalCash)} />
        <MetricCard
          label={t.dash.monthlyBurn}
          value={fmt(avgBurn, true)}
          sub={latestMonth ? fmt(latestMonth.expenses) : undefined}
          trend={burnTrend}
        />
        <MetricCard
          label={t.dash.monthlyRev}
          value={fmt(avgRevenue, true)}
          sub={latestMonth ? fmt(latestMonth.income) : undefined}
        />
        {runwayMonths !== null && (
          <MetricCard
            label={t.dash.runway}
            value={t.dash.months(runwayMonths)}
            trend={runwayMonths < 6 ? 'down' : runwayMonths >= 12 ? 'up' : undefined}
          />
        )}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <ChartCard title={t.dash.incomeVsExp} height={200}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={18}>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-low)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => fmt(v, true)} tick={{ fontSize: 11, fill: 'var(--text-low)' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip formatter={(v) => fmt(Number(v ?? 0))} contentStyle={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: 10, fontSize: 13 }} />
              <Bar dataKey="income"   fill="var(--pos)"    radius={[3,3,0,0]} name={locale === 'ka' ? 'შემოსავალი' : 'Income'} />
              <Bar dataKey="expenses" fill="var(--stone-5)" radius={[3,3,0,0]} name={locale === 'ka' ? 'ხარჯი' : 'Expenses'} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t.dash.netCashFlow} height={200}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--tan-9)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="var(--tan-9)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-low)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => fmt(v, true)} tick={{ fontSize: 11, fill: 'var(--text-low)' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip formatter={(v) => fmt(Number(v ?? 0))} contentStyle={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: 10, fontSize: 13 }} />
              <Area dataKey="net" stroke="var(--tan-9)" fill="url(#netGrad)" strokeWidth={2.5} name={locale === 'ka' ? 'წმინდა' : 'Net'} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Category breakdown */}
      {categories.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{t.dash.topCategories}</CardTitle></CardHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {categories.slice(0, 6).map(cat => (
              <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 130, fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cat.category}
                </div>
                <div style={{ flex: 1, height: 6, background: 'var(--stone-3)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${cat.percentage}%`, height: '100%', background: 'var(--tan-9)', borderRadius: 3 }} />
                </div>
                <div style={{ minWidth: 80, textAlign: 'right', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-num)' }}>
                  {fmt(cat.amount)}
                </div>
                <div style={{ minWidth: 36, textAlign: 'right', fontSize: 12, color: 'var(--text-low)' }}>
                  {cat.percentage.toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
