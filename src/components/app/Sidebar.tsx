'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { authClient } from '@/lib/auth/client'
import { useLocale } from '@/lib/i18n/LocaleContext'
import type { Locale } from '@/lib/i18n/strings'

interface SidebarProps {
  user: { name?: string | null; email: string }
}

// Icons
const DashIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
const AskIcon  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
const CfIcon   = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
const SetIcon  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const { locale, t, setLocale } = useLocale()

  const initials = user.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user.email[0]!.toUpperCase()

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/')
  }

  const NAV = [
    { href: '/dashboard', label: t.nav.dashboard, mobileLabel: t.nav.dashboard, icon: <DashIcon /> },
    { href: '/ask',       label: t.nav.ask,        mobileLabel: t.nav.ask,       icon: <AskIcon  /> },
    { href: '/cash-flow', label: t.nav.cashFlow,   mobileLabel: t.nav.cashFlow,  icon: <CfIcon   /> },
  ]

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <Link className="brand" href="/dashboard">
            <span className="word" style={{ fontSize: 20 }}>fain<span className="fstop">.</span></span>
          </Link>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn('nav-item', pathname.startsWith(item.href) && 'active')}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}

          <div className="nav-section">{locale === 'ka' ? 'სხვა' : 'More'}</div>
          <Link href="/settings" className={cn('nav-item', pathname === '/settings' && 'active')}>
            <SetIcon />
            <span>{t.nav.settings}</span>
          </Link>
        </nav>

        <div className="sidebar-foot">
          {/* Locale switcher */}
          <LocaleSwitcher locale={locale} setLocale={setLocale} />

          <div
            className="user-row"
            onClick={handleSignOut}
            title={t.nav.signOut}
            style={{ cursor: 'pointer' }}
          >
            <div className="avatar">{initials}</div>
            <div>
              <div className="user-name">{user.name ?? user.email}</div>
              <div className="user-role">{t.nav.signOut}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom bar ────────────────────────── */}
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn('mobile-nav-item', pathname.startsWith(item.href) && 'active')}
          >
            {item.icon}
            <span>{item.mobileLabel}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}

function LocaleSwitcher({ locale, setLocale }: { locale: Locale; setLocale: (l: Locale) => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '8px 12px', marginBottom: 8,
    }}>
      <button
        onClick={() => setLocale('en')}
        style={{
          padding: '3px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
          fontSize: 12, fontWeight: 600, letterSpacing: '0.02em',
          background: locale === 'en' ? 'var(--surface-dark)' : 'transparent',
          color: locale === 'en' ? 'var(--text-inverted)' : 'var(--text-low)',
          transition: 'all 0.15s',
        }}
      >
        EN
      </button>
      <button
        onClick={() => setLocale('ka')}
        style={{
          padding: '3px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
          fontSize: 12, fontWeight: 600, letterSpacing: '0.02em',
          fontFamily: "'Noto Sans Georgian', system-ui, sans-serif",
          background: locale === 'ka' ? 'var(--surface-dark)' : 'transparent',
          color: locale === 'ka' ? 'var(--text-inverted)' : 'var(--text-low)',
          transition: 'all 0.15s',
        }}
      >
        ქა
      </button>
    </div>
  )
}
