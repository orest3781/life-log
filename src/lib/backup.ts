import JSZip from 'jszip'
import { format } from 'date-fns'
import { db } from '../db/db'
import type { Category, Entry, Photo, Template } from '../types'

const MANIFEST_NAME = 'lifelog.json'
const APP_TAG = 'lifelog'
const FORMAT_VERSION = 1

interface PhotoMeta {
  id: string
  entryId: string
  width: number
  height: number
  createdAt: number
  path: string
  thumbPath?: string
  type: string
}

export interface ImportResult {
  categories: number
  entries: number
  photos: number
}

// Build a single .zip containing a JSON manifest plus every photo blob. This
// is the owned, portable, account-free backup the whole app rests on.
export async function exportAll(): Promise<Blob> {
  const [categories, entries, photos, templates] = await Promise.all([
    db.categories.toArray(),
    db.entries.toArray(),
    db.photos.toArray(),
    db.templates.toArray(),
  ])

  const zip = new JSZip()
  const photoMeta: PhotoMeta[] = []
  // Store each photo as an ArrayBuffer — the type JSZip handles identically in
  // every environment (browser and test runner alike).
  await Promise.all(
    photos.map(async (p) => {
      const path = `photos/${p.id}`
      zip.file(path, new Uint8Array(await p.blob.arrayBuffer()))
      let thumbPath: string | undefined
      if (p.thumb) {
        thumbPath = `thumbs/${p.id}`
        zip.file(thumbPath, new Uint8Array(await p.thumb.arrayBuffer()))
      }
      photoMeta.push({
        id: p.id,
        entryId: p.entryId,
        width: p.width,
        height: p.height,
        createdAt: p.createdAt,
        path,
        thumbPath,
        type: p.blob.type || 'image/jpeg',
      })
    }),
  )

  const manifest = {
    app: APP_TAG,
    version: FORMAT_VERSION,
    exportedAt: Date.now(),
    categories,
    entries,
    photos: photoMeta,
    templates,
  }
  zip.file(MANIFEST_NAME, JSON.stringify(manifest, null, 2))
  return zip.generateAsync({ type: 'blob' })
}

// Restore from a .zip produced by exportAll. Validates the manifest, then
// upserts everything (merge, not wipe) so an import never silently destroys
// data already on the device.
export async function importAll(file: Blob): Promise<ImportResult> {
  // Read to an ArrayBuffer first so JSZip never has to read a Blob directly
  // (its Blob path depends on FileReader and is environment-sensitive).
  const zip = await JSZip.loadAsync(new Uint8Array(await file.arrayBuffer()))
  const manifestFile = zip.file(MANIFEST_NAME)
  if (!manifestFile) {
    throw new Error('This isn’t a Waystone backup file.')
  }

  let manifest: {
    app?: string
    categories?: Category[]
    entries?: Entry[]
    photos?: PhotoMeta[]
    templates?: Template[]
  }
  try {
    manifest = JSON.parse(await manifestFile.async('string'))
  } catch {
    throw new Error('Backup file is corrupt (invalid JSON).')
  }
  if (manifest.app !== APP_TAG || !Array.isArray(manifest.entries)) {
    throw new Error('Unrecognized backup file.')
  }

  const categories = manifest.categories ?? []
  const entries = manifest.entries
  const templates = manifest.templates ?? []
  const photos: Photo[] = []
  for (const pm of manifest.photos ?? []) {
    const pf = zip.file(pm.path)
    if (!pf) continue
    // Read as ArrayBuffer and rebuild the Blob with its original MIME type so
    // it renders correctly — robust across browser and test environments.
    const buf = await pf.async('arraybuffer')
    const blob = new Blob([buf], { type: pm.type || 'image/jpeg' })
    let thumb: Blob | undefined
    if (pm.thumbPath) {
      const tf = zip.file(pm.thumbPath)
      if (tf) thumb = new Blob([await tf.async('arraybuffer')], { type: 'image/jpeg' })
    }
    photos.push({
      id: pm.id,
      entryId: pm.entryId,
      blob,
      thumb,
      width: pm.width,
      height: pm.height,
      createdAt: pm.createdAt,
    })
  }

  await db.transaction(
    'rw',
    db.categories,
    db.entries,
    db.photos,
    db.templates,
    async () => {
      if (categories.length) await db.categories.bulkPut(categories)
      await db.entries.bulkPut(entries)
      if (photos.length) await db.photos.bulkPut(photos)
      if (templates.length) await db.templates.bulkPut(templates)
    },
  )

  return {
    categories: categories.length,
    entries: entries.length,
    photos: photos.length,
  }
}

// Trigger a browser download of a backup blob with a dated filename.
export function downloadBackup(blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lifelog-backup-${format(Date.now(), 'yyyy-MM-dd')}.zip`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
