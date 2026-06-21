import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/api/ratelimit'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'
import { db } from '@/lib/db/client.server'
import { conversations, chatMessages } from '@/lib/db/schema.server'
import { eq, and } from 'drizzle-orm'
import { encrypt } from '@/lib/crypto/encrypt.server'

export const dynamic = 'force-dynamic'

const SYSTEM = `You are Fain, an AI financial controller for SME founders. You answer financial questions with precision and directness.

CRITICAL: Format every response using ONLY the structured block syntax below. Never output plain markdown, bullet points, or headings outside of blocks.

BLOCK SYNTAX — use exactly these markers:

:::prose
1–2 sentence direct answer. Bold key numbers like **₾150k** or **14 mo**. No fluff.
:::

:::metrics
Cash on hand | ₾482k | across BOG · TBC
Net burn / mo | ₾61k | ↑ 8% vs last mo
Runway | 14 mo | to Aug 2027
:::

:::opts
[REC] Best Option | ↑ 12% p.a. | recommended — brief reason
Second Option | ↑ 8% p.a. | brief note
Third Option | flat | brief note
:::

:::hbars
Salaries | ₾38k | 48%
Rent | ₾12k | 15%
Software | ₾8k | 10%
Other | ₾22k | 27%
:::

:::verdict
**Put ₾150k against the loan.** At 14% APR you're paying ₾1,750/mo in interest — more than T-bills earn.
:::

:::followups
What does this do to my runway? | Show full cost breakdown | Model paying off only half
:::

WHEN TO USE EACH BLOCK:
- :::prose — ALWAYS required, always first
- :::metrics — when you have 2–4 specific KPI values (cash, burn, runway, MRR, etc.)
- :::opts — when ranking 2–4 decision options (what to do with cash, what to cut, etc.)
- :::hbars — when showing spending or income breakdown by category (2–6 rows)
- :::verdict — when there is a clear recommendation or takeaway (use almost always)
- :::followups — ALWAYS required, always last, exactly 3 pipe-separated questions on one line

DATA RULES:
- Use figures from <financial_context> only. Never invent numbers.
- You see category totals and monthly summaries — never raw transactions or merchant names. Say so if asked.
- When data is missing, say what you would need. Suggest connecting a bank.
- Never give investment advice. Give financial facts and options.
- Currency: ₾ for GEL, $ for USD, € for EUR. Always show the symbol.
- Always close every block with ::: on its own line. Always end with :::followups.`

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const rl = await rateLimit(`ai:${session.user.id}`, 30, 60)
  if (!rl.success) return NextResponse.json({ error: 'Too many requests — wait a minute' }, { status: 429 })

  const { message, context, history = [], conversationId: existingConvId } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 })

  // ── Resolve or create the conversation ───────────────────────────────────────
  let convId: string
  let isNewConversation = false

  if (existingConvId) {
    // Verify ownership
    const [conv] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(and(
        eq(conversations.id,     existingConvId),
        eq(conversations.userId, session.user.id),
      ))
      .limit(1)

    if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    convId = existingConvId
  } else {
    // Auto-create a conversation titled from the first message
    convId            = crypto.randomUUID()
    isNewConversation = true
    const title       = (message as string).length > 120
      ? (message as string).slice(0, 120) + '…'
      : (message as string)
    const now = new Date()
    await db.insert(conversations).values({
      id:        convId,
      userId:    session.user.id,
      title,
      createdAt: now,
      updatedAt: now,
    })
  }

  // ── Save user message (encrypted) ────────────────────────────────────────────
  const userMsgId = crypto.randomUUID()
  const userEnc   = encrypt(message as string)
  await db.insert(chatMessages).values({
    id:             userMsgId,
    conversationId: convId,
    userId:         session.user.id,
    role:           'user',
    contentEnc:     userEnc.enc,
    iv:             userEnc.iv,
    createdAt:      new Date(),
  })

  // ── Stream Claude response ────────────────────────────────────────────────────
  const userContent = context
    ? `<financial_context>\n${context}\n</financial_context>\n\n${message}`
    : message

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[ai/chat] ANTHROPIC_API_KEY is not set')
    return NextResponse.json({ error: 'AI not configured' }, { status: 503 })
  }

  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const anthropic = new Anthropic({ apiKey })

  let stream: Awaited<ReturnType<typeof anthropic.messages.stream>>
  try {
    stream = await anthropic.messages.stream({
      model:      'claude-sonnet-4-6',
      max_tokens: 2048,
      system:     SYSTEM,
      messages: [
        ...history.slice(-12).map((m: { role: string; content: string }) => ({
          role:    m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: userContent },
      ],
    })
  } catch (e) {
    console.error('[ai/chat] Anthropic stream init failed:', e)
    return NextResponse.json({ error: 'AI unavailable' }, { status: 503 })
  }

  // ── Return SSE stream ─────────────────────────────────────────────────────────
  const encoder       = new TextEncoder()
  const assistantMsgId = crypto.randomUUID()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        // First event: send convId so client knows the conversation ID
        // (critical for new conversations created server-side)
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ convId, isNew: isNewConversation })}\n\n`
        ))

        let fullResponse = ''

        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            fullResponse += chunk.delta.text
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`
            ))
          }
        }

        const final = await stream.finalMessage()
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ done: true, usage: final.usage })}\n\n`
        ))
        controller.close()

        // ── Save assistant message (encrypted) after streaming ────────────────
        if (fullResponse) {
          const assistantEnc = encrypt(fullResponse)
          await Promise.all([
            db.insert(chatMessages).values({
              id:             assistantMsgId,
              conversationId: convId,
              userId:         session.user.id,
              role:           'assistant',
              contentEnc:     assistantEnc.enc,
              iv:             assistantEnc.iv,
              createdAt:      new Date(),
            }),
            db.update(conversations)
              .set({ updatedAt: new Date() })
              .where(eq(conversations.id, convId)),
          ])
        }
      } catch (e) {
        const err = e as Record<string, unknown>
        console.error('[ai/chat] stream error:', JSON.stringify({
          name:    err?.name    ?? 'unknown',
          message: err?.message ?? String(e),
          status:  err?.status  ?? null,
        }))
        controller.error(e)
      }
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
