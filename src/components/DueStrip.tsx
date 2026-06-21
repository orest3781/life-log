import { useState } from 'react'
import { BellIcon, CheckIcon } from './icons'
import type { Category, Entry } from '../types'

interface DueStripProps {
  entries: Entry[]
  categoriesById: Map<string, Category>
  onOpen: (entry: Entry) => void
  onMarkDone: (entry: Entry) => void
}

// The entire reminder surface: a brutalist accent card at the top of the
// ledger listing entries whose check-back date has arrived. Tap to open,
// check to clear.
export function DueStrip({
  entries,
  categoriesById,
  onOpen,
  onMarkDone,
}: DueStripProps) {
  // Guard against a double-tap clearing the same reminder twice before the
  // list re-renders without it.
  const [pending, setPending] = useState<Set<string>>(new Set())

  if (entries.length === 0) return null

  return (
    <section className="px-5 pt-3">
      <div className="brut-sm bg-accent-soft p-2">
        <div className="flex items-center gap-1.5 px-1.5 py-1 t-eyebrow text-accent">
          <BellIcon width={13} height={13} aria-hidden />
          Due
        </div>
        <ul className="flex flex-col gap-1">
          {entries.map((entry) => {
            const category = categoriesById.get(entry.categoryId)
            const isPending = pending.has(entry.id)
            return (
              <li key={entry.id} className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpen(entry)}
                  className="tap-ring min-w-0 flex-1 rounded-xl px-1.5 py-1.5 text-left"
                >
                  <div className="truncate text-[15px] font-medium text-ink">
                    {entry.title}
                  </div>
                  <div className="truncate text-xs text-muted">
                    {category ? `${category.emoji} ${category.name}` : 'Reminder'}{' '}
                    · check back
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isPending) return
                    setPending((prev) => new Set(prev).add(entry.id))
                    onMarkDone(entry)
                  }}
                  disabled={isPending}
                  aria-busy={isPending}
                  aria-label={`Mark "${entry.title}" done`}
                  className="brut-press tap-ring grid size-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-surface text-accent disabled:opacity-50"
                >
                  <CheckIcon width={18} height={18} />
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
