/**
 * Next.js Instrumentation hook — runs once per server cold start.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * We use this to ensure our Drizzle schema is in sync with the Neon database
 * without needing a separate migration runner. All statements are idempotent
 * (CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS).
 */

export async function register() {
  // Only run in Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  try {
    const { neon }  = await import('@neondatabase/serverless')
    const sql       = neon(process.env.DATABASE_URL!)

    // ── conversations ──────────────────────────────────────────────────────────
    await sql.query(`
      CREATE TABLE IF NOT EXISTS "conversations" (
        "id"         TEXT PRIMARY KEY,
        "user_id"    TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "title"      TEXT NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `)

    await sql.query(`
      CREATE INDEX IF NOT EXISTS "conversations_user_updated_idx"
        ON "conversations" ("user_id", "updated_at" DESC)
    `)

    // ── chat_messages ──────────────────────────────────────────────────────────
    await sql.query(`
      CREATE TABLE IF NOT EXISTS "chat_messages" (
        "id"              TEXT PRIMARY KEY,
        "conversation_id" TEXT NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
        "user_id"         TEXT NOT NULL,
        "role"            TEXT NOT NULL,
        "content_enc"     TEXT NOT NULL,
        "iv"              TEXT NOT NULL,
        "created_at"      TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `)

    await sql.query(`
      CREATE INDEX IF NOT EXISTS "chat_messages_conv_created_idx"
        ON "chat_messages" ("conversation_id", "created_at" ASC)
    `)

    console.log('[instrumentation] ✓ DB schema verified (conversations + chat_messages)')
  } catch (e) {
    // Log but don't crash the server — existing functionality still works
    console.error('[instrumentation] schema migration failed:', e)
  }
}
