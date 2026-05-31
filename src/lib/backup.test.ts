import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db/db'
import { exportAll, importAll } from './backup'
import type { Category, Entry, Photo } from '../types'

const category: Category = {
  id: 'cat-1',
  name: 'Car',
  emoji: '🚗',
  color: '#4f86c6',
  order: 0,
  usageCount: 3,
  lastUsedAt: 123,
  archived: false,
}

const entry: Entry = {
  id: 'entry-1',
  title: 'Replaced battery',
  categoryId: 'cat-1',
  occurredAt: 1_700_000_000_000,
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
}

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('backup round-trip', () => {
  it('exports then imports entries, categories, and photo blobs intact', async () => {
    await db.categories.add(category)
    await db.entries.add(entry)
    const photo: Photo = {
      id: 'photo-1',
      entryId: 'entry-1',
      blob: new Blob(['pixels'], { type: 'image/jpeg' }),
      width: 100,
      height: 80,
      createdAt: 1,
    }
    await db.photos.add(photo)

    const backup = await exportAll()

    // Wipe everything, as if restoring onto a fresh device.
    await db.entries.clear()
    await db.categories.clear()
    await db.photos.clear()
    expect(await db.entries.count()).toBe(0)

    const result = await importAll(backup)
    expect(result).toEqual({ categories: 1, entries: 1, photos: 1 })

    const restoredEntry = await db.entries.get('entry-1')
    expect(restoredEntry?.title).toBe('Replaced battery')

    const restoredPhotos = await db.photos.toArray()
    expect(restoredPhotos).toHaveLength(1)
    expect(restoredPhotos[0].width).toBe(100)
    expect(await restoredPhotos[0].blob.text()).toBe('pixels')
  })

  it('rejects a file that is not a LifeLog backup', async () => {
    const junk = new Blob(['not a zip'], { type: 'text/plain' })
    await expect(importAll(junk)).rejects.toThrow()
  })
})
