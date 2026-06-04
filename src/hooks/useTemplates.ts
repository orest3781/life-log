import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Template } from '../types'

// Saved quick-log presets, in manual order. Undefined until first load.
export function useTemplates(): Template[] | undefined {
  return useLiveQuery(() => db.templates.orderBy('order').toArray(), [])
}
