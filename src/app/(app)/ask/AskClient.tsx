'use client'

import { useState, useRef, useEffect, FormEvent, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAiChat, type Message } from '@/lib/ai/useAiChat'
import { Mark } from '@/components/ui/Mark'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import { useLocale } from '@/lib/i18n/LocaleContext'

// Parse [[label|value]] inline metric tags from AI response
function parseContent(text: string) {
  const parts: Array<{ type: 'text'; value: string } | { type: 'metric'; label: string; value: string }> = []
  const regex = /\[\[([^|]+)\|([^\]]+)\]\]/g
  let last = 0, match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: 'text', value: text.slice(last, match.index) })
    parts.push({ type: 'metric', label: match[1]!, value: match[2]! })
    last = match.index + match[0].length
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
      fontSize: '0.92em', fontFamily: 'var(--font-num)',
    }}>
      <span style={{ color: 'var(--text-low)', fontSize: '0.88em' }}>{label}</span>
      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
    </span>
  )
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  const parts  = isUser ? null : parseContent(msg.content)

  return (
    <div className={cn('chat-row', isUser && 'chat-row--user')}>
      {!isUser && <Mark size="sm" />}
      <div className={cn('chat-bubble', isUser ? 'chat-bubble--user' : 'chat-bubble--ai')}>
        {isUser ? msg.content : (
          <span>
            {parts!.map((p, i) =>
              p.type === 'text'
                ? <span key={i}>{p.value}</span>
                : <InlineMetric key={i} label={p.label} value={p.value} />
            )}
          </span>
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="chat-row">
      <Mark size="sm" />
      <div className="chat-bubble chat-bubble--ai" style={{ padding: '10px 14px' }}>
        <span className="typing-dots">
          <span /><span /><span />
        </span>
      </div>
    </div>
  )
}

function AskClientInner() {
  const { messages, streaming, error, send } = useAiChat()
  const { locale, t } = useLocale()
  const searchParams   = useSearchParams()
  const [draft, setDraft] = useState('')
  const bottomRef  = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const didAutoSend = useRef(false)

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

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || streaming) return
    setDraft('')
    send(text)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as FormEvent)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="app-header">
        <h1 className="page-title">{t.ask.title}</h1>
      </div>

      {/* Message list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '48px 0' }}>
            <Mark size="lg" />
            <h2 className="serif" style={{ margin: 0, textAlign: 'center', maxWidth: 320, fontSize: 22 }}>
              {locale === 'ka' ? 'დასვი ნებისმიერი კითხვა ფინანსებზე.' : 'Ask anything about your finances.'}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 480 }}>
              {t.ask.chips.map(chip => (
                <button
                  key={chip}
                  className="chip"
                  onClick={() => send(chip)}
                  style={{ cursor: 'pointer' }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
        {streaming && <TypingIndicator />}
        {error && (
          <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--neg)', fontSize: 13 }}>
            {locale === 'ka' ? 'შეცდომა — სცადე ხელახლა.' : 'Something went wrong — try again.'}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{ borderTop: '1px solid var(--border-subtle)', padding: '12px 20px', display: 'flex', gap: 10, alignItems: 'flex-end' }}
      >
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={t.ask.placeholder}
          disabled={streaming}
          style={{
            flex: 1, resize: 'none', border: '1px solid var(--border-subtle)',
            borderRadius: 12, padding: '10px 14px', fontFamily: 'inherit',
            fontSize: 14, background: 'var(--surface-primary)',
            color: 'var(--text-primary)', outline: 'none', lineHeight: 1.5,
            minHeight: 42, maxHeight: 140, overflowY: 'auto',
          }}
        />
        <Button type="submit" variant="primary" size="sm" loading={streaming} disabled={!draft.trim()}>
          {locale === 'ka' ? 'გაგზავნა' : 'Send'}
        </Button>
      </form>
    </div>
  )
}

export function AskClient() {
  return (
    <Suspense fallback={<div className="app-content" style={{ color: 'var(--text-low)', fontSize: 14 }}>Loading…</div>}>
      <AskClientInner />
    </Suspense>
  )
}
