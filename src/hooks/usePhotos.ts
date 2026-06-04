import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Photo, PhotoWithUrl } from '../types'

// Live photos for an entry, each paired with an object URL for rendering.
// URLs are created and revoked here so consumers never leak them.
export function usePhotos(entryId: string | null): PhotoWithUrl[] {
  const photos = useLiveQuery<Photo[]>(
    () =>
      entryId
        ? db.photos.where('entryId').equals(entryId).toArray()
        : Promise.resolve([] as Photo[]),
    [entryId],
  )

  const [withUrls, setWithUrls] = useState<PhotoWithUrl[]>([])
  useEffect(() => {
    const mapped = (photos ?? []).map((p) => ({
      ...p,
      url: URL.createObjectURL(p.blob),
    }))
    // Object URLs are browser resources we must create here and revoke on
    // cleanup, then hand to render via state — a legitimate effect setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWithUrls(mapped)
    return () => mapped.forEach((m) => URL.revokeObjectURL(m.url))
  }, [photos])

  return withUrls
}
