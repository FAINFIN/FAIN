import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client.server'
import { userProfiles } from '@/lib/db/schema.server'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { auth } from '@/lib/auth/config'

export const dynamic = 'force-dynamic'

const schema = z.object({
  jobRole:        z.string().min(1),
  companySize:    z.string().min(1),
  primaryGoal:    z.string().min(1),
  organisation:   z.string().min(1),
})

export async function POST(req: NextRequest) {
  // Verify session
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body   = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
  }

  const { jobRole, companySize, primaryGoal, organisation } = parsed.data
  const userId = session.user.id

  // Upsert user profile (insert or update if already exists)
  const existing = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1)

  const now = new Date()

  if (existing.length > 0) {
    await db
      .update(userProfiles)
      .set({
        jobRole,
        companySize,
        organisation,
        metadata: { primaryGoal },
        onboardingCompletedAt: now,
        updatedAt: now,
      })
      .where(eq(userProfiles.userId, userId))
  } else {
    await db.insert(userProfiles).values({
      id:                    nanoid(),
      userId,
      jobRole,
      companySize,
      organisation,
      metadata:              { primaryGoal },
      onboardingCompletedAt: now,
    })
  }

  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, session.user.id))
    .limit(1)

  return NextResponse.json({ profile: profile[0] ?? null })
}
