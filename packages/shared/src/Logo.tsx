type LogoProps = {
  className?: string
  showWordmark?: boolean
  /** color of the emblem square; the "C" is always ochre */
  tone?: 'ink' | 'bone'
}

/**
 * Carry Construction logo.
 * The emblem is a bold architectural "C" — the top-right arm is beveled
 * into a roofline, tying the letterform to building / real estate.
 */
export default function Logo({ className = '', showWordmark = true, tone = 'ink' }: LogoProps) {
  const square = tone === 'ink' ? '#1c1b18' : '#f5f1e9'

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        viewBox="0 0 40 40"
        className="h-9 w-9 shrink-0"
        role="img"
        aria-label="Carry Construction"
      >
        <rect width="40" height="40" fill={square} />
        <path d="M9 9 H23 L27 13 V16 H17 V24 H27 V31 H9 Z" fill="#b87333" />
      </svg>

      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[1.35rem] font-semibold tracking-tight">
            Carry
          </span>
          <span className="font-mono text-[0.6rem] font-medium uppercase tracking-[0.28em] text-concrete">
            Construction
          </span>
        </span>
      )}
    </span>
  )
}
