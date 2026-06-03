import { WaystoneMark } from './WaystoneMark'

// Shown for the brief moment before the database is ready, so launch doesn't
// flash a blank screen. Matches the app background, so it's seamless.
export function Splash() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3 bg-paper">
      <WaystoneMark size={56} />
      <span className="font-display text-lg font-bold tracking-tight text-ink">
        Waystone
      </span>
    </div>
  )
}
