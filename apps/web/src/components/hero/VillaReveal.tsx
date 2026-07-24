import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useMotionValueEvent, animate } from 'motion/react'
import Photo from '../Photo'

/**
 * Plays once on mount: a blueprint grid gives way to the real villa photo as
 * a construction sweep line rises from foundation to roof. Ties the hero
 * image to the brand's "blueprint → built" motif instead of a static photo.
 */
export default function VillaReveal({ className = '' }: { className?: string }) {
  const progress = useMotionValue(0)
  const [percent, setPercent] = useState(0)
  const [done, setDone] = useState(false)

  useMotionValueEvent(progress, 'change', (v) => setPercent(Math.round(v)))

  useEffect(() => {
    const controls = animate(progress, 100, {
      duration: 2.8,
      delay: 0.4,
      ease: 'easeInOut',
      onComplete: () => setDone(true),
    })
    return () => controls.stop()
  }, [progress])

  const clipPath = useTransform(progress, (p) => `inset(${100 - p}% 0 0 0)`)
  const sweepTop = useTransform(progress, (p) => `${100 - p}%`)
  const gridOpacity = useTransform(progress, [85, 100], [1, 0])

  return (
    <div className={`relative overflow-hidden bg-teal-dark ${className}`}>
      {/* Blueprint grid — the "not yet built" state, uncovered as the sweep line rises */}
      <motion.div
        style={{ opacity: gridOpacity }}
        className="absolute inset-0"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(213,169,106,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(213,169,106,0.16) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </motion.div>

      {/* Villa photo, wiped in from the ground up */}
      <motion.div className="absolute inset-0" style={{ clipPath }}>
        <Photo
          seed="hero-project"
          src="/hero-mobile.webp"
          label="Villa rising from the ground up, from blueprint to complete build"
          className="h-full w-full"
        />
      </motion.div>

      {/* Construction sweep line + live progress readout */}
      <AnimatePresence>
        {!done && (
          <motion.div
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ top: sweepTop }}
            className="pointer-events-none absolute inset-x-0 flex items-center gap-2 px-4"
          >
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-ochre to-ochre shadow-[0_0_10px_2px_rgba(213,169,106,0.55)]" />
            <span className="shrink-0 bg-ink px-2 py-1 font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ochre">
              Building {percent}%
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
