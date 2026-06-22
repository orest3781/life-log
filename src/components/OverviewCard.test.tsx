import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OverviewCard, type OverdueItem } from './OverviewCard'
import type { Category, Entry } from '../types'

const category: Category = {
  id: 'c1',
  name: 'Aquarium',
  emoji: '🐟',
  color: '#3aa6a0',
  order: 0,
  usageCount: 0,
  lastUsedAt: null,
  archived: false,
}

const NOW = 1_700_000_000_000
const DAY = 86_400_000

const dueEntry: Entry = {
  id: 'e1',
  title: 'Test water',
  categoryId: 'c1',
  occurredAt: NOW - DAY,
  createdAt: NOW - DAY,
  updatedAt: NOW - DAY,
  remindAt: NOW - 1000,
}

const upcomingEntry: Entry = {
  id: 'e2',
  title: 'Replace filter',
  categoryId: 'c1',
  occurredAt: NOW,
  createdAt: NOW,
  updatedAt: NOW,
  remindAt: NOW + 3 * DAY,
}

const overdueItem: OverdueItem = {
  category,
  lastOccurredAt: NOW - 400 * DAY,
  lastTitle: 'Cleaned tank',
}

const catsById = new Map([[category.id, category]])
const noop = {
  onOpenEntry: vi.fn(),
  onPickCategory: vi.fn(),
  onRelog: vi.fn(),
  onMarkDone: vi.fn(),
}

describe('OverviewCard', () => {
  it('renders nothing when there is nothing to surface', () => {
    const { container } = render(
      <OverviewCard
        overdue={[]}
        due={[]}
        upcoming={[]}
        categoriesById={catsById}
        now={NOW}
        {...noop}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows an overdue category and re-logs it', async () => {
    const onRelog = vi.fn()
    render(
      <OverviewCard
        overdue={[overdueItem]}
        due={[]}
        upcoming={[]}
        categoriesById={catsById}
        now={NOW}
        {...noop}
        onRelog={onRelog}
      />,
    )
    expect(screen.getByText('Aquarium')).toBeInTheDocument()
    expect(screen.getByText(/last done/)).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: /Log Aquarium again/ }),
    )
    expect(onRelog).toHaveBeenCalledWith(overdueItem)
  })

  it('lists due reminders and marks them done', async () => {
    const onMarkDone = vi.fn()
    render(
      <OverviewCard
        overdue={[]}
        due={[dueEntry]}
        upcoming={[]}
        categoriesById={catsById}
        now={NOW}
        {...noop}
        onMarkDone={onMarkDone}
      />,
    )
    expect(screen.getByText('Test water')).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: /Mark "Test water" done/ }),
    )
    expect(onMarkDone).toHaveBeenCalledWith(dueEntry)
  })

  it('shows upcoming reminders with a relative time', () => {
    render(
      <OverviewCard
        overdue={[]}
        due={[]}
        upcoming={[upcomingEntry]}
        categoriesById={catsById}
        now={NOW}
        {...noop}
      />,
    )
    expect(screen.getByText('Coming up')).toBeInTheDocument()
    expect(screen.getByText('Replace filter')).toBeInTheDocument()
    expect(screen.getByText('in 3 days')).toBeInTheDocument()
  })
})
