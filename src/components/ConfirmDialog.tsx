import { useEffect, useRef } from 'react'

interface ConfirmDialogProps {
  title: string
  body?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

// A small centered confirm modal for destructive actions. Focus defaults to
// Cancel, Escape and backdrop-tap cancel, focus is trapped and restored — the
// safe default is to do nothing.
export function ConfirmDialog({
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const restoreTo = document.activeElement as HTMLElement | null
    cancelRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
        return
      }
      if (e.key !== 'Tab') return
      const items = Array.from(
        panelRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [],
      )
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      restoreTo?.focus?.()
    }
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label={cancelLabel}
        onClick={onCancel}
        className="anim-fade-in absolute inset-0 bg-black/40"
      />
      <div
        ref={panelRef}
        className="brut anim-scale-in relative w-full max-w-xs bg-surface p-5"
      >
        <h2 className="t-sheet-title text-ink">{title}</h2>
        {body && (
          <p className="mt-2 text-[15px] leading-relaxed text-muted">{body}</p>
        )}
        <div className="mt-5 flex gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="tap-ring flex-1 rounded-xl border-2 border-ink bg-surface py-3 font-medium text-ink"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`brut-press tap-ring flex-1 rounded-xl border-[2.5px] border-ink py-3 font-semibold shadow-[3px_3px_0_var(--color-ink)] ${
              tone === 'danger'
                ? 'bg-danger text-on-danger'
                : 'bg-accent text-on-accent'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
