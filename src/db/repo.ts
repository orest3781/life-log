import { db } from './db'
import type { Category, Entry, Photo } from '../types'
import { processImage } from '../lib/image'

// ---- Entries -------------------------------------------------------------

export interface EntryInput {
  title: string
  note?: string
  categoryId: string
  occurredAt: number
  remindAt?: number
}

export async function addEntry(input: EntryInput): Promise<string> {
  const now = Date.now()
  const id = crypto.randomUUID()
  const entry: Entry = {
    id,
    title: input.title.trim(),
    note: input.note?.trim() || undefined,
    categoryId: input.categoryId,
    occurredAt: input.occurredAt,
    createdAt: now,
    updatedAt: now,
    remindAt: input.remindAt,
  }
  await db.transaction('rw', db.entries, db.categories, async () => {
    await db.entries.add(entry)
    await bumpCategoryUsage(input.categoryId, now)
  })
  return id
}

export async function updateEntry(
  id: string,
  patch: Partial<EntryInput> & { reminderDoneAt?: number | null },
): Promise<void> {
  const changes: Partial<Entry> = { updatedAt: Date.now() }
  if (patch.title !== undefined) changes.title = patch.title.trim()
  if (patch.note !== undefined) changes.note = patch.note.trim() || undefined
  if (patch.categoryId !== undefined) changes.categoryId = patch.categoryId
  if (patch.occurredAt !== undefined) changes.occurredAt = patch.occurredAt
  if (patch.remindAt !== undefined) changes.remindAt = patch.remindAt
  if (patch.reminderDoneAt !== undefined)
    changes.reminderDoneAt = patch.reminderDoneAt ?? undefined
  await db.entries.update(id, changes)
}

export async function deleteEntry(id: string): Promise<void> {
  await db.transaction('rw', db.entries, db.photos, async () => {
    await db.photos.where('entryId').equals(id).delete()
    await db.entries.delete(id)
  })
}

export function getEntry(id: string): Promise<Entry | undefined> {
  return db.entries.get(id)
}

// Mark a reminder as handled (clears it from the DUE strip) or restore it.
export function setReminderDone(id: string, done: boolean): Promise<void> {
  return updateEntry(id, { reminderDoneAt: done ? Date.now() : null })
}

// ---- Categories ----------------------------------------------------------

export async function bumpCategoryUsage(
  categoryId: string,
  at: number,
): Promise<void> {
  const cat = await db.categories.get(categoryId)
  if (!cat) return
  await db.categories.update(categoryId, {
    usageCount: cat.usageCount + 1,
    lastUsedAt: at,
  })
}

export async function addCategory(
  input: Pick<Category, 'name' | 'emoji' | 'color'>,
): Promise<string> {
  const id = crypto.randomUUID()
  const maxOrder = await db.categories.orderBy('order').last()
  await db.categories.add({
    id,
    name: input.name.trim(),
    emoji: input.emoji,
    color: input.color,
    order: (maxOrder?.order ?? -1) + 1,
    usageCount: 0,
    lastUsedAt: null,
    archived: false,
  })
  return id
}

export function updateCategory(
  id: string,
  patch: Partial<Pick<Category, 'name' | 'emoji' | 'color' | 'archived'>>,
): Promise<number> {
  const changes = { ...patch }
  if (changes.name !== undefined) changes.name = changes.name.trim()
  return db.categories.update(id, changes)
}

// Persist a new manual ordering given an array of category ids in order.
export async function reorderCategories(orderedIds: string[]): Promise<void> {
  await db.transaction('rw', db.categories, async () => {
    await Promise.all(
      orderedIds.map((id, index) => db.categories.update(id, { order: index })),
    )
  })
}

// How many entries reference a category — used to decide delete vs archive.
export function countEntriesForCategory(categoryId: string): Promise<number> {
  return db.entries.where('categoryId').equals(categoryId).count()
}

// Hard-delete is only allowed when no entries reference the category; callers
// should archive instead when it is in use.
export async function deleteCategory(id: string): Promise<boolean> {
  const inUse = await countEntriesForCategory(id)
  if (inUse > 0) return false
  await db.categories.delete(id)
  return true
}

// ---- Photos --------------------------------------------------------------

export async function addPhotoFromFile(
  entryId: string,
  file: Blob,
): Promise<string> {
  const { blob, width, height } = await processImage(file)
  const id = crypto.randomUUID()
  const photo: Photo = {
    id,
    entryId,
    blob,
    width,
    height,
    createdAt: Date.now(),
  }
  await db.photos.add(photo)
  return id
}

export function removePhoto(photoId: string): Promise<void> {
  return db.photos.delete(photoId)
}

export function getPhotos(entryId: string): Promise<Photo[]> {
  return db.photos.where('entryId').equals(entryId).toArray()
}
