import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { EASE_OUT_EXPO } from '../../lib/motion'

type RevealProps = {
  children: ReactNode
  delay?: number
  className?: string
  y?: number
  as?: 'div' | 'li'
}

/** Fades + slides content up as it scrolls into view. Animates once. */
export default function Reveal({ children, delay = 0, className, y = 24, as = 'div' }: RevealProps) {
  const MotionTag = motion[as]
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: EASE_OUT_EXPO }}
    >
      {children}
    </MotionTag>
  )
}
