// The Cairn mark: a stack of four stones. Teal rounded-square ground, cream
// stones with ink outlines — the brand's app icon, reused inline in the header.
export function CairnMark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} aria-hidden>
      <rect width="512" height="512" rx="112" fill="#3f7d6e" />
      <g stroke="#2a2622" strokeWidth="16">
        <ellipse cx="256" cy="378" rx="150" ry="46" fill="#f3ebd7" />
        <ellipse cx="256" cy="290" rx="118" ry="42" fill="#fbf8f1" />
        <ellipse cx="256" cy="210" rx="86" ry="38" fill="#f3ebd7" />
        <ellipse cx="256" cy="142" rx="54" ry="32" fill="#fbf8f1" />
      </g>
    </svg>
  )
}
