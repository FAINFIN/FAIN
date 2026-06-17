'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface WaitlistEntry {
  id: string
  email: string
  name: string | null
  company: string | null
  signedUpAt: string
  approvedAt: string | null
  status: 'pending' | 'approved' | 'rejected'
  notes: string | null
}

interface Connection {
  id: string
  providerName: string | null
  status: string
  connectedAt: string | null
  lastSyncedAt: string | null
}

interface ClientEntry {
  id: string
  email: string
  name: string | null
  approved: boolean
  createdAt: string
  connections: Connection[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    pending:      'background:#FFF3E0;color:#E65100',
    approved:     'background:#E8F5E9;color:#2E7D32',
    rejected:     'background:#FFEBEE;color:#C62828',
    connected:    'background:#E8F5E9;color:#2E7D32',
    pending_conn: 'background:#FFF3E0;color:#E65100',
    disconnected: 'background:#FFEBEE;color:#C62828',
    error:        'background:#FFEBEE;color:#C62828',
  }
  const style = colours[status] ?? 'background:#F5F5F5;color:#555'
  return (
    <span style={{ ...Object.fromEntries(style.split(';').map(s => s.split(':') as [string,string])) as React.CSSProperties, padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
      {status}
    </span>
  )
}

// ─── Login gate ───────────────────────────────────────────────────────────────
function LoginGate({ onAuth }: { onAuth: (s: string) => void }) {
  const [val, setVal] = useState('')
  const [err, setErr] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!val.trim()) { setErr(true); return }
    onAuth(val.trim())
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF8F5' }}>
      <form onSubmit={submit} style={{ background: '#fff', padding: '40px 32px', borderRadius: 16, boxShadow: '0 4px 32px #0000000d', minWidth: 320 }}>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 24 }}>
          fain<span style={{ color: '#FD5400' }}>.</span> <span style={{ fontSize: 14, color: '#888', fontWeight: 400 }}>admin</span>
        </div>
        <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 6 }}>Admin secret</label>
        <input
          type="password"
          value={val}
          onChange={e => { setVal(e.target.value); setErr(false) }}
          placeholder="Enter secret"
          style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${err ? '#e53935' : '#ddd'}`, borderRadius: 10, fontSize: 15, boxSizing: 'border-box', outline: 'none' }}
        />
        {err && <p style={{ color: '#e53935', fontSize: 12, margin: '6px 0 0' }}>Required</p>}
        <button type="submit" style={{ marginTop: 16, width: '100%', padding: '12px', background: '#FD5400', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
          Enter
        </button>
      </form>
    </div>
  )
}

// ─── Main admin UI ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [secret, setSecret]       = useState<string | null>(null)
  const [tab, setTab]             = useState<'waitlist' | 'clients'>('waitlist')
  const [waitlist, setWaitlist]   = useState<WaitlistEntry[]>([])
  const [clients, setClients]     = useState<ClientEntry[]>([])
  const [loading, setLoading]     = useState(false)
  const [filter, setFilter]       = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [actioning, setActioning] = useState<string | null>(null)

  const headers = useCallback(
    () => ({ 'x-admin-secret': secret ?? '', 'Content-Type': 'application/json' }),
    [secret]
  )

  const loadWaitlist = useCallback(async () => {
    if (!secret) return
    setLoading(true)
    try {
      const r = await fetch('/api/admin/waitlist', { headers: headers() })
      if (r.status === 403) { setSecret(null); return }
      const { data } = await r.json() as { data: WaitlistEntry[] }
      setWaitlist(data)
    } finally { setLoading(false) }
  }, [secret, headers])

  const loadClients = useCallback(async () => {
    if (!secret) return
    setLoading(true)
    try {
      const r = await fetch('/api/admin/clients', { headers: headers() })
      if (r.status === 403) { setSecret(null); return }
      const { data } = await r.json() as { data: ClientEntry[] }
      setClients(data)
    } finally { setLoading(false) }
  }, [secret, headers])

  useEffect(() => {
    if (!secret) return
    if (tab === 'waitlist') loadWaitlist()
    else loadClients()
  }, [secret, tab, loadWaitlist, loadClients])

  async function act(id: string, action: 'approve' | 'reject') {
    setActioning(id)
    await fetch('/api/admin/waitlist', {
      method:  'POST',
      headers: headers(),
      body:    JSON.stringify({ id, action }),
    })
    setActioning(null)
    loadWaitlist()
  }

  if (!secret) return <LoginGate onAuth={setSecret} />

  const filtered = filter === 'all' ? waitlist : waitlist.filter(e => e.status === filter)

  const counts = {
    all:      waitlist.length,
    pending:  waitlist.filter(e => e.status === 'pending').length,
    approved: waitlist.filter(e => e.status === 'approved').length,
    rejected: waitlist.filter(e => e.status === 'rejected').length,
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#FAF8F5', fontFamily: 'system-ui,sans-serif' }}>
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>
          fain<span style={{ color: '#FD5400' }}>.</span> <span style={{ fontSize: 13, color: '#888', fontWeight: 400 }}>admin</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['waitlist', 'clients'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ padding: '6px 18px', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', background: tab === t ? '#FD5400' : '#F0EDE8', color: tab === t ? '#fff' : '#555' }}
            >
              {t === 'waitlist' ? `Waitlist (${counts.all})` : `Clients (${clients.length})`}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSecret(null)}
          style={{ fontSize: 12, color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Sign out
        </button>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Waitlist tab ── */}
        {tab === 'waitlist' && (
          <>
            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{ padding: '6px 16px', borderRadius: 99, border: `1.5px solid ${filter === f ? '#FD5400' : '#ddd'}`, background: filter === f ? '#FD5400' : '#fff', color: filter === f ? '#fff' : '#555', fontWeight: 600, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize' }}
                >
                  {f} {f !== 'all' ? `(${counts[f]})` : `(${counts.all})`}
                </button>
              ))}
              <button
                onClick={loadWaitlist}
                style={{ marginLeft: 'auto', padding: '6px 16px', borderRadius: 99, border: '1.5px solid #ddd', background: '#fff', color: '#555', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                ↺ Refresh
              </button>
            </div>

            {loading ? (
              <p style={{ color: '#888' }}>Loading…</p>
            ) : filtered.length === 0 ? (
              <p style={{ color: '#888' }}>No entries yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map(e => (
                  <div key={e.id} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 4px #0000000a' }}>
                    {/* Avatar */}
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F0EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color: '#8a7060', flexShrink: 0 }}>
                      {(e.name ?? e.email)[0]?.toUpperCase() ?? '?'}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#29261b' }}>{e.name ?? '—'}</div>
                      <div style={{ fontSize: 13, color: '#6b6457', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.email}</div>
                      {e.company && <div style={{ fontSize: 12, color: '#aaa' }}>{e.company}</div>}
                    </div>

                    <div style={{ fontSize: 12, color: '#aaa', whiteSpace: 'nowrap' }}>{fmt(e.signedUpAt)}</div>
                    <StatusBadge status={e.status} />

                    {e.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          disabled={actioning === e.id}
                          onClick={() => act(e.id, 'approve')}
                          style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#2E7D32', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer', opacity: actioning === e.id ? 0.5 : 1 }}
                        >
                          Approve
                        </button>
                        <button
                          disabled={actioning === e.id}
                          onClick={() => act(e.id, 'reject')}
                          style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #ddd', background: '#fff', color: '#C62828', fontWeight: 600, fontSize: 12, cursor: 'pointer', opacity: actioning === e.id ? 0.5 : 1 }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Clients tab ── */}
        {tab === 'clients' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
              <button
                onClick={loadClients}
                style={{ padding: '6px 16px', borderRadius: 99, border: '1.5px solid #ddd', background: '#fff', color: '#555', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                ↺ Refresh
              </button>
            </div>

            {loading ? (
              <p style={{ color: '#888' }}>Loading…</p>
            ) : clients.length === 0 ? (
              <p style={{ color: '#888' }}>No users yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {clients.map(u => (
                  <div key={u.id} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px #0000000a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F0EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color: '#8a7060', flexShrink: 0 }}>
                        {(u.name ?? u.email)[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#29261b' }}>{u.name ?? '—'}</div>
                        <div style={{ fontSize: 13, color: '#6b6457' }}>{u.email}</div>
                      </div>
                      <div style={{ fontSize: 12, color: '#aaa' }}>Joined {fmt(u.createdAt)}</div>
                    </div>

                    {u.connections.length > 0 && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F0EDE8', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {u.connections.map(c => (
                          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                            <span style={{ color: '#555', flex: 1 }}>{c.providerName ?? 'Unknown bank'}</span>
                            <StatusBadge status={c.status} />
                            <span style={{ color: '#aaa', fontSize: 12 }}>connected {fmt(c.connectedAt)}</span>
                            <span style={{ color: '#aaa', fontSize: 12 }}>synced {fmt(c.lastSyncedAt)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {u.connections.length === 0 && (
                      <div style={{ marginTop: 8, fontSize: 12, color: '#aaa' }}>No bank connected</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
