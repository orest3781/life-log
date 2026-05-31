import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DueStrip } from './DueStrip'
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

const entry: Entry = {
  id: 'e1',
  title: 'Test water',
  categoryId: 'c1',
  occurredAt: 1,
  createdAt: 1,
  updatedAt: 1,
  remindAt: 1,
}

describe('DueStrip', () => {
  it('renders nothing when there are no due reminders', () => {
    const { container } = render(
      <DueStrip
        entries={[]}
        categoriesById={new Map()}
        onOpen={vi.fn()}
        onMarkDone={vi.fn()}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('lists due entries and fires onMarkDone from the check button', async () => {
    const onMarkDone = vi.fn()
    render(
      <DueStrip
        entries={[entry]}
        categoriesById={new Map([[category.id, category]])}
        onOpen={vi.fn()}
        onMarkDone={onMarkDone}
      />,
    )
    expect(screen.getByText('Test water')).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: /Mark "Test water" done/ }),
    )
    expect(onMarkDone).toHaveBeenCalledWith(entry)
  })
})
