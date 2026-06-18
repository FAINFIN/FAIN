'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { Suspense } from 'react'
import { cn } from '@/lib/utils/cn'
import { authClient } from '@/lib/auth/client'
import { getDb } from '@/lib/db/schema'
import { useLocale } from '@/lib/i18n/LocaleContext'

interface SidebarProps {
  user: { name?: string | null; email: string; image?: string | null }
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function BankIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="22" x2="21" y2="22"/>
      <line x1="6" y1="18" x2="6" y2="11"/>
      <line x1="10" y1="18" x2="10" y2="11"/>
      <line x1="14" y1="18" x2="14" y2="11"/>
      <line x1="18" y1="18" x2="18" y2="11"/>
      <polygon points="12 2 20 7 4 7"/>
    </svg>
  )
}

function SignOutIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-low)', flexShrink: 0 }}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

// ─── Bank logo pill ───────────────────────────────────────────────────────────
// Short abbreviated name shown in the sidebar connections row

function BankPill({ name }: { name: string }) {
  // Map known providers to short display names
  const abbr: Record<string, string> = {
    bog:           'BOG',
    'bank of georgia': 'BOG',
    tbc:           'TBC',
    'tbc bank':    'TBC',
    quickbooks:    'QB',
    xero:          'Xero',
    nbg:           'NBG',
    liberty:       'Lib.',
    vtb:           'VTB',
  }
  const key   = name.toLowerCase().trim()
  const label = abbr[key] ?? name.slice(0, 4).toUpperCase()

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 8px',
      borderRadius: 999,
      background: 'var(--stone-3)',
      border: '1px solid var(--border-subtle)',
      fontSize: 11,
      fontWeight: 600,
      color: 'var(--text-mid)',
      letterSpacing: '0.02em',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pos)', flexShrink: 0 }} />
      {label}
    </span>
  )
}

// ─── Main sidebar ─────────────────────────────────────────────────────────────

function SidebarInner({ user }: SidebarProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const { t } = useLocale()
  const s = t.sidebar

  // Live data from IndexedDB
  const conversations = useLiveQuery(
    () => getDb().conversations.orderBy('updatedAt').reverse().limit(8).toArray(),
    [], []
  )
  const connections = useLiveQuery(() => getDb().connections.toArray(), [], [])

  // User display
  const initials = user.name
    ? user.name.split(' ').map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 2)
    : (user.email[0]?.toUpperCase() ?? '?')
  const displayName = user.name ?? user.email.split('@')[0]
  const firstName   = user.name?.split(' ')[0] ?? displayName

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/')
  }

  // Current conversation from URL
  const currentConvId = pathname.startsWith('/ask')
    ? (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('c') : null)
    : null

  return (
    <aside className="sidebar">

      {/* ── Logo ── */}
      <div className="sidebar-top">
        <Link className="brand" href="/ask" style={{ textDecoration: 'none' }}>
          <span className="word" style={{ fontSize: 20 }}>
            fain<span className="fstop">.</span>
          </span>
        </Link>
      </div>

      {/* ── New question button ── */}
      <div style={{ padding: '0 12px 16px' }}>
        <Link
          href="/ask"
          className="btn btn-ghost btn-sm"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            justifyContent: 'flex-start',
            padding: '8px 12px',
            borderRadius: 10,
            background: 'var(--stone-2)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-mid)',
            fontWeight: 500,
            fontSize: 13,
            textDecoration: 'none',
          }}
        >
          <PlusIcon />
          {s.newQuestion}
        </Link>
      </div>

      {/* ── Recent conversations ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {conversations && conversations.length > 0 ? (
          <>
            <div style={{ padding: '0 8px 6px', fontSize: 11, fontWeight: 600, color: 'var(--text-low)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {s.recent}
            </div>
            {conversations.map(conv => {
              const isActive = conv.id === currentConvId
              return (
                <Link
                  key={conv.id}
                  href={`/ask?c=${conv.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 10px',
                    borderRadius: 9,
                    textDecoration: 'none',
                    background: isActive ? 'var(--stone-3)' : 'transparent',
                    color: isActive ? 'var(--text-high)' : 'var(--text-mid)',
                    fontSize: 13,
                    fontWeight: isActive ? 500 : 400,
                    transition: 'background .15s',
                  }}
                  className="sidebar-conv-link"
                >
                  <span style={{ color: 'var(--text-low)', flexShrink: 0, opacity: 0.7 }}>
                    <ChatIcon />
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.title}
                  </span>
                </Link>
              )
            })}
          </>
        ) : (
          /* Empty state — gently prompt to ask the first question */
          <div style={{ padding: '8px 10px 0', color: 'var(--text-low)', fontSize: 12.5, lineHeight: 1.55 }}>
            {s.noConvs}
          </div>
        )}
      </div>

      {/* ── Connected banks ── */}
      <div style={{ padding: '12px 12px 4px', borderTop: '1px solid var(--border-subtle)', marginTop: 8 }}>
        {connections && connections.length > 0 ? (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-low)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
              {s.connected}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {connections.map(conn => (
                <BankPill key={conn.id} name={conn.provider} />
              ))}
            </div>
          </>
        ) : (
          /* No banks — soft CTA */
          <Link
            href="/connect-bank"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 10px',
              borderRadius: 9,
              background: 'var(--tan-soft)',
              border: '1px dashed var(--tan-9)',
              color: 'var(--tan-11)',
              fontSize: 12.5,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <BankIcon />
            {s.connectBank}
          </Link>
        )}
      </div>

      {/* ── User footer ── */}
      <div className="sidebar-foot" style={{ borderTop: '1px solid var(--border-subtle)', padding: '10px 12px' }}>
        <button
          className="user-row"
          onClick={handleSignOut}
          title={s.signOut}
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          {/* Avatar */}
          {user.image ? (
            <img
              src={user.image}
              alt={firstName}
              style={{ width: 30, height: 30, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div className="avatar" style={{ width: 30, height: 30, borderRadius: 9, fontSize: 12 }}>
              {initials}
            </div>
          )}

          {/* Name + company */}
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {firstName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-low)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
              Fain · ₾ / $
            </div>
          </div>

          <SignOutIcon />
        </button>
      </div>
    </aside>
  )
}

export function Sidebar({ user }: SidebarProps) {
  return (
    <Suspense fallback={
      <aside className="sidebar">
        <div className="sidebar-top">
          <Link className="brand" href="/ask" style={{ textDecoration: 'none' }}>
            <span className="word" style={{ fontSize: 20 }}>fain<span className="fstop">.</span></span>
          </Link>
        </div>
      </aside>
    }>
      <SidebarInner user={user} />
    </Suspense>
  )
}
