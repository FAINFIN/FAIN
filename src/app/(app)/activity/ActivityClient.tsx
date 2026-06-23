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

// ─── Live feed placeholder ────────────────────────────────────────────────────

const SAMPLE_FEED = [
  { id: 1, type: 'transaction', label: 'Payroll transferred', amount: '−₾48,200', time: '2h ago',  color: 'var(--neg)' },
  { id: 2, type: 'alert',       label: 'Runway dropped below 12 months', amount: null, time: '6h ago', color: 'var(--tan-9)' },
  { id: 3, type: 'transaction', label: 'Revenue received — Client A', amount: '+₾24,500', time: 'Yesterday', color: 'var(--pos)' },
  { id: 4, type: 'sync',        label: 'BOG synced — 14 new transactions', amount: null, time: 'Yesterday', color: 'var(--text-low)' },
  { id: 5, type: 'transaction', label: 'AWS invoice paid', amount: '−₾3,240', time: '2d ago', color: 'var(--neg)' },
]

function FeedItem({ item }: { item: typeof SAMPLE_FEED[number] }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: item.color, flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, color: 'var(--text-high)', fontWeight: 500 }}>{item.label}</div>
      </div>
      {item.amount && (
        <div style={{
          fontSize: 13, fontFamily: 'var(--font-num)', fontWeight: 600,
          color: item.color, flexShrink: 0,
        }}>
          {item.amount}
        </div>
      )}
      <div style={{ fontSize: 11.5, color: 'var(--text-low)', flexShrink: 0 }}>{item.time}</div>
    </div>
  )
}

export function ActivityClient() {
  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 960, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--text-low)', marginBottom: 8,
        }}>Activity</div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 3vw, 38px)',
          fontWeight: 400, color: 'var(--text-high)',
          lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0,
        }}>
          Activity & Feed
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-low)', marginTop: 8, lineHeight: 1.6 }}>
          A real-time feed of transactions, alerts, and account events.
        </p>
      </div>

      {/* Section cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 32 }}>
        <SectionCard
          title="Transactions"
          description="Browse, search, and filter every bank and card transaction across all connected accounts."
          href="/transactions"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          }
        />
        <SectionCard
          title="Live Feed"
          description="A chronological stream of all financial events — transactions, alerts, syncs, and AI insights."
          href="/activity"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          }
        />
      </div>

      {/* Live feed preview */}
      <div style={{
        background: 'var(--surface-primary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16, overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 16px 10px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 13, fontWeight: 650, color: 'var(--text-high)' }}>Recent events</div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 11.5, color: 'var(--text-low)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pos)', display: 'inline-block' }} />
            Live
          </span>
        </div>

        {SAMPLE_FEED.map(item => <FeedItem key={item.id} item={item} />)}

        <div style={{ padding: '10px 16px' }}>
          <Link
            href="/transactions"
            style={{ fontSize: 13, color: 'var(--tan-11)', fontWeight: 600, textDecoration: 'none' }}
          >
            View all transactions →
          </Link>
        </div>
      </div>
    </div>
  )
}
