import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client.server'
import { user, bankConnections } from '@/lib/db/schema.server'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

function checkAdmin(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  return secret === process.env.ADMIN_SECRET
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const allUsers = await db.select().from(user).orderBy(user.createdAt)

  const result = await Promise.all(
    allUsers.map(async (u) => {
      const conns = await db.select()
        .from(bankConnections)
        .where(eq(bankConnections.userId, u.id))
      return { ...u, connections: conns }
    })
  )

  return NextResponse.json({ data: result })
}
