import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client.server'
import { waitlist, users } from '@/lib/db/schema.server'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export const dynamic = 'force-dynamic'

function checkAdmin(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  const expected = process.env.ADMIN_SECRET
  if (!expected) {
    // Env var not set — log and deny
    console.error('[admin] ADMIN_SECRET env var is not set!')
    return false
  }
  return secret === expected
}

// GET — list all waitlist entries
export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const entries = await db.select().from(waitlist).orderBy(waitlist.signedUpAt)
  return NextResponse.json({ data: entries })
}

// POST — approve a waitlist entry
export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, action } = await req.json() as { id: string; action: 'approve' | 'reject' }
  if (!id || !action) return NextResponse.json({ error: 'Missing id or action' }, { status: 400 })

  const entry = await db.select().from(waitlist).where(eq(waitlist.id, id)).limit(1)
  if (!entry[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'approve') {
    await db.update(waitlist)
      .set({ status: 'approved', approvedAt: new Date() })
      .where(eq(waitlist.id, id))

    // Create user record so they can log in
    await db.insert(users)
      .values({
        id:       nanoid(),
        email:    entry[0].email,
        name:     entry[0].name ?? null,
        approved: true,
      })
      .onConflictDoNothing()

    // Send invite email
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from:    process.env.RESEND_FROM ?? 'Fain <noreply@fain.ge>',
        to:      entry[0].email,
        subject: "Your Fain access is ready",
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;color:#29261b">
            <div style="font-size:26px;font-weight:700;letter-spacing:-0.03em">
              fain<span style="color:#FD5400">.</span>
            </div>
            <h2 style="margin:28px 0 12px;font-size:22px">Your spot is ready.</h2>
            <p style="color:#6b6457;line-height:1.6">
              You've been approved for early access to Fain. Sign in to connect your bank and get started.
            </p>
            <a href="https://fain.ge/login" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#FD5400;color:#fff;font-weight:700;font-size:15px;text-decoration:none;border-radius:12px">
              Sign in to Fain
            </a>
            <p style="margin-top:32px;color:#8a8377;font-size:14px">— The Fain team</p>
          </div>
        `,
      })
    } catch (e) {
      console.error('[admin/approve] email error', e)
    }
  }

  if (action === 'reject') {
    await db.update(waitlist)
      .set({ status: 'rejected' })
      .where(eq(waitlist.id, id))
  }

  return NextResponse.json({ ok: true })
}
