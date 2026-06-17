import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client.server'
import { bankConnections } from '@/lib/db/schema.server'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'
import { nanoid } from 'nanoid'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { connectionId, provider } = await req.json() as { connectionId: string; provider?: string }
  if (!connectionId) return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 })

  const userId = session.user.id

  // Better Auth already owns the `user` table — no insert needed here.
  // Just register the bank connection.

  // Check if connection already registered
  const existing = await db.select()
    .from(bankConnections)
    .where(eq(bankConnections.saltEdgeConnectionId, connectionId))
    .limit(1)

  if (existing.length === 0) {
    await db.insert(bankConnections).values({
      id:                   nanoid(),
      userId,
      saltEdgeCustomerId:   userId.replace(/[^a-z0-9_-]/gi, '_'),
      saltEdgeConnectionId: connectionId,
      providerName:         provider ?? null,
      status:               'connected',
      connectedAt:          new Date(),
      expiresAt:            new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      lastSyncedAt:         new Date(),
    })
  } else {
    await db.update(bankConnections)
      .set({ status: 'connected', lastSyncedAt: new Date() })
      .where(eq(bankConnections.saltEdgeConnectionId, connectionId))
  }

  return NextResponse.json({ ok: true })
}
