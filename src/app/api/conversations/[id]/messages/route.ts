/**
 * GET /api/conversations/[id]/messages
 * Return decrypted messages for a conversation (owner only).
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/client.server'
import { chatMessages, conversations } from '@/lib/db/schema.server'
import { eq, and, asc } from 'drizzle-orm'
import { decrypt } from '@/lib/crypto/encrypt.server'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id: conversationId } = await params

  // Verify ownership by joining through the conversation
  const [conv] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(
      eq(conversations.id,     conversationId),
      eq(conversations.userId, session.user.id),
    ))
    .limit(1)

  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const rows = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(asc(chatMessages.createdAt))

  const messages = rows.map(row => ({
    id:        row.id,
    role:      row.role,
    content:   decrypt(row.contentEnc, row.iv),
    createdAt: row.createdAt.toISOString(),
  }))

  return NextResponse.json({ messages })
}
