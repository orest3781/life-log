// Google Drive REST operations, scoped to the app's own files (drive.file).
// Backups live as a single `waystone-backup.zip` inside a visible "Waystone"
// folder the user owns. A folder/file from the old brand name ("LifeLog") is
// migrated in place (renamed) rather than abandoned.
//
// Every function takes an access token, keeping these pure and testable with a
// mocked fetch (see drive.test.ts) — no OAuth machinery in here.

const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files'
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files'
const FOLDER_NAME = 'Waystone'
const LEGACY_FOLDER_NAME = 'LifeLog'
const BACKUP_NAME = 'waystone-backup.zip'
const LEGACY_BACKUP_NAME = 'lifelog-backup.zip'
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

async function findByName(
  token: string,
  query: string,
): Promise<DriveFile | null> {
  const res = await driveFetch(
    token,
    `${DRIVE_FILES}?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime)&spaces=drive`,
  )
  const data = (await res.json()) as { files?: DriveFile[] }
  return data.files && data.files.length > 0 ? data.files[0] : null
}

// Rename an existing file/folder (metadata-only PATCH).
async function renameFile(
  token: string,
  id: string,
  name: string,
): Promise<void> {
  await driveFetch(token, `${DRIVE_FILES}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
}

// Find the app's "Waystone" folder, migrating an old "LifeLog" folder by
// renaming it, or creating a fresh one on first use.
export async function ensureBackupFolder(token: string): Promise<string> {
  const current = await findByName(
    token,
    `name='${FOLDER_NAME}' and mimeType='${FOLDER_MIME}' and trashed=false`,
  )
  if (current) return current.id

  const legacy = await findByName(
    token,
    `name='${LEGACY_FOLDER_NAME}' and mimeType='${FOLDER_MIME}' and trashed=false`,
  )
  if (legacy) {
    await renameFile(token, legacy.id, FOLDER_NAME)
    return legacy.id
  }

  const created = await driveFetch(token, DRIVE_FILES, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: FOLDER_MIME }),
  })
  return ((await created.json()) as DriveFile).id
}

// Locate the backup in the folder under the current name, falling back to the
// legacy name so a pre-rebrand backup is still found.
export async function findBackup(
  token: string,
  folderId: string,
): Promise<DriveFile | null> {
  for (const name of [BACKUP_NAME, LEGACY_BACKUP_NAME]) {
    const hit = await findByName(
      token,
      `name='${name}' and '${folderId}' in parents and trashed=false`,
    )
    if (hit) return hit
  }
  return null
}

// Create or overwrite the single backup file in the Waystone folder. A
// legacy-named backup is renamed to the current name as it's updated.
export async function uploadBackup(token: string, blob: Blob): Promise<void> {
  const folderId = await ensureBackupFolder(token)
  const existing = await findBackup(token, folderId)

  if (existing) {
    if (existing.name === LEGACY_BACKUP_NAME) {
      await renameFile(token, existing.id, BACKUP_NAME)
    }
    await driveFetch(token, `${DRIVE_UPLOAD}/${existing.id}?uploadType=media`, {
      method: 'PATCH',
      headers: { 'Content-Type': ZIP_MIME },
      body: blob,
    })
    return
  }

  // First backup: multipart/related upload carrying metadata + file content.
  const boundary = 'waystone-boundary-aZ09'
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
  const folderId = await ensureBackupFolder(token)
  const existing = await findBackup(token, folderId)
  if (!existing) return null
  const res = await driveFetch(token, `${DRIVE_FILES}/${existing.id}?alt=media`)
  return res.blob()
}
