import { useTheme } from '../hooks/useTheme'
import { THEMES } from '../lib/themes'
import { haptic } from '../lib/haptics'
import { CheckIcon } from './icons'

// A small grid of selectable themes. Each shows a 3-dot swatch (paper · accent ·
// ink) and applies instantly; the choice persists across launches.
export function ThemePicker() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="grid grid-cols-2 gap-2">
      {THEMES.map((t) => {
        const active = t.id === theme
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              haptic.select()
              setTheme(t.id)
            }}
            aria-pressed={active}
            className={`tap-ring flex items-center gap-2 rounded-xl border-2 border-ink px-3 py-2.5 text-left ${
              active ? 'bg-ink text-paper' : 'bg-surface text-ink'
            }`}
          >
            <span className="flex shrink-0 -space-x-1" aria-hidden>
              {t.swatches.map((c, i) => (
                <span
                  key={i}
                  className="size-4 rounded-full border-2 border-ink"
                  style={{ backgroundColor: c }}
                />
              ))}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
              {t.name}
            </span>
            {active && <CheckIcon width={16} height={16} className="shrink-0" />}
          </button>
        )
      })}
    </div>
  )
}
