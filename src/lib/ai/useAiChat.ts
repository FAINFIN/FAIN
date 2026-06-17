'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { getAiContext } from './useAiContext'
import { getDb } from '@/lib/db/schema'

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

  // Keep a ref so callbacks always read the latest convId
  const activeConvRef = useRef<string | null>(conversationId)
  useEffect(() => { activeConvRef.current = conversationId }, [conversationId])

  // Load persisted messages when conversationId changes
  useEffect(() => {
    if (!conversationId) { setMessages([]); return }
    getDb()
      .messages
      .where('conversationId').equals(conversationId)
      .sortBy('createdAt')
      .then(rows =>
        setMessages(rows.map(r => ({ id: r.id, role: r.role, content: r.content })))
      )
      .catch(console.error)
  }, [conversationId])

  const send = useCallback(async (text: string) => {
    setError(null)

    // ── Create a conversation if this is the first message ──
    let convId = activeConvRef.current
    if (!convId) {
      const newId = crypto.randomUUID()
      const title = text.length > 72 ? text.slice(0, 72) + '…' : text
      try {
        await getDb().conversations.add({
          id: newId, title,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      } catch (e) { console.error('[chat] create conversation', e) }
      activeConvRef.current = newId
      convId = newId
      onNewConversation?.(newId, title)
    }

    const userMsgId   = crypto.randomUUID()
    const assistantId = crypto.randomUUID()

    setMessages(prev => [
      ...prev,
      { id: userMsgId,   role: 'user',      content: text },
      { id: assistantId, role: 'assistant', content: '' },
    ])
    setStreaming(true)

    // Persist user message immediately
    try {
      await getDb().messages.add({
        id: userMsgId,
        conversationId: convId,
        role: 'user',
        content: text,
        createdAt: new Date(),
      })
    } catch (e) { console.error('[chat] save user message', e) }

    let fullResponse = ''
    try {
      const context = await getAiContext()
      const history = messages.map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/ai/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: text, context, history }),
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
        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const json = JSON.parse(line.slice(6))
          if (json.text) {
            fullResponse += json.text
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? { ...m, content: m.content + json.text } : m
            ))
          }
        }
      }

      // Persist completed assistant message + update conversation timestamp
      if (fullResponse) {
        await getDb().messages.add({
          id: assistantId,
          conversationId: convId,
          role: 'assistant',
          content: fullResponse,
          createdAt: new Date(),
        })
        await getDb().conversations.update(convId, { updatedAt: new Date() })
      }
    } catch (e: any) {
      setError(e.message)
      setMessages(prev => prev.filter(m => m.id !== assistantId))
    } finally {
      setStreaming(false)
    }
  }, [messages, onNewConversation])

  return { messages, streaming, error, send }
}
