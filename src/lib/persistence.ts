// Ask the browser to keep our IndexedDB data durable. Without this, storage can
// be evicted under pressure — and iOS Safari clears unused site data after ~7
// days — which would silently lose the user's log. Safe to call on every load;
// it no-ops once granted (or unsupported).
export async function requestPersistentStorage(): Promise<void> {
  try {
    if (!navigator.storage?.persist) return
    const already = (await navigator.storage.persisted?.()) ?? false
    if (!already) await navigator.storage.persist()
  } catch {
    // Best-effort only; never block startup on this.
  }
}
