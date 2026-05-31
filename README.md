# LifeLog

A five-second logbook for your own life. Type what happened, tap a category, done — the date defaults to today. Then every entry quietly tells you **how long ago** it was: *"battery — 14 months ago,"* *"cycling started — 3 weeks ago."*

We obsessively schedule the future and completely forget the past. Calendars are built for appointments, not for *"when did I do that thing."* LifeLog is the clean ledger you search when you need the answer and ignore the rest of the time. **Elapsed time is the product.**

- **Owned & private** — everything lives on your device (IndexedDB). No accounts, no servers, no feed.
- **Offline-first PWA** — installs to your home screen, works with no connection.
- **No nagging** — passive reminders surface a calm "DUE" strip when a check-back date arrives. No push notifications.
- **Portable backups** — one-tap export to a single `.zip` (entries + photos) you fully own, and import to restore.

## Features

- Quick-log: title + category in a couple of taps; date defaults to today and is backdatable.
- Live elapsed time on every entry (today / N days / N weeks / N months / N years ago).
- Custom categories with emoji + color; most-recently-used float to the top of the picker.
- Optional photos (multiple), notes, and passive check-back reminders per entry.
- Reverse-chronological ledger with full-text search and category filtering.

## Tech stack

React + Vite + TypeScript · Tailwind CSS v4 · Dexie (IndexedDB) · vite-plugin-pwa · Vitest + Testing Library.

## Develop

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build (generates PWA manifest + service worker)
npm run test     # run the test suite
npm run preview  # preview the production build
```

## Roadmap

- **Next milestone:** optional Google Drive auto-backup (account-free OAuth token flow) on top of the local-first core.

---

🤖 Built with [Claude Code](https://claude.com/claude-code)
