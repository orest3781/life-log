import { describe, expect, it } from 'vitest'
import { attentionCounts, nudgeBody } from './attention'
import type { Category, Entry } from '../types'

const DAY = 86_400_000
const NOW = 1_700_000_000_000

function cat(id: string, over: Partial<Category> = {}): Category {
  return {
    id,
    name: id,
    emoji: '🏷️',
    color: '#000',
    order: 0,
    usageCount: 0,
    lastUsedAt: null,
    archived: false,
    ...over,
  }
}

function entry(id: string, categoryId: string, over: Partial<Entry> = {}): Entry {
  return {
    id,
    title: id,
    categoryId,
    occurredAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...over,
  }
}

describe('attentionCounts', () => {
  it('counts a category whose latest entry is past its cadence', () => {
    const cats = [cat('car', { expectedInterval: { unit: 'month', count: 1 } })]
    const entries = [entry('e1', 'car', { occurredAt: NOW - 40 * DAY })]
    expect(attentionCounts(cats, entries, NOW)).toEqual({ overdue: 1, due: 0 })
  })

  it('is not overdue when the latest entry is within cadence', () => {
    const cats = [cat('car', { expectedInterval: { unit: 'month', count: 1 } })]
    const entries = [entry('e1', 'car', { occurredAt: NOW - 5 * DAY })]
    expect(attentionCounts(cats, entries, NOW).overdue).toBe(0)
  })

  it('ignores archived categories and cadence-less categories', () => {
    const cats = [
      cat('a', { archived: true, expectedInterval: { unit: 'week', count: 1 } }),
      cat('b'),
    ]
    const entries = [
      entry('e1', 'a', { occurredAt: NOW - 100 * DAY }),
      entry('e2', 'b', { occurredAt: NOW - 100 * DAY }),
    ]
    expect(attentionCounts(cats, entries, NOW).overdue).toBe(0)
  })

  it('counts arrived, uncleared reminders as due', () => {
    const entries = [
      entry('e1', 'c', { remindAt: NOW - 1000 }),
      entry('e2', 'c', { remindAt: NOW - 1000, reminderDoneAt: NOW }),
      entry('e3', 'c', { remindAt: NOW + DAY }),
    ]
    expect(attentionCounts([], entries, NOW).due).toBe(1)
  })
})

describe('nudgeBody', () => {
  it('returns null when nothing needs attention', () => {
    expect(nudgeBody({ overdue: 0, due: 0 })).toBeNull()
  })

  it('summarizes overdue and due', () => {
    expect(nudgeBody({ overdue: 2, due: 1 })).toBe('2 overdue · 1 due — tap to take a look.')
    expect(nudgeBody({ overdue: 0, due: 3 })).toBe('3 due — tap to take a look.')
  })
})
