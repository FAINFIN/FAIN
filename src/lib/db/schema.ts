import Dexie, { type EntityTable } from 'dexie'
import type {
  BankConnection,
  Account,
  Transaction,
  Scenario,
  ChatMessage,
  Conversation,
  FainUser,
} from '@/types'

// ─── Sync metadata ────────────────────────────────────────
interface SyncMeta {
  id: string          // accountId
  lastSyncedAt: Date
  transactionCount: number
}

// ─── Database class ───────────────────────────────────────
class FainDatabase extends Dexie {
  user!:         EntityTable<FainUser,       'id'>
  connections!:  EntityTable<BankConnection, 'id'>
  accounts!:     EntityTable<Account,        'id'>
  transactions!: EntityTable<Transaction,    'id'>
  syncMeta!:     EntityTable<SyncMeta,       'id'>
  scenarios!:    EntityTable<Scenario,       'id'>
  messages!:     EntityTable<ChatMessage,    'id'>
  conversations!:EntityTable<Conversation,   'id'>

  constructor() {
    super('fain')

    // v1 — original schema (messages without conversationId)
    this.version(1).stores({
      user:         'id',
      connections:  'id, provider, expiresAt',
      accounts:     'id, connectionId, provider, currency',
      transactions: 'id, accountId, date, type, category, [accountId+date]',
      syncMeta:     'id',
      scenarios:    'id, createdAt',
      messages:     'id, role, createdAt',
    })

    // v2 — add conversations table + conversationId index on messages
    this.version(2).stores({
      user:          'id',
      connections:   'id, provider, expiresAt',
      accounts:      'id, connectionId, provider, currency',
      transactions:  'id, accountId, date, type, category, [accountId+date]',
      syncMeta:      'id',
      scenarios:     'id, createdAt',
      messages:      'id, role, createdAt, conversationId, [conversationId+createdAt]',
      conversations: 'id, createdAt, updatedAt',
    })
  }
}

// ─── Singleton ────────────────────────────────────────────
// Dexie must only be instantiated in the browser
let _db: FainDatabase | null = null

export function getDb(): FainDatabase {
  if (typeof window === 'undefined') {
    throw new Error('FainDatabase can only be used in the browser')
  }
  if (!_db) _db = new FainDatabase()
  return _db
}

// ─── User data wipe ───────────────────────────────────────
// Called on sign-out and whenever a different account is detected.
// Clears every user-specific table so no data leaks between accounts.
export async function clearUserData(): Promise<void> {
  const db = getDb()
  await Promise.all([
    db.user.clear(),
    db.connections.clear(),
    db.accounts.clear(),
    db.transactions.clear(),
    db.syncMeta.clear(),
    db.scenarios.clear(),
    db.messages.clear(),
    db.conversations.clear(),
  ])
}

export type { FainDatabase, SyncMeta }
