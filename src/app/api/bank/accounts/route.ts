import { NextRequest, NextResponse } from 'next/server'
import { fetchAccounts } from '@/lib/api/saltedge'
import { rateLimit } from '@/lib/api/ratelimit'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const rl = await rateLimit(`accounts:${session.user.id}`, 30, 60)
  if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const { connectionId } = await req.json()
  if (!connectionId) return NextResponse.json({ error: 'connectionId required' }, { status: 400 })

  const accounts = await fetchAccounts(connectionId)
  return NextResponse.json({ data: accounts })
}
