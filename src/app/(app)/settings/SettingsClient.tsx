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
  const s = t.settings
  const [clearing,      setClearing]      = useState(false)
  const [loadingDemo,   setLoadingDemo]   = useState(false)
  const [isSample,      setIsSample]      = useState(false)

  const connections = useLiveQuery(() => getDb().connections.toArray())
  const accounts    = useLiveQuery(() => getDb().accounts.toArray())

  useEffect(() => { isSampleData().then(setIsSample) }, [connections])

  async function handleLoadDemo() {
    setLoadingDemo(true)
    try {
      const { loadSampleData } = await import('@/lib/db/sampleData')
      await loadSampleData(true) // force=true so it reloads even if data exists
      setIsSample(true)
    } catch (e) {
      console.error('[settings] demo data load failed:', e)
    }
    setLoadingDemo(false)
  }

  async function clearAllData() {
    if (!confirm(s.clearData + '?')) return
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

    // Remove from Salt Edge + Postgres (best-effort; don't block on failure)
    if (connectionId !== 'sample-connection') {
      try {
        await fetch('/api/bank/disconnect', {
          method:  'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ connectionId }),
        })
      } catch (err) {
        console.error('[settings] server disconnect failed:', err)
      }
    }

    // Always clear IndexedDB regardless of server result
    const accountIds = conn.accountIds ?? []
    await db.transactions.where('accountId').anyOf(accountIds).delete()
    await db.accounts.where('id').anyOf(accountIds).delete()
    await db.connections.delete(connectionId)
  }

  const dateLocale = locale === 'ka' ? 'ka-GE' : 'en-GB'

  return (
    <div className="app-content">
      <div className="app-header">
        <h1 className="page-title">{t.nav.settings}</h1>
      </div>

      {/* Connected sources */}
      <Card>
        <CardHeader>
          <CardTitle>{s.sources}</CardTitle>
          <Link href="/connect-bank" className="btn btn-primary btn-sm" style={{ fontSize: 12 }}>
            {s.addSource}
          </Link>
        </CardHeader>

        {!connections?.length ? (
          <p style={{ color: 'var(--text-low)', fontSize: 14, margin: 0 }}>
            {s.noSources}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {connections.map(conn => {
              const accs   = accounts?.filter(a => conn.accountIds?.includes(a.id)) ?? []
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
                      {isDemo ? s.sampleData : (conn.provider ?? conn.id)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-low)' }}>
                      {s.accounts(accs.length)}
                      {' · '}
                      {s.lastSync} {conn.lastSyncedAt ? new Date(conn.lastSyncedAt).toLocaleDateString(dateLocale) : '—'}
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => disconnectSource(conn.id)}
                    style={{ color: 'var(--neg)', fontSize: 12 }}
                  >
                    {s.disconnect}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Demo data */}
      <Card>
        <CardHeader><CardTitle>Demo Data</CardTitle></CardHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-low)', lineHeight: 1.6 }}>
            Load 24 months of realistic Georgian SME data (TechFlow Georgia) to explore the app without connecting a real bank.
            {isSample && <span style={{ color: 'var(--pos)', marginLeft: 6 }}>● Demo data active</span>}
          </p>
          <div>
            <Button
              variant="outline"
              size="sm"
              loading={loadingDemo}
              onClick={handleLoadDemo}
            >
              {isSample ? '↺ Reload Demo Data' : '⚡ Load Demo Data'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader><CardTitle>{s.language}</CardTitle></CardHeader>
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
        <CardHeader><CardTitle>{s.dataPrivacy}</CardTitle></CardHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-low)', lineHeight: 1.6 }}>
            {s.privacyNote}
          </p>
          <div>
            <Button
              variant="outline"
              size="sm"
              loading={clearing}
              onClick={clearAllData}
              style={{ color: 'var(--neg)', borderColor: 'var(--neg)' }}
            >
              {s.clearData}
            </Button>
          </div>
        </div>
      </Card>

      {/* App version */}
      <p style={{ fontSize: 12, color: 'var(--text-low)', marginTop: 4 }}>
        Fain beta · {s.version}0.1.0
      </p>
    </div>
  )
}
