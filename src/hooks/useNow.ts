import { useEffect, useState } from 'react'

// A coarse "now" that refreshes elapsed-time labels without ticking every
// second. Updates on an interval and whenever the app regains focus — the
// moment you're most likely to glance at "how long ago".
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const id = setInterval(tick, intervalMs)
    window.addEventListener('focus', tick)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', tick)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [intervalMs])
  return now
}
