import { describe, expect, it } from 'vitest'
import { addDays, subDays, subMonths, subWeeks, subYears } from 'date-fns'
import { formatAbsolute, formatElapsed, fromDateInputValue, toDateInputValue } from './elapsed'

const NOW = new Date(2026, 4, 31, 12, 0, 0).getTime() // 2026-05-31

describe('formatElapsed', () => {
  const cases: Array<[string, number, string]> = [
    ['same day', NOW, 'today'],
    ['yesterday', subDays(NOW, 1).getTime(), 'yesterday'],
    ['3 days', subDays(NOW, 3).getTime(), '3 days ago'],
    ['1 week', subWeeks(NOW, 1).getTime(), '1 week ago'],
    ['3 weeks', subWeeks(NOW, 3).getTime(), '3 weeks ago'],
    ['6 weeks (weeks run to 6, per pitch)', subDays(NOW, 42).getTime(), '6 weeks ago'],
    ['~50 days crosses into months', subDays(NOW, 50).getTime(), '1 month ago'],
    ['2 months', subMonths(NOW, 2).getTime(), '2 months ago'],
    ['14 months (stays months, per pitch)', subMonths(NOW, 14).getTime(), '14 months ago'],
    ['2 years', subYears(NOW, 2).getTime(), '2 years ago'],
  ]

  it.each(cases)('%s → %s', (_label, occurredAt, expected) => {
    expect(formatElapsed(occurredAt, NOW)).toBe(expected)
  })

  it('handles future dates gently', () => {
    expect(formatElapsed(addDays(NOW, 1).getTime(), NOW)).toBe('tomorrow')
    expect(formatElapsed(addDays(NOW, 3).getTime(), NOW)).toBe('in 3 days')
  })
})

describe('formatAbsolute', () => {
  it('omits the year within the current year', () => {
    expect(formatAbsolute(new Date(2026, 4, 10).getTime(), NOW)).toBe('May 10')
  })
  it('shows month + year for other years', () => {
    expect(formatAbsolute(new Date(2025, 2, 3).getTime(), NOW)).toBe('Mar 2025')
  })
})

describe('date input round-trip', () => {
  it('parses its own formatted value to the same calendar day', () => {
    const ms = new Date(2025, 3, 19, 12).getTime()
    expect(toDateInputValue(fromDateInputValue(toDateInputValue(ms)))).toBe(
      '2025-04-19',
    )
  })
})
