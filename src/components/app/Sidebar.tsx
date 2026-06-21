'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { Suspense, useState, useEffect, useCallback } from 'react'
import { authClient } from '@/lib/auth/client'
import { getDb } from '@/lib/db/schema'
import { useLocale } from '@/lib/i18n/LocaleContext'

// ─── Server-backed conversation list ─────────────────────────────────────────

interface ConvItem {
  id:        string
  title:     string
  updatedAt: string
}

function useServerConversations(activeConvId: string | null) {
  const [conversations, setConversations] = useState<ConvItem[]>([])

  const fetchConvs = useCallback(() => {
    fetch('/api/conversations')
      .then(r => r.ok ? r.json() : { conversations: [] })
      .then(data => setConversations(data.conversations ?? []))
      .catch(console.error)
  }, [])

  // Initial load
  useEffect(() => { fetchConvs() }, [fetchConvs])

  // Re-fetch when a new conversation is created from anywhere in the app
  useEffect(() => {
    window.addEventListener('fain:new-conversation', fetchConvs)
    return () => window.removeEventListener('fain:new-conversation', fetchConvs)
  }, [fetchConvs])

  return conversations
}

// ─── Date helper ──────────────────────────────────────────────────────────────

function formatConvDate(date: Date): string {
  const now  = new Date()
  const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7)  return `${diff}d ago`
  return new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

function ComposeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 1 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

interface SidebarProps {
  user: { name?: string | null; email: string; image?: string | null }
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function AskIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function OverviewIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )
}

function FeedIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11a9 9 0 0 1 9 9"/>
      <path d="M4 4a16 16 0 0 1 16 16"/>
      <circle cx="5" cy="19" r="1" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function CommandIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5"/>
      <line x1="12" y1="19" x2="20" y2="19"/>
    </svg>
  )
}

function CashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  )
}

function TxIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
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

function BankPill({ name }: { name: string }) {
  const abbr: Record<string, string> = {
    bog:                'BOG',
    'bank of georgia':  'BOG',
    tbc:                'TBC',
    'tbc bank':         'TBC',
    quickbooks:         'QB',
    xero:               'Xero',
    nbg:                'NBG',
    liberty:            'Lib.',
    vtb:                'VTB',
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

// ─── Nav link ─────────────────────────────────────────────────────────────────

function NavLink({ href, icon, label, exact = false }: {
  href: string
  icon: React.ReactNode
  label: string
  exact?: boolean
}) {
  const pathname = usePathname()
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '7px 10px',
        borderRadius: 9,
        textDecoration: 'none',
        background: active ? 'var(--stone-3)' : 'transparent',
        color: active ? 'var(--text-high)' : 'var(--text-mid)',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        transition: 'background .12s, color .12s',
      }}
      className="sidebar-nav-link"
    >
      <span style={{ opacity: active ? 1 : 0.65 }}>{icon}</span>
      {label}
    </Link>
  )
}

// ─── Main sidebar ─────────────────────────────────────────────────────────────

function SidebarInner({ user }: SidebarProps) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const { t } = useLocale()
  const s = t.sidebar
  const n = t.nav

  const activeConvId = searchParams.get('c')
  const isAskActive  = pathname === '/ask' && !activeConvId

  const connections   = useLiveQuery(() => getDb().connections.toArray(), [], [])
  const conversations = useServerConversations(activeConvId)

  const initials = user.name
    ? user.name.split(' ').map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 2)
    : (user.email[0]?.toUpperCase() ?? '?')
  const displayName = user.name ?? user.email.split('@')[0]
  const firstName   = user.name?.split(' ')[0] ?? displayName

  async function handleSignOut() {
    // Do NOT wipe IndexedDB here — the same user should get their history
    // back when they sign in again. UserGuard handles the cross-account
    // case: if a different email logs in next, it wipes everything then.
    await authClient.signOut()
    router.push('/')
  }

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

      {/* ── Page navigation ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 8px' }}>

        {/* Primary: Ask + New chat compose button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
          <Link
            href="/ask"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '7px 10px',
              borderRadius: 9,
              textDecoration: 'none',
              background: isAskActive ? 'var(--stone-3)' : 'transparent',
              color: isAskActive ? 'var(--text-high)' : 'var(--text-mid)',
              fontSize: 13,
              fontWeight: isAskActive ? 600 : 400,
              transition: 'background .12s, color .12s',
            }}
            className="sidebar-nav-link"
          >
            <span style={{ opacity: isAskActive ? 1 : 0.65 }}><AskIcon /></span>
            {n.ask}
          </Link>
          <button
            onClick={() => router.push('/ask')}
            title="New chat"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-low)',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background .12s, color .12s',
            }}
            className="sidebar-nav-link"
          >
            <ComposeIcon />
          </button>
        </div>

        {/* Conversation history */}
        {conversations && conversations.length > 0 && (
          <div className="conv-list" style={{ marginBottom: 4 }}>
            {conversations.map(conv => {
              const isActive = conv.id === activeConvId
              return (
                <button
                  key={conv.id}
                  onClick={() => router.push(`/ask?c=${conv.id}`)}
                  className={`conv-item${isActive ? ' active' : ''}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'normal',
                  }}
                >
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%',
                  }}>
                    {conv.title.length > 34 ? conv.title.slice(0, 34) + '…' : conv.title}
                  </span>
                  <span style={{ fontSize: 10.5, color: 'var(--text-low)', marginTop: 1 }}>
                    {formatConvDate(new Date(conv.updatedAt))}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 2px' }} />

        {/* Dashboard views */}
        <div style={{ padding: '2px 8px 4px', fontSize: 10.5, fontWeight: 600, color: 'var(--text-low)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          {s.navSection}
        </div>
        <NavLink href="/dashboard" icon={<OverviewIcon />} label={n.dashboard} />
        <NavLink href="/feed"      icon={<FeedIcon />}     label={n.feed} />
        <NavLink href="/command"   icon={<CommandIcon />}  label={n.command} />

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 2px' }} />

        {/* Data pages */}
        <NavLink href="/cash-flow"    icon={<CashIcon />}     label={n.cashFlow} />
        <NavLink href="/transactions" icon={<TxIcon />}       label={n.transactions} />
        <NavLink href="/settings"     icon={<SettingsIcon />} label={n.settings} />
      </div>

      {/* ── Connected banks ── */}
      <div style={{ padding: '10px 12px 4px', borderTop: '1px solid var(--border-subtle)' }}>
        {connections && connections.length > 0 ? (
          <>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-low)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 7 }}>
              {s.connected}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {connections.map(conn => (
                <BankPill key={conn.id} name={conn.provider} />
              ))}
            </div>
          </>
        ) : (
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
