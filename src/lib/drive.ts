// Google Drive REST operations, scoped to the app's own files (drive.file).
// Backups live as a single `lifelog-backup.zip` inside a visible "LifeLog"
// folder the app creates, so the user can see and own their data in Drive.
//
// Every function takes an access token, keeping these pure and testable with a
// mocked fetch (see drive.test.ts) — no OAuth machinery in here.

const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files'
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files'
const FOLDER_NAME = 'LifeLog'
const BACKUP_NAME = 'lifelog-backup.zip'
const FOLDER_MIME = 'application/vnd.google-apps.folder'
const ZIP_MIME = 'application/zip'

async function driveFetch(
  token: string,
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Drive API error ${res.status}: ${detail.slice(0, 200)}`)
  }
  return res
}

interface DriveFile {
  id: string
  name?: string
  modifiedTime?: string
}

// Find the app's "LifeLog" folder, creating it on first use.
export async function ensureLifelogFolder(token: string): Promise<string> {
  const q = `name='${FOLDER_NAME}' and mimeType='${FOLDER_MIME}' and trashed=false`
  const res = await driveFetch(
    token,
    `${DRIVE_FILES}?q=${encodeURIComponent(q)}&fields=files(id,name)&spaces=drive`,
  )
  const data = (await res.json()) as { files?: DriveFile[] }
  if (data.files && data.files.length > 0) return data.files[0].id

  const created = await driveFetch(token, DRIVE_FILES, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: FOLDER_MIME }),
  })
  return ((await created.json()) as DriveFile).id
}

export async function findBackup(
  token: string,
  folderId: string,
): Promise<DriveFile | null> {
  const q = `name='${BACKUP_NAME}' and '${folderId}' in parents and trashed=false`
  const res = await driveFetch(
    token,
    `${DRIVE_FILES}?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime)&spaces=drive`,
  )
  const data = (await res.json()) as { files?: DriveFile[] }
  return data.files && data.files.length > 0 ? data.files[0] : null
}

// Create or overwrite the single backup file in the LifeLog folder.
export async function uploadBackup(token: string, blob: Blob): Promise<void> {
  const folderId = await ensureLifelogFolder(token)
  const existing = await findBackup(token, folderId)

  if (existing) {
    await driveFetch(token, `${DRIVE_UPLOAD}/${existing.id}?uploadType=media`, {
      method: 'PATCH',
      headers: { 'Content-Type': ZIP_MIME },
      body: blob,
    })
    return
  }

  // First backup: multipart/related upload carrying metadata + file content.
  const boundary = 'lifelog-boundary-aZ09'
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify({ name: BACKUP_NAME, parents: [folderId] }),
    `\r\n--${boundary}\r\nContent-Type: ${ZIP_MIME}\r\n\r\n`,
    blob,
    `\r\n--${boundary}--`,
  ])
  await driveFetch(token, `${DRIVE_UPLOAD}?uploadType=multipart`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  })
}

// Fetch the latest backup zip, or null if none exists yet.
export async function downloadBackup(token: string): Promise<Blob | null> {
  const folderId = await ensureLifelogFolder(token)
  const existing = await findBackup(token, folderId)
  if (!existing) return null
  const res = await driveFetch(token, `${DRIVE_FILES}/${existing.id}?alt=media`)
  return res.blob()
}
