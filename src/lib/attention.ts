import { nextOccurrence } from './reminders'
import type { Category, Entry } from '../types'

export interface AttentionCounts {
  /** Non-archived categories whose latest entry is past their cadence. */
  overdue: number
  /** Reminders whose check-back date has arrived and aren't cleared. */
  due: number
}

// Pure "what needs attention" tally — shared by the in-app Overview math and
// the service worker's background nudge so they always agree. No DOM/IndexedDB
// here, so it runs equally in the page and the worker, and is unit-testable.
export function attentionCounts(
  categories: Category[],
  entries: Entry[],
  now: number,
): AttentionCounts {
  const latest = new Map<string, number>()
  for (const e of entries) {
    const cur = latest.get(e.categoryId)
    if (cur === undefined || e.occurredAt > cur) latest.set(e.categoryId, e.occurredAt)
  }

  let overdue = 0
  for (const c of categories) {
    if (c.archived) continue
    const last = latest.get(c.id)
    if (
      c.expectedInterval !== undefined &&
      last !== undefined &&
      nextOccurrence(last, c.expectedInterval) <= now
    ) {
      overdue++
    }
  }

  const due = entries.filter(
    (e) => e.remindAt !== undefined && e.remindAt <= now && !e.reminderDoneAt,
  ).length

  return { overdue, due }
}

// One calm summary line, or null when nothing needs attention (so the caller
// knows to stay silent).
export function nudgeBody({ overdue, due }: AttentionCounts): string | null {
  if (overdue + due === 0) return null
  const parts: string[] = []
  if (overdue > 0) parts.push(`${overdue} overdue`)
  if (due > 0) parts.push(`${due} due`)
  return `${parts.join(' · ')} — tap to take a look.`
}
