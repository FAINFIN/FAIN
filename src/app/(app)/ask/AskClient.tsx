'use client'

import { useState, useRef, useEffect, Suspense, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { useAiChat, type Message } from '@/lib/ai/useAiChat'
import { useUser } from '@/lib/auth/UserContext'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { getDb } from '@/lib/db/schema'
import { cn } from '@/lib/utils/cn'

// ─── Sample data (shown when no bank is connected) ────────────────
const SAMPLE_KPI = {
  cashOnHand: '₾482k',
  netBurn:    '₾61k',
  runway:     '14 mo',
  mrr:        '$38k',
}

// ─── SVG icons for the suggestion chips ──────────────────────────
const CHIP_ICONS = [
  <svg key="a" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>,
  <svg key="b" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>,
  <svg key="c" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  </svg>,
  <svg key="d" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
  </svg>,
]

// ─── Inline metric [[label|value]] ───────────────────────────────
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

// ─── Inline text parser: bold, italic, code, [[metric|value]] ────
function renderInline(text: string, baseKey: string): ReactNode[] {
  // Pattern matches [[label|value]], **bold**, *italic*, `code`
  const pattern = /(\[\[([^|]+)\|([^\]]+)\]\])|(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)/g
  const parts: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let idx = 0

  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={`${baseKey}-t${idx++}`}>{text.slice(last, m.index)}</span>)

    if (m[1]) { // [[label|value]]
      parts.push(<InlineMetric key={`${baseKey}-m${idx++}`} label={m[2]!} value={m[3]!} />)
    } else if (m[4]) { // **bold**
      parts.push(<strong key={`${baseKey}-b${idx++}`}>{m[5]}</strong>)
    } else if (m[6]) { // *italic*
      parts.push(<em key={`${baseKey}-i${idx++}`}>{m[7]}</em>)
    } else if (m[8]) { // `code`
      parts.push(
        <code key={`${baseKey}-c${idx++}`} style={{
          fontFamily: 'var(--font-num)', background: 'var(--stone-2)',
          borderRadius: 4, padding: '1px 5px', fontSize: '0.88em',
          border: '1px solid var(--border-subtle)',
        }}>
          {m[9]}
        </code>
      )
    }
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(<span key={`${baseKey}-t${idx++}`}>{text.slice(last)}</span>)
  return parts
}

// ─── Block markdown renderer ──────────────────────────────────────
// Handles: paragraphs, bullet lists, numbered lists, ### headers, code blocks
function renderContent(text: string): ReactNode {
  const lines = text.split('\n')
  const blocks: ReactNode[] = []
  let blockKey = 0
  let i = 0

  // Detect fenced code blocks
  const CODE_FENCE = /^```/

  while (i < lines.length) {
    const line = lines[i]!

    // Skip blank lines
    if (!line.trim()) { i++; continue }

    // Fenced code block
    if (CODE_FENCE.test(line)) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !CODE_FENCE.test(lines[i]!)) {
        codeLines.push(lines[i]!)
        i++
      }
      i++ // consume closing ```
      blocks.push(
        <pre key={blockKey++} style={{
          background: 'var(--stone-2)', border: '1px solid var(--border-subtle)',
          borderRadius: 8, padding: '10px 14px', margin: '8px 0',
          fontFamily: 'var(--font-num)', fontSize: '0.85em',
          overflowX: 'auto', whiteSpace: 'pre',
        }}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
      continue
    }

    // Heading (### or ## or #)
    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^(#{1,3})/)?.[1]?.length ?? 2
      const content = line.replace(/^#{1,3}\s+/, '')
      const Tag = (['h3', 'h4', 'h5'] as const)[level - 1] ?? 'h5'
      blocks.push(
        <Tag key={blockKey++} style={{
          margin: '10px 0 4px', fontWeight: 700,
          fontSize: level === 1 ? '1.1em' : '1em',
        }}>
          {renderInline(content, `hd-${blockKey}`)}
        </Tag>
      )
      i++
      continue
    }

    // Bullet list
    if (/^[-*•]\s/.test(line)) {
      const items: ReactNode[] = []
      let listKey = 0
      while (i < lines.length && /^[-*•]\s/.test(lines[i]!)) {
        const content = lines[i]!.replace(/^[-*•]\s+/, '')
        items.push(
          <li key={listKey++} style={{ marginBottom: 2 }}>
            {renderInline(content, `ul-${blockKey}-${listKey}`)}
          </li>
        )
        i++
      }
      blocks.push(
        <ul key={blockKey++} style={{ margin: '4px 0', paddingLeft: 20, listStyleType: 'disc' }}>
          {items}
        </ul>
      )
      continue
    }

    // Numbered list
    if (/^\d+[.)]\s/.test(line)) {
      const items: ReactNode[] = []
      let listKey = 0
      while (i < lines.length && /^\d+[.)]\s/.test(lines[i]!)) {
        const content = lines[i]!.replace(/^\d+[.)]\s+/, '')
        items.push(
          <li key={listKey++} style={{ marginBottom: 2 }}>
            {renderInline(content, `ol-${blockKey}-${listKey}`)}
          </li>
        )
        i++
      }
      blocks.push(
        <ol key={blockKey++} style={{ margin: '4px 0', paddingLeft: 20 }}>
          {items}
        </ol>
      )
      continue
    }

    // Paragraph: collect consecutive non-special lines
    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i]!.trim() &&
      !CODE_FENCE.test(lines[i]!) &&
      !/^#{1,3}\s/.test(lines[i]!) &&
      !/^[-*•]\s/.test(lines[i]!) &&
      !/^\d+[.)]\s/.test(lines[i]!)
    ) {
      paraLines.push(lines[i]!)
      i++
    }
    if (paraLines.length) {
      blocks.push(
        <p key={blockKey++} style={{ margin: '4px 0', lineHeight: 1.6 }}>
          {renderInline(paraLines.join(' '), `p-${blockKey}`)}
        </p>
      )
    }
  }

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{blocks}</div>
}

// ─── Message bubble ───────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div className={cn('chat-row', isUser && 'chat-row--user')}>
      {!isUser && (
        <div className="mark" style={{ width: 30, height: 30, borderRadius: 9, fontSize: 15, flex: '0 0 auto', marginTop: 2 }}>f</div>
      )}
      <div className={cn('chat-bubble', isUser ? 'chat-bubble--user' : 'chat-bubble--ai')}>
        {isUser ? msg.content : renderContent(msg.content)}
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
type AskStrings = ReturnType<typeof useLocale>['t']['ask']

function getGreeting(name: string | null | undefined, a: AskStrings): string {
  const h     = new Date().getHours()
  const first = name?.split(' ')[0] ?? a.greetingFallback
  const part  = h < 12 ? a.greetingMorning : h < 17 ? a.greetingAfternoon : a.greetingEvening
  return `${part}, ${first}.`
}

// ─── KPI row ───────────────────────────────────────────────────────
function fmtGel(n: number): string {
  if (n >= 1_000_000) return `₾${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `₾${Math.round(n / 1_000)}k`
  return `₾${Math.round(n)}`
}

function KpiRow({ hasData }: { hasData: boolean }) {
  const { t } = useLocale()
  const a     = t.ask

  const live = useLiveQuery(async () => {
    if (!hasData) return null
    const db       = getDb()
    const accounts = await db.accounts.toArray()
    const cash     = accounts.reduce((s, ac) => s + ac.balance, 0)

    const now            = new Date()
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
    const txs            = await db.transactions
      .where('date').between(threeMonthsAgo, now, true, true)
      .toArray()

    const totalExpenses = txs.filter(tx => tx.type === 'debit').reduce((s, tx)  => s + tx.amount, 0)
    const totalIncome   = txs.filter(tx => tx.type === 'credit').reduce((s, tx) => s + tx.amount, 0)
    const avgBurn       = totalExpenses / 3
    const avgMrr        = totalIncome   / 3
    const runway        = avgBurn > 0 ? Math.floor(cash / avgBurn) : 0

    return { cash, avgBurn, runway, avgMrr }
  }, [hasData])

  const kpi = hasData && live
    ? { cashOnHand: fmtGel(live.cash), netBurn: fmtGel(live.avgBurn), runway: `${live.runway} ${a.kpiMo}`, mrr: fmtGel(live.avgMrr) }
    : SAMPLE_KPI

  return (
    <div className="kpi-row">
      <div className="kpi-tile">
        <span className="kpi-label">{a.kpiCash}</span>
        <span className="kpi-value mono">{kpi.cashOnHand}</span>
      </div>
      <div className="kpi-divider" />
      <div className="kpi-tile">
        <span className="kpi-label">{a.kpiNetBurn}</span>
        <span className="kpi-value mono neg">{kpi.netBurn}</span>
      </div>
      <div className="kpi-divider" />
      <div className="kpi-tile">
        <span className="kpi-label">{a.kpiRunway}</span>
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

// ─── Chat input ────────────────────────────────────────────────────
function ChatInput({
  onSend,
  disabled,
  currency,
  onCurrencyChange,
  accountCount,
  placeholder,
  autoFocus,
}: {
  onSend: (text: string) => void
  disabled: boolean
  currency: Currency
  onCurrencyChange: (c: Currency) => void
  accountCount: number
  placeholder: string
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
          id="chat-input"
          name="message"
          className="chat-input-field"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
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
  const { t } = useLocale()
  const a     = t.ask
  return (
    <div className="connect-nudge">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--tan-9)', flexShrink: 0 }}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
      <span>
        {a.connectNudgePrefix}{' '}
        <a href="/connect-bank" className="connect-nudge-link">{a.connectNudgeLink}</a>
        {' '}{a.connectNudgeSuffix}
      </span>
    </div>
  )
}

// ─── Trust line ────────────────────────────────────────────────────
function TrustLine() {
  const { t } = useLocale()
  return (
    <p className="ask-trust">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      {t.ask.trustLine}
    </p>
  )
}

// ─── Main client component ─────────────────────────────────────────
function AskClientInner() {
  const router         = useRouter()
  const searchParams   = useSearchParams()
  const conversationId = searchParams.get('c')
  const user           = useUser()
  const { t }          = useLocale()
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

  // Locale-aware chip labels paired with icons
  const chips = t.ask.chips.map((label, i) => ({ label, icon: CHIP_ICONS[i % CHIP_ICONS.length] }))

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
            <h1 className="ask-greeting">{getGreeting(user.name, t.ask)}</h1>

            {/* Status line */}
            <p className="ask-subhead">
              {hasRealData ? t.ask.connectedHint : t.ask.sampleHint}
            </p>

            {/* Ask box */}
            <ChatInput
              onSend={send}
              disabled={streaming}
              currency={currency}
              onCurrencyChange={setCurrency}
              accountCount={accountCount as number}
              placeholder={t.ask.placeholder}
              autoFocus
            />

            {/* Starter chips */}
            <div className="ask-chips">
              {chips.map(c => (
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
                {t.ask.errorMsg}
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
            placeholder={t.ask.placeholder}
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
