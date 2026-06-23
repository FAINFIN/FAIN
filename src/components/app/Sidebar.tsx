'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { authClient } from '@/lib/auth/client'
import { getDb } from '@/lib/db/schema'
import { useLocale } from '@/lib/i18n/LocaleContext'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConvItem {
  id:        string
  title:     string
  updatedAt: string
}

interface SidebarProps {
  user: { name?: string | null; email: string; image?: string | null }
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useServerConversations(activeConvId: string | null) {
  const [conversations, setConversations] = useState<ConvItem[]>([])

  const fetchConvs = useCallback(() => {
    fetch('/api/conversations')
      .then(r => r.ok ? r.json() : { conversations: [] })
      .then(data => setConversations(data.conversations ?? []))
      .catch(console.error)
  }, [])

  useEffect(() => { fetchConvs() }, [fetchConvs])

  useEffect(() => {
    window.addEventListener('fain:new-conversation', fetchConvs)
    return () => window.removeEventListener('fain:new-conversation', fetchConvs)
  }, [fetchConvs])

  return conversations
}

function usePinnedConvs() {
  const [pinned, setPinned] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('fain:pinned-convs') ?? '[]') }
    catch { return [] }
  })

  const toggle = useCallback((id: string) => {
    setPinned(prev => {
      const next = prev.includes(id) ? prev.filter(p => p !== id) : [id, ...prev]
      localStorage.setItem('fain:pinned-convs', JSON.stringify(next))
      return next
    })
  }, [])

  return { pinned, toggle }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatConvDate(date: Date): string {
  const now  = new Date()
  const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7)  return `${diff}d ago`
  return new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function AskIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function ComposeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 1 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function OverviewIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
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

function ForecastIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 17 9 11 13 15 21 7"/>
      <line x1="21" y1="7" x2="21" y2="13"/><line x1="21" y1="7" x2="15" y2="7"/>
    </svg>
  )
}

function DecisionIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 8v4l3 3"/>
    </svg>
  )
}

function InvestorIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  )
}

function DataHubIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  )
}

function TxIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  )
}

function ActivityIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )
}

function ImportIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
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

function PinIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      {!filled && <circle cx="12" cy="10" r="3"/>}
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
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
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

// ─── NavLink ─────────────────────────────────────────────────────────────────

function NavLink({ href, icon, label, exact = false }: {
  href:    string
  icon:    React.ReactNode
  label:   string
  exact?:  boolean
}) {
  const pathname = usePathname()
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className="sidebar-nav-link"
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
    >
      <span style={{ opacity: active ? 1 : 0.6 }}>{icon}</span>
      {label}
    </Link>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: 'var(--text-low)',
      padding: '2px 10px 6px',
    }}>
      {children}
    </div>
  )
}

// ─── Bank pill ────────────────────────────────────────────────────────────────

function BankPill({ name }: { name: string }) {
  const abbr: Record<string, string> = {
    bog: 'BOG', 'bank of georgia': 'BOG',
    tbc: 'TBC', 'tbc bank': 'TBC',
    quickbooks: 'QB', xero: 'Xero',
    nbg: 'NBG', liberty: 'Lib.', vtb: 'VTB',
  }
  const key   = name.toLowerCase().trim()
  const label = abbr[key] ?? name.slice(0, 4).toUpperCase()

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999,
      background: 'var(--stone-3)', border: '1px solid var(--border-subtle)',
      fontSize: 11, fontWeight: 600, color: 'var(--text-mid)', letterSpacing: '0.02em',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pos)', flexShrink: 0 }} />
      {label}
    </span>
  )
}

// ─── Settings panel ───────────────────────────────────────────────────────────

interface SettingsPanelProps {
  user:    { name?: string | null; email: string }
  onClose: () => void
}

function SettingsPanel({ user, onClose }: SettingsPanelProps) {
  const displayName = user.name ?? user.email.split('@')[0] ?? user.email
  const panelRef    = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Close on outside click (outside the panel itself)
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 50)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  const SETTINGS_GROUPS = [
    {
      items: [
        { label: 'User Settings',       icon: '👤', href: '#' },
        { label: 'Interface Language',  icon: '🌐', href: '#' },
        { label: 'Change Currency',     icon: '₾',  href: '#' },
      ],
    },
    {
      items: [
        { label: 'Connections',         icon: '🔗', href: '/connect-bank' },
        { label: 'Chat Logs',           icon: '📋', href: '#' },
        { label: 'Upgrade Plan',        icon: '⚡', href: '#' },
      ],
    },
    {
      items: [
        { label: 'Get Help',            icon: '❓', href: '#' },
        { label: 'Give Feedback',       icon: '💬', href: '#' },
      ],
    },
  ]

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 290,
        background: 'rgba(0,0,0,0.18)',
        backdropFilter: 'blur(1px)',
        animation: 'fadeIn .15s ease',
      }} />

      {/* Panel — slides in over the sidebar */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          width: 272,
          zIndex: 300,
          background: 'var(--surface-primary)',
          borderRight: '1px solid var(--border-subtle)',
          boxShadow: 'var(--sh-lift)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInLeft .18s cubic-bezier(.2,.7,.2,1)',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 16px 8px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-high)' }}>
            {displayName}
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 8,
              border: 'none', background: 'transparent',
              color: 'var(--text-low)', cursor: 'pointer',
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Settings groups */}
        <div style={{ flex: 1, padding: '8px 8px' }}>
          {SETTINGS_GROUPS.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 4 }}>
              {group.items.map(item => (
                <a
                  key={item.label}
                  href={item.href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 9,
                    textDecoration: 'none',
                    color: 'var(--text-mid)',
                    fontSize: 13.5, fontWeight: 450,
                    transition: 'background .1s',
                  }}
                  className="settings-row"
                >
                  <span style={{ fontSize: 14, lineHeight: 1, width: 20, textAlign: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <span style={{ color: 'var(--text-low)', opacity: 0.5 }}><ChevronRight /></span>
                </a>
              ))}
              {gi < SETTINGS_GROUPS.length - 1 && (
                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '6px 2px' }} />
              )}
            </div>
          ))}
        </div>

        {/* Version */}
        <div style={{ padding: '12px 18px', fontSize: 11, color: 'var(--text-low)', borderTop: '1px solid var(--border-subtle)' }}>
          Fain · Beta · v0.1
        </div>
      </div>
    </>
  )
}

// ─── Main sidebar inner ───────────────────────────────────────────────────────

function SidebarInner({ user }: SidebarProps) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const { t }        = useLocale()
  const s            = t.sidebar

  const activeConvId = searchParams.get('c')
  const isAskActive  = pathname === '/ask' && !activeConvId

  const connections   = useLiveQuery(() => getDb().connections.toArray(), [], [])
  const conversations = useServerConversations(activeConvId)
  const { pinned, toggle: togglePin } = usePinnedConvs()

  const [chatSearch,    setChatSearch]    = useState('')
  const [settingsOpen,  setSettingsOpen]  = useState(false)
  const [hoveredConv,   setHoveredConv]   = useState<string | null>(null)

  const displayName = user.name ?? user.email.split('@')[0] ?? user.email

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/')
  }

  // Build the chat list: pinned first, then recents, filtered, max 6 total
  const filteredConvs = conversations.filter(c =>
    !chatSearch || c.title.toLowerCase().includes(chatSearch.toLowerCase())
  )
  const pinnedConvs   = filteredConvs.filter(c => pinned.includes(c.id))
  const recentConvs   = filteredConvs.filter(c => !pinned.includes(c.id))
  const displayConvs  = [...pinnedConvs, ...recentConvs].slice(0, 6)

  const IMPORTS = [
    { label: 'Accounting data',    slug: 'accounting' },
    { label: 'Bank transactions',  slug: 'bank-transactions' },
    { label: 'Accounts data',      slug: 'accounts' },
    { label: 'Suppliers data',     slug: 'suppliers' },
    { label: 'Invoices',           slug: 'invoices' },
  ]

  return (
    <>
      <aside className="sidebar">

        {/* ── Logo ── */}
        <div className="sidebar-top">
          <Link className="brand" href="/ask" style={{ textDecoration: 'none' }}>
            <span className="word" style={{ fontSize: 20 }}>
              fain<span className="fstop">.</span>
            </span>
          </Link>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* ─ §1 Ask Fain ─ */}
          <div style={{ padding: '6px 0 2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Link
                href="/ask"
                className="sidebar-nav-link"
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 9,
                  padding: '8px 10px', borderRadius: 9, textDecoration: 'none',
                  background: isAskActive ? 'color-mix(in oklch, var(--tan-9) 11%, transparent)' : 'transparent',
                  color: isAskActive ? 'var(--tan-11)' : 'var(--text-mid)',
                  fontSize: 13.5, fontWeight: isAskActive ? 700 : 500,
                  transition: 'background .12s, color .12s',
                }}
              >
                <span style={{ opacity: isAskActive ? 1 : 0.65 }}><AskIcon /></span>
                Ask Fain
              </Link>
              <button
                onClick={() => router.push('/ask')}
                title="New chat"
                className="sidebar-nav-link"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 28, borderRadius: 8,
                  border: 'none', background: 'transparent',
                  color: 'var(--text-low)', cursor: 'pointer', flexShrink: 0,
                  transition: 'background .12s, color .12s',
                }}
              >
                <ComposeIcon />
              </button>
            </div>
          </div>

          {/* Thin divider */}
          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '2px 2px' }} />

          {/* ─ §2 Views ─ */}
          <div style={{ paddingTop: 6 }}>
            <SectionLabel>Views</SectionLabel>
            <NavLink href="/dashboard"          icon={<OverviewIcon />}  label="Overview" />
            <NavLink href="/cash-flow"          icon={<CashIcon />}      label="Cash Flow" />
            <NavLink href="/forecasting"        icon={<ForecastIcon />}  label="Forecasting" />
            <NavLink href="/decision-engine"    icon={<DecisionIcon />}  label="Decision Engine" />
            <NavLink href="/investor-reporting" icon={<InvestorIcon />}  label="Investor Reporting" />
            <NavLink href="/data-hub"           icon={<DataHubIcon />}   label="Financial Data Hub" />
          </div>

          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 2px' }} />

          {/* ─ §3 Chats ─ */}
          <div style={{ paddingTop: 6 }}>
            <SectionLabel>Chats</SectionLabel>

            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 10px', margin: '0 0 4px',
              background: 'var(--stone-2)', borderRadius: 8,
              border: '1px solid var(--border-subtle)',
            }}>
              <span style={{ color: 'var(--text-low)', display: 'flex', flexShrink: 0 }}><SearchIcon /></span>
              <input
                type="text"
                value={chatSearch}
                onChange={e => setChatSearch(e.target.value)}
                placeholder="Search chats…"
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  background: 'transparent', fontSize: 12.5,
                  color: 'var(--text-mid)',
                  '::placeholder': { color: 'var(--text-low)' },
                } as React.CSSProperties}
              />
            </div>

            {/* Conversation list */}
            {displayConvs.length > 0 ? (
              <div className="conv-list">
                {displayConvs.map(conv => {
                  const isActive   = conv.id === activeConvId
                  const isPinned   = pinned.includes(conv.id)
                  const isHovered  = hoveredConv === conv.id

                  return (
                    <div
                      key={conv.id}
                      style={{ position: 'relative' }}
                      onMouseEnter={() => setHoveredConv(conv.id)}
                      onMouseLeave={() => setHoveredConv(null)}
                    >
                      <button
                        onClick={() => router.push(`/ask?c=${conv.id}`)}
                        className={`conv-item${isActive ? ' active' : ''}`}
                        style={{
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'flex-start', width: '100%',
                          textAlign: 'left', border: 'none', cursor: 'pointer',
                          whiteSpace: 'normal', paddingRight: isHovered ? 28 : 10,
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', display: 'flex', alignItems: 'center', gap: 5 }}>
                          {isPinned && <span style={{ color: 'var(--tan-9)', flexShrink: 0, display: 'flex' }}><PinIcon filled /></span>}
                          {conv.title.length > 30 ? conv.title.slice(0, 30) + '…' : conv.title}
                        </span>
                        <span style={{ fontSize: 10.5, color: 'var(--text-low)', marginTop: 1 }}>
                          {formatConvDate(new Date(conv.updatedAt))}
                        </span>
                      </button>

                      {/* Pin button — appears on hover */}
                      {isHovered && (
                        <button
                          onClick={e => { e.stopPropagation(); togglePin(conv.id) }}
                          title={isPinned ? 'Unpin' : 'Pin'}
                          style={{
                            position: 'absolute', right: 6, top: '50%',
                            transform: 'translateY(-50%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 22, height: 22, borderRadius: 6,
                            border: 'none', background: 'var(--stone-3)',
                            color: isPinned ? 'var(--tan-9)' : 'var(--text-low)',
                            cursor: 'pointer', flexShrink: 0,
                          }}
                        >
                          <PinIcon filled={isPinned} />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <span className="conv-empty">
                {chatSearch ? 'No chats found' : 'No conversations yet'}
              </span>
            )}
          </div>

          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 2px' }} />

          {/* ─ §4 Activity ─ */}
          <div style={{ paddingTop: 6 }}>
            <SectionLabel>Activity</SectionLabel>
            <NavLink href="/transactions" icon={<TxIcon />}       label="Transactions" />
            <NavLink href="/activity"     icon={<ActivityIcon />} label="Activity & Feed" />
          </div>

          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 2px' }} />

          {/* ─ §5 Imports ─ */}
          <div style={{ paddingTop: 6 }}>
            <SectionLabel>Imports</SectionLabel>
            {IMPORTS.map(imp => (
              <Link
                key={imp.slug}
                href={`/import/${imp.slug}`}
                className="sidebar-nav-link"
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '7px 10px', borderRadius: 9,
                  textDecoration: 'none', color: 'var(--text-mid)',
                  fontSize: 13, fontWeight: 400,
                  transition: 'background .12s, color .12s',
                }}
              >
                <span style={{ opacity: 0.6 }}><ImportIcon /></span>
                {imp.label}
              </Link>
            ))}
          </div>

          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 2px' }} />

          {/* ─ §6 Settings ─ */}
          <div style={{ paddingTop: 6, paddingBottom: 2 }}>
            <SectionLabel>Settings</SectionLabel>
            <button
              onClick={() => setSettingsOpen(true)}
              className="sidebar-nav-link"
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '7px 10px', borderRadius: 9, width: '100%',
                border: 'none', background: 'transparent',
                color: 'var(--text-mid)', fontSize: 13, fontWeight: 400,
                cursor: 'pointer', textAlign: 'left',
                transition: 'background .12s, color .12s',
              }}
            >
              <span style={{ opacity: 0.6 }}><SettingsIcon /></span>
              Preferences
            </button>
          </div>
        </div>

        {/* ── Connected banks ── */}
        <div style={{ padding: '10px 12px 6px', borderTop: '1px solid var(--border-subtle)' }}>
          {connections && connections.length > 0 ? (
            <>
              <div style={{
                fontSize: 10.5, fontWeight: 600, color: 'var(--text-low)',
                letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 7,
              }}>
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
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 10px', borderRadius: 9,
                background: 'var(--tan-soft)', border: '1px dashed var(--tan-9)',
                color: 'var(--tan-11)', fontSize: 12.5, fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              <BankIcon />
              {s.connectBank}
            </Link>
          )}
        </div>

        {/* ── User footer ── */}
        <div
          className="sidebar-foot"
          style={{ borderTop: '1px solid var(--border-subtle)', padding: '10px 12px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setSettingsOpen(true)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                textAlign: 'left', minWidth: 0,
              }}
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt={displayName}
                  style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div
                  className="avatar"
                  style={{ width: 28, height: 28, borderRadius: 8, fontSize: 11, flexShrink: 0 }}
                >
                  {displayName[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: 'var(--text-high)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {displayName}
                </div>
              </div>
            </button>

            <button
              onClick={handleSignOut}
              title={s.signOut}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: 8,
                border: 'none', background: 'transparent',
                color: 'var(--text-low)', cursor: 'pointer', flexShrink: 0,
                transition: 'background .12s, color .12s',
              }}
              className="sidebar-nav-link"
            >
              <SignOutIcon />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Settings slide-in ── */}
      {settingsOpen && (
        <SettingsPanel user={user} onClose={() => setSettingsOpen(false)} />
      )}
    </>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

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
