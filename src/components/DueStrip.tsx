import { CheckIcon } from './icons'
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
  if (entries.length === 0) return null

  return (
    <section className="px-5 pt-3">
      <div className="brut-sm bg-accent-soft p-2">
        <div className="px-1.5 py-1 font-display text-xs font-bold uppercase tracking-widest text-accent">
          Due
        </div>
        <ul className="flex flex-col gap-1">
          {entries.map((entry) => {
            const category = categoriesById.get(entry.categoryId)
            return (
              <li key={entry.id} className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpen(entry)}
                  className="min-w-0 flex-1 rounded-xl px-1.5 py-1.5 text-left"
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
                  onClick={() => onMarkDone(entry)}
                  aria-label={`Mark "${entry.title}" done`}
                  className="brut-press grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-surface text-accent"
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
