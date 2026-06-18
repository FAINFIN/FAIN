'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { useLocale } from '@/lib/i18n/LocaleContext'

interface TopBarProps {
  user: { name?: string | null; email: string }
}

type Currency = 'GEL' | 'USD'

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18"/>
      <path d="M9 21V9"/>
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}

export function TopBar({ user }: TopBarProps) {
  const router = useRouter()
  const { locale } = useLocale()
  const [currency, setCurrency] = useState<Currency>('GEL')
  const [query, setQuery] = useState('')

  const initials = user.name
    ? user.name.split(' ').map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 2)
    : (user.email[0]?.toUpperCase() ?? '?')

  // Derive a display name for the workspace pill
  const workspaceName = user.name ?? user.email.split('@')[0]

  function handleAskSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    const q = encodeURIComponent(query.trim())
    setQuery('')
    router.push(`/ask?q=${q}`)
  }

  function handleAskKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAskSubmit(e as unknown as React.FormEvent)
  }

  return (
    <header className="app-topbar">
      {/* ── Workspace pill ── */}
      <button className="topbar-company" type="button">
        <BuildingIcon />
        <span className="topbar-company-name">{workspaceName}</span>
        <ChevronDown />
      </button>

      {/* ── Global ask bar ── */}
      <form className="topbar-ask" onSubmit={handleAskSubmit}>
        <SearchIcon />
        <input
          className="topbar-ask-input"
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleAskKeyDown}
          placeholder={locale === 'ka' ? 'ჰკითხე Fain-ს…' : 'ASK FAIN ANYTHING…'}
          autoComplete="off"
          aria-label={locale === 'ka' ? 'ჰკითხე Fain-ს' : 'Ask Fain'}
        />
        <span className="topbar-ask-shortcut">/</span>
      </form>

      {/* ── Right actions ── */}
      <div className="topbar-right">
        {/* Currency toggle */}
        <div className="currency-toggle">
          <span
            className={cn('currency-option', currency === 'GEL' && 'active')}
            onClick={() => setCurrency('GEL')}
            role="button"
            tabIndex={0}
          >₾</span>
          <span
            className={cn('currency-option', currency === 'USD' && 'active')}
            onClick={() => setCurrency('USD')}
            role="button"
            tabIndex={0}
          >$</span>
        </div>

        {/* Avatar */}
        <div className="topbar-avatar" title={user.name ?? user.email}>
          {initials}
        </div>
      </div>
    </header>
  )
}
