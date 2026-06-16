import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Salt Edge calls this when new transactions are available.
// We log the event — the client will re-fetch on next load.
// No financial data is stored server-side.

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('signature') ?? ''

  // Verify HMAC-SHA256 signature
  const secret = process.env.SALT_EDGE_SECRET ?? ''
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  if (signature !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)
  // Types: connection.success, connection.error, connection.destroyed,
  //        attempts.success, attempts.error
  console.log('[saltedge webhook]', event.meta?.type, event.data?.connection_id)

  // The client will pick up new data on next sync — nothing to store.
  return NextResponse.json({ acknowledged: true })
}
