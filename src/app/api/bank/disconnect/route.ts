import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/client.server'
import { bankConnections } from '@/lib/db/schema.server'
import { and, eq } from 'drizzle-orm'
import { deleteConnection } from '@/lib/api/saltedge'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { connectionId } = await req.json() as { connectionId: string }
  if (!connectionId) return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 })

  const userId = session.user.id

  // Find the row — scoped to this user so they can't delete someone else's connection
  const rows = await db
    .select({ id: bankConnections.id, saltEdgeConnectionId: bankConnections.saltEdgeConnectionId })
    .from(bankConnections)
    .where(and(
      eq(bankConnections.userId, userId),
      eq(bankConnections.saltEdgeConnectionId, connectionId),
    ))
    .limit(1)

  if (!rows.length) {
    // Row already gone — treat as success (idempotent)
    return NextResponse.json({ ok: true })
  }

  const row = rows[0]!

  // Delete from Salt Edge first (best-effort — don't fail the whole request if SE returns an error)
  try {
    await deleteConnection(row.saltEdgeConnectionId!)
  } catch (err) {
    console.error('[bank/disconnect] Salt Edge deleteConnection failed (continuing):', err)
  }

  // Delete from Postgres
  await db
    .delete(bankConnections)
    .where(eq(bankConnections.id, row.id))

  return NextResponse.json({ ok: true })
}
