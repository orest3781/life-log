import { useCallback, useEffect, useState } from 'react'
import {
  type NudgeCapability,
  disableNudges,
  enableNudges,
  getCapability,
  nudgesEnabled,
} from '../lib/nudges'

// Drives the opt-in reminders toggle: tracks whether nudges are enabled, the
// device's notification capability, and the last permission outcome.
export function useNudges() {
  const [enabled, setEnabled] = useState(nudgesEnabled)
  const [capability, setCapability] = useState<NudgeCapability | null>(null)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(() => {
    getCapability().then((c) => {
      setCapability(c)
      setPermission(c.permission)
    })
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const toggle = useCallback(async () => {
    if (busy) return
    setBusy(true)
    try {
      if (enabled) {
        await disableNudges()
        setEnabled(false)
      } else {
        const result = await enableNudges()
        setPermission(result)
        setEnabled(result === 'granted')
      }
      refresh()
    } finally {
      setBusy(false)
    }
  }, [busy, enabled, refresh])

  return { enabled, capability, permission, busy, toggle }
}
