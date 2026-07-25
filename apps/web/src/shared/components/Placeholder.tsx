type PlaceholderProps = {
  label?: string
  className?: string
}

/**
 * Dummy-image stand-in. A warm "blueprint" block with a subtle grid and an
 * architectural corner motif — reads as intentional, not broken. Swap these
 * for real Cloudinary photos later.
 */
export default function Placeholder({ label = 'Photo', className = '' }: PlaceholderProps) {
  return (
    <div
      className={`blueprint relative flex items-center justify-center overflow-hidden ${className}`}
      aria-label={`${label} placeholder`}
    >
      {/* corner crop marks */}
      <span className="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-ink/30" />
      <span className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-ink/30" />
      <span className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-ink/45">
        {label}
      </span>
    </div>
  )
}
