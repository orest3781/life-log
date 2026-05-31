import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Entry } from '../types'

// Entries whose passive reminder date has arrived and haven't been cleared.
// This is the entire reminder mechanism — purely visual, surfaced at the top
// of the ledger. No push, no nagging.
export function useDueReminders(now: number): Entry[] | undefined {
  return useLiveQuery(async () => {
    const due = await db.entries.where('remindAt').belowOrEqual(now).toArray()
    return due
      .filter((e) => !e.reminderDoneAt)
      .sort((a, b) => (a.remindAt ?? 0) - (b.remindAt ?? 0))
  }, [now])
}
