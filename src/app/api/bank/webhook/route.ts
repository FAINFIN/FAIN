import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db/client.server'
import { bankConnections, syncLog } from '@/lib/db/schema.server'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('signature') ?? ''

  // Verify HMAC-SHA256 signature
  const secret   = process.env.SALT_EDGE_SECRET ?? ''
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  if (secret && signature !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event        = JSON.parse(body)
  const type         = event.meta?.type as string
  const connectionId = event.data?.connection_id as string | undefined

  console.log('[saltedge webhook]', type, connectionId)

  if (connectionId) {
    const conn = await db.select()
      .from(bankConnections)
      .where(eq(bankConnections.saltEdgeConnectionId, connectionId))
      .limit(1)

    const record = conn[0]
    if (record) {
      if (type === 'connection.success' || type === 'attempts.success') {
        await db.update(bankConnections)
          .set({ status: 'connected', lastSyncedAt: new Date() })
          .where(eq(bankConnections.saltEdgeConnectionId, connectionId))

        await db.insert(syncLog).values({
          id:           nanoid(),
          connectionId: record.id,
          status:       'ok',
        })
      }

      if (type === 'connection.error' || type === 'attempts.error') {
        await db.update(bankConnections)
          .set({ status: 'error' })
          .where(eq(bankConnections.saltEdgeConnectionId, connectionId))

        await db.insert(syncLog).values({
          id:           nanoid(),
          connectionId: record.id,
          status:       'error',
          error:        JSON.stringify(event.data?.error ?? {}),
        })
      }

      if (type === 'connection.destroyed') {
        await db.update(bankConnections)
          .set({ status: 'disconnected' })
          .where(eq(bankConnections.saltEdgeConnectionId, connectionId))
      }
    }
  }


  return NextResponse.json({ acknowledged: true })
}
