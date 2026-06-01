import { useEffect, type ReactNode } from 'react'
import { CloseIcon } from './icons'

interface SheetProps {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** Optional element rendered at the right of the header (e.g. a delete button). */
  headerAction?: ReactNode
}

// A bottom sheet: backdrop + slide-up panel, Escape and backdrop-tap to close,
// body scroll locked while open. Used for logging, entry detail, and settings.
export function Sheet({ title, onClose, children, footer, headerAction }: SheetProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 anim-fade-in"
      />
      <div className="anim-sheet-up relative mx-auto flex max-h-[92vh] w-full max-w-md flex-col rounded-t-3xl border-x-[3px] border-t-[3px] border-ink bg-surface">
        <header className="flex items-center gap-2 px-5 pb-3 pt-3">
          <span className="absolute left-1/2 top-2 mx-auto h-1.5 w-10 -translate-x-1/2 rounded-full bg-ink" />
          <h2 className="mt-2 flex-1 font-display text-lg font-bold text-ink">
            {title}
          </h2>
          {headerAction}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="brut-press mt-2 grid size-9 place-items-center rounded-full border-2 border-ink bg-surface text-ink"
          >
            <CloseIcon width={20} height={20} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5">{children}</div>
        {footer && <div className="border-t-2 border-ink p-4">{footer}</div>}
      </div>
    </div>
  )
}
