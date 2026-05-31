import { useCallback, useEffect, useState } from 'react'

// The non-standard event Chromium fires when a site is installable. Not in the
// DOM lib types, so we describe the shape we use.
interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  prompt: () => Promise<void>
}

const DISMISS_KEY = 'lifelog-install-dismissed'

function detectStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari exposes this when launched from the home screen.
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function detectIOSSafari(): boolean {
  const ua = navigator.userAgent
  const isIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS reports as Mac; disambiguate via touch support.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|chrome|android/i.test(ua)
  return isIOS && isSafari
}

export interface InstallPromptState {
  /** Show a banner with a working Install button (Chromium). */
  canInstall: boolean
  /** Show the manual "Add to Home Screen" hint (iOS Safari). */
  showIOSHint: boolean
  /** Trigger the native install dialog; resolves once the user chooses. */
  promptInstall: () => Promise<void>
  /** Hide the banner and remember the choice. */
  dismiss: () => void
}

// Surfaces whether (and how) the app can be installed to the home screen, and
// remembers a dismissal so we never nag.
export function useInstallPrompt(): InstallPromptState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSHint, setShowIOSHint] = useState(false)
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === '1',
  )

  useEffect(() => {
    if (detectStandalone()) return // already installed — nothing to offer

    const onBeforeInstall = (e: Event) => {
      e.preventDefault() // stop Chrome's default mini-infobar; we drive our own UI
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setDeferred(null)
      setShowIOSHint(false)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    // iOS gets no beforeinstallprompt — decide up front whether to hint.
    if (detectIOSSafari()) setShowIOSHint(true)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null) // the event can only be used once
  }, [deferred])

  const dismiss = useCallback(() => {
    setDismissed(true)
    localStorage.setItem(DISMISS_KEY, '1')
  }, [])

  return {
    canInstall: !dismissed && deferred !== null,
    showIOSHint: !dismissed && showIOSHint,
    promptInstall,
    dismiss,
  }
}
