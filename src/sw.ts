/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'
import { attentionCounts, nudgeBody } from './lib/attention'
import type { Category, Entry } from './types'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

// Offline/precaching — same behavior as the previous generateSW build.
precacheAndRoute(self.__WB_MANIFEST)

// Keep the "prompt to update" flow: the page posts SKIP_WAITING when the user
// accepts the new-version toast.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
})

const NUDGE_TAG = 'waystone-nudge'
const MIN_GAP_MS = 20 * 60 * 60 * 1000 // at most one nudge per ~day

// Background nudge — Chromium installed PWAs only. Throttled by the browser
// (typically ~daily). No-op everywhere it isn't supported.
;(self as unknown as EventTarget).addEventListener('periodicsync', (event) => {
  const e = event as ExtendableEvent & { tag?: string }
  if (e.tag === NUDGE_TAG) e.waitUntil(checkAndNotify())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      const existing = clients.find((c) => 'focus' in c) as WindowClient | undefined
      if (existing) {
        await existing.focus()
        return
      }
      await self.clients.openWindow('/')
    })(),
  )
})

// Read a whole object store from the app's Dexie database with raw IndexedDB,
// so the worker stays decoupled from app/UI modules.
function idbGetAll<T>(store: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('lifelog')
    open.onerror = () => reject(open.error)
    open.onsuccess = () => {
      const dbi = open.result
      try {
        const req = dbi.transaction(store, 'readonly').objectStore(store).getAll()
        req.onsuccess = () => {
          resolve(req.result as T[])
          dbi.close()
        }
        req.onerror = () => {
          reject(req.error)
          dbi.close()
        }
      } catch (err) {
        dbi.close()
        reject(err)
      }
    }
  })
}

// Dedupe via the Cache API (service workers have no localStorage).
async function getLastNudge(): Promise<number> {
  const res = await (await caches.open('waystone-meta')).match('last-nudge')
  return res ? Number(await res.text()) : 0
}
async function setLastNudge(t: number): Promise<void> {
  await (await caches.open('waystone-meta')).put('last-nudge', new Response(String(t)))
}

async function checkAndNotify(): Promise<void> {
  const now = Date.now()
  if (now - (await getLastNudge()) < MIN_GAP_MS) return
  const [categories, entries] = await Promise.all([
    idbGetAll<Category>('categories'),
    idbGetAll<Entry>('entries'),
  ])
  const body = nudgeBody(attentionCounts(categories, entries, now))
  if (!body) return
  await self.registration.showNotification('Waystone', {
    body,
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
    tag: NUDGE_TAG,
  })
  await setLastNudge(now)
}
