import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Category } from '../types'

// All categories (including archived); callers filter as needed via the
// helpers in lib/categories. Returns undefined until the first load resolves.
export function useCategories(): Category[] | undefined {
  return useLiveQuery(() => db.categories.toArray(), [])
}
