import { formatAbsolute, formatElapsed } from '../lib/elapsed'
import { CategoryChip } from './CategoryChip'
import { StatusPill } from './StatusPill'
import type { EntryThumb } from '../hooks/useEntryThumbnails'
import type { Category, Entry } from '../types'

interface EntryRowProps {
  entry: Entry
  category?: Category
  thumb?: EntryThumb
  now: number
  /** Stagger delay (ms) for a gentle cascade as rows mount. */
  animDelayMs?: number
  onOpen: (entry: Entry) => void
}

// One ledger card. Elapsed time is the dominant element (display type); the
// absolute date and category sit quietly around it. The thumbnail comes from a
// single shared query (see useEntryThumbnails), not a per-row subscription.
export function EntryRow({
  entry,
  category,
  thumb,
  now,
  animDelayMs,
  onOpen,
}: EntryRowProps) {
  const hasDueReminder =
    entry.remindAt !== undefined &&
    entry.remindAt <= now &&
    !entry.reminderDoneAt

  // Rows only mount-animate; a stable key means useNow ticks re-render in place
  // (no remount), so the animation never replays on every tick.
  return (
    <li
      className="anim-row-in"
      style={animDelayMs ? { animationDelay: `${animDelayMs}ms` } : undefined}
    >
      <button
        type="button"
        onClick={() => onOpen(entry)}
        className="brut-card brut-press tap-ring flex w-full items-center gap-3 bg-surface px-4 py-3.5 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            {category && <CategoryChip category={category} />}
            {hasDueReminder && <StatusPill kind="due" />}
          </div>
          <div className="truncate text-[15px] text-ink">{entry.title}</div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="t-elapsed text-ink">
              {formatElapsed(entry.occurredAt, now)}
            </span>
            <span className="text-sm text-muted">
              {formatAbsolute(entry.occurredAt, now)}
            </span>
          </div>
        </div>

        {thumb && (
          <div className="relative size-14 shrink-0">
            <img
              src={thumb.url}
              alt=""
              className="size-14 rounded-xl border-2 border-ink object-cover"
            />
            {thumb.count > 1 && (
              <span className="absolute -bottom-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-ink bg-ink px-1 text-[11px] font-semibold text-paper">
                +{thumb.count - 1}
              </span>
            )}
          </div>
        )}
      </button>
    </li>
  )
}
