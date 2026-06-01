// The Waystone mark: a single upright marker stone with a carved waymark
// chevron on a teal ground. The brand's app icon, reused inline in the header.
export function WaystoneMark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} aria-hidden>
      <rect width="512" height="512" rx="112" fill="#3f7d6e" />
      <g
        stroke="#2a2622"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ellipse cx="256" cy="404" rx="134" ry="24" fill="#f3ebd7" />
        <rect x="200" y="118" width="112" height="288" rx="54" fill="#fbf8f1" />
        <path d="M228 218 L256 188 L284 218" fill="none" />
      </g>
    </svg>
  )
}
