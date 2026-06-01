import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import {
  backupNow,
  connectDrive,
  disconnectDrive,
  getDriveState,
  hasLiveToken,
  isConfigured,
  restoreFromDrive,
  setAutoBackup,
  type DriveState,
} from '../lib/driveSync'

const AUTO_BACKUP_DEBOUNCE_MS = 12_000

export type SyncStatus = 'idle' | 'working' | 'error' | 'reconnect'

export interface UseDriveSync {
  configured: boolean
  connected: boolean
  autoBackup: boolean
  lastBackupAt: number | null
  status: SyncStatus
  message: string | null
  connect: () => Promise<void>
  disconnect: () => void
  backup: () => Promise<void>
  restore: () => Promise<void>
  toggleAuto: () => void
}

// A coarse fingerprint of the database; changes whenever entries/categories/
// photos are added, edited, or removed. Drives the debounced auto-backup.
function useDataFingerprint(): string | undefined {
  return useLiveQuery(async () => {
    const entries = await db.entries.toArray()
    const categories = await db.categories.count()
    const photos = await db.photos.count()
    const maxUpdated = entries.reduce((m, e) => Math.max(m, e.updatedAt), 0)
    return `${entries.length}:${categories}:${photos}:${maxUpdated}`
  }, [])
}

export function useDriveSync(): UseDriveSync {
  const [state, setState] = useState<DriveState>(() => getDriveState())
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const configured = isConfigured()

  const fingerprint = useDataFingerprint()
  const lastSeenFp = useRef<string | undefined>(undefined)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runBackup = useCallback(async () => {
    setStatus('working')
    setMessage(null)
    try {
      setState(await backupNow())
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Backup failed.')
    }
  }, [])

  // Auto-backup after changes settle — but only silently (no popup). If the
  // token has lapsed, surface a gentle "reconnect" hint instead of nagging.
  useEffect(() => {
    if (fingerprint === undefined) return
    const first = lastSeenFp.current === undefined
    const changed = fingerprint !== lastSeenFp.current
    lastSeenFp.current = fingerprint
    if (first || !changed) return
    if (!configured || !state.connected || !state.autoBackup) return

    if (!hasLiveToken()) {
      setStatus('reconnect')
      return
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      void runBackup()
    }, AUTO_BACKUP_DEBOUNCE_MS)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [fingerprint, configured, state.connected, state.autoBackup, runBackup])

  const connect = useCallback(async () => {
    setStatus('working')
    setMessage(null)
    try {
      setState(await connectDrive())
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Could not connect.')
    }
  }, [])

  const disconnect = useCallback(() => {
    setState(disconnectDrive())
    setStatus('idle')
    setMessage(null)
  }, [])

  const restore = useCallback(async () => {
    setStatus('working')
    setMessage(null)
    try {
      const found = await restoreFromDrive()
      setStatus('idle')
      setMessage(found ? 'Restored from Drive.' : 'No backup found in Drive yet.')
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Restore failed.')
    }
  }, [])

  const toggleAuto = useCallback(() => {
    setState(setAutoBackup(!getDriveState().autoBackup))
  }, [])

  return {
    configured,
    connected: state.connected,
    autoBackup: state.autoBackup,
    lastBackupAt: state.lastBackupAt,
    status,
    message,
    connect,
    disconnect,
    backup: runBackup,
    restore,
    toggleAuto,
  }
}
