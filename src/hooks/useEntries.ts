import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Entry } from '../types'

export type EntrySort = 'newest' | 'oldest'

export interface EntryFilter {
  search?: string
  categoryId?: string | null
  sort?: EntrySort
  /** Only entries at least this many days old (null = no age filter). */
  olderThanDays?: number | null
}

const DAY = 86_400_000

// The ledger: entries filtered by category, free-text, and age, ordered by
// occurredAt (createdAt tiebreak). Data is local and modest, so we filter in
// memory. Returns undefined until first load.
export function useEntries(filter: EntryFilter): Entry[] | undefined {
  const search = filter.search?.trim().toLowerCase() ?? ''
  const categoryId = filter.categoryId ?? null
  const sort = filter.sort ?? 'newest'
  const olderThanDays = filter.olderThanDays ?? null

  return useLiveQuery(async () => {
    let arr = await db.entries.toArray()

    if (olderThanDays !== null) {
      const cutoff = Date.now() - olderThanDays * DAY
      arr = arr.filter((e) => e.occurredAt <= cutoff)
    }

    arr.sort((a, b) =>
      sort === 'oldest'
        ? a.occurredAt - b.occurredAt || a.createdAt - b.createdAt
        : b.occurredAt - a.occurredAt || b.createdAt - a.createdAt,
    )

    if (categoryId) arr = arr.filter((e) => e.categoryId === categoryId)
    if (search) {
      arr = arr.filter(
        (e) =>
          e.title.toLowerCase().includes(search) ||
          (e.note?.toLowerCase().includes(search) ?? false),
      )
    }
    return arr
  }, [search, categoryId, sort, olderThanDays])
}
