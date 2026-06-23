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

const SECTIONS = [
  {
    title: 'Transactions',
    description: 'Every bank and card transaction in one place — categorized, searchable, and exportable.',
    href: '/transactions',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
        <line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    ),
  },
  {
    title: 'Accounts Receivable',
    description: 'Outstanding invoices and incoming payments — track what customers owe and when.',
    href: '/data-hub/ar',
    badge: 'Soon' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 14 4 9 9 4"/>
        <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
      </svg>
    ),
  },
  {
    title: 'Accounts Payable',
    description: 'Bills due and supplier payments — never miss a payment or over-pay early.',
    href: '/data-hub/ap',
    badge: 'Soon' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 10 20 15 15 20"/>
        <path d="M4 4v7a4 4 0 0 0 4 4h12"/>
      </svg>
    ),
  },
  {
    title: 'EBITDA vs Industry',
    description: 'Benchmark your margin against sector peers — see where you outperform and where gaps exist.',
    href: '/data-hub/ebitda',
    badge: 'Soon' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    title: 'Debt & Ratios',
    description: 'D/E ratio, interest coverage, current ratio — the key financial health indicators in one view.',
    href: '/data-hub/debt',
    badge: 'Soon' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
  {
    title: 'Financial Statements Builder',
    description: 'Generate P&L, Balance Sheet, and Cash Flow statement from your transaction data.',
    href: '/data-hub/statements',
    badge: 'Soon' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
]

export function DataHubClient() {
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
          Financial Data Hub
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-low)', marginTop: 8, lineHeight: 1.6 }}>
          All your financial raw data in one place — transactions, AR, AP, statements, and benchmarks.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {SECTIONS.map(s => <SectionCard key={s.href} {...s} />)}
      </div>
    </div>
  )
}
