/**
 * Server-side Postgres schema (Neon + Drizzle).
 *
 * Better Auth manages: user, session, account, verification, passkey, twoFactor
 * We own: waitlist, userProfiles, bankConnections, syncLog
 *
 * Financial transaction data stays in the browser (IndexedDB) — never here.
 */
import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  numeric,
  index,
} from 'drizzle-orm/pg-core'

// ═══════════════════════════════════════════════════════════════════
// BETTER AUTH CORE TABLES (required by the Drizzle adapter)
// https://www.better-auth.com/docs/adapters/drizzle
// ═══════════════════════════════════════════════════════════════════

export const user = pgTable('user', {
  id:               text('id').primaryKey(),
  name:             text('name').notNull(),
  email:            text('email').notNull().unique(),
  emailVerified:    boolean('email_verified').notNull().default(false),
  image:            text('image'),
  createdAt:        timestamp('created_at').notNull(),
  updatedAt:        timestamp('updated_at').notNull(),
  // Two-factor flag — set by the twoFactor plugin
  twoFactorEnabled: boolean('two_factor_enabled'),
})

export const session = pgTable('session', {
  id:           text('id').primaryKey(),
  expiresAt:    timestamp('expires_at').notNull(),
  token:        text('token').notNull().unique(),
  createdAt:    timestamp('created_at').notNull(),
  updatedAt:    timestamp('updated_at').notNull(),
  ipAddress:    text('ip_address'),
  userAgent:    text('user_agent'),
  userId:       text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id:                   text('id').primaryKey(),
  accountId:            text('account_id').notNull(),
  providerId:           text('provider_id').notNull(),
  userId:               text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken:          text('access_token'),
  refreshToken:         text('refresh_token'),
  idToken:              text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt:timestamp('refresh_token_expires_at'),
  scope:                text('scope'),
  password:             text('password'),
  createdAt:            timestamp('created_at').notNull(),
  updatedAt:            timestamp('updated_at').notNull(),
})

export const verification = pgTable('verification', {
  id:         text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value:      text('value').notNull(),
  expiresAt:  timestamp('expires_at').notNull(),
  createdAt:  timestamp('created_at'),
  updatedAt:  timestamp('updated_at'),
})

// ═══════════════════════════════════════════════════════════════════
// BETTER AUTH PLUGIN TABLES
// ═══════════════════════════════════════════════════════════════════

// Passkeys / WebAuthn (Touch ID, Face ID)
export const passkey = pgTable('passkey', {
  id:           text('id').primaryKey(),
  name:         text('name'),
  publicKey:    text('public_key').notNull(),
  userId:       text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  credentialID: text('credential_i_d').notNull(),
  counter:      integer('counter').notNull(),
  deviceType:   text('device_type').notNull(),   // 'platform' | 'cross-platform'
  backedUp:     boolean('backed_up').notNull(),
  transports:   text('transports'),
  createdAt:    timestamp('created_at'),
  aaguid:       text('aaguid'),
})

// Two-factor (TOTP / Google Authenticator)
export const twoFactor = pgTable('two_factor', {
  id:          text('id').primaryKey(),
  secret:      text('secret').notNull(),
  backupCodes: text('backup_codes').notNull(),
  userId:      text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }).unique(),
})

// ═══════════════════════════════════════════════════════════════════
// OUR OWN TABLES
// ═══════════════════════════════════════════════════════════════════

// Waitlist (pre-auth; no foreign key to user)
export const waitlist = pgTable('waitlist', {
  id:         text('id').primaryKey(),           // nanoid
  email:      text('email').notNull().unique(),
  name:       text('name'),
  company:    text('company'),
  signedUpAt: timestamp('signed_up_at').defaultNow().notNull(),
  approvedAt: timestamp('approved_at'),
  status:     text('status').notNull().default('pending'), // pending | approved | rejected
  notes:      text('notes'),
})

// Extended user profile — all the extra data we collect
// beyond what Better Auth stores in `user`
export const userProfiles = pgTable('user_profiles', {
  id:             text('id').primaryKey(),           // nanoid
  userId:         text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }).unique(),

  // Professional — core identity
  fullName:       text('full_name'),                 // legal name for billing / invoices
  jobRole:        text('job_role'),                  // 'CFO', 'Founder', 'Accountant', …
  organisation:   text('organisation'),              // company display name
  industry:       text('industry'),                  // 'Technology' | 'Finance' | 'Retail' | …
  companySize:    text('company_size'),              // '1-10' | '11-50' | '51-200' | '201-500' | '500+'
  websiteUrl:     text('website_url'),               // company website

  // Preferences
  language:       text('language').default('en'),    // 'en' | 'ka' | …
  currencyPref:   text('currency_pref').default('GEL'), // 'GEL' | 'USD' | …
  timezone:       text('timezone'),

  // Contact
  phone:          text('phone'),                     // E.164 format (used for SMS 2FA)
  personalEmail:  text('personal_email'),            // secondary contact email
  workEmail:      text('work_email'),                // may equal Better Auth email

  // Addresses
  address:        jsonb('address'),                  // { street, city, country, zip } — general
  billingAddress: jsonb('billing_address'),          // { name, street, city, country, zip } — invoices

  // Auth & onboarding
  preferredAuthMethod:   text('preferred_auth_method'),   // 'google' | 'microsoft' | 'magic-link' | 'passkey'
  onboardingCompletedAt: timestamp('onboarding_completed_at'),

  // Notification preferences
  // { email: true, sms: false, weeklyDigest: true, thresholdAlerts: true }
  notifPrefs:     jsonb('notif_prefs'),

  // Approval (waitlist gate)
  approvedAt:     timestamp('approved_at'),          // null = pending

  // Free-form metadata for UX personalization
  // e.g. { lastSeenVersion: '1.2', featureFlags: [...], welcomeDismissed: true }
  metadata:       jsonb('metadata'),

  createdAt:      timestamp('created_at').defaultNow().notNull(),
  updatedAt:      timestamp('updated_at').defaultNow().notNull(),
})

// Bank connections (Salt Edge)
export const bankConnections = pgTable('bank_connections', {
  id:                   text('id').primaryKey(),     // nanoid
  userId:               text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  saltEdgeCustomerId:   text('salt_edge_customer_id').notNull(),
  saltEdgeConnectionId: text('salt_edge_connection_id').unique(),
  providerName:         text('provider_name'),       // 'Bank of Georgia', 'TBC', …
  status:               text('status').notNull().default('pending'),
                        // pending | connected | expired | disconnected | error
  connectedAt:          timestamp('connected_at'),
  expiresAt:            timestamp('expires_at'),
  lastSyncedAt:         timestamp('last_synced_at'),
  createdAt:            timestamp('created_at').defaultNow().notNull(),
})

// ─── Bank accounts (synced from Salt Edge) ────────────────────────────────
// These mirror the accounts inside each bank connection and enable server-side
// balance queries and cross-account analytics without browser-only IndexedDB.
export const bankAccounts = pgTable('bank_accounts', {
  id:                  text('id').primaryKey(),       // nanoid
  userId:              text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  connectionId:        text('connection_id').notNull().references(() => bankConnections.id, { onDelete: 'cascade' }),
  saltEdgeAccountId:   text('salt_edge_account_id').notNull().unique(),

  name:                text('name').notNull(),        // display name from bank
  nature:              text('nature'),                // 'account' | 'card' | 'loan' | 'savings' | 'checking'
  currency:            text('currency').notNull().default('GEL'),
  balance:             numeric('balance').notNull().default('0'),
  availableBalance:    numeric('available_balance'),
  creditLimit:         numeric('credit_limit'),

  iban:                text('iban'),
  cardNumberLast4:     text('card_number_last4'),
  balanceUpdatedAt:    timestamp('balance_updated_at'),

  extra:               jsonb('extra'),                // raw extra object from Salt Edge

  createdAt:           timestamp('created_at').defaultNow().notNull(),
  updatedAt:           timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('ba_user_idx').on(t.userId),
  index('ba_conn_idx').on(t.connectionId),
])

// ─── Transactions (synced from Salt Edge) ─────────────────────────────────
// Server-side store enables live analytics, AI categorisation, and cross-device
// access without re-fetching from Salt Edge on every page load.
// For large transaction volumes, consider enabling the TimescaleDB extension on
// Neon and converting this table to a hypertable (chunk by `made_on`).
export const transactions = pgTable('transactions', {
  id:                       text('id').primaryKey(),  // nanoid
  userId:                   text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  bankAccountId:            text('bank_account_id').notNull().references(() => bankAccounts.id, { onDelete: 'cascade' }),
  saltEdgeTransactionId:    text('salt_edge_transaction_id').unique(),

  amount:                   numeric('amount').notNull(),
  currencyCode:             text('currency_code').notNull().default('GEL'),
  description:              text('description'),      // cleaned payee / narration
  rawDescription:           text('raw_description'),  // original from bank

  // Categories
  category:                 text('category'),         // raw category from Salt Edge
  aiCategory:               text('ai_category'),      // our AI-assigned category
  aiSubcategory:            text('ai_subcategory'),   // more specific bucket
  aiConfidence:             numeric('ai_confidence'), // 0–1

  madeOn:                   timestamp('made_on').notNull(),
  status:                   text('status').notNull().default('posted'), // posted | pending

  extra:                    jsonb('extra'),            // raw extra from Salt Edge

  createdAt:                timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('tx_user_idx').on(t.userId),
  index('tx_account_idx').on(t.bankAccountId),
  index('tx_made_on_idx').on(t.madeOn),             // range-query perf for analytics
  index('tx_category_idx').on(t.aiCategory),
])

// Sync log
export const syncLog = pgTable('sync_log', {
  id:                text('id').primaryKey(),        // nanoid
  connectionId:      text('connection_id').notNull().references(() => bankConnections.id, { onDelete: 'cascade' }),
  syncedAt:          timestamp('synced_at').defaultNow().notNull(),
  accountsCount:     integer('accounts_count').default(0),
  transactionsCount: integer('transactions_count').default(0),
  status:            text('status').notNull().default('ok'), // ok | error
  error:             text('error'),
})

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export type User              = typeof user.$inferSelect
export type NewUser           = typeof user.$inferInsert
export type Session           = typeof session.$inferSelect
export type Account           = typeof account.$inferSelect
export type Passkey           = typeof passkey.$inferSelect
export type TwoFactor         = typeof twoFactor.$inferSelect
export type Waitlist          = typeof waitlist.$inferSelect
export type NewWaitlist       = typeof waitlist.$inferInsert
export type UserProfile       = typeof userProfiles.$inferSelect
export type NewUserProfile    = typeof userProfiles.$inferInsert
export type BankConnection    = typeof bankConnections.$inferSelect
export type NewBankConnection = typeof bankConnections.$inferInsert
export type BankAccount       = typeof bankAccounts.$inferSelect
export type NewBankAccount    = typeof bankAccounts.$inferInsert
export type Transaction       = typeof transactions.$inferSelect
export type NewTransaction    = typeof transactions.$inferInsert
export type SyncLog           = typeof syncLog.$inferSelect
