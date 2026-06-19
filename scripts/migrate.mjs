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
  console.error('❌  DATABASE_URL is not set — skipping migration')
  process.exit(0) // soft-exit so build continues without DB
}

console.log('🗄️  Running Fain DB migrations…')

const sql = neon(DATABASE_URL)
const db  = drizzle(sql)

try {
  await migrate(db, { migrationsFolder })
  console.log('✅  Migrations applied successfully')
} catch (err) {
  // If tables already exist (first-run re-deploy) drizzle treats them as applied
  if (err.message?.includes('already exists')) {
    console.log('ℹ️   Tables already exist — nothing to do')
  } else {
    console.error('❌  Migration failed:', err.message)
    process.exit(1)
  }
}
