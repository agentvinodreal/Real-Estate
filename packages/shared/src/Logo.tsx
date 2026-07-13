type LogoProps = {
  className?: string
  showWordmark?: boolean
  /** color of the emblem square */
  tone?: 'ink' | 'bone'
}

/**
 * Carry Construction logo.
 * A premium architectural emblem: an interlocking geometric "C" representing
 * structural components (foundation, column, and beveled roof line), complete
 * with fine drafting/blueprint guidelines.
 */
export default function Logo({ className = '', showWordmark = true, tone = 'ink' }: LogoProps) {
  const square = tone === 'ink' ? '#1c1b18' : '#ebe6da'
  const gridColor = tone === 'ink' ? 'rgba(139, 133, 122, 0.25)' : 'rgba(28, 27, 24, 0.15)'

  return (
    <span className={`group inline-flex items-center gap-3 transition-transform duration-300 ease-out hover:scale-[1.02] ${className}`}>
      <svg
        viewBox="0 0 40 40"
        className="h-9 w-9 shrink-0 shadow-sm"
        role="img"
        aria-label="Carry Construction Logo"
      >
        <defs>
          <linearGradient id="logoGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ebd4b0" />
            <stop offset="60%" stopColor="#d5a96a" />
            <stop offset="100%" stopColor="#9e7338" />
          </linearGradient>
        </defs>

        {/* Emblem Background */}
        <rect width="40" height="40" rx="8" fill={square} className="transition-colors duration-300" />

        {/* Blueprint drafting guidelines */}
        <line x1="6" y1="20" x2="34" y2="20" stroke={gridColor} strokeWidth="0.5" strokeDasharray="2 2" />
        <line x1="20" y1="6" x2="20" y2="34" stroke={gridColor} strokeWidth="0.5" strokeDasharray="2 2" />
        <circle cx="20" cy="20" r="14" stroke={gridColor} strokeWidth="0.5" fill="none" strokeDasharray="1 3" />

        {/* Interlocking geometric "C" */}
        <g fill="url(#logoGoldGrad)" className="transition-transform duration-300 ease-out group-hover:translate-x-[0.5px]">
          {/* Top / Roof component */}
          <path 
            d="M10 9h15l5 5v3h-6v-3H10V9z" 
            className="transition-transform duration-500 ease-out group-hover:translate-y-[-0.5px]" 
          />
          {/* Spine / Column component */}
          <rect 
            x="10" 
            y="16" 
            width="6" 
            height="8" 
            rx="0.5" 
            className="transition-transform duration-500 ease-out group-hover:scale-y-[1.05]" 
          />
          {/* Base / Foundation component */}
          <path 
            d="M10 26h18a2 2 0 012 2v3H10v-5z" 
            className="transition-transform duration-500 ease-out group-hover:translate-y-[0.5px]" 
          />
        </g>
      </svg>

      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[1.35rem] font-semibold tracking-tight text-ink group-hover:text-ochre transition-colors duration-300">
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

