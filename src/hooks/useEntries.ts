import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Entry } from '../types'

export interface EntryFilter {
  search?: string
  categoryId?: string | null
}

// The ledger: entries newest-first, optionally narrowed by category and/or a
// free-text search across title and note. Data is local and modest, so we
// filter in memory for simplicity. Returns undefined until first load.
export function useEntries(filter: EntryFilter): Entry[] | undefined {
  const search = filter.search?.trim().toLowerCase() ?? ''
  const categoryId = filter.categoryId ?? null
  return useLiveQuery(async () => {
    let arr = await db.entries.toArray()
    // Newest first, breaking same-day ties by when the entry was written so
    // order is stable and intuitive (latest-logged on top within a day).
    arr.sort((a, b) => b.occurredAt - a.occurredAt || b.createdAt - a.createdAt)
    if (categoryId) arr = arr.filter((e) => e.categoryId === categoryId)
    if (search) {
      arr = arr.filter(
        (e) =>
          e.title.toLowerCase().includes(search) ||
          (e.note?.toLowerCase().includes(search) ?? false),
      )
    }
    return arr
  }, [search, categoryId])
}
