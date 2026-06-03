import { useMemo } from 'react'
import { Sheet } from './Sheet'
import { CategoryChip } from './CategoryChip'
import { useEntries } from '../hooks/useEntries'
import { visibleCategories } from '../lib/categories'
import { formatElapsed } from '../lib/elapsed'
import type { Category, Entry } from '../types'

interface SummarySheetProps {
  categories: Category[]
  now: number
  onClose: () => void
  onPick: (categoryId: string) => void
}

// "Last done": the most-recent entry per category at a glance — answering
// "when did I last X" without searching. Tap a row to filter the ledger to it.
export function SummarySheet({ categories, now, onClose, onPick }: SummarySheetProps) {
  const entries = useEntries({}) // all, newest first

  const latestByCategory = useMemo(() => {
    const map = new Map<string, Entry>()
    entries?.forEach((e) => {
      if (!map.has(e.categoryId)) map.set(e.categoryId, e)
    })
    return map
  }, [entries])

  const cats = visibleCategories(categories)

  return (
    <Sheet title="Last done" onClose={onClose}>
      <ul className="flex flex-col gap-2 py-2">
        {cats.map((c) => {
          const last = latestByCategory.get(c.id)
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onPick(c.id)}
                className="brut-sm brut-press flex w-full items-center gap-3 bg-surface px-4 py-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <CategoryChip category={c} />
                  {last && (
                    <div className="mt-1 truncate text-[13px] text-muted">
                      {last.title}
                    </div>
                  )}
                </div>
                <span
                  className={`shrink-0 font-display text-lg font-bold tracking-tight ${
                    last ? 'text-ink' : 'text-faint'
                  }`}
                >
                  {last ? formatElapsed(last.occurredAt, now) : 'never'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}
