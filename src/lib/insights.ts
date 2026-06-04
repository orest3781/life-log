import { differenceInCalendarDays, isSameMonth } from 'date-fns'
import type { Entry } from '../types'

export const HEATMAP_DAYS = 84 // 12 weeks

export interface CategoryCadence {
  categoryId: string
  count: number
  /** Average days between consecutive entries; null with fewer than 2. */
  avgGapDays: number | null
}

export interface Insights {
  total: number
  thisMonth: number
  perCategory: CategoryCadence[] // sorted by count desc
  heatmap: number[] // length HEATMAP_DAYS; index 0 = oldest, last = today
  busiestCategoryId: string | null
}

export function computeInsights(entries: Entry[], now: number): Insights {
  const total = entries.length
  const thisMonth = entries.filter((e) => isSameMonth(e.occurredAt, now)).length

  const byCategory = new Map<string, number[]>()
  for (const e of entries) {
    const times = byCategory.get(e.categoryId) ?? []
    times.push(e.occurredAt)
    byCategory.set(e.categoryId, times)
  }

  const perCategory: CategoryCadence[] = []
  for (const [categoryId, times] of byCategory) {
    times.sort((a, b) => a - b)
    let avgGapDays: number | null = null
    if (times.length >= 2) {
      let sum = 0
      for (let i = 1; i < times.length; i++) sum += times[i] - times[i - 1]
      avgGapDays = sum / (times.length - 1) / 86_400_000
    }
    perCategory.push({ categoryId, count: times.length, avgGapDays })
  }
  perCategory.sort((a, b) => b.count - a.count)

  const heatmap = new Array<number>(HEATMAP_DAYS).fill(0)
  for (const e of entries) {
    const daysAgo = differenceInCalendarDays(now, e.occurredAt)
    if (daysAgo >= 0 && daysAgo < HEATMAP_DAYS) heatmap[HEATMAP_DAYS - 1 - daysAgo] += 1
  }

  return {
    total,
    thisMonth,
    perCategory,
    heatmap,
    busiestCategoryId: perCategory[0]?.categoryId ?? null,
  }
}

// Compact cadence label, e.g. "~every 9d", "~every 3w", "~every 2mo".
export function formatCadence(avgGapDays: number | null): string {
  if (avgGapDays === null) return '—'
  if (avgGapDays < 10) return `~every ${Math.max(1, Math.round(avgGapDays))}d`
  if (avgGapDays < 60) return `~every ${Math.round(avgGapDays / 7)}w`
  return `~every ${Math.round(avgGapDays / 30)}mo`
}
