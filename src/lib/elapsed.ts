import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  format,
  isSameYear,
} from 'date-fns'

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? '' : 's'}`
}

/**
 * The headline of every entry: how long ago it happened, in human terms.
 *
 * Boundaries are tuned to the product's voice:
 *   today / yesterday / N days / N weeks / N months / N years ago.
 * Months run all the way to 23 before flipping to years, so a battery is
 * "14 months ago" (as in the pitch), never a vaguer "1 year ago".
 */
export function formatElapsed(occurredAt: number, now: number = Date.now()): string {
  if (occurredAt > now) return formatFuture(occurredAt, now)

  const days = differenceInCalendarDays(now, occurredAt)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${plural(days, 'day')} ago`
  if (days < 45) return `${plural(Math.round(days / 7), 'week')} ago`

  const months = Math.max(1, differenceInCalendarMonths(now, occurredAt))
  if (months < 24) return `${plural(months, 'month')} ago`

  return `${plural(Math.floor(months / 12), 'year')} ago`
}

// Reminders can sit in the future; render those gently for the DUE strip's
// not-yet-due cousins and any backdated-forward edge cases.
function formatFuture(when: number, now: number): string {
  const days = differenceInCalendarDays(when, now)
  if (days <= 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days < 7) return `in ${plural(days, 'day')}`
  if (days < 45) return `in ${plural(Math.round(days / 7), 'week')}`
  const months = Math.max(1, differenceInCalendarMonths(when, now))
  if (months < 24) return `in ${plural(months, 'month')}`
  return `in ${plural(Math.floor(months / 12), 'year')}`
}

/**
 * The quiet secondary label: an absolute date. Within this year we show
 * "May 10"; older entries show "Mar 2025" so the year is never ambiguous.
 */
export function formatAbsolute(occurredAt: number, now: number = Date.now()): string {
  return isSameYear(occurredAt, now)
    ? format(occurredAt, 'MMM d')
    : format(occurredAt, 'MMM yyyy')
}

// Value for <input type="date">, in the input's required yyyy-MM-dd format,
// in the user's local time zone.
export function toDateInputValue(ms: number): string {
  return format(ms, 'yyyy-MM-dd')
}

// Parse a yyyy-MM-dd input back to ms, anchored at local noon so the calendar
// day can't drift across time zones.
export function fromDateInputValue(value: string): number {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0, 0).getTime()
}
