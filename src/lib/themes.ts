// Selectable color themes. The actual token values live in index.css under
// :root[data-theme='<id>'] (each with a light + dark variant); here we keep the
// metadata the picker needs plus a small swatch preview (light paper · accent ·
// ink). Bone & Teal is the default and uses the base :root tokens (no attribute).

export interface ThemeMeta {
  id: string
  name: string
  /** Preview swatches: [paper, accent, ink] in the theme's light variant. */
  swatches: [string, string, string]
}

export const THEMES: ThemeMeta[] = [
  { id: 'bone', name: 'Bone & Teal', swatches: ['#e7e0d1', '#356b5e', '#241f1a'] },
  { id: 'slate', name: 'Slate & Amber', swatches: ['#e3e6ea', '#8a5a17', '#1f242c'] },
  { id: 'coral', name: 'Ink & Coral', swatches: ['#f0e8e1', '#a8432e', '#2a2320'] },
  { id: 'indigo', name: 'Indigo & Gold', swatches: ['#e3e2ec', '#7a6212', '#20212e'] },
  { id: 'mono', name: 'Mono', swatches: ['#e8e8e6', '#161614', '#6f6f6b'] },
]

export const DEFAULT_THEME = 'bone'
export const THEME_STORAGE_KEY = 'waystone-theme'

export function isThemeId(value: unknown): value is string {
  return typeof value === 'string' && THEMES.some((t) => t.id === value)
}

// Apply a theme by toggling the root data-theme attribute. The default theme
// uses the base tokens, so we clear the attribute rather than set it. Also sync
// the browser chrome color (address/status bar) to the theme's paper.
export function applyTheme(id: string): void {
  const root = document.documentElement
  if (id === DEFAULT_THEME) root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', id)

  const paper = getComputedStyle(root).getPropertyValue('--color-paper').trim()
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta && paper) meta.setAttribute('content', paper)
}
