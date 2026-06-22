// High-level Google Drive sync: connect/disconnect, back up, and restore,
// built on googleAuth (tokens) + drive (REST) + backup (export/import zip).
// Connection preference and last-backup time persist in localStorage.

import { exportAll, importAll } from './backup'
import {
  clearToken,
  getAccessToken,
  hasLiveToken,
  isConfigured,
} from './googleAuth'
import { downloadBackup, ensureBackupFolder, findBackup, uploadBackup } from './drive'

const STATE_KEY = 'lifelog-drive'

export interface DriveState {
  connected: boolean
  autoBackup: boolean
  lastBackupAt: number | null
  /** A Drive backup found on connect, awaiting the user's restore/keep choice.
   *  While set, auto-backup is paused so it can't clobber the backup. */
  pendingRestoreAt: number | null
}

const DEFAULT_STATE: DriveState = {
  connected: false,
  autoBackup: true,
  lastBackupAt: null,
  pendingRestoreAt: null,
}

export function getDriveState(): DriveState {
  try {
    return { ...DEFAULT_STATE, ...JSON.parse(localStorage.getItem(STATE_KEY) || '{}') }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

function patchState(patch: Partial<DriveState>): DriveState {
  const next = { ...getDriveState(), ...patch }
  localStorage.setItem(STATE_KEY, JSON.stringify(next))
  return next
}

export { isConfigured, hasLiveToken }

// Turn raw OAuth / Drive API error text into a plain-language next step.
export function friendlyDriveError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('not configured'))
    return 'Google Drive isn’t set up in this build.'
  if (m.includes('origin_mismatch') || m.includes('origin mismatch'))
    return 'This site isn’t authorized for Google sign-in yet (origin mismatch). Add it to the OAuth client’s allowed origins.'
  if (m.includes('popup'))
    return 'The Google sign-in popup was blocked — allow popups for this site and try again.'
  if (m.includes('cancel') || m.includes('access_denied'))
    return 'Sign-in was cancelled.'
  if (m.includes('403'))
    return 'Drive denied access (403). Make sure the Google Drive API is enabled and your account is allowed.'
  if (m.includes('401'))
    return 'Drive sign-in expired — reconnect to continue.'
  if (m.includes('failed to fetch') || m.includes('network'))
    return 'Network error — check your connection and try again.'
  return 'Something went wrong with Google Drive. Please try again.'
}

// Begin the OAuth flow (shows Google's UI), then mark as connected. Crucially,
// don't blindly overwrite Drive: if a backup already exists (e.g. connecting a
// second device), flag it so the user can choose to restore it. Only a brand
// new, empty Drive is seeded from this device.
export async function connectDrive(): Promise<DriveState> {
  await getAccessToken() // user gesture → consent UI
  patchState({ connected: true })
  const existing = await peekBackup()
  if (existing) {
    return patchState({ pendingRestoreAt: existing.modifiedTime ?? Date.now() })
  }
  return backupNow()
}

// Whether a backup already exists in Drive, with its last-modified time.
export async function peekBackup(): Promise<{ modifiedTime: number | null } | null> {
  const token = await getAccessToken()
  const folderId = await ensureBackupFolder(token)
  const file = await findBackup(token, folderId)
  if (!file) return null
  return {
    modifiedTime: file.modifiedTime ? new Date(file.modifiedTime).getTime() : null,
  }
}

// Accept the offered Drive backup: pull it in and clear the pending prompt.
export async function confirmRestore(): Promise<boolean> {
  const found = await restoreFromDrive()
  patchState({ pendingRestoreAt: null })
  return found
}

// Keep this device's data instead: overwrite the Drive backup, clear the prompt.
export async function keepLocalOverwrite(): Promise<DriveState> {
  await backupNow()
  return patchState({ pendingRestoreAt: null })
}

export function disconnectDrive(): DriveState {
  clearToken()
  return patchState({ connected: false })
}

export function setAutoBackup(enabled: boolean): DriveState {
  return patchState({ autoBackup: enabled })
}

// Export the whole database and push it to Drive, overwriting the prior backup.
export async function backupNow(): Promise<DriveState> {
  const token = await getAccessToken()
  const blob = await exportAll()
  await uploadBackup(token, blob)
  return patchState({ connected: true, lastBackupAt: Date.now() })
}

// Pull the latest Drive backup and merge it into the local database.
// Returns false if no backup exists in Drive yet.
export async function restoreFromDrive(): Promise<boolean> {
  const token = await getAccessToken()
  const blob = await downloadBackup(token)
  if (!blob) return false
  await importAll(blob)
  return true
}
