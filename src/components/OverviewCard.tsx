import { useState } from 'react'
import { CategoryChip } from './CategoryChip'
import { StatusPill } from './StatusPill'
import { AlertIcon, BellIcon, CheckIcon, ClockIcon, RotateIcon } from './icons'
import { formatElapsed } from '../lib/elapsed'
import type { Category, Entry } from '../types'

export interface OverdueItem {
  category: Category
  lastOccurredAt: number
  lastTitle: string | null
}

interface OverviewCardProps {
  overdue: OverdueItem[]
  due: Entry[]
  upcoming: Entry[]
  categoriesById: Map<string, Category>
  now: number
  onOpenEntry: (entry: Entry) => void
  onPickCategory: (id: string) => void
  onRelog: (item: OverdueItem) => void
  onMarkDone: (entry: Entry) => void
}

// The single "needs attention" glance at the top of the ledger: what's overdue
// (by cadence), what's due now (arrived reminders), and what's coming up. One
// calm card — answering "what should I look at?" the moment the app opens.
export function OverviewCard({
  overdue,
  due,
  upcoming,
  categoriesById,
  now,
  onOpenEntry,
  onPickCategory,
  onRelog,
  onMarkDone,
}: OverviewCardProps) {
  // Guard against a double-tap before the list re-renders without the item.
  const [relogged, setRelogged] = useState<Set<string>>(new Set())
  const [donePending, setDonePending] = useState<Set<string>>(new Set())

  if (overdue.length === 0 && due.length === 0 && upcoming.length === 0) {
    return null
  }

  return (
    <section className="px-5 pt-3">
      <div className="brut-sm flex flex-col divide-y-2 divide-line bg-surface-2">
        {overdue.length > 0 && (
          <div className="p-2">
            <Eyebrow tone="text-danger" icon={<AlertIcon width={13} height={13} aria-hidden />}>
              Overdue
            </Eyebrow>
            <ul className="flex flex-col gap-1">
              {overdue.map((item) => (
                <li key={item.category.id} className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onPickCategory(item.category.id)}
                    className="tap-ring min-w-0 flex-1 rounded-xl px-1.5 py-1.5 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <CategoryChip category={item.category} />
                      <StatusPill kind="overdue" />
                    </div>
                    <div className="mt-1 truncate text-xs text-muted">
                      {item.lastTitle ? `${item.lastTitle} · ` : ''}last done{' '}
                      {formatElapsed(item.lastOccurredAt, now)}
                    </div>
                  </button>
                  {item.lastTitle && (
                    <button
                      type="button"
                      onClick={() => {
                        if (relogged.has(item.category.id)) return
                        setRelogged((p) => new Set(p).add(item.category.id))
                        onRelog(item)
                      }}
                      disabled={relogged.has(item.category.id)}
                      aria-busy={relogged.has(item.category.id)}
                      aria-label={`Log ${item.category.name} again`}
                      className="brut-press tap-ring grid size-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-accent text-on-accent disabled:opacity-60"
                    >
                      <RotateIcon width={18} height={18} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {due.length > 0 && (
          <div className="p-2">
            <Eyebrow tone="text-accent" icon={<BellIcon width={13} height={13} aria-hidden />}>
              Due now
            </Eyebrow>
            <ul className="flex flex-col gap-1">
              {due.map((entry) => {
                const category = categoriesById.get(entry.categoryId)
                const pending = donePending.has(entry.id)
                return (
                  <li key={entry.id} className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenEntry(entry)}
                      className="tap-ring min-w-0 flex-1 rounded-xl px-1.5 py-1.5 text-left"
                    >
                      <div className="truncate text-[15px] font-medium text-ink">
                        {entry.title}
                      </div>
                      <div className="truncate text-xs text-muted">
                        {category
                          ? `${category.emoji} ${category.name}`
                          : 'Reminder'}{' '}
                        · check back
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (pending) return
                        setDonePending((p) => new Set(p).add(entry.id))
                        onMarkDone(entry)
                      }}
                      disabled={pending}
                      aria-busy={pending}
                      aria-label={`Mark "${entry.title}" done`}
                      className="brut-press tap-ring grid size-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-surface text-accent disabled:opacity-50"
                    >
                      <CheckIcon width={18} height={18} />
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="p-2">
            <Eyebrow tone="text-muted" icon={<ClockIcon width={13} height={13} aria-hidden />}>
              Coming up
            </Eyebrow>
            <ul className="flex flex-col gap-1">
              {upcoming.map((entry) => {
                const category = categoriesById.get(entry.categoryId)
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => onOpenEntry(entry)}
                      className="tap-ring flex w-full items-center gap-2 rounded-xl px-1.5 py-1.5 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] text-ink">
                          {entry.title}
                        </div>
                        <div className="truncate text-xs text-muted">
                          {category
                            ? `${category.emoji} ${category.name}`
                            : 'Reminder'}
                        </div>
                      </div>
                      {entry.remindAt !== undefined && (
                        <span className="shrink-0 text-xs font-semibold text-muted">
                          {formatElapsed(entry.remindAt, now)}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

function Eyebrow({
  tone,
  icon,
  children,
}: {
  tone: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className={`flex items-center gap-1.5 px-1.5 pb-1.5 t-eyebrow ${tone}`}>
      {icon}
      {children}
    </div>
  )
}
