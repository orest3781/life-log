import type { Category } from '../types'

// A compact, tinted pill with a chunky ink outline showing a category's
// emoji + name.
export function CategoryChip({
  category,
  className = '',
}: {
  category: Category
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-2 border-ink px-2 py-0.5 text-xs font-semibold text-ink ${className}`}
      style={{ backgroundColor: category.color + '40' }}
    >
      <span aria-hidden>{category.emoji}</span>
      <span>{category.name}</span>
    </span>
  )
}
