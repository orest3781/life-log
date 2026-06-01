import { useRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Sheet } from './Sheet'
import { exportAll, downloadBackup, importAll } from '../lib/backup'
import { useDriveSync } from '../hooks/useDriveSync'

interface SettingsSheetProps {
  onClose: () => void
  onOpenCategories: () => void
}

export function SettingsSheet({ onClose, onOpenCategories }: SettingsSheetProps) {
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleExport() {
    setBusy(true)
    setStatus(null)
    try {
      const blob = await exportAll()
      downloadBackup(blob)
      setStatus('Backup downloaded.')
    } catch {
      setStatus('Export failed.')
    } finally {
      setBusy(false)
    }
  }

  async function handleImport(file: File) {
    setBusy(true)
    setStatus(null)
    try {
      const result = await importAll(file)
      setStatus(
        `Restored ${result.entries} entries, ${result.categories} categories, ${result.photos} photos.`,
      )
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Import failed.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <Sheet title="Settings" onClose={onClose}>
      <div className="flex flex-col gap-6 py-2">
        <Section title="Categories">
          <Row label="Manage categories" onClick={onOpenCategories} />
        </Section>

        <Section title="Your data">
          <p className="mb-3 text-sm leading-relaxed text-muted">
            Everything lives on this device. Export a backup you fully own — a
            single file with all entries and photos — and import it to restore.
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={busy}
              className="brut-press rounded-xl border-[2.5px] border-ink bg-accent py-3 font-semibold text-white shadow-[3px_3px_0_var(--color-ink)] disabled:opacity-50"
            >
              Export backup
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="rounded-xl border-2 border-ink bg-surface py-3 font-medium text-ink disabled:opacity-50"
            >
              Import backup
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleImport(f)
              }}
            />
          </div>
          {status && (
            <p className="mt-3 text-sm text-accent" role="status">
              {status}
            </p>
          )}
        </Section>

        <Section title="Cloud backup">
          <DriveSection />
        </Section>

        <Section title="About">
          <p className="text-sm leading-relaxed text-muted">
            Waystone is a five-second logbook for your life. Mark what
            happened, tap a category, done — and every entry quietly tells you
            how long ago it was. No accounts, no nagging.
          </p>
        </Section>
      </div>
    </Sheet>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        {title}
      </h3>
      {children}
    </section>
  )
}

function Row({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border-2 border-ink bg-surface px-4 py-3 text-[15px] text-ink"
    >
      {label}
      <span className="text-muted">›</span>
    </button>
  )
}

function DriveSection() {
  const drive = useDriveSync()
  const working = drive.status === 'working'

  if (!drive.configured) {
    return (
      <p className="text-sm leading-relaxed text-muted">
        Optional Google Drive sync isn't enabled in this build. Add a Google
        OAuth client ID (<code className="text-ink">VITE_GOOGLE_CLIENT_ID</code>)
        to back up automatically to a private folder in your own Drive.
      </p>
    )
  }

  if (!drive.connected) {
    return (
      <>
        <p className="mb-3 text-sm leading-relaxed text-muted">
          Connect Google Drive to automatically back up to a private folder you
          own. Waystone can only see the files it creates — nothing else in
          your Drive.
        </p>
        <button
          type="button"
          onClick={drive.connect}
          disabled={working}
          className="brut-press rounded-xl border-[2.5px] border-ink bg-accent px-4 py-3 font-semibold text-white shadow-[3px_3px_0_var(--color-ink)] disabled:opacity-50"
        >
          {working ? 'Connecting…' : 'Connect Google Drive'}
        </button>
        {drive.message && (
          <p className="mt-3 text-sm text-danger">{drive.message}</p>
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="brut-sm flex items-center justify-between bg-surface px-4 py-3">
        <div>
          <div className="text-[15px] font-medium text-ink">Connected</div>
          <div className="text-xs text-muted">
            {drive.lastBackupAt
              ? `Last backup ${formatDistanceToNow(drive.lastBackupAt, { addSuffix: true })}`
              : 'Not backed up yet'}
          </div>
        </div>
        <span className="size-2.5 rounded-full bg-accent" aria-hidden />
      </div>

      <button
        type="button"
        onClick={drive.toggleAuto}
        className="flex items-center justify-between rounded-xl border-2 border-ink bg-surface px-4 py-3 text-[15px] text-ink"
        role="switch"
        aria-checked={drive.autoBackup}
      >
        Auto-backup after changes
        <span
          className={`relative h-6 w-10 rounded-full border-2 border-ink transition-colors ${
            drive.autoBackup ? 'bg-accent' : 'bg-surface-2'
          }`}
        >
          <span
            className={`absolute top-[2px] size-4 rounded-full border-2 border-ink bg-white transition-all ${
              drive.autoBackup ? 'left-[18px]' : 'left-[2px]'
            }`}
          />
        </span>
      </button>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={drive.backup}
          disabled={working}
          className="brut-press flex-1 rounded-xl border-[2.5px] border-ink bg-accent py-3 font-semibold text-white shadow-[3px_3px_0_var(--color-ink)] disabled:opacity-50"
        >
          {working ? 'Working…' : 'Back up now'}
        </button>
        <button
          type="button"
          onClick={drive.restore}
          disabled={working}
          className="flex-1 rounded-xl border-2 border-ink bg-surface py-3 font-medium text-ink disabled:opacity-50"
        >
          Restore
        </button>
      </div>

      <button
        type="button"
        onClick={drive.disconnect}
        className="self-start text-sm font-medium text-danger"
      >
        Disconnect
      </button>

      {drive.status === 'reconnect' && (
        <p className="text-sm text-muted">
          Changes pending — tap “Back up now” to sync (your session needs to
          re-authorize).
        </p>
      )}
      {drive.message && (
        <p
          className={`text-sm ${drive.status === 'error' ? 'text-danger' : 'text-accent'}`}
          role="status"
        >
          {drive.message}
        </p>
      )}
    </div>
  )
}
