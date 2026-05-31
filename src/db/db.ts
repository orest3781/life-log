import Dexie, { type Table } from 'dexie'
import type { Category, Entry, Photo } from '../types'

export class LifeLogDB extends Dexie {
  categories!: Table<Category, string>
  entries!: Table<Entry, string>
  photos!: Table<Photo, string>

  constructor() {
    super('lifelog')
    this.version(1).stores({
      // Only indexed fields are listed; other fields are stored but unindexed.
      categories: 'id, order, archived',
      entries: 'id, occurredAt, categoryId, remindAt',
      photos: 'id, entryId',
    })
  }
}

export const db = new LifeLogDB()

// Starter category set, seeded once on first run.
export const STARTER_CATEGORIES: Array<
  Pick<Category, 'name' | 'emoji' | 'color'>
> = [
  { name: 'Car', emoji: '🚗', color: '#4f86c6' },
  { name: 'Garden', emoji: '🌱', color: '#5b9d5b' },
  { name: 'Home', emoji: '🏠', color: '#c98b3a' },
  { name: 'Health', emoji: '❤️', color: '#c85c7e' },
  { name: 'Pets', emoji: '🐾', color: '#8a6fc0' },
]

// Populate the starter categories only when the table is empty. A module-level
// promise makes this run exactly once per page load, even when React's
// StrictMode invokes the seeding effect twice — otherwise both calls would see
// an empty table and double-seed.
let seedPromise: Promise<void> | null = null

export function seedIfEmpty(): Promise<void> {
  if (!seedPromise) seedPromise = doSeed()
  return seedPromise
}

async function doSeed(): Promise<void> {
  const count = await db.categories.count()
  if (count > 0) return
  await db.categories.bulkAdd(
    STARTER_CATEGORIES.map((c, i) => ({
      id: crypto.randomUUID(),
      name: c.name,
      emoji: c.emoji,
      color: c.color,
      order: i,
      usageCount: 0,
      lastUsedAt: null,
      archived: false,
    })),
  )
}
