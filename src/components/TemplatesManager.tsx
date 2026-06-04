import { Sheet } from './Sheet'
import { TrashIcon } from './icons'
import { deleteTemplate } from '../db/repo'
import type { Category, Template } from '../types'

interface TemplatesManagerProps {
  templates: Template[]
  categoriesById: Map<string, Category>
  onClose: () => void
}

export function TemplatesManager({
  templates,
  categoriesById,
  onClose,
}: TemplatesManagerProps) {
  return (
    <Sheet title="Quick-log templates" onClose={onClose}>
      {templates.length === 0 ? (
        <p className="py-10 text-center text-[15px] leading-relaxed text-muted">
          No templates yet. In the new-entry sheet, tap “Save as quick-log” to
          turn a title + category into a one-tap preset.
        </p>
      ) : (
        <ul className="flex flex-col gap-2 py-2">
          {templates.map((t) => {
            const c = categoriesById.get(t.categoryId)
            return (
              <li
                key={t.id}
                className="brut-sm flex items-center justify-between bg-surface px-4 py-3"
              >
                <span className="flex min-w-0 items-center gap-2 text-[15px] text-ink">
                  {c && <span aria-hidden>{c.emoji}</span>}
                  <span className="truncate">{t.title}</span>
                </span>
                <button
                  type="button"
                  onClick={() => deleteTemplate(t.id)}
                  aria-label={`Delete ${t.title}`}
                  className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:text-danger"
                >
                  <TrashIcon width={16} height={16} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Sheet>
  )
}
