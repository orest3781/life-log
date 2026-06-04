import { db } from './db'
import type { Category, Entry, Photo, RepeatRule, Template } from '../types'
import { makeThumbnail, processImage } from '../lib/image'
import { nextOccurrence } from '../lib/reminders'

// ---- Entries -------------------------------------------------------------

export interface EntryInput {
  title: string
  note?: string
  categoryId: string
  occurredAt: number
  remindAt?: number
  repeat?: RepeatRule | null
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
    repeat: input.remindAt ? (input.repeat ?? undefined) : undefined,
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
  if (patch.repeat !== undefined) changes.repeat = patch.repeat ?? undefined
  if (patch.reminderDoneAt !== undefined)
    changes.reminderDoneAt = patch.reminderDoneAt ?? undefined
  await db.entries.update(id, changes)
}

// Clear a due reminder. If the entry has a repeat rule, advance it to the next
// occurrence (re-arming it) instead of marking it permanently done.
export async function completeReminder(entry: Entry): Promise<void> {
  const now = Date.now()
  if (entry.repeat && entry.remindAt) {
    const base = Math.max(entry.remindAt, now) // never schedule into the past
    await db.entries.update(entry.id, {
      remindAt: nextOccurrence(base, entry.repeat),
      reminderDoneAt: undefined,
      updatedAt: now,
    })
  } else {
    await db.entries.update(entry.id, { reminderDoneAt: now, updatedAt: now })
  }
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

// Re-insert an entry and its photos exactly as they were — backs the "Undo"
// on delete. Same ids, so it's a faithful restore.
export async function restoreEntry(
  entry: Entry,
  photos: Photo[],
): Promise<void> {
  await db.transaction('rw', db.entries, db.photos, async () => {
    await db.entries.put(entry)
    if (photos.length) await db.photos.bulkPut(photos)
  })
}

// "Log it again": create a fresh occurrence of an existing entry, dated now.
// Reminders/repeat are not carried — this marks a new event, not a schedule.
export async function logAgain(entry: Entry): Promise<string> {
  return addEntry({
    title: entry.title,
    note: entry.note,
    categoryId: entry.categoryId,
    occurredAt: Date.now(),
  })
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

// Set (or clear, with null) a category's expected cadence for overdue detection.
export async function setCategoryInterval(
  id: string,
  rule: RepeatRule | null,
): Promise<void> {
  await db.categories.update(id, { expectedInterval: rule ?? undefined })
}

// ---- Templates (quick-log presets) ---------------------------------------

export async function addTemplate(input: {
  title: string
  categoryId: string
}): Promise<string> {
  const id = crypto.randomUUID()
  const maxOrder = await db.templates.orderBy('order').last()
  await db.templates.add({
    id,
    title: input.title.trim(),
    categoryId: input.categoryId,
    order: (maxOrder?.order ?? -1) + 1,
    createdAt: Date.now(),
  })
  return id
}

export function deleteTemplate(id: string): Promise<void> {
  return db.templates.delete(id)
}

// One-tap log of a title under a category, dated now (templates, summary re-log).
export function quickLog(title: string, categoryId: string): Promise<string> {
  return addEntry({ title, categoryId, occurredAt: Date.now() })
}

// One-tap log from a saved template, dated now.
export function logFromTemplate(template: Template): Promise<string> {
  return quickLog(template.title, template.categoryId)
}

// ---- Photos --------------------------------------------------------------

export async function addPhotoFromFile(
  entryId: string,
  file: Blob,
): Promise<string> {
  const { blob, width, height } = await processImage(file)
  const thumb = await makeThumbnail(blob)
  const id = crypto.randomUUID()
  const photo: Photo = {
    id,
    entryId,
    blob,
    thumb,
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
