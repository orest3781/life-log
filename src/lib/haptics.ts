// Centralized haptic feedback. The Vibration API is optional (`?.`) so these
// are silent no-ops on devices/browsers without it (e.g. iOS Safari, desktop).
// Keep durations short and distinct so taps build a consistent expectation.
export const haptic = {
  /** A confirmed action: log saved, entry created. */
  tap: () => navigator.vibrate?.(8),
  /** A light selection: chip pick, toggle, FAB press. */
  select: () => navigator.vibrate?.(4),
  /** A destructive confirmation: delete carried out. */
  warn: () => navigator.vibrate?.([12, 40, 12]),
}
