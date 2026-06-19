import { getDb } from '@/lib/db/schema'
import { buildAiContext } from '@/lib/db/queries'
import { last12MonthsRange } from '@/lib/utils/dates'

export async function getAiContext(accountIds?: string[]): Promise<string> {
  const db  = getDb()
  const ids = accountIds ?? (await db.accounts.toArray()).map(a => a.id)
  if (!ids.length) return 'No accounts connected.'
  const range = last12MonthsRange()
  return buildAiContext(ids, range.from, range.to)
}
