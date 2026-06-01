import type { Category } from '../types'

interface SearchBarProps {
  searchOpen: boolean
  search: string
  onSearchChange: (value: string) => void
  categories: Category[]
  activeCategoryId: string | null
  onSelectCategory: (id: string | null) => void
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border-2 border-ink px-3 py-1.5 text-sm font-semibold transition-colors ${
        active ? 'bg-ink text-paper' : 'bg-surface text-ink'
      }`}
    >
      {children}
    </button>
  )
}

// The lookup controls: a toggleable text search plus a horizontal row of
// category filter chips. Together they answer "when did I last X".
export function SearchBar({
  searchOpen,
  search,
  onSearchChange,
  categories,
  activeCategoryId,
  onSelectCategory,
}: SearchBarProps) {
  return (
    <div className="px-5 pt-1">
      {searchOpen && (
        <input
          autoFocus
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search your log…"
          className="mb-2 w-full rounded-xl border-2 border-ink bg-surface px-4 py-2.5 text-[15px] text-ink outline-none placeholder:text-faint"
        />
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
