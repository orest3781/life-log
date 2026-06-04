import { describe, expect, it } from 'vitest'
import { subDays } from 'date-fns'
import { computeInsights, formatCadence } from './insights'
import type { Entry } from '../types'

const NOW = new Date(2026, 5, 15, 12).getTime()

function entry(categoryId: string, daysAgo: number): Entry {
  const t = subDays(NOW, daysAgo).getTime()
  return {
    id: `${categoryId}-${daysAgo}`,
    title: 't',
    categoryId,
    occurredAt: t,
    createdAt: t,
    updatedAt: t,
  }
}

describe('computeInsights', () => {
  it('counts totals, this-month, per-category cadence, and heatmap', () => {
    const entries = [
      entry('car', 0),
      entry('car', 10),
      entry('car', 20),
      entry('garden', 2),
      entry('garden', 100), // outside heatmap window
    ]
    const r = computeInsights(entries, NOW)

    expect(r.total).toBe(5)
    // June (NOW) entries: car@0, car@10, garden@2 — car@20 lands in May.
    expect(r.thisMonth).toBe(3)

    const car = r.perCategory.find((c) => c.categoryId === 'car')!
    expect(car.count).toBe(3)
    expect(Math.round(car.avgGapDays!)).toBe(10) // gaps of 10 and 10 days

    const garden = r.perCategory.find((c) => c.categoryId === 'garden')!
    expect(garden.count).toBe(2)

    expect(r.busiestCategoryId).toBe('car') // most entries
    expect(r.heatmap).toHaveLength(84)
    expect(r.heatmap[83]).toBe(1) // today (car @ 0 days ago)
    expect(r.heatmap.reduce((a, b) => a + b, 0)).toBe(4) // 100-days-ago excluded
  })
})

describe('formatCadence', () => {
  it('formats by scale and handles unknown', () => {
    expect(formatCadence(null)).toBe('—')
    expect(formatCadence(9)).toBe('~every 9d')
    expect(formatCadence(21)).toBe('~every 3w')
    expect(formatCadence(60)).toBe('~every 2mo')
  })
})
