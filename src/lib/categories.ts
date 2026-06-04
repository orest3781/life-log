import type { Category } from '../types'

// Manual display order — used in Settings and for the filter chips.
export function sortByOrder(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => a.order - b.order)
}

// Visible (non-archived) categories in manual order.
export function visibleCategories(categories: Category[]): Category[] {
  return sortByOrder(categories.filter((c) => !c.archived))
}

/**
 * Order for the log sheet's category picker, so the tap you're about to make
 * is usually first. Categories you've used recently lead; ties break by how
 * often you've used them; categories you've never used fall back to their
 * manual order. Archived categories are excluded.
 */
export function sortForPicker(categories: Category[]): Category[] {
  return categories
    .filter((c) => !c.archived)
    .sort((a, b) => {
      const aUsed = a.lastUsedAt !== null
      const bUsed = b.lastUsedAt !== null
      if (aUsed !== bUsed) return aUsed ? -1 : 1 // used categories first
      if (aUsed && bUsed) {
        if (b.lastUsedAt! !== a.lastUsedAt!) return b.lastUsedAt! - a.lastUsedAt! // recent first
        if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount // then frequent
      }
      return a.order - b.order // never-used: manual order
    })
}
