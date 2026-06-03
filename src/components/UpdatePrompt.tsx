import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

// When a new build is deployed, the service worker fetches it in the background
// and we surface a small "Reload" toast instead of silently swapping (which
// left people on a stale version until a manual hard-refresh).
export function UpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const updateRef = useRef<((reload?: boolean) => Promise<void>) | null>(null)

  useEffect(() => {
    updateRef.current = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true)
      },
    })
  }, [])

  if (!needRefresh) return null

  return (
    <div
      className="anim-slide-down pointer-events-none fixed inset-x-0 top-0 z-[60]"
      style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
      role="status"
    >
      <div className="mx-auto flex max-w-md items-center gap-3 px-5">
        <div className="brut-sm pointer-events-auto flex flex-1 items-center gap-3 bg-surface px-4 py-2.5">
          <span className="flex-1 text-[15px] font-medium text-ink">
            New version available
          </span>
          <button
            type="button"
            onClick={() => setNeedRefresh(false)}
            className="text-sm font-medium text-muted"
          >
            Later
          </button>
          <button
            type="button"
            onClick={() => updateRef.current?.(true)}
            className="brut-press rounded-lg border-2 border-ink bg-accent px-3 py-1.5 text-sm font-semibold text-white shadow-[2px_2px_0_var(--color-ink)]"
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  )
}
