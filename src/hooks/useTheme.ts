import { useEffect, useState } from 'react'
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  applyTheme,
  isThemeId,
} from '../lib/themes'

function readStored(): string {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemeId(v) ? v : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

// Reads/sets the active color theme, persisting the choice and applying it to
// the document root. A small inline script in index.html applies the stored
// theme before first paint (no flash); this keeps it in sync at runtime.
export function useTheme() {
  const [theme, setThemeState] = useState(readStored)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  function setTheme(id: string) {
    setThemeState(id)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id)
    } catch {
      // Private mode / storage disabled — the theme still applies for this
      // session via the effect above.
    }
  }

  return { theme, setTheme }
}
