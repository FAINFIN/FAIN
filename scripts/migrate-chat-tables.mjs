/**
 * One-time migration: create conversations + chat_messages tables.
 * Run with: node scripts/migrate-chat-tables.mjs
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __dir = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

// Load DATABASE_URL from .env.local
const envPath = join(__dir, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf8')
const match = envContent.match(/^DATABASE_URL=(.+)$/m)
if (!match) { console.error('DATABASE_URL not found in .env.local'); process.exit(1) }

const DATABASE_URL = match[1].trim()

// Use the pnpm-installed neon client
const neonPath = join(__dir, '..', 'node_modules/.pnpm/@neondatabase+serverless@1.1.0/node_modules/@neondatabase/serverless/index.js')
const { neon } = require(neonPath)
const sql = neon(DATABASE_URL)

const migration = `
CREATE TABLE IF NOT EXISTS "conversations" (
  "id"         TEXT PRIMARY KEY,
  "user_id"    TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "title"      TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
)`

const migration2 = `
CREATE INDEX IF NOT EXISTS "conversations_user_id_updated_at_idx"
  ON "conversations" ("user_id", "updated_at" DESC)`

const migration3 = `
CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id"              TEXT PRIMARY KEY,
  "conversation_id" TEXT NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "user_id"         TEXT NOT NULL,
  "role"            TEXT NOT NULL,
  "content_enc"     TEXT NOT NULL,
  "iv"              TEXT NOT NULL,
  "created_at"      TIMESTAMP DEFAULT NOW() NOT NULL
)`

const migration4 = `
CREATE INDEX IF NOT EXISTS "chat_messages_conversation_id_idx"
  ON "chat_messages" ("conversation_id", "created_at" ASC)`

try {
  await sql.query(migration);    console.log('✓ conversations table')
  await sql.query(migration2);   console.log('✓ conversations index')
  await sql.query(migration3);   console.log('✓ chat_messages table')
  await sql.query(migration4);   console.log('✓ chat_messages index')
  console.log('\n✅ Migration complete')
} catch (e) {
  console.error('✗ Migration failed:', e.message)
  process.exit(1)
}
