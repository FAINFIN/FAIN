import { NextRequest, NextResponse } from 'next/server'
import { createConnectSession, createCustomer } from '@/lib/api/saltedge'
import { rateLimit } from '@/lib/api/ratelimit'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // Rate limit: 5 connect attempts per user per minute
  const rl = await rateLimit(`connect:${session.user.id}`, 5, 60)
  if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    // Salt Edge requires a customer — use the user's session ID as stable identifier
    // (we never store this mapping server-side; client keeps connectionId in IndexedDB)
    const customerId = session.user.id.replace(/[^a-z0-9_-]/gi, '_')

    let customer
    try {
      customer = await createCustomer(customerId)
    } catch {
      // Customer may already exist — that's fine
      customer = { id: customerId }
    }

    const returnTo = `${process.env.NEXT_PUBLIC_APP_URL}/connect-bank/callback`
    const { connect_url, expires_at } = await createConnectSession(customer.id, returnTo)
    return NextResponse.json({ connect_url, expires_at })
  } catch (err) {
    console.error('[bank/connect]', err)
    return NextResponse.json({ error: 'Failed to create connection session' }, { status: 500 })
  }
}
