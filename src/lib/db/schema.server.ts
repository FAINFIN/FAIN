/**
 * Server-side Postgres schema (Neon + Drizzle).
 * Financial data stays in the browser (IndexedDB) — this only holds
 * identity, waitlist, and bank-connection metadata.
 */
import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
} from 'drizzle-orm/pg-core'

// ── Waitlist ──────────────────────────────────────────────────────────────
export const waitlist = pgTable('waitlist', {
  id:          text('id').primaryKey(),           // nanoid
  email:       text('email').notNull().unique(),
  name:        text('name'),
  company:     text('company'),
  signedUpAt:  timestamp('signed_up_at').defaultNow().notNull(),
  approvedAt:  timestamp('approved_at'),
  status:      text('status').notNull().default('pending'), // pending | approved | rejected
  notes:       text('notes'),
})

// ── Users (approved, can log in) ─────────────────────────────────────────
export const users = pgTable('users', {
  id:          text('id').primaryKey(),           // better-auth user id
  email:       text('email').notNull().unique(),
  name:        text('name'),
  approved:    boolean('approved').notNull().default(false),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
})

// ── Bank connections ──────────────────────────────────────────────────────
export const bankConnections = pgTable('bank_connections', {
  id:                     text('id').primaryKey(),          // nanoid
  userId:                 text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  saltEdgeCustomerId:     text('salt_edge_customer_id').notNull(),
  saltEdgeConnectionId:   text('salt_edge_connection_id').unique(),
  providerName:           text('provider_name'),            // 'Bank of Georgia', 'TBC', etc.
  status:                 text('status').notNull().default('pending'),
                          // pending | connected | expired | disconnected | error
  connectedAt:            timestamp('connected_at'),
  expiresAt:              timestamp('expires_at'),
  lastSyncedAt:           timestamp('last_synced_at'),
  createdAt:              timestamp('created_at').defaultNow().notNull(),
})

// ── Sync log ──────────────────────────────────────────────────────────────
export const syncLog = pgTable('sync_log', {
  id:               text('id').primaryKey(),                // nanoid
  connectionId:     text('connection_id').notNull().references(() => bankConnections.id, { onDelete: 'cascade' }),
  syncedAt:         timestamp('synced_at').defaultNow().notNull(),
  accountsCount:    integer('accounts_count').default(0),
  transactionsCount:integer('transactions_count').default(0),
  status:           text('status').notNull().default('ok'), // ok | error
  error:            text('error'),
})

// ── Types ─────────────────────────────────────────────────────────────────
export type Waitlist       = typeof waitlist.$inferSelect
export type NewWaitlist    = typeof waitlist.$inferInsert
export type User           = typeof users.$inferSelect
export type NewUser        = typeof users.$inferInsert
export type BankConnection = typeof bankConnections.$inferSelect
export type NewBankConnection = typeof bankConnections.$inferInsert
export type SyncLog        = typeof syncLog.$inferSelect
