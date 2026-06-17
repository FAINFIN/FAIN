/**
 * Neon serverless Postgres client + Drizzle instance.
 * Import `db` in API routes and server components only — never in client code.
 */
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema.server'

function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  const sql = neon(url)
  return drizzle(sql, { schema })
}

// Singleton — reuse across hot-reloads in dev
const globalForDb = globalThis as unknown as { _fainDb?: ReturnType<typeof getDb> }
export const db = globalForDb._fainDb ?? getDb()
if (process.env.NODE_ENV !== 'production') globalForDb._fainDb = db
