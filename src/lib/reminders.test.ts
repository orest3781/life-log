import { describe, expect, it } from 'vitest'
import { describeRepeat, nextOccurrence, sameRule } from './reminders'

const base = new Date(2026, 0, 15, 12).getTime() // 2026-01-15

describe('nextOccurrence', () => {
  it('advances by weeks, months, and years', () => {
    expect(nextOccurrence(base, { unit: 'week', count: 2 })).toBe(
      new Date(2026, 0, 29, 12).getTime(),
    )
    expect(nextOccurrence(base, { unit: 'month', count: 6 })).toBe(
      new Date(2026, 6, 15, 12).getTime(),
    )
    expect(nextOccurrence(base, { unit: 'year', count: 1 })).toBe(
      new Date(2027, 0, 15, 12).getTime(),
    )
  })
})

describe('describeRepeat', () => {
  it('reads naturally for singular and plural', () => {
    expect(describeRepeat({ unit: 'week', count: 1 })).toBe('every week')
    expect(describeRepeat({ unit: 'month', count: 6 })).toBe('every 6 months')
  })
})

describe('sameRule', () => {
  it('compares rules and handles null', () => {
    expect(sameRule(null, null)).toBe(true)
    expect(sameRule({ unit: 'month', count: 6 }, { unit: 'month', count: 6 })).toBe(true)
    expect(sameRule({ unit: 'month', count: 6 }, { unit: 'month', count: 3 })).toBe(false)
    expect(sameRule(null, { unit: 'week', count: 1 })).toBe(false)
  })
})
