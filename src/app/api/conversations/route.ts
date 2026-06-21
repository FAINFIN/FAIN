/**
 * GET  /api/conversations  — list the current user's conversations (newest first)
 * POST /api/conversations  — create a new conversation
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/client.server'
import { conversations } from '@/lib/db/schema.server'
import { eq, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// ── GET — list conversations ──────────────────────────────────────────────────

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const rows = await db
    .select({
      id:        conversations.id,
      title:     conversations.title,
      updatedAt: conversations.updatedAt,
      createdAt: conversations.createdAt,
    })
    .from(conversations)
    .where(eq(conversations.userId, session.user.id))
    .orderBy(desc(conversations.updatedAt))
    .limit(50)

  return NextResponse.json({ conversations: rows })
}

// ── POST — create a conversation ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { title } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const id  = crypto.randomUUID()
  const now = new Date()

  await db.insert(conversations).values({
    id,
    userId:    session.user.id,
    title:     (title as string).slice(0, 200),
    createdAt: now,
    updatedAt: now,
  })

  return NextResponse.json({ id, title, createdAt: now.toISOString() }, { status: 201 })
}
