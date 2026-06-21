import { useState } from 'react'
import { format } from 'date-fns'
import { Sheet } from './Sheet'
import { CategoryChip } from './CategoryChip'
import { StatusPill } from './StatusPill'
import { PencilIcon, RotateIcon, TrashIcon } from './icons'
import { usePhotos } from '../hooks/usePhotos'
import { useToast } from './Toast'
import { haptic } from '../lib/haptics'
import { formatAbsolute, formatElapsed } from '../lib/elapsed'
import { describeRepeat } from '../lib/reminders'
import {
  completeReminder,
  deleteEntry,
  getPhotos,
  logAgain,
  restoreEntry,
} from '../db/repo'
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
  const [busy, setBusy] = useState(false)
  const [doneBusy, setDoneBusy] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const toast = useToast()

  async function handleLogAgain() {
    if (busy) return
    setBusy(true)
    try {
      await logAgain(entry)
      haptic.tap()
      onClose()
      toast.show('Logged again — now')
    } catch {
      setBusy(false)
      toast.show("Couldn't log that. Please try again.", { tone: 'error' })
    }
  }

  async function handleDelete() {
    if (busy) return
    setBusy(true)
    // Capture the entry + its photo blobs before deleting so Undo can restore
    // them faithfully (the in-memory blobs survive the DB delete).
    const snapshotPhotos = await getPhotos(entry.id)
    await deleteEntry(entry.id)
    haptic.warn()
    onClose()
    toast.show('Entry deleted', {
      action: {
        label: 'Undo',
        onAction: () => {
          void restoreEntry(entry, snapshotPhotos)
        },
      },
    })
  }

  async function handleDone() {
    if (doneBusy) return
    setDoneBusy(true)
    try {
      await completeReminder(entry)
      haptic.tap()
    } catch {
      setDoneBusy(false)
    }
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
          className="brut-press tap-ring mt-2 grid size-11 place-items-center rounded-full border-2 border-ink bg-surface text-ink"
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
              className="tap-ring flex-1 rounded-xl border-2 border-ink bg-surface py-3 font-medium text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              aria-busy={busy}
              className="brut-press tap-ring flex-1 rounded-xl border-[2.5px] border-ink bg-danger py-3 font-semibold text-on-danger shadow-[3px_3px_0_var(--color-ink)] disabled:opacity-60"
            >
              Delete
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="tap-ring flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink py-3 font-medium text-danger"
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
            <span className="t-elapsed-lg text-ink">
              {formatElapsed(entry.occurredAt, now)}
            </span>
          </div>
          <div className="mt-1 text-sm text-muted">
            {format(entry.occurredAt, 'EEEE, MMMM d, yyyy')} ·{' '}
            {formatAbsolute(entry.occurredAt, now)}
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogAgain}
          disabled={busy}
          aria-busy={busy}
          className="brut-press tap-ring flex w-full items-center justify-center gap-2 rounded-xl border-[2.5px] border-ink bg-accent py-3 font-semibold text-on-accent shadow-[3px_3px_0_var(--color-ink)] disabled:opacity-60"
        >
          <RotateIcon width={18} height={18} /> Log again (now)
        </button>

        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setLightbox(p.url)}
                aria-label="View photo"
                className="tap-ring rounded-xl"
              >
                <img
                  src={p.url}
                  alt=""
                  className="aspect-square w-full rounded-xl border-2 border-ink object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {lightbox && (
          <div
            className="anim-fade-in fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4"
            onClick={() => setLightbox(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Photo"
          >
            <img
              src={lightbox}
              alt=""
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          </div>
        )}

        {entry.note && (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
            {entry.note}
          </p>
        )}

        {reminderActive && entry.remindAt !== undefined && (
          <div className="brut-sm flex items-center justify-between gap-2 bg-accent-soft px-4 py-3">
            <div className="min-w-0">
              {entry.remindAt <= now && (
                <StatusPill kind="due" className="mb-1.5" />
              )}
              <span className="block text-sm text-accent">
                Check back {formatElapsed(entry.remindAt, now)} ·{' '}
                {format(entry.remindAt, 'MMM d, yyyy')}
                {entry.repeat && ` · repeats ${describeRepeat(entry.repeat)}`}
              </span>
            </div>
            {entry.remindAt <= now && (
              <button
                type="button"
                onClick={handleDone}
                disabled={doneBusy}
                aria-busy={doneBusy}
                className="tap-ring shrink-0 rounded-lg px-1 text-sm font-semibold text-accent disabled:opacity-50"
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
