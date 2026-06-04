import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Photo } from '../types'

export interface EntryThumb {
  url: string
  count: number
}

// One subscription for the whole ledger: maps each entry id to its first
// photo's thumbnail URL + photo count. Replaces a per-row usePhotos() (which
// opened one live query per visible card) and renders from the small thumb
// blob rather than the full-size image.
export function useEntryThumbnails(): Map<string, EntryThumb> {
  const photos = useLiveQuery(() => db.photos.toArray(), [])
  const [map, setMap] = useState<Map<string, EntryThumb>>(new Map())

  useEffect(() => {
    const byEntry = new Map<string, Photo[]>()
    for (const p of photos ?? []) {
      const list = byEntry.get(p.entryId) ?? []
      list.push(p)
      byEntry.set(p.entryId, list)
    }

    const next = new Map<string, EntryThumb>()
    const urls: string[] = []
    for (const [entryId, list] of byEntry) {
      list.sort((a, b) => a.createdAt - b.createdAt)
      const first = list[0]
      const url = URL.createObjectURL(first.thumb ?? first.blob)
      urls.push(url)
      next.set(entryId, { url, count: list.length })
    }
    // Object URLs are browser resources we must create here and revoke on
    // cleanup, then hand to render via state — a legitimate effect setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMap(next)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [photos])

  return map
}
