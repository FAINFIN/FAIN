'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getDb } from '@/lib/db/schema'
import { useLocale } from '@/lib/i18n/LocaleContext'
import type { Provider } from '@/types'

function CallbackInner() {
  const router  = useRouter()
  const params  = useSearchParams()
  const { locale } = useLocale()
  const [status, setStatus] = useState<'syncing' | 'done' | 'error'>('syncing')

  useEffect(() => {
    const connectionIdRaw = params.get('connection_id')
    if (!connectionIdRaw) { setStatus('error'); return }
    const connectionId: string = connectionIdRaw

    async function sync() {
      try {
        const db    = getDb()
        const srcId = (sessionStorage.getItem('fain_connecting') ?? 'bog') as Provider
        sessionStorage.removeItem('fain_connecting')

        // Register connection server-side (stores in Postgres)
        await fetch('/api/bank/register', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ connectionId, provider: srcId }),
        })

        // Fetch accounts via server proxy
        const accRes = await fetch('/api/bank/accounts', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ connectionId }),
        })
        const { data: accounts } = await accRes.json() as { data: Record<string, unknown>[] }

        // Store connection in IndexedDB
        await db.connections.put({
          id:                   connectionId,
          provider:             srcId,
          saltEdgeConnectionId: connectionId,
          saltEdgeToken:        connectionId,
          accountIds:           accounts.map(a => a.id as string),
          connectedAt:          new Date(),
          expiresAt:            new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          lastSyncedAt:         new Date(),
        })

        for (const acc of accounts) {
          const rawCcy     = acc.currency_code as string
          const currency   = (['GEL','USD','EUR'].includes(rawCcy) ? rawCcy : 'GEL') as import('@/types').Currency
          const rawNature  = acc.nature as string | undefined
          const acctType   = (['checking','savings','credit','loan'].includes(rawNature ?? '')
            ? rawNature : 'checking') as import('@/types').AccountType

          await db.accounts.put({
            id:               acc.id as string,
            connectionId,
            provider:         srcId,
            name:             acc.name as string,
            currency,
            balance:          parseFloat(acc.balance as string),
            type:             acctType,
            balanceUpdatedAt: new Date(),
          })

          // Fetch 24 months of transactions
          const from = new Date()
          from.setMonth(from.getMonth() - 24)
          const txRes = await fetch('/api/bank/transactions', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ accountId: acc.id, fromDate: from.toISOString().split('T')[0] }),
          })
          const { data: txns } = await txRes.json() as { data: Record<string, unknown>[] }
          for (const tx of txns) {
            const txAmt      = parseFloat(tx.amount as string)
            const txCcy      = tx.currency_code as string
            const txCurrency = (['GEL','USD','EUR'].includes(txCcy) ? txCcy : 'GEL') as import('@/types').Currency
            const extra      = tx.extra as { merchant_name?: string } | undefined
            await db.transactions.put({
              id:           tx.id as string,
              accountId:    acc.id as string,
              date:         new Date(tx.made_on as string),
              amount:       Math.abs(txAmt),
              type:         txAmt < 0 ? 'debit' : 'credit',
              currency:     txCurrency,
              description:  tx.description as string,
              category:     (tx.category as string | undefined) ?? 'Other',
              merchantName: extra?.merchant_name,
              pending:      false,
            })
          }
        }

        setStatus('done')
        setTimeout(() => router.push('/ask'), 1500)
      } catch (e) {
        console.error(e)
        setStatus('error')
      }
    }

    sync()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', gap: 16 }}>
      {status === 'syncing' && (
        <>
          <div className="mark" style={{ width: 56, height: 56, fontSize: 24 }}>f</div>
          <p className="lead" style={{ margin: 0 }}>{locale === 'ka' ? 'ანგარიშები სინქრონიზდება…' : 'Syncing your accounts…'}</p>
          <p className="hint" style={{ margin: 0 }}>{locale === 'ka' ? '24 თვის ისტორია — დაახლოებით 30 წამი.' : 'This takes about 30 seconds for 24 months of history.'}</p>
        </>
      )}
      {status === 'done'  && <p className="lead">{locale === 'ka' ? 'მზადაა ✓' : 'All done ✓'}</p>}
      {status === 'error' && (
        <>
          <p className="lead neg">{locale === 'ka' ? 'შეცდომა მოხდა.' : 'Something went wrong.'}</p>
          <a className="btn btn-outline" href="/connect-bank">{locale === 'ka' ? 'სცადე ხელახლა' : 'Try again'}</a>
        </>
      )}
    </div>
  )
}

export default function CallbackPage() {
  return <Suspense><CallbackInner /></Suspense>
}
