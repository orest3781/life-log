import { useMemo, useState } from 'react'
import { useNow } from '../hooks/useNow'
import { useCategories } from '../hooks/useCategories'
import { useEntries } from '../hooks/useEntries'
import { useDueReminders } from '../hooks/useDueReminders'
import { useEntryThumbnails } from '../hooks/useEntryThumbnails'
import { useCategoryStatus } from '../hooks/useCategoryStatus'
import { visibleCategories } from '../lib/categories'
import { completeReminder } from '../db/repo'
import { DueStrip } from './DueStrip'
import { EntryRow } from './EntryRow'
import { SearchBar } from './SearchBar'
import { LogSheet } from './LogSheet'
import { EntryDetail } from './EntryDetail'
import { SettingsSheet } from './SettingsSheet'
import { CategoryManager } from './CategoryManager'
import { InstallBanner } from './InstallBanner'
import { SummarySheet } from './SummarySheet'
import { InsightsSheet } from './InsightsSheet'
import { WaystoneMark } from './WaystoneMark'
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
  | { kind: 'categories' }

export function LedgerScreen() {
  const now = useNow()
  const categories = useCategories()
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [view, setView] = useState<View>({ kind: 'none' })

  const entries = useEntries({ search, categoryId })
  const due = useDueReminders(now)
  const thumbnails = useEntryThumbnails()
  const categoryStatus = useCategoryStatus(now)
  const overdueCount = useMemo(
    () => [...categoryStatus.values()].filter((s) => s.overdue).length,
    [categoryStatus],
  )

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
  const filtering = search.trim() !== '' || categoryId !== null

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b-2 border-ink bg-paper px-5 py-3">
        <h1 className="flex flex-1 items-center gap-2 font-display text-2xl font-bold tracking-tight text-ink">
          <WaystoneMark size={26} />
          Waystone
        </h1>
        <button
          type="button"
          aria-label={
            overdueCount > 0 ? `Last done (${overdueCount} overdue)` : 'Last done'
          }
          onClick={() => setView({ kind: 'summary' })}
          className="brut-press relative grid size-10 place-items-center rounded-full border-2 border-ink bg-surface text-ink"
        >
          <ClockIcon width={20} height={20} />
          {overdueCount > 0 && (
            <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full border-2 border-ink bg-danger text-[9px] font-bold text-white">
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
            if (searchOpen) setSearch('')
          }}
          className={`brut-press grid size-10 place-items-center rounded-full border-2 border-ink ${
            searchOpen ? 'bg-accent text-white' : 'bg-surface text-ink'
          }`}
        >
          <SearchIcon width={20} height={20} />
        </button>
        <button
          type="button"
          aria-label="Settings"
          onClick={() => setView({ kind: 'settings' })}
          className="brut-press grid size-10 place-items-center rounded-full border-2 border-ink bg-surface text-ink"
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
      />

      {due && (
        <DueStrip
          entries={due}
          categoriesById={categoriesById}
          onOpen={(entry) => setView({ kind: 'detail', entry })}
          onMarkDone={(entry) => completeReminder(entry)}
        />
      )}

      {/* Ledger */}
      <main className="flex-1 pb-28 pt-2">
        {loading ? null : entries.length === 0 ? (
          <EmptyState filtering={filtering} />
        ) : (
          <ul className="flex flex-col gap-3 px-5">
            {entries.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                category={categoriesById.get(entry.categoryId)}
                thumb={thumbnails.get(entry.id)}
                now={now}
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
            onClick={() => setView({ kind: 'create' })}
            className="brut-press pointer-events-auto grid size-16 place-items-center rounded-full border-[3px] border-ink bg-accent text-white shadow-[5px_5px_0_var(--color-ink)]"
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
      {view.kind === 'settings' && (
        <SettingsSheet
          onClose={() => setView({ kind: 'none' })}
          onOpenCategories={() => setView({ kind: 'categories' })}
          onOpenInsights={() => setView({ kind: 'insights' })}
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
