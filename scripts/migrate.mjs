/**
 * Database migration script — runs during Vercel build (pnpm build:ci).
 * Uses drizzle-orm/neon-http migrator, which is fully non-interactive.
 *
 * Usage:
 *   node scripts/migrate.mjs
 *   DATABASE_URL=<url> node scripts/migrate.mjs
 */
import { drizzle } from 'drizzle-orm/neon-http'
import { migrate } from 'drizzle-orm/neon-http/migrator'
import { neon } from '@neondatabase/serverless'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsFolder = join(__dirname, '..', 'drizzle')

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.log('ℹ️   DATABASE_URL not set — skipping migration (local dev without DB)')
  process.exit(0)
}

console.log('🗄️  Running Fain DB migrations…')

const sql = neon(DATABASE_URL)
const db  = drizzle(sql)

try {
  await migrate(db, { migrationsFolder })
  console.log('✅  Migrations applied successfully')
} catch (err) {
  const msg = err?.message ?? String(err)
  // Tables already exist from a previous deploy or better-auth — not an error
  const isAlreadyExists =
    msg.includes('already exists') ||
    msg.includes('42P07') ||         // PostgreSQL relation already exists
    msg.includes('42P16')            // invalid_table_definition (duplicate constraint)

  if (isAlreadyExists) {
    console.log('ℹ️   Some tables already exist — migration skipped (idempotent)')
  } else {
    console.error('❌  Migration failed:', msg)
    process.exit(1)
  }
}
