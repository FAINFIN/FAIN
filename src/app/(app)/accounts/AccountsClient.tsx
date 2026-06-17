'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { getDb } from '@/lib/db/schema'
import { formatCurrency } from '@/lib/utils/currency'
import { useLocale } from '@/lib/i18n/LocaleContext'
import Link from 'next/link'

const BANK_LOGOS: Record<string, string> = {
  bog:     '/banks/bog.png',
  tbc:     '/banks/tbc.png',
  credo:   '/banks/credo.png',
  liberty: '/banks/liberty.png',
  pasha:   '/banks/pasha.png',
}

function ProviderLogo({ provider }: { provider: string }) {
  const src = BANK_LOGOS[provider.toLowerCase()]
  if (src) {
    return <img src={src} alt={provider} style={{ width: 32, height: 32, objectFit: 'contain' }} />
  }
  return (
    <div style={{ width: 32, height: 32, background: 'var(--stone-3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text-low)' }}>
      {provider[0]?.toUpperCase() ?? 'B'}
    </div>
  )
}

type AccountType = 'checking' | 'savings' | 'credit' | 'loan'
const TYPE_LABEL: Record<AccountType, string> = {
  checking: 'Checking',
  savings:  'Savings',
  credit:   'Credit',
  loan:     'Loan',
}

export function AccountsClient() {
  const { locale } = useLocale()
  const fmt = (n: number, ccy = 'GEL') => formatCurrency(n, { currency: ccy as 'GEL' | 'USD' | 'EUR', locale })

  const result = useLiveQuery(async () => {
    const db          = getDb()
    const accounts    = await db.accounts.toArray()
    const connections = await db.connections.toArray()
    return { accounts, connections }
  })

  if (result === undefined) {
    return <div className="app-content"><p style={{ color: 'var(--text-low)' }}>Loading…</p></div>
  }

  if (!result.accounts.length) {
    return (
      <div className="app-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, textAlign: 'center' }}>
        <div className="mark" style={{ width: 56, height: 56, fontSize: 24 }}>f</div>
        <h2 className="serif" style={{ margin: 0 }}>No accounts connected</h2>
        <p style={{ margin: 0, color: 'var(--text-low)' }}>Connect your bank to see your accounts here.</p>
        <Link href="/connect-bank" className="btn btn-primary" style={{ marginTop: 8 }}>Connect bank</Link>
      </div>
    )
  }

  const { accounts, connections } = result
  const totalGel = accounts
    .filter(a => a.currency === 'GEL')
    .reduce((s, a) => s + a.balance, 0)

  // Group accounts by connection/provider
  const byProvider: Record<string, typeof accounts> = {}
  for (const acc of accounts) {
    const prov = acc.provider ?? 'unknown'
    if (!byProvider[prov]) byProvider[prov] = []
    byProvider[prov].push(acc)
  }

  return (
    <div className="app-content">
      <div className="app-header">
        <h1 className="page-title">Accounts</h1>
        <Link href="/connect-bank" className="btn btn-outline" style={{ fontSize: 13, padding: '6px 16px' }}>
          + Add bank
        </Link>
      </div>

      {/* Total */}
      <div style={{ background: 'var(--surface-dark)', color: 'var(--text-inverted)', borderRadius: 16, padding: '24px 28px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 6 }}>Total balance (GEL)</div>
        <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-serif)', letterSpacing: '-0.03em' }}>
          {fmt(totalGel)}
        </div>
        <div style={{ fontSize: 13, opacity: 0.6, marginTop: 6 }}>
          {accounts.length} account{accounts.length !== 1 ? 's' : ''} · {connections.length} connection{connections.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Accounts by bank */}
      {Object.entries(byProvider).map(([provider, accs]) => (
        <div key={provider} style={{ marginBottom: 16 }}>
          {/* Bank header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <ProviderLogo provider={provider} />
            <div style={{ fontWeight: 700, fontSize: 15, textTransform: 'capitalize' }}>
              {provider === 'bog' ? 'Bank of Georgia'
                : provider === 'tbc' ? 'TBC Bank'
                : provider === 'credo' ? 'Credo Bank'
                : provider === 'liberty' ? 'Liberty Bank'
                : provider === 'pasha' ? 'Pasha Bank'
                : provider}
            </div>
          </div>

          {/* Account cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {accs.map(acc => (
              <div
                key={acc.id}
                style={{ background: 'var(--surface-primary)', borderRadius: 12, border: '1px solid var(--border-subtle)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}
              >
                {/* Type badge */}
                <div style={{
                  padding: '4px 10px', borderRadius: 8,
                  background: acc.type === 'credit' ? '#FFF3E0' : acc.type === 'savings' ? '#E8F5E9' : 'var(--stone-3)',
                  color: acc.type === 'credit' ? '#E65100' : acc.type === 'savings' ? '#2E7D32' : 'var(--text-low)',
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>
                  {TYPE_LABEL[acc.type as AccountType] ?? acc.type}
                </div>

                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {acc.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-low)', marginTop: 2 }}>
                    Updated {acc.balanceUpdatedAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </div>
                </div>

                {/* Balance */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 18, fontFamily: 'var(--font-num)', color: acc.balance >= 0 ? 'var(--text-primary)' : 'var(--neg)' }}>
                    {fmt(Math.abs(acc.balance), acc.currency)}{acc.balance < 0 ? ' DR' : ''}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-low)' }}>{acc.currency}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Disconnect note */}
      <p style={{ fontSize: 12, color: 'var(--text-low)', marginTop: 24, textAlign: 'center' }}>
        To disconnect a bank, go to{' '}
        <Link href="/settings" style={{ color: 'var(--tan-9)' }}>Settings</Link>.
      </p>
    </div>
  )
}
