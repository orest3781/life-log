import { useRef, useState } from 'react'
import { Sheet } from './Sheet'
import { exportAll, downloadBackup, importAll } from '../lib/backup'

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
              className="rounded-xl bg-accent py-3 font-semibold text-white disabled:opacity-50"
            >
              Export backup
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="rounded-xl bg-surface-2 py-3 font-medium text-ink disabled:opacity-50"
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

        <Section title="About">
          <p className="text-sm leading-relaxed text-muted">
            LifeLog is a five-second logbook for your own life. Type what
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
      className="flex w-full items-center justify-between rounded-xl bg-surface-2 px-4 py-3 text-[15px] text-ink hover:opacity-90"
    >
      {label}
      <span className="text-muted">›</span>
    </button>
  )
}
