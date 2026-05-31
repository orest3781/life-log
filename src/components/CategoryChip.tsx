import type { Category } from '../types'

// A compact, tinted pill showing a category's emoji + name in its own color.
export function CategoryChip({
  category,
  className = '',
}: {
  category: Category
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
      style={{ backgroundColor: category.color + '24', color: category.color }}
    >
      <span aria-hidden>{category.emoji}</span>
      <span>{category.name}</span>
    </span>
  )
}
