import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/api/ratelimit'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

const SYSTEM = `You are Fain, an AI financial controller for SME founders. You give direct, plain-English answers about their finances.

Rules:
- Lead with the number/answer. Explain after.
- Use the <financial_context> block when provided — reference specific figures.
- Currency: ₾ for GEL, $ for USD, € for EUR. Always show the symbol.
- Inline metrics format: [[label|value]] — e.g. [[Runway|14 mo]] [[Burn|₾61k/mo]]
- You only see category totals and monthly summaries — never raw transactions or merchant names. Be honest about this.
- When data is missing, say what you'd need and suggest connecting it.
- Never invent numbers. Never give investment advice.
- Keep it tight: founders want facts, not essays.`

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const rl = await rateLimit(`ai:${session.user.id}`, 30, 60)
  if (!rl.success) return NextResponse.json({ error: 'Too many requests — wait a minute' }, { status: 429 })

  const { message, context, history = [] } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 })

  const userContent = context
    ? `<financial_context>\n${context}\n</financial_context>\n\n${message}`
    : message

  // Lazy-init Anthropic inside the handler — never runs at build time
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // Stream the response
  const stream = await anthropic.messages.stream({
    model:      'claude-sonnet-4-6',
    max_tokens: 1024,
    system:     SYSTEM,
    messages: [
      ...history.slice(-12).map((m: {role: string; content: string}) => ({
        role:    m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: userContent },
    ],
  })

  // Return as a ReadableStream (Server-Sent Events compatible)
  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
        }
      }
      const final = await stream.finalMessage()
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, usage: final.usage })}\n\n`))
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection:      'keep-alive',
    },
  })
}
