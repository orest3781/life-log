// A placeholder ledger shown during the brief first load instead of a blank
// flash. Mirrors EntryRow geometry (chip · title · big elapsed · thumbnail) so
// the real list settles in without a jump.
export function LedgerSkeleton() {
  return (
    <ul className="anim-fade-in flex flex-col gap-3 px-5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <li
          key={i}
          className="brut-sm flex items-center gap-3 bg-surface px-4 py-3.5"
        >
          <div className="min-w-0 flex-1">
            <div className="skeleton mb-2 h-4 w-20 rounded-full" />
            <div
              className={`skeleton mb-2.5 h-3.5 rounded ${
                i % 2 === 0 ? 'w-2/3' : 'w-1/2'
              }`}
            />
            <div className="skeleton h-7 w-28 rounded-md" />
          </div>
          {i % 3 !== 1 && <div className="skeleton size-14 shrink-0 rounded-xl" />}
        </li>
      ))}
    </ul>
  )
}
