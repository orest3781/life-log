import { useState } from 'react'
import { Sheet } from './Sheet'
import { CategoryChip } from './CategoryChip'
import { StatusPill } from './StatusPill'
import { useToast } from './Toast'
import { haptic } from '../lib/haptics'
import { RotateIcon } from './icons'
import { useCategoryStatus } from '../hooks/useCategoryStatus'
import { visibleCategories } from '../lib/categories'
import { formatElapsed } from '../lib/elapsed'
import { quickLog } from '../db/repo'
import type { Category } from '../types'

interface SummarySheetProps {
  categories: Category[]
  now: number
  onClose: () => void
  onPick: (categoryId: string) => void
}

// "Last done": the most-recent entry per category at a glance — answering
// "when did I last X" without searching. Overdue categories are flagged, and a
// one-tap "Log again" re-logs the latest title with today's date.
export function SummarySheet({ categories, now, onClose, onPick }: SummarySheetProps) {
  const status = useCategoryStatus(now)
  const toast = useToast()
  const [busy, setBusy] = useState<Set<string>>(new Set())
  const cats = visibleCategories(categories)

  async function handleLogAgain(category: Category, title: string) {
    if (busy.has(category.id)) return
    setBusy((prev) => new Set(prev).add(category.id))
    try {
      await quickLog(title, category.id)
      haptic.tap()
      toast.show(`Logged “${title}” — now`)
    } finally {
      setBusy((prev) => {
        const next = new Set(prev)
        next.delete(category.id)
        return next
      })
    }
  }

  return (
    <Sheet title="Last done" onClose={onClose}>
      <ul className="flex flex-col gap-2 py-2">
        {cats.map((c) => {
          const s = status.get(c.id)
          const last = s?.lastOccurredAt ?? null
          const title = s?.lastTitle ?? null
          return (
            <li key={c.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPick(c.id)}
                className="brut-card brut-press tap-ring flex min-w-0 flex-1 items-center gap-3 bg-surface px-4 py-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <CategoryChip category={c} />
                  {title && (
                    <div className="mt-1 truncate text-[13px] text-muted">
                      {title}
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div
                    className={`font-display text-lg font-bold tracking-tight ${
                      last === null
                        ? 'text-faint'
                        : s?.overdue
                          ? 'text-danger'
                          : 'text-ink'
                    }`}
                  >
                    {last === null ? 'never' : formatElapsed(last, now)}
                  </div>
                  {s?.overdue && (
                    <div className="mt-1 flex justify-end">
                      <StatusPill kind="overdue" />
                    </div>
                  )}
                </div>
              </button>

              {title && (
                <button
                  type="button"
                  onClick={() => handleLogAgain(c, title)}
                  disabled={busy.has(c.id)}
                  aria-busy={busy.has(c.id)}
                  aria-label={`Log "${title}" again`}
                  className="brut-press tap-ring grid size-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-accent text-on-accent disabled:opacity-60"
                >
                  <RotateIcon width={18} height={18} />
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}
