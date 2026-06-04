import { useMemo } from 'react'
import { Sheet } from './Sheet'
import { CategoryChip } from './CategoryChip'
import { useEntries } from '../hooks/useEntries'
import { computeInsights, formatCadence } from '../lib/insights'
import type { Category } from '../types'

interface InsightsSheetProps {
  categories: Category[]
  now: number
  onClose: () => void
}

function cellClass(n: number): string {
  if (n <= 0) return 'bg-surface-2'
  if (n === 1) return 'bg-accent/40'
  if (n === 2) return 'bg-accent/70'
  return 'bg-accent'
}

// Read-only analytics: totals, a 12-week activity heatmap, and per-category
// frequency ("~every N days") — surfacing the rhythm hidden in the ledger.
export function InsightsSheet({ categories, now, onClose }: InsightsSheetProps) {
  const entries = useEntries({})
  const insights = useMemo(
    () => computeInsights(entries ?? [], now),
    [entries, now],
  )
  const byId = useMemo(() => {
    const m = new Map<string, Category>()
    categories.forEach((c) => m.set(c.id, c))
    return m
  }, [categories])

  if (insights.total === 0) {
    return (
      <Sheet title="Insights" onClose={onClose}>
        <p className="py-10 text-center text-muted">
          Log a few things and your patterns will show up here.
        </p>
      </Sheet>
    )
  }

  return (
    <Sheet title="Insights" onClose={onClose}>
      <div className="flex flex-col gap-5 py-2">
        <div className="flex gap-3">
          <Stat label="Total" value={insights.total} />
          <Stat label="This month" value={insights.thisMonth} />
        </div>

        <div>
          <Label>Last 12 weeks</Label>
          <div className="flex gap-1">
            {Array.from({ length: 12 }).map((_, c) => (
              <div key={c} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, r) => (
                  <div
                    key={r}
                    className={`size-3.5 rounded-[3px] border border-line ${cellClass(
                      insights.heatmap[c * 7 + r],
                    )}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>By category</Label>
          <ul className="flex flex-col gap-2">
            {insights.perCategory.map((pc) => {
              const c = byId.get(pc.categoryId)
              return (
                <li
                  key={pc.categoryId}
                  className="brut-sm flex items-center justify-between bg-surface px-4 py-2.5"
                >
                  {c ? (
                    <CategoryChip category={c} />
                  ) : (
                    <span className="text-sm text-muted">Removed</span>
                  )}
                  <span className="text-sm text-muted">
                    {pc.count} · {formatCadence(pc.avgGapDays)}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </Sheet>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="brut-sm flex-1 bg-surface px-4 py-3">
      <div className="font-display text-3xl font-bold tracking-tight text-ink">
        {value}
      </div>
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
      {children}
    </div>
  )
}
