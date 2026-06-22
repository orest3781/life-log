import { useEffect, useState } from 'react'
import { seedIfEmpty } from './db/db'
import { preloadGoogleAuth } from './lib/googleAuth'
import { requestPersistentStorage } from './lib/persistence'
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  applyTheme,
  isThemeId,
} from './lib/themes'
import { LedgerScreen } from './components/LedgerScreen'
import { Splash } from './components/Splash'

export default function App() {
  const [ready, setReady] = useState(false)
  // "Open to log": the manifest's New-entry shortcut (and any /?action=new
  // deep link) launches straight into the new-entry sheet.
  const [openCreate] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('action') === 'new'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (openCreate) {
      try {
        window.history.replaceState({}, '', window.location.pathname)
      } catch {
        /* ignore */
      }
    }
  }, [openCreate])

  useEffect(() => {
    // Re-apply the saved theme now that styles are loaded — the inline script
    // in index.html set data-theme pre-paint; this also syncs the chrome color.
    let theme = DEFAULT_THEME
    try {
      const v = localStorage.getItem(THEME_STORAGE_KEY)
      if (isThemeId(v)) theme = v
    } catch {
      /* storage unavailable — default theme applies */
    }
    applyTheme(theme)

    seedIfEmpty().finally(() => setReady(true))
    // Keep local data durable (resists eviction, incl. iOS 7-day clearing).
    requestPersistentStorage()
    // Warm up Google sign-in so the Drive "Connect" popup opens within the
    // user's click instead of being blocked behind a script download.
    preloadGoogleAuth()
  }, [])

  if (!ready) return <Splash />
  return <LedgerScreen openCreate={openCreate} />
}
