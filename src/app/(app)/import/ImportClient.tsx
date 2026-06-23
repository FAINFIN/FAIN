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
    title: 'Accounting Data',
    description: 'Import your chart of accounts, journals, and ledger entries from QuickBooks, Xero, or a CSV export.',
    href: '/import/accounting',
    badge: 'Soon' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    title: 'Bank Transactions',
    description: 'Upload a bank statement CSV or OFX file to bring transactions in without a live bank connection.',
    href: '/import/bank-transactions',
    badge: 'Soon' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="22" x2="21" y2="22"/>
        <line x1="6" y1="18" x2="6" y2="11"/>
        <line x1="10" y1="18" x2="10" y2="11"/>
        <line x1="14" y1="18" x2="14" y2="11"/>
        <line x1="18" y1="18" x2="18" y2="11"/>
        <polygon points="12 2 20 7 4 7"/>
      </svg>
    ),
  },
  {
    title: 'Accounts Data',
    description: 'Import your chart of accounts or account structures to organise financial data by entity or department.',
    href: '/import/accounts',
    badge: 'Soon' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/>
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      </svg>
    ),
  },
  {
    title: 'Suppliers Data',
    description: 'Import your supplier list with payment terms, contact details, and outstanding balances.',
    href: '/import/suppliers',
    badge: 'Soon' as const,
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
    title: 'Invoices',
    description: 'Import issued invoices in bulk from a CSV — amounts, dates, clients, and payment status.',
    href: '/import/invoices',
    badge: 'Soon' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
  },
]

export function ImportClient() {
  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 960, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: 8,
        }}>
          Imports
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 3vw, 38px)',
          fontWeight: 400, color: 'var(--text-high)',
          lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0,
        }}>
          Import Data
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-low)', marginTop: 8, lineHeight: 1.6 }}>
          Bring in financial data from files, accounting software, or manual uploads.
        </p>
      </div>

      {/* Section cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 16,
      }}>
        {SECTIONS.map(s => <SectionCard key={s.href} {...s} />)}
      </div>
    </div>
  )
}
