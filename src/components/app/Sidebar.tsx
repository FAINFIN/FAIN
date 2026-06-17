'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { Suspense } from 'react'
import { cn } from '@/lib/utils/cn'
import { authClient } from '@/lib/auth/client'
import { getDb } from '@/lib/db/schema'

interface SidebarProps {
  user: { name?: string | null; email: string }
}

function SidebarInner({ user }: SidebarProps) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const activeConvId = searchParams.get('c')

  const conversations = useLiveQuery(
    () => getDb().conversations.orderBy('updatedAt').reverse().limit(25).toArray(),
    []
  )

  const connections = useLiveQuery(
    () => getDb().connections.toArray(),
    []
  )

  const initials = user.name
    ? user.name.split(' ').map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 2)
    : (user.email[0]?.toUpperCase() ?? '?')

  const displayName = user.name?.split(' ')[0] ?? user.email.split('@')[0]

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/')
  }

  return (
    <aside className="sidebar">
      {/* ── Logo + new question ── */}
      <div className="sidebar-top">
        <Link className="brand" href="/ask">
          <span className="word" style={{ fontSize: 20 }}>
            fain<span className="fstop">.</span>
          </span>
        </Link>
        <Link href="/ask" className="btn-new-conv">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New question
        </Link>
      </div>

      {/* ── Recent conversations ── */}
      <div className="sidebar-section">
        <span className="sidebar-section-label">Recent</span>
        <div className="conv-list">
          {conversations !== undefined && conversations.length === 0 && (
            <span className="conv-empty">No conversations yet</span>
          )}
          {conversations?.map(conv => (
            <Link
              key={conv.id}
              href={`/ask?c=${conv.id}`}
              className={cn('conv-item', activeConvId === conv.id && 'active')}
              title={conv.title}
            >
              {conv.title}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Connected banks ── */}
      {connections !== undefined && connections.length > 0 && (
        <div className="sidebar-section">
          <span className="sidebar-section-label">Connected</span>
          <div className="bank-pills">
            {connections.map(conn => (
              <div key={conn.id} className="bank-pill">
                <span className="bank-dot" />
                {conn.provider.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Spacer ── */}
      <div style={{ flex: 1 }} />

      {/* ── User footer ── */}
      <div className="sidebar-foot">
        <div className="user-row" onClick={handleSignOut} title="Sign out" style={{ cursor: 'pointer' }}>
          <div className="avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name">{displayName}</div>
          </div>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-low)', flex: '0 0 auto' }}>
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </div>
    </aside>
  )
}

export function Sidebar({ user }: SidebarProps) {
  return (
    <Suspense fallback={
      <aside className="sidebar">
        <div className="sidebar-top">
          <Link className="brand" href="/ask">
            <span className="word" style={{ fontSize: 20 }}>fain<span className="fstop">.</span></span>
          </Link>
        </div>
      </aside>
    }>
      <SidebarInner user={user} />
    </Suspense>
  )
}
