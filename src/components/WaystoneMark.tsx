// The Waystone mark: a single upward waymark chevron ("this way") on a teal
// ground. The brand's app icon, reused inline in the header. Colors come from
// tokens so the mark adapts to light/dark (teal ground, on-accent chevron).
export function WaystoneMark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} aria-hidden>
      <rect width="512" height="512" rx="112" fill="var(--color-accent)" />
      <path
        d="M160 320 L256 200 L352 320"
        fill="none"
        stroke="var(--color-on-accent)"
        strokeWidth="44"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
