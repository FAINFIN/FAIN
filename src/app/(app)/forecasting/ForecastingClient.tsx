'use client'

import Link from 'next/link'

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  title, description, icon, href, badge,
}: {
  title:        string
  description:  string
  icon:         React.ReactNode
  href:         string
  badge?:       string
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex', flexDirection: 'column', gap: 10,
        padding: '20px 22px',
        background: 'var(--surface-primary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16,
        textDecoration: 'none',
        transition: 'border-color .15s, box-shadow .15s',
      }}
      className="section-card-link"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ color: 'var(--text-low)', display: 'flex', marginTop: 1 }}>{icon}</span>
        {badge && (
          <span style={{
            fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em',
            textTransform: 'uppercase', padding: '2px 8px', borderRadius: 99,
            background: 'var(--tan-soft)', color: 'var(--tan-11)',
          }}>{badge}</span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 14.5, fontWeight: 650, color: 'var(--text-high)', marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-low)', lineHeight: 1.5 }}>
          {description}
        </div>
      </div>
    </Link>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function TrendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 17 9 11 13 15 21 7"/>
      <line x1="21" y1="7" x2="21" y2="13"/><line x1="21" y1="7" x2="15" y2="7"/>
    </svg>
  )
}

function CostIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  )
}

function BudgetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  )
}

function ScenarioIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ForecastingClient() {
  const sections = [
    {
      title: 'Revenue Forecast',
      description: 'Project revenue based on historical trends, growth rate, and pipeline assumptions.',
      icon: <TrendIcon />,
      href: '/forecasting/revenue',
      badge: 'Soon',
    },
    {
      title: 'Expense Forecast',
      description: 'Model upcoming costs by category — headcount, SaaS, infrastructure, and more.',
      icon: <CostIcon />,
      href: '/forecasting/expenses',
      badge: 'Soon',
    },
    {
      title: 'Budgeting',
      description: 'Set monthly budgets per department or category and track actuals vs plan.',
      icon: <BudgetIcon />,
      href: '/forecasting/budgeting',
      badge: 'Soon',
    },
    {
      title: 'Scenario Builder',
      description: 'Run what-if scenarios: what happens to runway if you hire, cut costs, or hit a revenue target?',
      icon: <ScenarioIcon />,
      href: '/cash-flow',
    },
  ]

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 960, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: 8,
        }}>
          Views
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 3vw, 38px)',
          fontWeight: 400, color: 'var(--text-high)',
          lineHeight: 1.1, letterSpacing: '-0.02em',
          margin: 0,
        }}>
          Forecasting
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-low)', marginTop: 8, lineHeight: 1.6 }}>
          Build forward-looking models for revenue, expenses, budgets, and scenarios.
        </p>
      </div>

      {/* Section cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 16,
      }}>
        {sections.map(s => (
          <SectionCard key={s.href} {...s} />
        ))}
      </div>
    </div>
  )
}
