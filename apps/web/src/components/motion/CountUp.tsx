import { useEffect, useRef, useState } from 'react'
import { useInView, animate } from 'motion/react'
import { EASE_OUT_EXPO } from '../../lib/motion'

type CountUpProps = {
  value: string
  className?: string
}

const MATCH = /^(\d+(?:\.\d+)?)(.*)$/

/** Animates the leading number in a stat string (e.g. "12+", "2.5M") from 0 on scroll into view. */
export default function CountUp({ value, className }: CountUpProps) {
  const match = value.match(MATCH)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [display, setDisplay] = useState(match ? '0' + match[2] : value)

  useEffect(() => {
    const match = value.match(MATCH)
    if (!inView || !match) return
    const target = Number(match[1])
    const decimals = match[1].includes('.') ? match[1].split('.')[1].length : 0
    const controls = animate(0, target, {
      duration: 1.4,
      ease: EASE_OUT_EXPO,
      onUpdate: (v) => setDisplay(v.toFixed(decimals) + match[2]),
    })
    return () => controls.stop()
  }, [inView, value])

  return (
    <span ref={ref} className={className}>
      {match ? display : value}
    </span>
  )
}
