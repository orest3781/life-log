import { useEffect, useState } from 'react'
import { seedIfEmpty } from './db/db'
import { LedgerScreen } from './components/LedgerScreen'

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    seedIfEmpty().finally(() => setReady(true))
  }, [])

  if (!ready) return null
  return <LedgerScreen />
}
