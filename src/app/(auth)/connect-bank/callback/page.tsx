'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getDb } from '@/lib/db/schema'
import { Suspense } from 'react'

function CallbackInner() {
  const router   = useRouter()
  const params   = useSearchParams()
  const [status, setStatus] = useState<'syncing' | 'done' | 'error'>('syncing')

  useEffect(() => {
    const connectionId = params.get('connection_id')
    if (!connectionId) { setStatus('error'); return }

    async function sync() {
      try {
        const db   = getDb()
        const srcId = (sessionStorage.getItem('fain_connecting') ?? 'bog') as string
        sessionStorage.removeItem('fain_connecting')

        // Fetch accounts via server proxy
        const accRes  = await fetch('/api/bank/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ connectionId }) })
        const { data: accounts } = await accRes.json()

        // Store connection + accounts in IndexedDB (client-only)
        await db.connections.put({ id: connectionId, provider: srcId as any, saltEdgeToken: connectionId, status: 'active', lastSyncAt: new Date().toISOString(), accountIds: accounts.map((a: any) => a.id) })

        for (const acc of accounts) {
          await db.accounts.put({ id: acc.id, connectionId, name: acc.name, currency: acc.currency_code, balance: parseFloat(acc.balance), type: acc.nature })

          // Fetch 24 months of transactions
          const from = new Date()
          from.setMonth(from.getMonth() - 24)
          const txRes = await fetch('/api/bank/transactions', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ accountId: acc.id, fromDate: from.toISOString().split('T')[0] }),
          })
          const { data: txns } = await txRes.json()
          for (const tx of txns) {
            await db.transactions.put({ id: tx.id, accountId: acc.id, date: tx.made_on, amount: parseFloat(tx.amount), currency: tx.currency_code, description: tx.description, category: tx.category ?? 'Other', merchant: tx.extra?.merchant_name })
          }
        }

        setStatus('done')
        setTimeout(() => router.push('/connect-bank?synced=1'), 1200)
      } catch (e) {
        console.error(e)
        setStatus('error')
      }
    }

    sync()
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', gap: 16 }}>
      {status === 'syncing' && (
        <>
          <div className="mark" style={{ width: 56, height: 56, fontSize: 24 }}>f</div>
          <p className="lead" style={{ margin: 0 }}>Syncing your accounts…</p>
          <p className="hint" style={{ margin: 0 }}>This takes about 30 seconds for 24 months of history.</p>
        </>
      )}
      {status === 'done' && <p className="lead">All done ✓</p>}
      {status === 'error' && (
        <>
          <p className="lead neg">Something went wrong.</p>
          <a className="btn btn-outline" href="/connect-bank">Try again</a>
        </>
      )}
    </div>
  )
}

export default function CallbackPage() {
  return <Suspense><CallbackInner /></Suspense>
}
