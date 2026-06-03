import { useEffect, useState } from 'react'
import { seedIfEmpty } from './db/db'
import { preloadGoogleAuth } from './lib/googleAuth'
import { requestPersistentStorage } from './lib/persistence'
import { LedgerScreen } from './components/LedgerScreen'
import { Splash } from './components/Splash'

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    seedIfEmpty().finally(() => setReady(true))
    // Keep local data durable (resists eviction, incl. iOS 7-day clearing).
    requestPersistentStorage()
    // Warm up Google sign-in so the Drive "Connect" popup opens within the
    // user's click instead of being blocked behind a script download.
    preloadGoogleAuth()
  }, [])

  if (!ready) return <Splash />
  return <LedgerScreen />
}
