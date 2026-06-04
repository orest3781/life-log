import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { nextOccurrence } from '../lib/reminders'
import type { Entry } from '../types'

export interface CategoryStatus {
  lastOccurredAt: number | null
  lastTitle: string | null
  overdue: boolean
}

// Per-category status: when the category was last logged, its latest title, and
// whether it's overdue (latest entry older than the category's expected
// cadence). Shared by the "Last done" summary and the header overdue badge.
export function useCategoryStatus(now: number): Map<string, CategoryStatus> {
  const map = useLiveQuery(async () => {
    const [cats, entries] = await Promise.all([
      db.categories.toArray(),
      db.entries.orderBy('occurredAt').reverse().toArray(),
    ])
    const latest = new Map<string, Entry>()
    for (const e of entries) {
      if (!latest.has(e.categoryId)) latest.set(e.categoryId, e)
    }
    const result = new Map<string, CategoryStatus>()
    for (const c of cats) {
      const last = latest.get(c.id)
      const lastOccurredAt = last?.occurredAt ?? null
      const overdue =
        c.expectedInterval !== undefined &&
        lastOccurredAt !== null &&
        nextOccurrence(lastOccurredAt, c.expectedInterval) <= now
      result.set(c.id, {
        lastOccurredAt,
        lastTitle: last?.title ?? null,
        overdue,
      })
    }
    return result
  }, [now])

  return map ?? new Map()
}
