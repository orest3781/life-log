// Domain types for LifeLog. All timestamps are epoch milliseconds (number).

export interface Category {
  id: string
  name: string
  emoji: string
  color: string // hex, used for the category chip
  order: number // manual sort position (lower = earlier)
  usageCount: number // bumped each time an entry is logged with it
  lastUsedAt: number | null // ms; for recency in the picker
  archived: boolean
}

// An optional recurrence for a reminder, e.g. { unit: 'month', count: 6 }.
export interface RepeatRule {
  unit: 'week' | 'month' | 'year'
  count: number
}

export interface Entry {
  id: string
  title: string
  note?: string
  categoryId: string
  occurredAt: number // ms — when the thing happened (default: now, backdatable)
  createdAt: number // ms — when the row was written
  updatedAt: number // ms
  remindAt?: number // ms — optional passive "check back" date
  reminderDoneAt?: number // ms — set when the user clears the reminder
  repeat?: RepeatRule // when set, marking the reminder done schedules the next
}

export interface Photo {
  id: string
  entryId: string
  blob: Blob
  /** Small (~256px) thumbnail for list rows; absent on photos saved pre-v2. */
  thumb?: Blob
  width: number
  height: number
  createdAt: number
}

// A photo paired with an object URL for rendering. The URL must be revoked
// by the consumer when no longer needed.
export interface PhotoWithUrl extends Photo {
  url: string
}
