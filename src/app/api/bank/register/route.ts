import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client.server'
import { bankConnections } from '@/lib/db/schema.server'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { connectionId, provider } = await req.json() as { connectionId: string; provider?: string }
  if (!connectionId) return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 })

  const userId = session.user.id

  // Check if this connectionId is already fully registered (idempotent re-call)
  const alreadyRegistered = await db
    .select({ id: bankConnections.id })
    .from(bankConnections)
    .where(eq(bankConnections.saltEdgeConnectionId, connectionId))
    .limit(1)

  if (alreadyRegistered.length > 0) {
    // Idempotent: mark as connected in case it was previously expired/errored
    await db
      .update(bankConnections)
      .set({ status: 'connected', lastSyncedAt: new Date() })
      .where(eq(bankConnections.saltEdgeConnectionId, connectionId))
    return NextResponse.json({ ok: true })
  }

  // Find the pending row created by /api/bank/connect for this user.
  // That row already holds the correct Salt Edge customer ID.
  const pendingRows = await db
    .select()
    .from(bankConnections)
    .where(and(
      eq(bankConnections.userId, userId),
      eq(bankConnections.status, 'pending'),
    ))
    .limit(1)

  if (pendingRows.length > 0) {
    // Promote the pending row to a fully connected state
    await db
      .update(bankConnections)
      .set({
        saltEdgeConnectionId: connectionId,
        providerName:         provider ?? null,
        status:               'connected',
        connectedAt:          new Date(),
        expiresAt:            new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        lastSyncedAt:         new Date(),
      })
      .where(eq(bankConnections.id, pendingRows[0].id))
  } else {
    // Fallback: no pending row exists (e.g. race condition or direct callback hit).
    // This path should be rare — the saltEdgeCustomerId will be wrong here,
    // but the connection itself will work for syncing. A future reconnect will
    // hit the existing-row branch in /api/bank/connect and use the right customer ID.
    return NextResponse.json(
      { error: 'No pending connection found for this user. Please retry connecting your bank.' },
      { status: 409 },
    )
  }

  return NextResponse.json({ ok: true })
}
