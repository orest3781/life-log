import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
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
  counts: Map<string, number>
  totalCount: number
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

const Chip = forwardRef<
  HTMLButtonElement,
  {
    active: boolean
    onClick: () => void
    small?: boolean
    /** Category color — when set, the chip shows a color dot and tints when active. */
    color?: string
    count?: number
    children: ReactNode
  }
>(function Chip({ active, onClick, small, color, count, children }, ref) {
  const tinted = color !== undefined
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={active}
      onClick={() => {
        haptic.select()
        onClick()
      }}
      style={tinted && active ? { backgroundColor: `${color}33` } : undefined}
      className={`tap-ring inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border-2 border-ink font-semibold transition-colors ${
        small ? 'min-h-9 px-3 text-xs' : 'min-h-11 px-3.5 text-sm'
      } ${active && !tinted ? 'bg-ink text-paper' : 'bg-surface text-ink'}`}
    >
      {tinted && (
        <span
          aria-hidden
          className="size-2.5 shrink-0 rounded-full border border-ink"
          style={{ backgroundColor: color }}
        />
      )}
      {children}
      {count !== undefined && (
        <span className="font-medium opacity-60">{count}</span>
      )}
    </button>
  )
})

// A horizontal chip scroller that fades whichever edge still has hidden
// content, so it's clear more chips exist off-screen.
function ScrollRow({
  className = '',
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ left: false, right: false })

  const update = useCallback(() => {
    const el = outer.current
    if (!el) return
    setEdges({
      left: el.scrollLeft > 1,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    })
  }, [])

  useEffect(() => {
    const el = outer.current
    const content = inner.current
    if (!el || !content) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(content)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [update])

  const fade = '20px'
  const left = edges.left ? `transparent 0, #000 ${fade}` : '#000 0'
  const right = edges.right ? `#000 calc(100% - ${fade}), transparent 100%` : '#000 100%'
  const mask = `linear-gradient(to right, ${left}, ${right})`

  return (
    <div
      ref={outer}
      className={`no-scrollbar -mx-1 overflow-x-auto ${className}`}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      <div ref={inner} className="flex items-center gap-2 px-1">
        {children}
      </div>
    </div>
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
  counts,
  totalCount,
}: SearchBarProps) {
  // Keep the active category chip visible — scroll it into view when selected.
  const activeChipRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    activeChipRef.current?.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }, [activeCategoryId])

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
          <ScrollRow className="mb-2">
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
          </ScrollRow>
        </div>
      )}
      {categories.length > 0 && (
        <ScrollRow className="pb-1">
          <Chip
            ref={activeCategoryId === null ? activeChipRef : undefined}
            active={!activeCategoryId}
            count={totalCount}
            onClick={() => onSelectCategory(null)}
          >
            All
          </Chip>
          {categories.map((c) => (
            <Chip
              key={c.id}
              ref={activeCategoryId === c.id ? activeChipRef : undefined}
              active={activeCategoryId === c.id}
              color={c.color}
              count={counts.get(c.id) ?? 0}
              onClick={() => onSelectCategory(c.id)}
            >
              {c.emoji} {c.name}
            </Chip>
          ))}
        </ScrollRow>
      )}
    </div>
  )
}
