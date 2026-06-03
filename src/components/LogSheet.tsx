import { useEffect, useRef, useState } from 'react'
import { addDays, addMonths, addWeeks, addYears } from 'date-fns'
import { Sheet } from './Sheet'
import { useToast } from './Toast'
import { ImageIcon, TrashIcon } from './icons'
import { usePhotos } from '../hooks/usePhotos'
import { sortForPicker } from '../lib/categories'
import { toDateInputValue, fromDateInputValue } from '../lib/elapsed'
import {
  addEntry,
  addPhotoFromFile,
  removePhoto,
  updateEntry,
} from '../db/repo'
import type { Category, Entry } from '../types'

interface LogSheetProps {
  mode: 'create' | 'edit'
  entry?: Entry
  categories: Category[]
  onClose: () => void
}

interface NewPhoto {
  key: string
  file: File
  url: string
}

const REMINDER_PRESETS: Array<{ label: string; add: (d: number) => Date }> = [
  { label: 'Tomorrow', add: (d) => addDays(d, 1) },
  { label: '3 days', add: (d) => addDays(d, 3) },
  { label: '1 week', add: (d) => addWeeks(d, 1) },
  { label: '2 weeks', add: (d) => addWeeks(d, 2) },
  { label: '1 month', add: (d) => addMonths(d, 1) },
  { label: '3 months', add: (d) => addMonths(d, 3) },
  { label: '6 months', add: (d) => addMonths(d, 6) },
  { label: '9 months', add: (d) => addMonths(d, 9) },
  { label: '1 year', add: (d) => addYears(d, 1) },
  { label: '2 years', add: (d) => addYears(d, 2) },
]

// Create or edit an entry. Optimized so the common path is: type a title,
// tap a category, Save. Everything else (photos, note, dates, reminder) is an
// optional tap that stays out of the way.
export function LogSheet({ mode, entry, categories, onClose }: LogSheetProps) {
  const toast = useToast()
  const [title, setTitle] = useState(entry?.title ?? '')
  const [categoryId, setCategoryId] = useState<string | null>(
    entry?.categoryId ?? null,
  )
  const [occurredAt, setOccurredAt] = useState<number>(
    entry?.occurredAt ?? Date.now(),
  )
  const [note, setNote] = useState(entry?.note ?? '')
  const [showNote, setShowNote] = useState(Boolean(entry?.note))
  const [remindAt, setRemindAt] = useState<number | null>(
    entry?.remindAt ?? null,
  )
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([])
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const existingPhotos = usePhotos(mode === 'edit' ? (entry?.id ?? null) : null)
  const visibleExisting = existingPhotos.filter((p) => !removedIds.has(p.id))
  const pickerCategories = sortForPicker(categories)

  // Revoke preview URLs for any new photos when the sheet unmounts.
  useEffect(() => {
    return () => newPhotos.forEach((p) => URL.revokeObjectURL(p.url))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const canSave = title.trim().length > 0 && categoryId !== null && !saving

  function handleFiles(files: FileList | null) {
    if (!files) return
    const added: NewPhoto[] = Array.from(files).map((file) => ({
      key: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
    }))
    setNewPhotos((prev) => [...prev, ...added])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeNewPhoto(key: string) {
    setNewPhotos((prev) => {
      const target = prev.find((p) => p.key === key)
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((p) => p.key !== key)
    })
  }

  async function handleSave() {
    if (!canSave || categoryId === null) return
    setSaving(true)
    try {
      const id =
        mode === 'edit' && entry
          ? (await updateEntry(entry.id, {
              title,
              note,
              categoryId,
              occurredAt,
              remindAt: remindAt ?? undefined,
            }),
            entry.id)
          : await addEntry({
              title,
              note,
              categoryId,
              occurredAt,
              remindAt: remindAt ?? undefined,
            })

      await Promise.all([
        ...[...removedIds].map((pid) => removePhoto(pid)),
        ...newPhotos.map((p) => addPhotoFromFile(id, p.file)),
      ])
      onClose()
    } catch (err) {
      // Most likely a storage-quota failure while saving photos.
      toast.show(
        err instanceof Error && /quota/i.test(err.message)
          ? "Couldn't save — device storage is full."
          : "Couldn't save that entry. Please try again.",
        { tone: 'error' },
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      title={mode === 'edit' ? 'Edit entry' : 'New entry'}
      onClose={onClose}
      footer={
        <button
          type="button"
          disabled={!canSave}
          onClick={handleSave}
          className="brut-press w-full rounded-xl border-[2.5px] border-ink bg-accent py-3 text-center font-semibold text-white shadow-[3px_3px_0_var(--color-ink)] disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      }
    >
      <div className="flex flex-col gap-5 py-2">
        {/* Title */}
        <input
          autoFocus={mode === 'create'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What happened?"
          className="w-full border-b-2 border-ink bg-transparent pb-2 font-display text-lg font-medium text-ink outline-none placeholder:font-normal placeholder:text-faint"
        />

        {/* Category picker */}
        <div>
          <Label>Category</Label>
          <div className="flex flex-wrap gap-2">
            {pickerCategories.map((c) => {
              const active = c.id === categoryId
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className="rounded-full border-2 border-ink px-3 py-1.5 text-sm font-semibold text-ink transition-colors"
                  style={{
                    backgroundColor: active ? c.color : c.color + '33',
                  }}
                >
                  {c.emoji} {c.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Photos */}
        <div>
          <Label>Photos</Label>
          <div className="flex flex-wrap gap-2">
            {visibleExisting.map((p) => (
              <PhotoThumb
                key={p.id}
                url={p.url}
                onRemove={() =>
                  setRemovedIds((prev) => new Set(prev).add(p.id))
                }
              />
            ))}
            {newPhotos.map((p) => (
              <PhotoThumb
                key={p.key}
                url={p.url}
                onRemove={() => removeNewPhoto(p.key)}
              />
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="grid size-16 place-items-center rounded-xl border-2 border-dashed border-ink text-ink"
              aria-label="Add photo"
            >
              <ImageIcon width={22} height={22} />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* Date */}
        <div>
          <Label>When</Label>
          <input
            type="date"
            value={toDateInputValue(occurredAt)}
            max={toDateInputValue(Date.now())}
            onChange={(e) =>
              e.target.value && setOccurredAt(fromDateInputValue(e.target.value))
            }
            className="rounded-xl border border-line bg-surface px-3 py-2 text-[15px] text-ink outline-none focus:border-accent"
          />
        </div>

        {/* Note (collapsible) */}
        {showNote ? (
          <div>
            <Label>Note</Label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Any details…"
              className="w-full resize-none rounded-xl border-2 border-ink bg-surface px-3 py-2 text-[15px] text-ink outline-none placeholder:text-faint"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowNote(true)}
            className="self-start text-sm font-medium text-accent"
          >
            + Add note
          </button>
        )}

        {/* Reminder */}
        <div>
          <Label>Check back later</Label>
          {remindAt === null ? (
            <div className="flex flex-wrap gap-2">
              {REMINDER_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setRemindAt(preset.add(Date.now()).getTime())}
                  className="rounded-full border-2 border-ink bg-surface px-3 py-1.5 text-sm font-medium text-ink"
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setRemindAt(addWeeks(Date.now(), 1).getTime())}
                className="rounded-full border-2 border-ink bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent"
              >
                Pick date…
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={toDateInputValue(remindAt)}
                min={toDateInputValue(Date.now())}
                onChange={(e) =>
                  e.target.value &&
                  setRemindAt(fromDateInputValue(e.target.value))
                }
                className="rounded-xl border-2 border-ink bg-surface px-3 py-2 text-[15px] text-ink outline-none"
              />
              <button
                type="button"
                onClick={() => setRemindAt(null)}
                className="text-sm font-medium text-danger"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>
    </Sheet>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
      {children}
    </div>
  )
}

function PhotoThumb({ url, onRemove }: { url: string; onRemove: () => void }) {
  return (
    <div className="relative size-16">
      <img src={url} alt="" className="size-16 rounded-xl object-cover" />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove photo"
        className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-ink text-paper shadow"
      >
        <TrashIcon width={13} height={13} />
      </button>
    </div>
  )
}
