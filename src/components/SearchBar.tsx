import type { EntrySort } from '../hooks/useEntries'
import type { Category } from '../types'
import { haptic } from '../lib/haptics'

interface SearchBarProps {
  searchOpen: boolean
  search: string
  onSearchChange: (value: string) => void
  categories: Category[]
  activeCategoryId: string | null
  onSelectCategory: (id: string | null) => void
  sort: EntrySort
  onSortChange: (sort: EntrySort) => void
  olderThanDays: number | null
  onOlderThanChange: (days: number | null) => void
}

function Chip({
  active,
  onClick,
  small,
  children,
}: {
  active: boolean
  onClick: () => void
  small?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={() => {
        haptic.select()
        onClick()
      }}
      className={`tap-ring inline-flex shrink-0 items-center justify-center rounded-full border-2 border-ink font-semibold transition-colors ${
        small ? 'min-h-9 px-3 text-xs' : 'min-h-11 px-3.5 text-sm'
      } ${active ? 'bg-ink text-paper' : 'bg-surface text-ink'}`}
    >
      {children}
    </button>
  )
}

const AGE_OPTIONS: Array<{ label: string; days: number | null }> = [
  { label: 'Any age', days: null },
  { label: '1w+', days: 7 },
  { label: '1mo+', days: 30 },
  { label: '1y+', days: 365 },
]

// The lookup controls: a toggleable text search, sort + age filters (shown with
// search), and a horizontal row of category filter chips.
export function SearchBar({
  searchOpen,
  search,
  onSearchChange,
  categories,
  activeCategoryId,
  onSelectCategory,
  sort,
  onSortChange,
  olderThanDays,
  onOlderThanChange,
}: SearchBarProps) {
  return (
    <div className="px-5 pt-1">
      {searchOpen && (
        <div className="anim-expand">
          <input
            autoFocus
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search your log…"
            className="tap-ring mb-2 w-full rounded-xl border-2 border-ink bg-surface px-4 py-2.5 text-[15px] text-ink outline-none placeholder:text-faint"
          />
          <div className="no-scrollbar -mx-1 mb-2 flex items-center gap-2 overflow-x-auto px-1">
            <Chip
              small
              active={sort === 'oldest'}
              onClick={() =>
                onSortChange(sort === 'oldest' ? 'newest' : 'oldest')
              }
            >
              {sort === 'oldest' ? 'Oldest first' : 'Newest first'}
            </Chip>
            <span className="text-faint">·</span>
            {AGE_OPTIONS.map((o) => (
              <Chip
                key={o.label}
                small
                active={olderThanDays === o.days}
                onClick={() => onOlderThanChange(o.days)}
              >
                {o.label}
              </Chip>
            ))}
          </div>
        </div>
      )}
      {categories.length > 0 && (
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <Chip active={!activeCategoryId} onClick={() => onSelectCategory(null)}>
            All
          </Chip>
          {categories.map((c) => (
            <Chip
              key={c.id}
              active={activeCategoryId === c.id}
              onClick={() => onSelectCategory(c.id)}
            >
              {c.emoji} {c.name}
            </Chip>
          ))}
        </div>
      )}
    </div>
  )
}
