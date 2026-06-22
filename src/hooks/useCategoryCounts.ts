import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

export interface CategoryCounts {
  byCategory: Map<string, number>
  total: number
}

// Total entries per category (unfiltered), for the filter-chip counts. Separate
// from the filtered ledger query so the counts reflect everything, not the
// current view.
export function useCategoryCounts(): CategoryCounts {
  const result = useLiveQuery(async () => {
    const entries = await db.entries.toArray()
    const byCategory = new Map<string, number>()
    for (const e of entries) {
      byCategory.set(e.categoryId, (byCategory.get(e.categoryId) ?? 0) + 1)
    }
    return { byCategory, total: entries.length }
  }, [])
  return result ?? { byCategory: new Map(), total: 0 }
}
