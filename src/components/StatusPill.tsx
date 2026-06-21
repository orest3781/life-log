import { AlertIcon, BellIcon } from './icons'

// A reminder/overdue status badge. Communicates state with an icon AND a word
// AND a tinted ground — never color alone — so it reads for color-blind users
// and in greyscale.
export function StatusPill({
  kind,
  className = '',
}: {
  kind: 'overdue' | 'due'
  className?: string
}) {
  const isOverdue = kind === 'overdue'
  const Icon = isOverdue ? AlertIcon : BellIcon
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-2 border-ink px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
        isOverdue ? 'bg-danger-soft text-danger' : 'bg-accent-soft text-accent'
      } ${className}`}
    >
      <Icon width={11} height={11} aria-hidden />
      {isOverdue ? 'Overdue' : 'Due'}
    </span>
  )
}
