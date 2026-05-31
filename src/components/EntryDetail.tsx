import { useState } from 'react'
import { format } from 'date-fns'
import { Sheet } from './Sheet'
import { CategoryChip } from './CategoryChip'
import { PencilIcon, TrashIcon } from './icons'
import { usePhotos } from '../hooks/usePhotos'
import { formatAbsolute, formatElapsed } from '../lib/elapsed'
import { deleteEntry, setReminderDone } from '../db/repo'
import type { Category, Entry } from '../types'

interface EntryDetailProps {
  entry: Entry
  category?: Category
  now: number
  onClose: () => void
  onEdit: (entry: Entry) => void
}

export function EntryDetail({
  entry,
  category,
  now,
  onClose,
  onEdit,
}: EntryDetailProps) {
  const photos = usePhotos(entry.id)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleDelete() {
    await deleteEntry(entry.id)
    onClose()
  }

  const reminderActive = entry.remindAt !== undefined && !entry.reminderDoneAt

  return (
    <Sheet
      title="Entry"
      onClose={onClose}
      headerAction={
        <button
          type="button"
          onClick={() => onEdit(entry)}
          aria-label="Edit entry"
          className="mt-2 grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 active:scale-95"
        >
          <PencilIcon width={18} height={18} />
        </button>
      }
      footer={
        confirmDelete ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="flex-1 rounded-xl bg-surface-2 py-3 font-medium text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 rounded-xl bg-danger py-3 font-semibold text-white"
            >
              Delete
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 font-medium text-danger hover:bg-surface-2"
          >
            <TrashIcon width={18} height={18} /> Delete entry
          </button>
        )
      }
    >
      <div className="flex flex-col gap-4 py-2">
        {category && (
          <div>
            <CategoryChip category={category} />
          </div>
        )}

        <div>
          <div className="text-xl font-medium text-ink">{entry.title}</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-ink">
              {formatElapsed(entry.occurredAt, now)}
            </span>
          </div>
          <div className="mt-1 text-sm text-muted">
            {format(entry.occurredAt, 'EEEE, MMMM d, yyyy')} ·{' '}
            {formatAbsolute(entry.occurredAt, now)}
          </div>
        </div>

        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <a key={p.id} href={p.url} target="_blank" rel="noreferrer">
                <img
                  src={p.url}
                  alt=""
                  className="aspect-square w-full rounded-xl object-cover"
                />
              </a>
            ))}
          </div>
        )}

        {entry.note && (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
            {entry.note}
          </p>
        )}

        {reminderActive && entry.remindAt !== undefined && (
          <div className="flex items-center justify-between rounded-xl bg-accent-soft px-4 py-3">
            <span className="text-sm text-accent">
              Check back {formatElapsed(entry.remindAt, now)} ·{' '}
              {format(entry.remindAt, 'MMM d, yyyy')}
            </span>
            {entry.remindAt <= now && (
              <button
                type="button"
                onClick={() => setReminderDone(entry.id, true)}
                className="text-sm font-semibold text-accent"
              >
                Done
              </button>
            )}
          </div>
        )}
      </div>
    </Sheet>
  )
}
