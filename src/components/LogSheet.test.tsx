import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LogSheet } from './LogSheet'
import { ToastProvider } from './Toast'
import { db } from '../db/db'
import type { Category } from '../types'

const categories: Category[] = [
  {
    id: 'c1',
    name: 'Garden',
    emoji: '🌱',
    color: '#5b9d5b',
    order: 0,
    usageCount: 0,
    lastUsedAt: null,
    archived: false,
  },
]

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('LogSheet quick-log path', () => {
  it('requires a title and category, then writes the entry on Save', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <ToastProvider>
        <LogSheet mode="create" categories={categories} onClose={onClose} />
      </ToastProvider>,
    )

    const save = screen.getByRole('button', { name: 'Save' })
    expect(save).toBeDisabled()

    await user.type(
      screen.getByPlaceholderText('What happened?'),
      'Planted basil',
    )
    await user.click(screen.getByRole('button', { name: /Garden/ }))
    expect(save).toBeEnabled()

    await user.click(save)

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    const entries = await db.entries.toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0].title).toBe('Planted basil')
    expect(entries[0].categoryId).toBe('c1')
  })
})
