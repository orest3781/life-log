# Cairn — Redesign & Rebrand Spec

## Context

LifeLog shipped as a calm, warm-paper local-first PWA (a five-second logbook where elapsed time is the headline). The owner wants a **distinctive visual identity** so the product stands apart, plus a **rebrand**. Through visual brainstorming we locked:

- **Direction:** Neo-brutalist — thick ink outlines, hard offset (blur-free) shadows, chunky rounded cards — in a **muted** palette (not the usual neon brutalism).
- **Palette:** "Bone & Teal" (warm paper bones + muted teal accent), keeping LifeLog's warm soul.
- **New name:** **Cairn** — stacked stones that mark a place and endure; ties to "mark the moment, find it later."

This spec is the canonical reference for the rebuild. Behavior/features are unchanged; this is identity + visual system.

## Brand

- **Name:** Cairn
- **Tagline:** "Mark the moment. Find it later."
- **Positioning line:** "A five-second logbook for your life — every entry tells you how long ago."
- **Voice:** warm, plainspoken, unfussy.
- **Mark:** a stack of 3 rounded stones (largest at bottom) — the cairn. App icon: teal rounded-square, cream stones with ink outline. Wordmark: "Cairn" in heavy display type, optionally preceded by the stone mark.

## Visual System

### Color tokens (light)
| token | value | use |
|---|---|---|
| `--color-paper` | `#e8e1d3` | app background (bone) |
| `--color-backdrop` | `#ddd4c2` | deeper bone behind cards/sheets |
| `--color-surface` | `#fbf8f1` | cards, sheets (cream) |
| `--color-surface-2` | `#efe9dc` | insets, muted fills |
| `--color-ink` | `#2a2622` | text, **all outlines + hard shadows** |
| `--color-muted` | `#6b6052` | secondary text |
| `--color-faint` | `#a89c86` | placeholders, hairlines |
| `--color-accent` | `#3f7d6e` | FAB, active states, brand teal |
| `--color-accent-soft` | `#d9e6e1` | due strip, accent fills |
| `--color-danger` | `#b5503a` | destructive (muted brick) |

Category palette (muted): dusty blue `#6f8fae`, sage `#7e9b6e`, clay `#c08457`, rose `#b06b86`, plum `#8a6fc0`. Starters re-tinted to these.

### Color tokens (dark, adapted)
Warm near-black bg `#1b1916`, surface `#262019`, ink/outline+shadow becomes warm bone `#e9e0cf` (light outlines on dark so the brutalist edges still read), accent `#4ea892`, danger `#d4795f`. Hard shadows use the bone ink color at low-ish presence.

### Typography
- **Display** (wordmark, elapsed time, headings): **Space Grotesk** (700/900) — geometric, characterful, distinctive.
- **UI / body:** **Inter** (400/500/600).
- Bundled via `@fontsource/space-grotesk` + `@fontsource/inter` so the PWA stays offline-capable.
- Elapsed time remains the largest element; rendered in Space Grotesk 700, tight tracking.

### Neo-brutalist primitives (CSS utility classes in `index.css`)
- `.brut` — `border: 3px solid var(--color-ink); border-radius: 18px; box-shadow: 5px 5px 0 var(--color-ink);`
- `.brut-sm` — 2.5px border, 14px radius, `3px 3px 0` shadow (entry cards, chips' container).
- `.brut-press` — on `:active`, `transform: translate(3px,3px)` and shadow shrinks to `2px 2px 0` (tactile press; disabled under `prefers-reduced-motion`).
- Borders/shadows are **always** `--color-ink`; color comes from fills, not lines.

## Components (restyle, same behavior)

- **Header:** "Cairn" wordmark (Space Grotesk 800) + stone mark; search/settings as chunky ink-outlined icon buttons.
- **Filter chips:** pill, 2px ink border; active = ink fill, paper text.
- **Entry rows → cards:** each entry becomes a `.brut-sm` cream card in a gapped vertical stack (not a flat divided list). Category chip (tinted, ink-outlined) + title + **big elapsed time** + muted date; photo thumb with ink outline. Whole card is the tap target with `.brut-press`.
- **DUE strip:** `.brut-sm` card in `--color-accent-soft`, heading "DUE", check buttons ink-outlined.
- **FAB:** circular, teal fill, ink border + hard shadow, `.brut-press`; "+" in Space Grotesk.
- **Sheets (Log / Detail / Settings / Categories):** top sheet panel gets a thick ink top border + large radius; inputs and buttons adopt `.brut-sm`. Bottom-sheet slide-up animation retained.
- **Install banner:** restyled to `.brut-sm`; slide-in timing retained.
- **Primary buttons** (Save, Connect, etc.): teal fill, ink outline, hard shadow, `.brut-press`. **Secondary:** surface-2 fill, ink outline.

## Rename surface (LifeLog → Cairn)
- `index.html` (title, apple title, theme-color → keep teal), `vite.config.ts` PWA manifest (`name`/`short_name` = "Cairn", description, `theme_color` `#3f7d6e`, `background_color` `#e8e1d3`).
- App copy: header, empty state, Settings → About, install banner.
- New `public/icon.svg`, `icon-maskable.svg`, `favicon.svg` = cairn stone mark.
- `README.md` title/wordmark, `package.json` `name` → `cairn`.
- **Invisible plumbing stays `lifelog` for compatibility** (not brand-facing): IndexedDB database name (renaming would orphan existing local data), backup manifest `app` tag + filename (`lifelog-backup.zip`), and the Drive folder name ("LifeLog"). Changing these would break existing local data, already-exported zips, and any connected Drive. Only brand-facing surfaces become Cairn.

## Out of scope / notes
- No feature/behavior changes. No data-model changes (DB name unchanged to preserve users' local data).
- Vercel project/domain rename (lifelog-lyart) is optional follow-up; the app brand is Cairn regardless.
- Dark mode adapted, not redesigned from scratch.

## Verification
- `npm run build` + `npm run test` (existing 30 tests must stay green; text assertions like "3 weeks ago" unaffected).
- Visual pass via Playwright at mobile width: ledger (with entries), log sheet, entry detail, settings, category manager, install banner, empty state — confirm brutalist cards, shadows, fonts, Cairn wordmark + icon, both light and dark.
- Confirm PWA manifest serves name "Cairn" and the new icons.
