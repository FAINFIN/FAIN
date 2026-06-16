import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Force dynamic — this route sends email and must never be statically pre-rendered
export const dynamic = 'force-dynamic'

const schema = z.object({
  email: z.string().email(),
  name:  z.string().min(1).optional(),
})

export async function POST(req: NextRequest) {
  const body   = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid email' }, { status: 400 })

  const { email, name } = parsed.data

  // Lazy-init Resend inside the handler so it never runs at build time
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    // Notify us
    await resend.emails.send({
      from:    process.env.RESEND_FROM_EMAIL ?? 'hello@fain.ge',
      to:      'archilgu@gmail.com',
      subject: `New waitlist signup: ${email}`,
      text:    `Name: ${name ?? '—'}\nEmail: ${email}\nTime: ${new Date().toISOString()}`,
    })

    // Confirm to the user
    await resend.emails.send({
      from:    process.env.RESEND_FROM_EMAIL ?? 'hello@fain.ge',
      to:      email,
      subject: "You're on the Fain waitlist",
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;color:#29261b">
          <div style="font-size:26px;font-weight:700;letter-spacing:-0.03em">
            fain<span style="color:#FD5400">.</span>
          </div>
          <h2 style="margin:28px 0 12px;font-size:22px">You're on the list.</h2>
          <p style="color:#6b6457;line-height:1.6">
            We're giving early access to a small group of founders.
            We'll be in touch as soon as your spot is ready — usually within a few days.
          </p>
          <p style="color:#6b6457;line-height:1.6">
            In the meantime, if you have questions just reply to this email.
          </p>
          <p style="margin-top:32px;color:#8a8377;font-size:14px">— The Fain team</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[waitlist]', err)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
