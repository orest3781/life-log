import { addMonths, addWeeks, addYears } from 'date-fns'
import type { RepeatRule } from '../types'

// The next reminder date after `from`, advanced by a repeat rule.
export function nextOccurrence(from: number, rule: RepeatRule): number {
  switch (rule.unit) {
    case 'week':
      return addWeeks(from, rule.count).getTime()
    case 'month':
      return addMonths(from, rule.count).getTime()
    case 'year':
      return addYears(from, rule.count).getTime()
  }
}

// Human label for a repeat rule, e.g. "every 6 months", "every week".
export function describeRepeat(rule: RepeatRule): string {
  return rule.count === 1
    ? `every ${rule.unit}`
    : `every ${rule.count} ${rule.unit}s`
}

export function sameRule(a: RepeatRule | null, b: RepeatRule | null): boolean {
  if (a === null || b === null) return a === b
  return a.unit === b.unit && a.count === b.count
}

export const REPEAT_PRESETS: Array<{ label: string; rule: RepeatRule | null }> = [
  { label: 'One-time', rule: null },
  { label: 'Weekly', rule: { unit: 'week', count: 1 } },
  { label: 'Monthly', rule: { unit: 'month', count: 1 } },
  { label: 'Every 3 mo', rule: { unit: 'month', count: 3 } },
  { label: 'Every 6 mo', rule: { unit: 'month', count: 6 } },
  { label: 'Yearly', rule: { unit: 'year', count: 1 } },
]
