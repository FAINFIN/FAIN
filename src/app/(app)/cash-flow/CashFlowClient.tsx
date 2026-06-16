'use client'

import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getDb } from '@/lib/db/schema'
import { getCashPosition, getMonthlyTotals } from '@/lib/db/queries'
import { formatCurrency } from '@/lib/utils/currency'
import { last12MonthsRange, rangeToMonths, monthLabel, yearMonthToDate, addMonths } from '@/lib/utils/dates'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { MetricCard } from '@/components/ui/MetricCard'
import { ChartCard } from '@/components/ui/ChartCard'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'

interface Lever {
  id:    string
  labelKey: 'hires' | 'salary' | 'rev' | 'costs'
  unit:  string
  value: number
  min:   number
  max:   number
  step:  number
}

const DEFAULT_LEVERS: Lever[] = [
  { id: 'hires',  labelKey: 'hires',  unit: '',  value: 0,    min: 0,    max: 20,    step: 1   },
  { id: 'salary', labelKey: 'salary', unit: '₾', value: 8500, min: 3000, max: 25000, step: 500 },
  { id: 'rev',    labelKey: 'rev',    unit: '%',  value: 0,    min: -50,  max: 100,   step: 5   },
  { id: 'costs',  labelKey: 'costs',  unit: '%',  value: 0,    min: 0,    max: 50,    step: 5   },
]

const LEVER_LABELS = {
  en: { hires: 'New hires', salary: 'Avg salary/mo', rev: 'Revenue change', costs: 'Cost reduction' },
  ka: { hires: 'ახალი თანამშრომელი', salary: 'საშ. ხელფასი/თვე', rev: 'შემოსავლის ცვლილება', costs: 'ხარჯის შემცირება' },
}

const RANGE  = last12MonthsRange()
const MONTHS = rangeToMonths(RANGE)

function useProjectionData(levers: Lever[]) {
  return useLiveQuery(async () => {
    const db  = getDb()
    const ids = (await db.accounts.toArray()).map(a => a.id)
    if (!ids.length) return null

    const [cash, monthly] = await Promise.all([
      getCashPosition(ids),
      getMonthlyTotals(ids, MONTHS),
    ])
    if (!monthly.length) return null

    const avgBurn    = monthly.reduce((s, m) => s + m.expenses, 0) / monthly.length
    const avgRevenue = monthly.reduce((s, m) => s + m.income, 0)   / monthly.length
    const lastCash   = cash.totalCash

    const hireCost   = levers.find(l => l.id === 'hires')!.value * levers.find(l => l.id === 'salary')!.value
    const revChange  = levers.find(l => l.id === 'rev')!.value   / 100
    const costChange = levers.find(l => l.id === 'costs')!.value / 100

    const newBurn    = avgBurn    * (1 - costChange) + hireCost
    const newRevenue = avgRevenue * (1 + revChange)

    const baseline: number[] = []
    const scenario: number[] = []
    let baseCash = lastCash
    let scenCash = lastCash

    for (let i = 0; i < 18; i++) {
      baseline.push(Math.max(0, baseCash))
      scenario.push(Math.max(0, scenCash))
      baseCash += avgRevenue - avgBurn
      scenCash += newRevenue - newBurn
    }

    const baseRunway = baseline.findIndex(v => v <= 0)
    const scenRunway = scenario.findIndex(v => v <= 0)

    return {
      monthly,
      cash,
      avgBurn,
      newBurn,
      baseRunway: baseRunway === -1 ? 18 : baseRunway,
      scenRunway: scenRunway === -1 ? 18 : scenRunway,
      changed: hireCost > 0 || revChange !== 0 || costChange > 0,
      baseline,
      scenario,
    }
  }, [levers])
}

export function CashFlowClient() {
  const [levers, setLevers] = useState<Lever[]>(DEFAULT_LEVERS)
  const data   = useProjectionData(levers)
  const { locale, t } = useLocale()

  const fmt = (n: number, compact = false) =>
    formatCurrency(n, { currency: 'GEL', compact, locale })

  const leverLabels = LEVER_LABELS[locale]

  function updateLever(id: string, value: number) {
    setLevers(prev => prev.map(l => l.id === id ? { ...l, value } : l))
  }

  if (data === undefined) return <div className="app-content"><div style={{ color: 'var(--text-low)', fontSize: 14 }}>{t.loading}</div></div>
  if (!data) return (
    <div className="app-content">
      <div className="app-header"><h1 className="page-title">{t.cashFlow.title}</h1></div>
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-low)' }}>{t.dash.noAccounts}</div>
    </div>
  )

  const { monthly, cash, avgBurn, newBurn, baseRunway, scenRunway, changed, baseline, scenario } = data

  // Build projection chart data
  const projection = baseline.map((b, i) => ({
    month:    monthLabel(addMonths(new Date(), i), locale),
    baseline: Math.round(b),
    scenario: Math.round(scenario[i]!),
  }))

  // Monthly history chart
  const historyData = monthly.map(m => ({
    month: monthLabel(yearMonthToDate(m), locale),
    net:   m.income - m.expenses,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      <div className="app-header">
        <h1 className="page-title">{t.cashFlow.title}</h1>
        <div className="sync-badge"><span className="sync-dot" />{t.liveLabel}</div>
      </div>

      <div className="app-content">
        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
          <MetricCard label={t.dash.cashOnHand} value={fmt(cash.totalCash)} />
          <MetricCard label={t.dash.monthlyBurn} value={fmt(avgBurn, true)} sub={locale === 'ka' ? 'ბოლო 12 თვე' : 'last 12 months'} />
          {changed && (
            <MetricCard
              label={t.cashFlow.scenarioBurn}
              value={fmt(newBurn, true)}
              trend={newBurn > avgBurn ? 'down' : 'up'}
              trendLabel={fmt(newBurn - avgBurn, true)}
            />
          )}
          <MetricCard
            label={changed ? t.cashFlow.scenarioRunway : t.dash.runway}
            value={scenRunway >= 18 ? t.cashFlow.months18 : t.dash.months(scenRunway)}
            trend={changed ? (scenRunway >= baseRunway ? 'up' : 'down') : undefined}
            trendLabel={changed && scenRunway !== baseRunway
              ? `${locale === 'ka' ? 'ბაზა' : 'base'}: ${baseRunway >= 18 ? t.cashFlow.months18 : t.dash.months(baseRunway)}`
              : undefined}
          />
        </div>

        {/* Chart + levers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
          <ChartCard title={changed ? t.cashFlow.projection : (locale === 'ka' ? 'ნაღდი ფულის პროგნოზი' : 'Projected cash balance')} height={260}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projection}>
                <defs>
                  <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--stone-7)" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="var(--stone-7)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="scenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--tan-9)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="var(--tan-9)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-low)' }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tickFormatter={v => fmt(v, true)} tick={{ fontSize: 11, fill: 'var(--text-low)' }} axisLine={false} tickLine={false} width={56} />
                <ReferenceLine y={0} stroke="var(--neg)" strokeWidth={1.5} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: 10, fontSize: 13 }} />
                <Area dataKey="baseline" stroke="var(--stone-7)" fill="url(#baseGrad)" strokeWidth={2} name={t.cashFlow.baseline} />
                {changed && <Area dataKey="scenario" stroke="var(--tan-9)" fill="url(#scenGrad)" strokeWidth={2} strokeDasharray="6 4" name={t.cashFlow.scenario} />}
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <Card>
            <CardHeader>
              <CardTitle>{t.cashFlow.levers}</CardTitle>
              {changed && (
                <button className="btn btn-ghost btn-sm" onClick={() => setLevers(DEFAULT_LEVERS)} style={{ fontSize: 12 }}>
                  {t.cashFlow.reset}
                </button>
              )}
            </CardHeader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {levers.map(lever => {
                const label = leverLabels[lever.labelKey]
                const display = lever.unit === '₾'
                  ? `₾${lever.value.toLocaleString()}`
                  : lever.unit === '%'
                    ? `${lever.value > 0 ? '+' : ''}${lever.value}%`
                    : `${lever.value}`

                return (
                  <div key={lever.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ fontSize: 13, fontWeight: 500 }}>{label}</label>
                      <span style={{ fontFamily: 'var(--font-num)', fontSize: 13, fontWeight: 700 }}>{display}</span>
                    </div>
                    <input
                      type="range" min={lever.min} max={lever.max} step={lever.step} value={lever.value}
                      onChange={e => updateLever(lever.id, Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--tan-9)' }}
                    />
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* History */}
        <ChartCard title={t.cashFlow.netHistory} height={180}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-low)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => fmt(v, true)} tick={{ fontSize: 11, fill: 'var(--text-low)' }} axisLine={false} tickLine={false} width={56} />
              <ReferenceLine y={0} stroke="var(--border-subtle)" strokeWidth={1} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: 10, fontSize: 13 }} />
              <Line dataKey="net" stroke="var(--tan-9)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--tan-9)' }} name={locale === 'ka' ? 'წმინდა' : 'Net'} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
