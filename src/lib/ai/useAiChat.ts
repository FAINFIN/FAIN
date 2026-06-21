'use client'

/**
 * useAiChat — server-backed chat hook.
 *
 * Messages are stored in Neon Postgres (encrypted at rest).
 * This hook does NOT write to IndexedDB/Dexie at all — that is now
 * only used for bank connections and financial data.
 *
 * Flow:
 * 1. On mount (or when conversationId changes), fetch messages from
 *    GET /api/conversations/[id]/messages
 * 2. On send(), call POST /api/ai/chat with {message, context, history,
 *    conversationId}. The server creates the conversation if conversationId
 *    is null.
 * 3. Parse the SSE stream: first event contains {convId, isNew}; subsequent
 *    events contain {text} chunks; final event has {done: true}.
 * 4. After streaming, fire onNewConversation(id, title) if the server
 *    created a new conversation — caller uses this to update the URL.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { getAiContext } from './useAiContext'

export interface Message {
  id:      string
  role:    'user' | 'assistant'
  content: string
}

interface UseAiChatOptions {
  conversationId:     string | null
  onNewConversation?: (id: string, title: string) => void
}

export function useAiChat({
  conversationId,
  onNewConversation,
}: UseAiChatOptions = { conversationId: null }) {
  const [messages,  setMessages]  = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  // Keep a ref so the send() callback always reads the latest convId
  const activeConvRef = useRef<string | null>(conversationId)
  useEffect(() => { activeConvRef.current = conversationId }, [conversationId])

  // ── Load persisted messages when conversationId changes ──────────────────────
  useEffect(() => {
    if (!conversationId) { setMessages([]); return }

    let cancelled = false
    fetch(`/api/conversations/${conversationId}/messages`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        if (cancelled) return
        setMessages(
          (data.messages ?? []).map((m: { id: string; role: string; content: string }) => ({
            id:      m.id,
            role:    m.role as 'user' | 'assistant',
            content: m.content,
          }))
        )
      })
      .catch(e => {
        if (!cancelled) console.error('[useAiChat] load messages:', e)
      })

    return () => { cancelled = true }
  }, [conversationId])

  // ── Send a message ────────────────────────────────────────────────────────────
  const send = useCallback(async (text: string) => {
    setError(null)

    const assistantId = crypto.randomUUID()
    const userMsgId   = crypto.randomUUID()

    // Optimistically add both messages to state before the network round-trip
    setMessages(prev => [
      ...prev,
      { id: userMsgId,   role: 'user',      content: text },
      { id: assistantId, role: 'assistant', content: '' },
    ])
    setStreaming(true)

    let resolvedConvId: string | null  = activeConvRef.current
    let newConvTitle:   string | null  = null

    try {
      const context = await getAiContext()
      // Build history from current messages (exclude the optimistic ones we just added)
      const history = messages.map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/ai/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          message:        text,
          context,
          history,
          conversationId: activeConvRef.current, // null → server creates a new one
        }),
      })

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error ?? 'Request failed')
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const lines = decoder.decode(value, { stream: true }).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          let json: Record<string, unknown>
          try { json = JSON.parse(line.slice(6)) } catch { continue }

          // First event: server sends the conversation ID
          if (json.convId) {
            resolvedConvId = json.convId as string
            activeConvRef.current = resolvedConvId

            if (json.isNew) {
              // Title = first 72 chars of the message
              newConvTitle = text.length > 72 ? text.slice(0, 72) + '…' : text
            }
          }

          // Content delta
          if (json.text) {
            setMessages(prev => prev.map(m =>
              m.id === assistantId
                ? { ...m, content: m.content + (json.text as string) }
                : m
            ))
          }
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      // Remove the empty assistant placeholder on error
      setMessages(prev => prev.filter(m => m.id !== assistantId))
    } finally {
      setStreaming(false)

      // Navigate to the new conversation URL AFTER streaming is done —
      // doing it earlier would reset the conversationId prop mid-stream
      // and trigger the load-messages useEffect, wiping streaming state.
      if (newConvTitle !== null && resolvedConvId) {
        onNewConversation?.(resolvedConvId, newConvTitle)
        // Fire a browser event so the Sidebar knows to refresh its list
        window.dispatchEvent(new CustomEvent('fain:new-conversation'))
      }
    }
  }, [messages, onNewConversation])

  return { messages, streaming, error, send }
}
