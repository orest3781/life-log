import { useState } from 'react'
import { Sheet } from './Sheet'
import { TrashIcon } from './icons'
import { sortByOrder } from '../lib/categories'
import {
  addCategory,
  countEntriesForCategory,
  deleteCategory,
  reorderCategories,
  updateCategory,
} from '../db/repo'
import type { Category } from '../types'

const PALETTE = [
  '#4f86c6',
  '#5b9d5b',
  '#c98b3a',
  '#c85c7e',
  '#8a6fc0',
  '#3aa6a0',
  '#c0563f',
  '#7a8a3f',
  '#b6587d',
  '#5f6f8a',
]

interface CategoryManagerProps {
  categories: Category[]
  onClose: () => void
}

export function CategoryManager({ categories, onClose }: CategoryManagerProps) {
  const ordered = sortByOrder(categories)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('🏷️')
  const [newColor, setNewColor] = useState(PALETTE[0])

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= ordered.length) return
    const ids = ordered.map((c) => c.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    await reorderCategories(ids)
  }

  async function handleAdd() {
    const name = newName.trim()
    if (!name) return
    await addCategory({ name, emoji: newEmoji.trim() || '🏷️', color: newColor })
    setNewName('')
    setNewEmoji('🏷️')
  }

  async function handleDelete(cat: Category) {
    const inUse = await countEntriesForCategory(cat.id)
    if (inUse > 0) {
      // In use — archive instead of destroying history.
      await updateCategory(cat.id, { archived: true })
    } else {
      await deleteCategory(cat.id)
    }
  }

  return (
    <Sheet title="Categories" onClose={onClose}>
      <div className="flex flex-col gap-3 py-2">
        <ul className="flex flex-col divide-y divide-line">
          {ordered.map((cat, i) => (
            <li key={cat.id} className="flex items-center gap-2 py-2">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move up"
                  className="text-muted disabled:opacity-25"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === ordered.length - 1}
                  aria-label="Move down"
                  className="text-muted disabled:opacity-25"
                >
                  ↓
                </button>
              </div>

              <input
                key={`emoji-${cat.id}`}
                defaultValue={cat.emoji}
                onBlur={(e) =>
                  updateCategory(cat.id, { emoji: e.target.value || '🏷️' })
                }
                aria-label="Emoji"
                className="w-9 rounded-lg bg-surface-2 py-1 text-center text-lg outline-none"
              />

              <input
                key={`name-${cat.id}`}
                defaultValue={cat.name}
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  if (v && v !== cat.name) updateCategory(cat.id, { name: v })
                }}
                aria-label="Name"
                className={`min-w-0 flex-1 rounded-lg bg-transparent px-1 py-1 text-[15px] outline-none focus:bg-surface-2 ${
                  cat.archived ? 'text-faint line-through' : 'text-ink'
                }`}
              />

              <input
                type="color"
                value={cat.color}
                onChange={(e) => updateCategory(cat.id, { color: e.target.value })}
                aria-label="Color"
                className="size-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
              />

              {cat.archived ? (
                <button
                  type="button"
                  onClick={() => updateCategory(cat.id, { archived: false })}
                  className="text-xs font-medium text-accent"
                >
                  Restore
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDelete(cat)}
                  aria-label={`Remove ${cat.name}`}
                  className="grid size-8 place-items-center rounded-full text-muted hover:text-danger"
                >
                  <TrashIcon width={16} height={16} />
                </button>
              )}
            </li>
          ))}
        </ul>

        {/* Add new */}
        <div className="rounded-2xl bg-surface-2 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Add category
          </div>
          <div className="flex items-center gap-2">
            <input
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              aria-label="New emoji"
              className="w-10 rounded-lg bg-surface py-1.5 text-center text-lg outline-none"
            />
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Name"
              aria-label="New name"
              className="min-w-0 flex-1 rounded-lg bg-surface px-3 py-1.5 text-[15px] text-ink outline-none placeholder:text-faint"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              Add
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                aria-label={`Color ${c}`}
                className="size-6 rounded-full"
                style={{
                  backgroundColor: c,
                  boxShadow:
                    newColor === c
                      ? `0 0 0 2px var(--color-surface-2), 0 0 0 4px ${c}`
                      : 'none',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  )
}
