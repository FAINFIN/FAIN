import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 503 })

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const anthropic = new Anthropic({ apiKey })
    const msg = await anthropic.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 16,
      messages:   [{ role: 'user', content: 'Say "ok"' }],
    })
    return NextResponse.json({ ok: true, content: msg.content, model: msg.model })
  } catch (e) {
    const err = e as Record<string, unknown>
    return NextResponse.json({
      ok:      false,
      name:    err?.name,
      message: err?.message,
      status:  err?.status,
    }, { status: 200 }) // 200 so we can read the body
  }
}
