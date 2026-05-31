import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { subWeeks } from 'date-fns'
import { EntryRow } from './EntryRow'
import type { Category, Entry } from '../types'

const NOW = new Date(2026, 4, 31, 12).getTime()

const category: Category = {
  id: 'c1',
  name: 'Garden',
  emoji: '🌱',
  color: '#5b9d5b',
  order: 0,
  usageCount: 0,
  lastUsedAt: null,
  archived: false,
}

const entry: Entry = {
  id: 'e1',
  title: 'Planted tomato seeds',
  categoryId: 'c1',
  occurredAt: subWeeks(NOW, 3).getTime(),
  createdAt: NOW,
  updatedAt: NOW,
}

describe('EntryRow', () => {
  it('leads with elapsed time and shows title + category', () => {
    render(
      <ul>
        <EntryRow entry={entry} category={category} now={NOW} onOpen={vi.fn()} />
      </ul>,
    )
    expect(screen.getByText('3 weeks ago')).toBeInTheDocument()
    expect(screen.getByText('Planted tomato seeds')).toBeInTheDocument()
    expect(screen.getByText('Garden')).toBeInTheDocument()
  })
})
