import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  downloadBackup,
  ensureBackupFolder,
  findBackup,
  uploadBackup,
} from './drive'

interface Call {
  url: string
  init?: RequestInit
}

let calls: Call[] = []
let queue: unknown[] = []

const ok = (obj: unknown) => ({
  ok: true,
  status: 200,
  json: async () => obj,
  text: async () => '',
})
const okBlob = (b: Blob) => ({ ok: true, status: 200, blob: async () => b })

const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
  calls.push({ url, init })
  if (queue.length === 0) throw new Error(`unexpected fetch: ${url}`)
  return queue.shift()
})

beforeEach(() => {
  calls = []
  queue = []
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('ensureBackupFolder', () => {
  it('returns the existing Waystone folder without creating one', async () => {
    queue = [ok({ files: [{ id: 'folder-1' }] })]
    expect(await ensureBackupFolder('tok')).toBe('folder-1')
    expect(calls).toHaveLength(1)
    expect((calls[0].init?.headers as Record<string, string>).Authorization).toBe(
      'Bearer tok',
    )
  })

  it('migrates a legacy "LifeLog" folder by renaming it', async () => {
    queue = [
      ok({ files: [] }), // no Waystone folder
      ok({ files: [{ id: 'legacy-1', name: 'LifeLog' }] }), // legacy folder found
      ok({}), // PATCH rename
    ]
    expect(await ensureBackupFolder('tok')).toBe('legacy-1')
    expect(calls[2].init?.method).toBe('PATCH')
    expect(calls[2].url).toContain('/legacy-1')
    expect(calls[2].init?.body).toContain('Waystone')
  })

  it('creates a fresh folder when neither name exists', async () => {
    queue = [ok({ files: [] }), ok({ files: [] }), ok({ id: 'new-folder' })]
    expect(await ensureBackupFolder('tok')).toBe('new-folder')
    expect(calls[2].init?.method).toBe('POST')
  })
})

describe('findBackup', () => {
  it('returns null when neither current nor legacy backup exists', async () => {
    queue = [ok({ files: [] }), ok({ files: [] })]
    expect(await findBackup('tok', 'folder-1')).toBeNull()
  })
})

describe('uploadBackup', () => {
  it('overwrites the current backup with a PATCH media upload', async () => {
    queue = [
      ok({ files: [{ id: 'folder-1' }] }), // ensureBackupFolder (Waystone exists)
      ok({ files: [{ id: 'backup-1', name: 'waystone-backup.zip' }] }), // findBackup
      ok({}), // PATCH media
    ]
    await uploadBackup('tok', new Blob(['data']))
    expect(calls[2].init?.method).toBe('PATCH')
    expect(calls[2].url).toContain('/backup-1?uploadType=media')
  })

  it('renames a legacy backup before updating it', async () => {
    queue = [
      ok({ files: [{ id: 'folder-1' }] }), // folder
      ok({ files: [] }), // no waystone-backup.zip
      ok({ files: [{ id: 'backup-1', name: 'lifelog-backup.zip' }] }), // legacy found
      ok({}), // PATCH rename (metadata)
      ok({}), // PATCH media
    ]
    await uploadBackup('tok', new Blob(['data']))
    expect(calls[3].init?.method).toBe('PATCH')
    expect(calls[3].init?.body).toContain('waystone-backup.zip')
    expect(calls[4].url).toContain('/backup-1?uploadType=media')
  })

  it('creates a new backup with a multipart upload when none exists', async () => {
    queue = [
      ok({ files: [{ id: 'folder-1' }] }), // folder
      ok({ files: [] }), // no waystone-backup.zip
      ok({ files: [] }), // no legacy
      ok({ id: 'backup-2' }), // POST
    ]
    await uploadBackup('tok', new Blob(['data']))
    expect(calls[3].init?.method).toBe('POST')
    expect(calls[3].url).toContain('uploadType=multipart')
  })
})

describe('downloadBackup', () => {
  it('returns the backup blob when one exists', async () => {
    queue = [
      ok({ files: [{ id: 'folder-1' }] }), // folder
      ok({ files: [{ id: 'backup-1', name: 'waystone-backup.zip' }] }), // findBackup
      okBlob(new Blob(['the backup'])),
    ]
    const blob = await downloadBackup('tok')
    expect(blob).not.toBeNull()
    expect(await blob!.text()).toBe('the backup')
  })

  it('returns null when there is no backup yet', async () => {
    queue = [
      ok({ files: [{ id: 'folder-1' }] }), // folder
      ok({ files: [] }), // no current
      ok({ files: [] }), // no legacy
    ]
    expect(await downloadBackup('tok')).toBeNull()
  })
})
