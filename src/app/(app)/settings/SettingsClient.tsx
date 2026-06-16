'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { getDb } from '@/lib/db/schema'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { isSampleData } from '@/lib/db/sampleData'
import Link from 'next/link'

export function SettingsClient() {
  const router    = useRouter()
  const { locale, t, setLocale } = useLocale()
  const [clearing, setClearing] = useState(false)
  const [isSample, setIsSample] = useState(false)

  const connections = useLiveQuery(() => getDb().connections.toArray())
  const accounts    = useLiveQuery(() => getDb().accounts.toArray())

  useEffect(() => { isSampleData().then(setIsSample) }, [])

  async function clearAllData() {
    if (!confirm(locale === 'ka' ? 'ყველა მონაცემი წაიშლება. დარწმუნებული ხარ?' : 'This will delete all local data. Are you sure?')) return
    setClearing(true)
    const db = getDb()
    await Promise.all([
      db.transactions.clear(),
      db.accounts.clear(),
      db.connections.clear(),
      db.syncMeta.clear(),
    ])
    setClearing(false)
    router.push('/connect-bank')
  }

  async function disconnectSource(connectionId: string) {
    const db = getDb()
    const conn = await db.connections.get(connectionId)
    if (!conn) return
    // Delete related accounts + transactions
    const accountIds = conn.accountIds ?? []
    await db.transactions.where('accountId').anyOf(accountIds).delete()
    await db.accounts.where('id').anyOf(accountIds).delete()
    await db.connections.delete(connectionId)
  }

  return (
    <div className="app-content">
      <div className="app-header">
        <h1 className="page-title">{t.nav.settings}</h1>
      </div>

      {/* Connected sources */}
      <Card>
        <CardHeader>
          <CardTitle>{locale === 'ka' ? 'დაკავშირებული წყაროები' : 'Connected sources'}</CardTitle>
          <Link href="/connect-bank" className="btn btn-primary btn-sm" style={{ fontSize: 12 }}>
            {locale === 'ka' ? '+ წყაროს დამატება' : '+ Add source'}
          </Link>
        </CardHeader>

        {!connections?.length ? (
          <p style={{ color: 'var(--text-low)', fontSize: 14, margin: 0 }}>
            {locale === 'ka' ? 'დაკავშირებული წყარო არ არის.' : 'No sources connected yet.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {connections.map(conn => {
              const accs = accounts?.filter(a => conn.accountIds?.includes(a.id)) ?? []
              const isDemo = conn.id === 'sample-connection'
              return (
                <div key={conn.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, background: 'var(--stone-3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 11, color: 'var(--text-low)',
                  }}>
                    {isDemo ? '📊' : (conn.provider ?? 'Bk').slice(0, 3)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {isDemo ? (locale === 'ka' ? 'სადემო მონაცემები' : 'Sample Data') : (conn.provider ?? conn.id)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-low)' }}>
                      {accs.length} {locale === 'ka' ? 'ანგარიში' : `account${accs.length !== 1 ? 's' : ''}`}
                      {' · '}
                      {locale === 'ka' ? 'ბოლო სინქრ.:' : 'last sync:'} {conn.lastSync ? new Date(conn.lastSync).toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-GB') : '—'}
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => disconnectSource(conn.id)}
                    style={{ color: 'var(--neg)', fontSize: 12 }}
                  >
                    {locale === 'ka' ? 'გათიშვა' : 'Disconnect'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Language */}
      <Card>
        <CardHeader><CardTitle>{locale === 'ka' ? 'ენა' : 'Language'}</CardTitle></CardHeader>
        <div style={{ display: 'flex', gap: 10 }}>
          {(['en', 'ka'] as const).map(l => (
            <button
              key={l}
              className={`btn ${locale === l ? 'btn-primary' : 'btn-outline'} btn-sm`}
              onClick={() => setLocale(l)}
              style={{ fontFamily: l === 'ka' ? "'Noto Sans Georgian', system-ui" : undefined }}
            >
              {l === 'en' ? 'English' : 'ქართული'}
            </button>
          ))}
        </div>
      </Card>

      {/* Data + privacy */}
      <Card>
        <CardHeader><CardTitle>{locale === 'ka' ? 'მონაცემები და კონფიდენციალობა' : 'Data & privacy'}</CardTitle></CardHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-low)', lineHeight: 1.6 }}>
            {locale === 'ka'
              ? 'ყველა ფინანსური მონაცემი ინახება მხოლოდ ამ მოწყობილობაზე — IndexedDB-ში. Fain-ის სერვერები ვერ ხედავს შენს ოპერაციებს.'
              : 'All financial data is stored only on this device — in your browser\'s IndexedDB. Fain\'s servers never see your individual transactions or account balances.'
            }
          </p>
          <div>
            <Button
              variant="outline"
              size="sm"
              loading={clearing}
              onClick={clearAllData}
              style={{ color: 'var(--neg)', borderColor: 'var(--neg)' }}
            >
              {locale === 'ka' ? 'ყველა მონაცემის წაშლა' : 'Clear all local data'}
            </Button>
          </div>
        </div>
      </Card>

      {/* App version */}
      <p style={{ fontSize: 12, color: 'var(--text-low)', marginTop: 4 }}>
        Fain beta · {locale === 'ka' ? 'ვერსია' : 'v'}0.1.0
      </p>
    </div>
  )
}
