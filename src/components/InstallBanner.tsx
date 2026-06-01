import { useEffect, useState } from 'react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { CloseIcon, DownloadIcon, ShareIcon } from './icons'

// How long to let the visitor settle in before gently sliding the prompt in.
const APPEAR_DELAY_MS = 4000

// A calm, dismissible prompt inviting the visitor to save LifeLog to their
// home screen. Slides in a few seconds after load. Uses the real install
// dialog on Chromium; on iOS Safari (which has no install API) it shows the
// manual Share → Add to Home Screen steps. Never appears once installed, and
// stays hidden after being dismissed.
export function InstallBanner() {
  const { canInstall, showIOSHint, promptInstall, dismiss } = useInstallPrompt()
  const available = canInstall || showIOSHint
  const [appeared, setAppeared] = useState(false)

  useEffect(() => {
    if (!available) {
      setAppeared(false)
      return
    }
    const t = setTimeout(() => setAppeared(true), APPEAR_DELAY_MS)
    return () => clearTimeout(t)
  }, [available])

  if (!available || !appeared) return null

  return (
    <div className="anim-slide-down px-5 pt-3">
      <div className="relative flex items-start gap-3 rounded-2xl bg-surface-2 p-3 pr-9">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-white">
          <DownloadIcon width={20} height={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-ink">
            Add LifeLog to your home screen
          </div>

          {canInstall ? (
            <>
              <p className="mt-0.5 text-sm text-muted">
                Install it for one-tap, offline access — no app store needed.
              </p>
              <button
                type="button"
                onClick={promptInstall}
                className="mt-2 rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white active:scale-95"
              >
                Install
              </button>
            </>
          ) : (
            <p className="mt-0.5 flex flex-wrap items-center gap-1 text-sm text-muted">
              Tap
              <ShareIcon
                width={16}
                height={16}
                className="inline-block text-accent"
                aria-label="the Share button"
              />
              then <span className="font-medium text-ink">Add to Home Screen</span>.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full text-muted hover:bg-black/5"
        >
          <CloseIcon width={16} height={16} />
        </button>
      </div>
    </div>
  )
}
