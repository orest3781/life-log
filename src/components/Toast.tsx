import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type ToastAction, type ToastApi } from './toast-context'

interface ToastItem {
  id: string
  message: string
  action?: ToastAction
  tone: 'default' | 'error'
}

// A minimal toast/snackbar stack: transient messages with an optional action
// (used for "Entry deleted · Undo" and for surfacing errors).
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) clearTimeout(timer)
    timers.current.delete(id)
  }, [])

  const show = useCallback<ToastApi['show']>(
    (message, opts) => {
      const id = crypto.randomUUID()
      setToasts((list) => [
        ...list,
        { id, message, action: opts?.action, tone: opts?.tone ?? 'default' },
      ])
      const timer = setTimeout(
        () => dismiss(id),
        opts?.durationMs ?? (opts?.action ? 6000 : 4000),
      )
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[55] flex flex-col items-center gap-2 px-5"
        style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`anim-slide-down brut-sm pointer-events-auto flex w-full max-w-md items-center gap-3 px-4 py-2.5 ${
              t.tone === 'error' ? 'bg-danger text-white' : 'bg-ink text-paper'
            }`}
          >
            <span className="flex-1 text-[15px] font-medium">{t.message}</span>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action!.onAction()
                  dismiss(t.id)
                }}
                className="font-semibold text-white underline underline-offset-2"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
