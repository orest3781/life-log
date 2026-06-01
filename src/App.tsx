import { useEffect, useState } from 'react'
import { seedIfEmpty } from './db/db'
import { preloadGoogleAuth } from './lib/googleAuth'
import { LedgerScreen } from './components/LedgerScreen'

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    seedIfEmpty().finally(() => setReady(true))
    // Warm up Google sign-in so the Drive "Connect" popup opens within the
    // user's click instead of being blocked behind a script download.
    preloadGoogleAuth()
  }, [])

  if (!ready) return null
  return <LedgerScreen />
}
