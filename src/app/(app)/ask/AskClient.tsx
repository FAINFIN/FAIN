'use client'

import { useState, useRef, useEffect, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { useAiChat, type Message } from '@/lib/ai/useAiChat'
import { useUser } from '@/lib/auth/UserContext'
import { getDb } from '@/lib/db/schema'
import { cn } from '@/lib/utils/cn'

// ─── Parse [[label|value]] inline metric tags ──────────────
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

// ─── Currency toggle ───────────────────────────────────────
type Currency = 'GEL' | 'USD'

function CurrencyToggle({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  return (
    <div className="currency-toggle">
      <span className={cn('currency-option', value === 'GEL' && 'active')} onClick={() => onChange('GEL')}>₾</span>
      <span className={cn('currency-option', value === 'USD' && 'active')} onClick={() => onChange('USD')}>$</span>
    </div>
  )
}

// ─── Greeting helper ──────────────────────────────────────
function getGreeting(name: string | null | undefined): string {
  const h = new Date().getHours()
  const part = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  const first = name?.split(' ')[0] ?? 'there'
  return `Good ${part}, ${first}.`
}

// ─── Chat input ────────────────────────────────────────────
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
          placeholder="Message Fain…"
          rows={1}
          disabled={disabled}
        />
        <div className="chat-input-bar">
          <span className="chat-input-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {accountCount > 0 ? `${accountCount} account${accountCount === 1 ? '' : 's'}` : 'All accounts'}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
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

// ─── Starter chips ────────────────────────────────────────
const CHIPS = [
  { icon: '⚡', label: 'How long is my runway?' },
  { icon: '🔍', label: 'Biggest expense changes this month' },
  { icon: '→',  label: 'Model a $2M raise' },
]

// ─── Main client component ────────────────────────────────
function AskClientInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const conversationId = searchParams.get('c')
  const user         = useUser()
  const [currency, setCurrency] = useState<Currency>('GEL')
  const bottomRef  = useRef<HTMLDivElement>(null)
  const didAutoSend = useRef(false)

  const accountCount = useLiveQuery(
    () => getDb().accounts.count(),
    [], 0
  ) ?? 0

  const { messages, streaming, error, send } = useAiChat({
    conversationId,
    onNewConversation: (id) => {
      router.replace(`/ask?c=${id}`)
    },
  })

  // Auto-send URL param query (from connect-bank "done" screen)
  useEffect(() => {
    const q = searchParams.get('q')
    if (q && !didAutoSend.current) {
      didAutoSend.current = true
      send(q)
    }
  }, [searchParams, send])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  const isHome = messages.length === 0 && !streaming

  return (
    <div className="ask-shell">
      {/* ── Top bar ── */}
      <div className="ask-topbar">
        <span className="ask-topbar-title">
          Fain
        </span>
        <div className="ask-topbar-actions">
          <CurrencyToggle value={currency} onChange={setCurrency} />
          <a href="/connect-bank" className="btn btn-primary btn-sm">
            Connect your bank
          </a>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="ask-body">
        {isHome ? (
          /* ── Home screen ── */
          <div className="ask-home">
            <div className="ask-mark" aria-hidden="true">f</div>
            <h1 className="ask-greeting">{getGreeting(user.name)}</h1>
            <p className="ask-subhead">
              Your cash is healthy. Ask me anything, or pick up where you left off.
            </p>

            <ChatInput
              onSend={send}
              disabled={streaming}
              currency={currency}
              onCurrencyChange={setCurrency}
              accountCount={accountCount as number}
              autoFocus
            />

            <div className="ask-chips">
              {CHIPS.map(c => (
                <button
                  key={c.label}
                  className="chip"
                  onClick={() => send(c.label)}
                  style={{ cursor: 'pointer' }}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>

            <p className="ask-disclaimer">
              Fain reads your financial data with read-only access.
              Always verify important decisions with your accountant.
            </p>
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
