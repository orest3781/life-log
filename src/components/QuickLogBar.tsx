import { useState } from 'react'
import { useToast } from './Toast'
import { PlusIcon } from './icons'
import { haptic } from '../lib/haptics'
import { logFromTemplate } from '../db/repo'
import type { Category, Template } from '../types'

interface QuickLogBarProps {
  templates: Template[]
  categoriesById: Map<string, Category>
}

// A horizontal row of saved presets. Tapping one logs it instantly with
// today's date — the genre's one-tap "I did it again" loop.
export function QuickLogBar({ templates, categoriesById }: QuickLogBarProps) {
  const toast = useToast()
  const [busy, setBusy] = useState<Set<string>>(new Set())

  if (templates.length === 0) return null

  async function log(t: Template) {
    if (busy.has(t.id)) return
    setBusy((prev) => new Set(prev).add(t.id))
    try {
      await logFromTemplate(t)
      haptic.tap()
      toast.show(`Logged “${t.title}” — now`)
    } finally {
      setBusy((prev) => {
        const next = new Set(prev)
        next.delete(t.id)
        return next
      })
    }
  }

  return (
    <div className="px-5 pt-3">
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {templates.map((t) => {
          const c = categoriesById.get(t.categoryId)
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => log(t)}
              disabled={busy.has(t.id)}
              aria-busy={busy.has(t.id)}
              className="brut-press tap-ring flex shrink-0 items-center gap-1 rounded-full border-2 border-ink bg-surface py-1.5 pl-2 pr-3 text-sm font-medium text-ink disabled:opacity-60"
            >
              <PlusIcon width={14} height={14} className="text-accent" />
              {c && <span aria-hidden>{c.emoji}</span>}
              {t.title}
            </button>
          )
        })}
      </div>
    </div>
  )
}
