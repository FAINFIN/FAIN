import { NextRequest, NextResponse } from 'next/server'
import { fetchTransactions } from '@/lib/api/saltedge'
import { rateLimit } from '@/lib/api/ratelimit'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const rl = await rateLimit(`transactions:${session.user.id}`, 20, 60)
  if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const { accountId, fromDate, toDate } = await req.json()
  if (!accountId) return NextResponse.json({ error: 'accountId required' }, { status: 400 })

  const transactions = await fetchTransactions(accountId, fromDate, toDate)
  return NextResponse.json({ data: transactions })
}
