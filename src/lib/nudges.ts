// Opt-in "calm but present" reminders. Off by default. Real background
// notifications work only on installed Chromium PWAs (via Periodic Background
// Sync, throttled to ~daily); everywhere else the in-app Overview is the
// fallback, and this module reports that honestly so the toggle is never a lie.

export const NUDGES_ENABLED_KEY = 'waystone-nudges'
const NUDGE_TAG = 'waystone-nudge'
const MIN_INTERVAL_MS = 24 * 60 * 60 * 1000

export interface NudgeCapability {
  /** The Notification API exists at all. */
  supported: boolean
  permission: NotificationPermission
  /** Running as an installed/standalone app. */
  installed: boolean
  /** Background nudges are actually possible here (Periodic Background Sync). */
  background: boolean
}

export function isInstalled(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as { standalone?: boolean }).standalone === true
  )
}

export async function getCapability(): Promise<NudgeCapability> {
  const supported = 'Notification' in window
  const installed = isInstalled()
  let background = false
  if (supported && 'serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration()
    background = !!reg && 'periodicSync' in reg && installed
  }
  return {
    supported,
    permission: supported ? Notification.permission : 'default',
    installed,
    background,
  }
}

export function nudgesEnabled(): boolean {
  try {
    return localStorage.getItem(NUDGES_ENABLED_KEY) === '1'
  } catch {
    return false
  }
}

// Ask for permission and, where supported, register the background check.
// Returns the resulting permission so the UI can explain a denial.
export async function enableNudges(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  const permission = await Notification.requestPermission()
  if (permission === 'granted') {
    try {
      localStorage.setItem(NUDGES_ENABLED_KEY, '1')
    } catch {
      /* storage unavailable — still active this session */
    }
    await registerPeriodicSync()
  }
  return permission
}

export async function disableNudges(): Promise<void> {
  try {
    localStorage.removeItem(NUDGES_ENABLED_KEY)
  } catch {
    /* ignore */
  }
  const reg = await navigator.serviceWorker?.getRegistration()
  const sync = (reg as { periodicSync?: { unregister(tag: string): Promise<void> } } | undefined)
    ?.periodicSync
  if (sync) {
    try {
      await sync.unregister(NUDGE_TAG)
    } catch {
      /* ignore */
    }
  }
}

async function registerPeriodicSync(): Promise<void> {
  const reg = await navigator.serviceWorker?.getRegistration()
  const sync = (
    reg as
      | { periodicSync?: { register(tag: string, opts: { minInterval: number }): Promise<void> } }
      | undefined
  )?.periodicSync
  if (!sync) return
  try {
    const status = await navigator.permissions.query({
      name: 'periodic-background-sync' as PermissionName,
    })
    if (status.state === 'granted') {
      await sync.register(NUDGE_TAG, { minInterval: MIN_INTERVAL_MS })
    }
  } catch {
    /* permission API or registration unsupported — silently skip */
  }
}
