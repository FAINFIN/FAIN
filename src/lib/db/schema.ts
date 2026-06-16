import Dexie, { type EntityTable } from 'dexie'
import type {
  BankConnection,
  Account,
  Transaction,
  Scenario,
  ChatMessage,
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
  user!:        EntityTable<FainUser,       'id'>
  connections!: EntityTable<BankConnection, 'id'>
  accounts!:    EntityTable<Account,        'id'>
  transactions!:EntityTable<Transaction,    'id'>
  syncMeta!:    EntityTable<SyncMeta,       'id'>
  scenarios!:   EntityTable<Scenario,       'id'>
  messages!:    EntityTable<ChatMessage,    'id'>

  constructor() {
    super('fain')

    this.version(1).stores({
      user:         'id',
      connections:  'id, provider, expiresAt',
      accounts:     'id, connectionId, provider, currency',
      transactions: 'id, accountId, date, type, category, [accountId+date]',
      syncMeta:     'id',
      scenarios:    'id, createdAt',
      messages:     'id, role, createdAt',
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

export type { FainDatabase, SyncMeta }
