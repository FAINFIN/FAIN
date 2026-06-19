import { NextRequest, NextResponse } from 'next/server'
import { createConnectSession, createCustomer, getCustomerByIdentifier } from '@/lib/api/saltedge'
import { rateLimit } from '@/lib/api/ratelimit'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/client.server'
import { bankConnections } from '@/lib/db/schema.server'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { nanoid } from 'nanoid'

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // Rate limit: 5 connect attempts per user per minute
  const rl = await rateLimit(`connect:${session.user.id}`, 5, 60)
  if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const userId = session.user.id

    // Look up an existing Salt Edge customer ID for this user.
    // We store the Salt Edge-assigned customer ID (not our own user ID) so that
    // subsequent connect attempts reuse the same Salt Edge customer.
    const existingRows = await db
      .select({ saltEdgeCustomerId: bankConnections.saltEdgeCustomerId })
      .from(bankConnections)
      .where(eq(bankConnections.userId, userId))
      .limit(1)

    let saltEdgeCustomerId: string

    if (existingRows.length > 0) {
      // Reuse the Salt Edge customer ID we stored from the first connect attempt
      saltEdgeCustomerId = existingRows[0]!.saltEdgeCustomerId
    } else {
      // First time: create a Salt Edge customer and store the real SE-assigned ID
      const identifier = userId.replace(/[^a-z0-9_-]/gi, '_')
      let customer: { id: string; identifier: string }
      try {
        customer = await createCustomer(identifier)
      } catch (createErr) {
        // Customer already exists at Salt Edge (e.g. DB was reset but SE wasn't).
        // Fall back to looking up by identifier to get the real SE-assigned ID.
        try {
          customer = await getCustomerByIdentifier(identifier)
        } catch {
          throw createErr  // Re-throw original error if lookup also fails
        }
      }
      saltEdgeCustomerId = customer.id  // Salt Edge's own UUID — NOT our identifier

      // Insert a pending row so subsequent connects (or reconnects) reuse this customer ID
      await db.insert(bankConnections).values({
        id:                   nanoid(),
        userId,
        saltEdgeCustomerId,
        saltEdgeConnectionId: null,   // filled in by /api/bank/register after callback
        status:               'pending',
        createdAt:            new Date(),
      })
    }

    const returnTo = `${process.env.NEXT_PUBLIC_APP_URL}/connect-bank/callback`
    const { connect_url, expires_at } = await createConnectSession(saltEdgeCustomerId, returnTo)
    return NextResponse.json({ connect_url, expires_at })
  } catch (err) {
    console.error('[bank/connect]', err)
    return NextResponse.json({ error: 'Failed to create connection session' }, { status: 500 })
  }
}
