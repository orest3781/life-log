import { useNudges } from '../hooks/useNudges'

// The opt-in reminders control. Shows a functional toggle only where background
// notifications are actually possible (installed Chromium PWA); otherwise it
// explains the in-app fallback honestly, so the toggle is never a dead end.
export function NudgeSettings() {
  const { enabled, capability, permission, busy, toggle } = useNudges()

  if (!capability) {
    return <p className="text-sm text-muted">Checking notification support…</p>
  }

  if (!capability.supported) {
    return (
      <Info>
        Notifications aren’t supported on this device. Overdue and due items
        always show at the top of your log.
      </Info>
    )
  }

  if (!capability.background) {
    return (
      <Info>
        {capability.installed
          ? 'This device shows reminders inside the app rather than as background notifications — overdue and due items appear at the top of your log.'
          : 'Install Waystone to your home screen to get background reminders. Until then, overdue and due items show at the top of your log.'}
      </Info>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={toggle}
        disabled={busy}
        className="tap-ring flex items-center justify-between rounded-xl border-2 border-ink bg-surface px-4 py-3 text-[15px] text-ink disabled:opacity-60"
      >
        Remind me about overdue &amp; due items
        <span
          className={`relative h-6 w-10 shrink-0 rounded-full border-2 border-ink transition-colors ${
            enabled ? 'bg-accent' : 'bg-surface-2'
          }`}
        >
          <span
            className={`absolute top-[2px] size-4 rounded-full border-2 border-ink bg-white transition-all ${
              enabled ? 'left-[18px]' : 'left-[2px]'
            }`}
          />
        </span>
      </button>
      <p className="text-sm leading-relaxed text-muted">
        {permission === 'denied'
          ? 'Notifications are blocked — allow them in your browser settings to get nudges.'
          : enabled
            ? 'On — at most one calm nudge a day, only when something needs you. No streaks, no spam.'
            : 'Off — turn on a quiet daily nudge for overdue or due items.'}
      </p>
    </div>
  )
}

function Info({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-muted">{children}</p>
}
