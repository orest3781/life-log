import { formatAbsolute, formatElapsed } from '../lib/elapsed'
import { usePhotos } from '../hooks/usePhotos'
import { CategoryChip } from './CategoryChip'
import { BellIcon } from './icons'
import type { Category, Entry } from '../types'

interface EntryRowProps {
  entry: Entry
  category?: Category
  now: number
  onOpen: (entry: Entry) => void
}

// One ledger row. Elapsed time is the dominant element; the absolute date and
// category sit quietly around it.
export function EntryRow({ entry, category, now, onOpen }: EntryRowProps) {
  const photos = usePhotos(entry.id)
  const hasDueReminder =
    entry.remindAt !== undefined &&
    entry.remindAt <= now &&
    !entry.reminderDoneAt

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(entry)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-2 active:bg-surface-2"
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            {category && <CategoryChip category={category} />}
            {hasDueReminder && (
              <BellIcon width={14} height={14} className="text-accent" />
            )}
          </div>
          <div className="truncate text-[15px] text-ink">{entry.title}</div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-xl font-semibold tracking-tight text-ink">
              {formatElapsed(entry.occurredAt, now)}
            </span>
            <span className="text-sm text-muted">
              {formatAbsolute(entry.occurredAt, now)}
            </span>
          </div>
        </div>

        {photos.length > 0 && (
          <div className="relative size-14 shrink-0">
            <img
              src={photos[0].url}
              alt=""
              className="size-14 rounded-xl object-cover"
            />
            {photos.length > 1 && (
              <span className="absolute -bottom-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[11px] font-semibold text-paper">
                +{photos.length - 1}
              </span>
            )}
          </div>
        )}
      </button>
    </li>
  )
}
