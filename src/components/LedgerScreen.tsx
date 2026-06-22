import { useMemo, useState } from 'react'
import { useNow } from '../hooks/useNow'
import { useCategories } from '../hooks/useCategories'
import { useEntries, type EntrySort } from '../hooks/useEntries'
import { useDueReminders } from '../hooks/useDueReminders'
import { useUpcomingReminders } from '../hooks/useUpcomingReminders'
import { useEntryThumbnails } from '../hooks/useEntryThumbnails'
import { useCategoryStatus } from '../hooks/useCategoryStatus'
import { useCategoryCounts } from '../hooks/useCategoryCounts'
import { visibleCategories } from '../lib/categories'
import { completeReminder, quickLog } from '../db/repo'
import { useToast } from './Toast'
import { OverviewCard, type OverdueItem } from './OverviewCard'
import { EntryRow } from './EntryRow'
import { SearchBar } from './SearchBar'
import { LogSheet } from './LogSheet'
import { EntryDetail } from './EntryDetail'
import { SettingsSheet } from './SettingsSheet'
import { CategoryManager } from './CategoryManager'
import { InstallBanner } from './InstallBanner'
import { SummarySheet } from './SummarySheet'
import { InsightsSheet } from './InsightsSheet'
import { QuickLogBar } from './QuickLogBar'
import { TemplatesManager } from './TemplatesManager'
import { LedgerSkeleton } from './LedgerSkeleton'
import { useTemplates } from '../hooks/useTemplates'
import { WaystoneMark } from './WaystoneMark'
import { haptic } from '../lib/haptics'
import { ClockIcon, GearIcon, PlusIcon, SearchIcon } from './icons'
import type { Category, Entry } from '../types'

type View =
  | { kind: 'none' }
  | { kind: 'create' }
  | { kind: 'edit'; entry: Entry }
  | { kind: 'detail'; entry: Entry }
  | { kind: 'settings' }
  | { kind: 'summary' }
  | { kind: 'insights' }
  | { kind: 'templates' }
  | { kind: 'categories' }

export function LedgerScreen() {
  const now = useNow()
  const toast = useToast()
  const categories = useCategories()
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [sort, setSort] = useState<EntrySort>('newest')
  const [olderThanDays, setOlderThanDays] = useState<number | null>(null)
  const [view, setView] = useState<View>({ kind: 'none' })

  const entries = useEntries({ search, categoryId, sort, olderThanDays })
  const due = useDueReminders(now)
  const upcoming = useUpcomingReminders(now)
  const thumbnails = useEntryThumbnails()
  const templates = useTemplates()
  const categoryStatus = useCategoryStatus(now)
  const categoryCounts = useCategoryCounts()
  const overdueCount = useMemo(
    () => [...categoryStatus.values()].filter((s) => s.overdue).length,
    [categoryStatus],
  )

  // Cadence-overdue categories, surfaced in the overview at the top of the
  // ledger (no longer hidden behind the clock).
  const overdueItems = useMemo<OverdueItem[]>(() => {
    if (!categories) return []
    return visibleCategories(categories)
      .map((c) => {
        const s = categoryStatus.get(c.id)
        return s?.overdue && s.lastOccurredAt !== null
          ? {
              category: c,
              lastOccurredAt: s.lastOccurredAt,
              lastTitle: s.lastTitle,
            }
          : null
      })
      .filter((x): x is OverdueItem => x !== null)
  }, [categories, categoryStatus])

  async function handleRelog(item: OverdueItem) {
    if (!item.lastTitle) return
    await quickLog(item.lastTitle, item.category.id)
    haptic.tap()
    toast.show(`Logged “${item.lastTitle}” — now`)
  }

  const categoriesById = useMemo(() => {
    const map = new Map<string, Category>()
    categories?.forEach((c) => map.set(c.id, c))
    return map
  }, [categories])

  const filterCategories = useMemo(
    () => (categories ? visibleCategories(categories) : []),
    [categories],
  )

  const loading = categories === undefined || entries === undefined
  const filtering =
    search.trim() !== '' || categoryId !== null || olderThanDays !== null

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b-2 border-ink bg-paper px-5 py-3">
        <h1 className="flex flex-1 items-center gap-2 t-title text-ink">
          <WaystoneMark size={26} />
          Waystone
        </h1>
        <button
          type="button"
          aria-label={
            overdueCount > 0 ? `Last done (${overdueCount} overdue)` : 'Last done'
          }
          onClick={() => setView({ kind: 'summary' })}
          className={`brut-press tap-ring relative grid size-11 place-items-center rounded-full border-2 border-ink ${
            overdueCount > 0 ? 'bg-danger-soft text-danger' : 'bg-surface text-ink'
          }`}
        >
          <ClockIcon width={20} height={20} />
          {overdueCount > 0 && (
            <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border-2 border-ink bg-danger text-[10px] font-bold text-on-danger">
              {overdueCount}
            </span>
          )}
        </button>
        <button
          type="button"
          aria-label="Search"
          aria-pressed={searchOpen}
          onClick={() => {
            setSearchOpen((v) => !v)
            if (searchOpen) {
              setSearch('')
              setSort('newest')
              setOlderThanDays(null)
            }
          }}
          className={`brut-press tap-ring grid size-11 place-items-center rounded-full border-2 border-ink ${
            searchOpen ? 'bg-accent text-on-accent' : 'bg-surface text-ink'
          }`}
        >
          <SearchIcon width={20} height={20} />
        </button>
        <button
          type="button"
          aria-label="Settings"
          onClick={() => setView({ kind: 'settings' })}
          className="brut-press tap-ring grid size-11 place-items-center rounded-full border-2 border-ink bg-surface text-ink"
        >
          <GearIcon width={20} height={20} />
        </button>
      </header>

      <InstallBanner />

      <SearchBar
        searchOpen={searchOpen}
        search={search}
        onSearchChange={setSearch}
        categories={filterCategories}
        activeCategoryId={categoryId}
        onSelectCategory={setCategoryId}
        sort={sort}
        onSortChange={setSort}
        olderThanDays={olderThanDays}
        onOlderThanChange={setOlderThanDays}
        counts={categoryCounts.byCategory}
        totalCount={categoryCounts.total}
      />

      <OverviewCard
        overdue={overdueItems}
        due={due ?? []}
        upcoming={upcoming ?? []}
        categoriesById={categoriesById}
        now={now}
        onOpenEntry={(entry) => setView({ kind: 'detail', entry })}
        onPickCategory={(id) => setCategoryId(id)}
        onRelog={handleRelog}
        onMarkDone={(entry) => completeReminder(entry)}
      />

      {templates && (
        <QuickLogBar templates={templates} categoriesById={categoriesById} />
      )}

      {/* Ledger */}
      <main className="flex-1 pb-28 pt-2">
        {loading ? (
          <LedgerSkeleton />
        ) : entries.length === 0 ? (
          <EmptyState filtering={filtering} />
        ) : (
          <ul className="flex flex-col gap-3 px-5">
            {entries.map((entry, i) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                category={categoriesById.get(entry.categoryId)}
                thumb={thumbnails.get(entry.id)}
                now={now}
                animDelayMs={Math.min(i, 6) * 30}
                onOpen={(e) => setView({ kind: 'detail', entry: e })}
              />
            ))}
          </ul>
        )}
      </main>

      {/* Floating log button, aligned to the column */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30">
        <div
          className="mx-auto flex max-w-md justify-end px-5"
          style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            aria-label="Log something"
            onClick={() => {
              haptic.select()
              setView({ kind: 'create' })
            }}
            className="brut-press tap-ring pointer-events-auto grid size-16 place-items-center rounded-full border-[3px] border-ink bg-accent text-on-accent shadow-[5px_5px_0_var(--color-ink)]"
          >
            <PlusIcon width={28} height={28} />
          </button>
        </div>
      </div>

      {/* Overlays */}
      {view.kind === 'create' && categories && (
        <LogSheet
          mode="create"
          categories={categories}
          defaultCategoryId={categoryId}
          onClose={() => setView({ kind: 'none' })}
        />
      )}
      {view.kind === 'edit' && categories && (
        <LogSheet
          mode="edit"
          entry={view.entry}
          categories={categories}
          onClose={() => setView({ kind: 'none' })}
        />
      )}
      {view.kind === 'detail' && (
        <EntryDetail
          entry={view.entry}
          category={categoriesById.get(view.entry.categoryId)}
          now={now}
          onClose={() => setView({ kind: 'none' })}
          onEdit={(entry) => setView({ kind: 'edit', entry })}
        />
      )}
      {view.kind === 'summary' && categories && (
        <SummarySheet
          categories={categories}
          now={now}
          onClose={() => setView({ kind: 'none' })}
          onPick={(id) => {
            setCategoryId(id)
            setView({ kind: 'none' })
          }}
        />
      )}
      {view.kind === 'insights' && categories && (
        <InsightsSheet
          categories={categories}
          now={now}
          onClose={() => setView({ kind: 'settings' })}
        />
      )}
      {view.kind === 'templates' && templates && (
        <TemplatesManager
          templates={templates}
          categoriesById={categoriesById}
          onClose={() => setView({ kind: 'settings' })}
        />
      )}
      {view.kind === 'settings' && (
        <SettingsSheet
          onClose={() => setView({ kind: 'none' })}
          onOpenCategories={() => setView({ kind: 'categories' })}
          onOpenInsights={() => setView({ kind: 'insights' })}
          onOpenTemplates={() => setView({ kind: 'templates' })}
        />
      )}
      {view.kind === 'categories' && categories && (
        <CategoryManager
          categories={categories}
          onClose={() => setView({ kind: 'settings' })}
        />
      )}
    </div>
  )
}

function EmptyState({ filtering }: { filtering: boolean }) {
  if (filtering) {
    return (
      <div className="px-8 py-20 text-center text-muted">
        Nothing matches that.
      </div>
    )
  }
  return (
    <div className="px-8 py-24 text-center">
      <div className="font-display text-xl font-bold text-ink">
        Nothing marked yet
      </div>
      <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-muted">
        Tap the <span className="font-semibold text-accent">+</span> button to
        mark what just happened. Later, you'll see exactly how long ago it was.
      </p>
    </div>
  )
}
