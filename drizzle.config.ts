import type { Config } from 'drizzle-kit'
import { loadEnvConfig } from '@next/env'

// Load .env.local so drizzle-kit picks up DATABASE_URL without needing Next.js
loadEnvConfig(process.cwd())

export default {
  schema:    './src/lib/db/schema.server.ts',
  out:       './drizzle',
  dialect:   'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config
