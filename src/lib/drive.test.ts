import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  downloadBackup,
  ensureLifelogFolder,
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

describe('ensureLifelogFolder', () => {
  it('returns the existing folder without creating one', async () => {
    queue = [ok({ files: [{ id: 'folder-1' }] })]
    expect(await ensureLifelogFolder('tok')).toBe('folder-1')
    expect(calls).toHaveLength(1)
    expect((calls[0].init?.headers as Record<string, string>).Authorization).toBe(
      'Bearer tok',
    )
  })

  it('creates the folder when none exists', async () => {
    queue = [ok({ files: [] }), ok({ id: 'new-folder' })]
    expect(await ensureLifelogFolder('tok')).toBe('new-folder')
    expect(calls[1].init?.method).toBe('POST')
  })
})

describe('findBackup', () => {
  it('returns null when the folder has no backup', async () => {
    queue = [ok({ files: [] })]
    expect(await findBackup('tok', 'folder-1')).toBeNull()
  })
})

describe('uploadBackup', () => {
  it('overwrites the existing backup with a PATCH media upload', async () => {
    queue = [
      ok({ files: [{ id: 'folder-1' }] }), // ensureLifelogFolder
      ok({ files: [{ id: 'backup-1' }] }), // findBackup
      ok({}), // PATCH
    ]
    await uploadBackup('tok', new Blob(['data']))
    expect(calls[2].init?.method).toBe('PATCH')
    expect(calls[2].url).toContain('/backup-1?uploadType=media')
  })

  it('creates a new backup with a multipart upload when none exists', async () => {
    queue = [
      ok({ files: [{ id: 'folder-1' }] }), // ensureLifelogFolder
      ok({ files: [] }), // findBackup
      ok({ id: 'backup-2' }), // POST
    ]
    await uploadBackup('tok', new Blob(['data']))
    expect(calls[2].init?.method).toBe('POST')
    expect(calls[2].url).toContain('uploadType=multipart')
  })
})

describe('downloadBackup', () => {
  it('returns the backup blob when one exists', async () => {
    queue = [
      ok({ files: [{ id: 'folder-1' }] }),
      ok({ files: [{ id: 'backup-1' }] }),
      okBlob(new Blob(['the backup'])),
    ]
    const blob = await downloadBackup('tok')
    expect(blob).not.toBeNull()
    expect(await blob!.text()).toBe('the backup')
  })

  it('returns null when there is no backup yet', async () => {
    queue = [ok({ files: [{ id: 'folder-1' }] }), ok({ files: [] })]
    expect(await downloadBackup('tok')).toBeNull()
  })
})
