import { CheckIcon } from './icons'
import type { Category, Entry } from '../types'

interface DueStripProps {
  entries: Entry[]
  categoriesById: Map<string, Category>
  onOpen: (entry: Entry) => void
  onMarkDone: (entry: Entry) => void
}

// The entire reminder surface: a calm strip at the top of the ledger listing
// entries whose check-back date has arrived. Tap to open, check to clear.
export function DueStrip({
  entries,
  categoriesById,
  onOpen,
  onMarkDone,
}: DueStripProps) {
  if (entries.length === 0) return null

  return (
    <section className="px-5 pt-3">
      <div className="rounded-2xl bg-accent-soft p-1.5">
        <div className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
          Due
        </div>
        <ul className="flex flex-col gap-0.5">
          {entries.map((entry) => {
            const category = categoriesById.get(entry.categoryId)
            return (
              <li key={entry.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onOpen(entry)}
                  className="min-w-0 flex-1 rounded-xl px-2.5 py-2 text-left hover:bg-black/5"
                >
                  <div className="truncate text-[15px] text-ink">
                    {entry.title}
                  </div>
                  <div className="truncate text-xs text-muted">
                    {category ? `${category.emoji} ${category.name}` : 'Reminder'}{' '}
                    · check back
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onMarkDone(entry)}
                  aria-label={`Mark "${entry.title}" done`}
                  className="grid size-10 shrink-0 place-items-center rounded-full text-accent hover:bg-black/5 active:scale-95"
                >
                  <CheckIcon width={20} height={20} />
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
