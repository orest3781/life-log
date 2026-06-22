import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Entry } from '../types'

const DAY = 86_400_000

// Reminders still in the future but within `withinDays` — the "coming up"
// cousins of the due list. Surfaced in the overview so nothing sneaks up on you.
// Strictly future (remindAt > now); due-now items belong to useDueReminders.
export function useUpcomingReminders(
  now: number,
  withinDays = 7,
): Entry[] | undefined {
  return useLiveQuery(async () => {
    const horizon = now + withinDays * DAY
    const rows = await db.entries
      .where('remindAt')
      .between(now, horizon, false, true)
      .toArray()
    return rows
      .filter((e) => !e.reminderDoneAt)
      .sort((a, b) => (a.remindAt ?? 0) - (b.remindAt ?? 0))
  }, [now, withinDays])
}
