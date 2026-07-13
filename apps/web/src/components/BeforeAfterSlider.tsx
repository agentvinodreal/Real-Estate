import { useState, useRef, useEffect } from 'react'
import Photo from './Photo'

type Props = {
  before: string
  after: string
  className?: string
}

export default function BeforeAfterSlider({ before, after, className = '' }: Props) {
  const [sliderPosition, setSliderPosition] = useState(50) // percentage (0-100)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const position = (x / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, position)))
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.current) return
    handleMove(e.touches[0].clientX)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return
    handleMove(e.clientX)
  }

  const handleMouseUp = () => {
    isDragging.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleMouseUp)
  }

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    handleMove(clientX)

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleMouseUp)
  }

  // Cleanup event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleMouseUp)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden border border-ink/10 ${className}`}
    >
      {/* After Image (Background) */}
      <Photo src={after} seed="after-image" className="h-full w-full" objectFit="cover" />
      <span className="absolute bottom-3 right-3 z-10 bg-ink/75 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.15em] text-bone">
        After
      </span>

      {/* Before Image (Foreground overlay, clipped) */}
      <div
        className="absolute inset-y-0 left-0 right-0 z-10 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <Photo src={before} seed="before-image" className="h-full w-full" objectFit="cover" />
        <span className="absolute bottom-3 left-3 z-10 bg-ochre/80 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.15em] text-ink">
          Before
        </span>
      </div>

      {/* Drag Slider Bar / Handle */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        style={{ left: `${sliderPosition}%` }}
        className="absolute inset-y-0 z-20 w-1 -translate-x-1/2 bg-ochre cursor-ew-resize flex items-center justify-center"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ochre shadow-[0_2px_8px_rgba(0,0,0,0.25)] border border-bone/50 text-ink text-xs font-bold font-mono">
          ↔
        </div>
      </div>
    </div>
  )
}
