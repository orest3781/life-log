import { describe, expect, it } from 'vitest'
import { sortForPicker, visibleCategories } from './categories'
import type { Category } from '../types'

function cat(p: Partial<Category> & { id: string }): Category {
  return {
    name: p.id,
    emoji: '🏷️',
    color: '#000',
    order: 0,
    usageCount: 0,
    lastUsedAt: null,
    archived: false,
    ...p,
  }
}

describe('sortForPicker', () => {
  it('puts recently used first, then frequency, then never-used by order', () => {
    const cats = [
      cat({ id: 'never-b', order: 1 }),
      cat({ id: 'never-a', order: 0 }),
      cat({ id: 'old-frequent', lastUsedAt: 1_000, usageCount: 50 }),
      cat({ id: 'recent', lastUsedAt: 9_000, usageCount: 1 }),
    ]
    expect(sortForPicker(cats).map((c) => c.id)).toEqual([
      'recent', // most recent wins
      'old-frequent', // used, but older
      'never-a', // never used → manual order
      'never-b',
    ])
  })

  it('breaks recency ties by usage count', () => {
    const cats = [
      cat({ id: 'less', lastUsedAt: 5_000, usageCount: 2 }),
      cat({ id: 'more', lastUsedAt: 5_000, usageCount: 9 }),
    ]
    expect(sortForPicker(cats).map((c) => c.id)).toEqual(['more', 'less'])
  })

  it('excludes archived categories', () => {
    const cats = [cat({ id: 'a' }), cat({ id: 'b', archived: true })]
    expect(sortForPicker(cats).map((c) => c.id)).toEqual(['a'])
    expect(visibleCategories(cats).map((c) => c.id)).toEqual(['a'])
  })
})
