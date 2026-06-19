import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client.server'
import { sql } from 'drizzle-orm'

export const runtime = 'nodejs'

const REQUIRED_ENV = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'ANTHROPIC_API_KEY',
]

const OPTIONAL_ENV = [
  'SALT_EDGE_APP_ID',
  'SALT_EDGE_SECRET',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'GOOGLE_CLIENT_ID',
  'RESEND_API_KEY',
]

export async function GET() {
  const start = Date.now()

  // ── DB ping ──────────────────────────────────────────────────────────────
  let dbStatus: 'ok' | 'error' = 'ok'
  let dbLatencyMs: number | null = null
  let dbError: string | null = null

  try {
    const t0 = Date.now()
    await db.execute(sql`SELECT 1`)
    dbLatencyMs = Date.now() - t0
  } catch (err) {
    dbStatus = 'error'
    dbError = err instanceof Error ? err.message : String(err)
  }

  // ── Env-var check ─────────────────────────────────────────────────────────
  const missingRequired = REQUIRED_ENV.filter(k => !process.env[k])
  const presentOptional = OPTIONAL_ENV.filter(k => !!process.env[k])

  const healthy = dbStatus === 'ok' && missingRequired.length === 0

  const body = {
    status:  healthy ? 'ok' : 'degraded',
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
    db: {
      status:    dbStatus,
      latencyMs: dbLatencyMs,
      ...(dbError ? { error: dbError } : {}),
    },
    env: {
      required: {
        present: REQUIRED_ENV.filter(k => !!process.env[k]),
        missing: missingRequired,
      },
      optional: {
        present: presentOptional,
        missing: OPTIONAL_ENV.filter(k => !process.env[k]),
      },
    },
    uptimeMs: Date.now() - start,
  }

  return NextResponse.json(body, {
    status: healthy ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  })
}
