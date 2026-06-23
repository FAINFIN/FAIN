'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/i18n/LocaleContext'

interface TopBarProps {
  user: { name?: string | null; email: string }
}

export type AppCurrency = 'GEL' | 'USD' | 'EUR' | 'GBP' | 'CNY'

const CURRENCIES: { code: AppCurrency; symbol: string; label: string }[] = [
  { code: 'GEL', symbol: '₾', label: '₾  GEL' },
  { code: 'USD', symbol: '$', label: '$  USD' },
  { code: 'EUR', symbol: '€', label: '€  EUR' },
  { code: 'GBP', symbol: '£', label: '£  GBP' },
  { code: 'CNY', symbol: '¥', label: '¥  CNY' },
]

function ChevronDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

// ─── Currency dropdown ────────────────────────────────────────────────────────

function CurrencyDropdown({ value, onChange }: { value: AppCurrency; onChange: (c: AppCurrency) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = CURRENCIES.find(c => c.code === value)!

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 10px',
          borderRadius: 'var(--r-pill)',
          border: '1px solid var(--border-subtle)',
          background: open ? 'var(--stone-3)' : 'var(--stone-2)',
          color: 'var(--text-high)',
          fontSize: 12.5,
          fontWeight: 600,
          fontFamily: 'var(--font-num)',
          cursor: 'pointer',
          transition: 'background .12s',
          whiteSpace: 'nowrap',
        }}
      >
        {selected.symbol} <span style={{ color: 'var(--text-low)', fontFamily: 'var(--font-ui)', fontWeight: 500 }}>{selected.code}</span>
        <span style={{ marginLeft: 1, color: 'var(--text-low)', display: 'flex' }}><ChevronDown /></span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          background: 'var(--surface-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          boxShadow: 'var(--sh-lift)',
          padding: '4px',
          zIndex: 200,
          minWidth: 110,
        }}>
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              onClick={() => { onChange(c.code); setOpen(false) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '7px 10px',
                borderRadius: 8,
                border: 'none',
                background: c.code === value ? 'var(--stone-3)' : 'transparent',
                color: c.code === value ? 'var(--text-high)' : 'var(--text-mid)',
                fontSize: 12.5,
                fontWeight: c.code === value ? 600 : 400,
                fontFamily: 'var(--font-num)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background .1s',
              }}
              onMouseEnter={e => { if (c.code !== value) (e.currentTarget as HTMLElement).style.background = 'var(--stone-2)' }}
              onMouseLeave={e => { if (c.code !== value) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span style={{ width: 14, textAlign: 'center' }}>{c.symbol}</span>
              <span style={{ fontFamily: 'var(--font-ui)', color: 'var(--text-low)', fontWeight: 400, fontSize: 12 }}>{c.code}</span>
              {c.code === value && (
                <svg style={{ marginLeft: 'auto' }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--tan-9)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

export function TopBar({ user }: TopBarProps) {
  const router = useRouter()
  const { t } = useLocale()
  const [currency, setCurrency] = useState<AppCurrency>('GEL')
  const [query, setQuery] = useState('')

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
          placeholder={t.topbar.placeholder}
          autoComplete="off"
          aria-label={t.topbar.ariaLabel}
        />
        <span className="topbar-ask-shortcut">/</span>
      </form>

      {/* ── Right actions ── */}
      <div className="topbar-right">
        <CurrencyDropdown value={currency} onChange={setCurrency} />
      </div>
    </header>
  )
}
