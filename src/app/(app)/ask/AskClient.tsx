'use client'

import { useState, useRef, useEffect, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { useAiChat, type Message } from '@/lib/ai/useAiChat'
import { useUser } from '@/lib/auth/UserContext'
import { getDb } from '@/lib/db/schema'
import { cn } from '@/lib/utils/cn'

// ─── Sample data (shown when no bank is connected) ────────────────
const SAMPLE_KPI = {
  cashOnHand: '₾482k',
  netBurn:    '₾61k',
  runway:     '14 mo',
  mrr:        '$38k',
}

// ─── Parse [[label|value]] inline metric tags ─────────────────────
function parseContent(text: string) {
  const parts: Array<{ type: 'text'; value: string } | { type: 'metric'; label: string; value: string }> = []
  const regex = /\[\[([^|]+)\|([^\]]+)\]\]/g
  let last = 0, m
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: 'text', value: text.slice(last, m.index) })
    parts.push({ type: 'metric', label: m[1]!, value: m[2]! })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) })
  return parts
}

function InlineMetric({ label, value }: { label: string; value: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'baseline', gap: 4,
      background: 'var(--stone-2)', border: '1px solid var(--border-subtle)',
      borderRadius: 8, padding: '2px 8px', margin: '0 2px',
      fontSize: '0.91em', fontFamily: 'var(--font-num)',
    }}>
      <span style={{ color: 'var(--text-low)', fontSize: '0.88em' }}>{label}</span>
      <span style={{ fontWeight: 700, color: 'var(--text-high)' }}>{value}</span>
    </span>
  )
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  const parts  = isUser ? null : parseContent(msg.content)
  return (
    <div className={cn('chat-row', isUser && 'chat-row--user')}>
      {!isUser && (
        <div className="mark" style={{ width: 30, height: 30, borderRadius: 9, fontSize: 15, flex: '0 0 auto', marginTop: 2 }}>f</div>
      )}
      <div className={cn('chat-bubble', isUser ? 'chat-bubble--user' : 'chat-bubble--ai')}>
        {isUser ? msg.content : (
          <>
            {parts!.map((p, i) =>
              p.type === 'text'
                ? <span key={i}>{p.value}</span>
                : <InlineMetric key={i} label={p.label} value={p.value} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="chat-row">
      <div className="mark" style={{ width: 30, height: 30, borderRadius: 9, fontSize: 15, flex: '0 0 auto', marginTop: 2 }}>f</div>
      <div className="chat-bubble chat-bubble--ai" style={{ padding: '12px 16px' }}>
        <span className="typing-dots"><span /><span /><span /></span>
      </div>
    </div>
  )
}

// ─── Currency toggle ──────────────────────────────────────────────
type Currency = 'GEL' | 'USD'

function CurrencyToggle({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  return (
    <div className="currency-toggle">
      <span className={cn('currency-option', value === 'GEL' && 'active')} onClick={() => onChange('GEL')}>₾</span>
      <span className={cn('currency-option', value === 'USD' && 'active')} onClick={() => onChange('USD')}>$</span>
    </div>
  )
}

// ─── Greeting ──────────────────────────────────────────────────────
function getGreeting(name: string | null | undefined): string {
  const h = new Date().getHours()
  const part = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  const first = name?.split(' ')[0] ?? 'there'
  return `Good ${part}, ${first}.`
}

// ─── KPI row ───────────────────────────────────────────────────────
function KpiRow({ hasData }: { hasData: boolean }) {
  const kpi = SAMPLE_KPI // swap with real data when connected
  return (
    <div className="kpi-row">
      <div className="kpi-tile">
        <span className="kpi-label">CASH ON HAND</span>
        <span className="kpi-value mono">{kpi.cashOnHand}</span>
      </div>
      <div className="kpi-divider" />
      <div className="kpi-tile">
        <span className="kpi-label">NET BURN/MO</span>
        <span className="kpi-value mono neg">{kpi.netBurn}</span>
      </div>
      <div className="kpi-divider" />
      <div className="kpi-tile">
        <span className="kpi-label">RUNWAY</span>
        <span className="kpi-value mono">{kpi.runway}</span>
      </div>
      <div className="kpi-divider" />
      <div className="kpi-tile">
        <span className="kpi-label">MRR</span>
        <span className="kpi-value mono pos">{kpi.mrr}</span>
      </div>
      {!hasData && (
        <span className="kpi-sample-badge">SAMPLE</span>
      )}
    </div>
  )
}

// ─── Starter chips ─────────────────────────────────────────────────
const CHIPS = [
  {
    label: 'How long is my runway?',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
  },
  {
    label: 'Biggest expense changes',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    label: 'Model a $2M raise',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      </svg>
    ),
  },
  {
    label: 'Am I profitable yet?',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
  },
]

// ─── Chat input ────────────────────────────────────────────────────
function ChatInput({
  onSend,
  disabled,
  currency,
  onCurrencyChange,
  accountCount,
  autoFocus,
}: {
  onSend: (text: string) => void
  disabled: boolean
  currency: Currency
  onCurrencyChange: (c: Currency) => void
  accountCount: number
  autoFocus?: boolean
}) {
  const [draft, setDraft] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])

  function submit() {
    const text = draft.trim()
    if (!text || disabled) return
    setDraft('')
    onSend(text)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  return (
    <div className="chat-input-wrap">
      <div className="chat-input-card">
        <textarea
          ref={ref}
          className="chat-input-field"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask Fain anything about your finances…"
          rows={1}
          disabled={disabled}
        />
        <div className="chat-input-bar">
          <span className="chat-input-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {accountCount > 0 ? `${accountCount} account${accountCount === 1 ? '' : 's'}` : 'All accounts'}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </span>
          <CurrencyToggle value={currency} onChange={onCurrencyChange} />
          <button
            className="chat-send-btn"
            onClick={submit}
            disabled={!draft.trim() || disabled}
            aria-label="Send"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Connect-bank nudge ────────────────────────────────────────────
function ConnectNudge() {
  return (
    <div className="connect-nudge">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--tan-9)', flexShrink: 0 }}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
      <span>This is sample data. <a href="/connect-bank" className="connect-nudge-link">Connect your bank</a> to see your real numbers.</span>
    </div>
  )
}

// ─── Trust line ────────────────────────────────────────────────────
function TrustLine() {
  return (
    <p className="ask-trust">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      Read-only · Fain shows the numbers behind every answer.
    </p>
  )
}

// ─── Main client component ─────────────────────────────────────────
function AskClientInner() {
  const router         = useRouter()
  const searchParams   = useSearchParams()
  const conversationId = searchParams.get('c')
  const user           = useUser()
  const [currency, setCurrency] = useState<Currency>('GEL')
  const bottomRef      = useRef<HTMLDivElement>(null)
  const didAutoSend    = useRef(false)

  const accountCount = useLiveQuery(
    () => getDb().accounts.count(),
    [], 0
  ) ?? 0

  const hasRealData = (accountCount as number) > 0

  const { messages, streaming, error, send } = useAiChat({
    conversationId,
    onNewConversation: (id) => {
      router.replace(`/ask?c=${id}`)
    },
  })

  // Auto-send URL param query (from connect-bank "done" screen or TopBar)
  useEffect(() => {
    const q = searchParams.get('q')
    if (q && !didAutoSend.current) {
      didAutoSend.current = true
      send(decodeURIComponent(q))
    }
  }, [searchParams, send])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  const isHome = messages.length === 0 && !streaming

  return (
    <div className="ask-shell">
      {/* ── Body ── */}
      <div className="ask-body">
        {isHome ? (
          /* ── Home screen ── */
          <div className="ask-home">
            {/* Fain mark */}
            <div className="ask-mark" aria-hidden="true">f</div>

            {/* Greeting */}
            <h1 className="ask-greeting">{getGreeting(user.name)}</h1>

            {/* Status line */}
            <p className="ask-subhead">
              {hasRealData
                ? 'Your cash is healthy — 14 months of runway. Ask me anything, or pick up where you left off.'
                : 'Ask me anything about your finances, or pick up where you left off.'}
            </p>

            {/* Ask box */}
            <ChatInput
              onSend={send}
              disabled={streaming}
              currency={currency}
              onCurrencyChange={setCurrency}
              accountCount={accountCount as number}
              autoFocus
            />

            {/* Starter chips */}
            <div className="ask-chips">
              {CHIPS.map(c => (
                <button
                  key={c.label}
                  className="chip"
                  onClick={() => send(c.label)}
                >
                  {c.icon}
                  {c.label}
                </button>
              ))}
            </div>

            {/* KPI row */}
            <KpiRow hasData={hasRealData} />

            {/* Connect nudge if no bank */}
            {!hasRealData && <ConnectNudge />}

            {/* Trust line */}
            <TrustLine />
          </div>
        ) : (
          /* ── Chat thread ── */
          <div className="ask-thread">
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
            {streaming && <TypingIndicator />}
            {error && (
              <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--neg)', fontSize: 13 }}>
                Something went wrong — try again.
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Pinned input (thread view only) ── */}
      {!isHome && (
        <div className="ask-input-area">
          <ChatInput
            onSend={send}
            disabled={streaming}
            currency={currency}
            onCurrencyChange={setCurrency}
            accountCount={accountCount as number}
          />
        </div>
      )}
    </div>
  )
}

export function AskClient() {
  return (
    <Suspense fallback={<div className="ask-shell" />}>
      <AskClientInner />
    </Suspense>
  )
}
