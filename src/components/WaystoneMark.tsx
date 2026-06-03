// The Waystone mark: a single upward waymark chevron ("this way") on a teal
// ground. The brand's app icon, reused inline in the header.
export function WaystoneMark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} aria-hidden>
      <rect width="512" height="512" rx="112" fill="#3f7d6e" />
      <path
        d="M160 320 L256 200 L352 320"
        fill="none"
        stroke="#fbf8f1"
        strokeWidth="44"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
