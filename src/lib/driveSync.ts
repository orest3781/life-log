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
import { downloadBackup, uploadBackup } from './drive'

const STATE_KEY = 'lifelog-drive'

export interface DriveState {
  connected: boolean
  autoBackup: boolean
  lastBackupAt: number | null
}

const DEFAULT_STATE: DriveState = {
  connected: false,
  autoBackup: true,
  lastBackupAt: null,
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

// Begin the OAuth flow (shows Google's UI), then mark as connected and run a
// first backup so Drive immediately reflects the device.
export async function connectDrive(): Promise<DriveState> {
  await getAccessToken() // user gesture → consent UI
  patchState({ connected: true })
  return backupNow()
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
