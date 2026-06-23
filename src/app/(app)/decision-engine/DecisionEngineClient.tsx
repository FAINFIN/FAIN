'use client'

import Link from 'next/link'

function SectionCard({
  title, description, icon, href, badge,
}: {
  title: string; description: string; icon: React.ReactNode; href: string; badge?: string
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex', flexDirection: 'column', gap: 10,
        padding: '20px 22px',
        background: 'var(--surface-primary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16, textDecoration: 'none',
        transition: 'border-color .15s, box-shadow .15s',
      }}
      className="section-card-link"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ color: 'var(--text-low)', display: 'flex', marginTop: 1 }}>{icon}</span>
        {badge && (
          <span style={{
            fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
            padding: '2px 8px', borderRadius: 99,
            background: 'var(--tan-soft)', color: 'var(--tan-11)',
          }}>{badge}</span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 14.5, fontWeight: 650, color: 'var(--text-high)', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-low)', lineHeight: 1.5 }}>{description}</div>
      </div>
    </Link>
  )
}

const I = (d: string) => () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
)

const SECTIONS = [
  {
    title: 'Decision Centre',
    description: 'Model the financial impact of key decisions before you make them — hires, contracts, market moves.',
    href: '/decision-engine/centre',
    badge: 'Soon' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
    ),
  },
  {
    title: 'Hiring Simulator',
    description: 'See exactly how runway and burn change across different headcount scenarios.',
    href: '/cash-flow',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    title: 'Investment Simulator',
    description: 'Model the return and payback period of a planned investment or capital expenditure.',
    href: '/decision-engine/investment',
    badge: 'Soon' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
  },
  {
    title: 'Loan Simulator',
    description: 'Model repayment schedules and cash flow impact for different loan structures and rates.',
    href: '/decision-engine/loan',
    badge: 'Soon' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    title: 'Risk Analysis',
    description: 'Surface financial risks: concentration, seasonality, payment timing, and cash gap probability.',
    href: '/decision-engine/risk',
    badge: 'Soon' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
]

export function DecisionEngineClient() {
  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: 8,
        }}>Views</div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 3vw, 38px)',
          fontWeight: 400, color: 'var(--text-high)',
          lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0,
        }}>
          Decision Engine
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-low)', marginTop: 8, lineHeight: 1.6 }}>
          Simulate the financial impact of every major decision before you commit.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {SECTIONS.map(s => <SectionCard key={s.href} {...s} />)}
      </div>
    </div>
  )
}
