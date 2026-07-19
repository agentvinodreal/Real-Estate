import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import Photo from '../components/Photo'
import { PROCESS } from '../lib/data'
import Reveal from '../components/motion/Reveal'

const INK = '#122325'
const OCHRE = '#d5a96a'

type StepProps = {
  step: typeof PROCESS[number]
  index: number
  total: number
  scrollYProgress: any
}

function TimelineCard({ step, index, total, scrollYProgress }: StepProps) {
  // Define active range for this specific step card
  const rangeStart = index / total
  const rangePeak = (index + 0.5) / total
  const rangeEnd = (index + 1) / total

  // Interpolated animation values driven by container scroll percentage
  const cardScale = useTransform(
    scrollYProgress,
    [rangeStart, rangePeak, rangeEnd],
    [0.97, 1.025, 0.97]
  )
  const cardOpacity = useTransform(
    scrollYProgress,
    [rangeStart, rangePeak, rangeEnd],
    [0.55, 1, 0.55]
  )
  const cardBg = useTransform(
    scrollYProgress,
    [rangeStart, rangePeak, rangeEnd],
    ['rgba(251, 250, 247, 0.2)', 'rgba(213, 169, 106, 0.08)', 'rgba(251, 250, 247, 0.2)']
  )
  const cardBorderColor = useTransform(
    scrollYProgress,
    [rangeStart, rangePeak, rangeEnd],
    ['rgba(18, 35, 37, 0.08)', 'rgba(213, 169, 106, 0.9)', 'rgba(18, 35, 37, 0.08)']
  )

  return (
    <motion.div
      style={{
        scale: cardScale,
        opacity: cardOpacity,
        backgroundColor: cardBg,
        borderColor: cardBorderColor,
      }}
      className="flex gap-6 p-6 border rounded-sm transition-shadow duration-300 hover:shadow-sm"
    >
      <span className="font-mono text-sm text-ochre font-semibold leading-none mt-1">
        {step.step}
      </span>
      <div>
        <h3 className="font-display text-xl font-normal text-ink">{step.title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">{step.body}</p>
      </div>
    </motion.div>
  )
}

export default function Process() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Track vertical scroll progress of the process timeline container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  })

  // Smooth translation for the hanging crane hook
  const hookY = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <section id="process" className="border-y border-teal-dark/30 bg-teal/5">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:py-20 sm:px-8">
        
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          
          {/* LEFT PANEL: STICKY BRAND CONTEXT */}
          <div className="lg:sticky lg:top-28 lg:h-fit">
            <Reveal>
              <span className="kicker !text-ochre">How we construct</span>
              <h2 className="mt-4 font-display text-2xl font-normal tracking-tight text-ink sm:text-4xl lg:text-5xl">
                A process you can watch, step by step.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-soft">
                We own the entire journey from design to handover. Drag-line crane tracking on the right visualizes the exact construction lifecycle of your home.
              </p>
              <Photo seed="process-site" src="/process_construction.jpg" label="On-site construction" className="mt-8 aspect-[16/10] w-full border border-ink/5 shadow-sm" />
            </Reveal>
          </div>

          {/* RIGHT PANEL: SCROLL TIMELINE */}
          <div ref={containerRef} className="relative flex gap-8 py-4 select-none">
            
            {/* Crane Track Cable Line */}
            <div className="absolute left-[20px] top-6 bottom-6 w-[2px] bg-ink/10 rounded">
              <motion.div
                style={{ scaleY: scrollYProgress, originY: 0 }}
                className="w-full h-full bg-ochre"
              />
            </div>

            {/* Pulley & Crane Hook SVG (driven by scroll progress) */}
            <motion.div
              style={{ y: hookY, top: 0 }}
              className="absolute left-1 z-10 w-[34px] -translate-y-1/2 pointer-events-none"
            >
              <svg width="34" height="52" viewBox="0 0 34 52" fill="none" className="drop-shadow-sm">
                {/* Pulley box */}
                <rect x="8" y="2" width="18" height="18" rx="2" fill={INK} stroke={OCHRE} strokeWidth="1" />
                <circle cx="17" cy="11" r="5" fill={OCHRE} />
                {/* Connector line */}
                <line x1="17" y1="20" x2="17" y2="34" stroke={OCHRE} strokeWidth="1.5" />
                {/* Shackle Hook */}
                <path
                  d="M17 34c-4 0-6 2-6 5s2 4 4 2 1-4-2-4"
                  stroke={OCHRE}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>

            {/* Construction Timeline Steps list */}
            <div className="flex-1 flex flex-col gap-6 pl-8">
              {PROCESS.map((p, i) => (
                <TimelineCard
                  key={p.step}
                  step={p}
                  index={i}
                  total={PROCESS.length}
                  scrollYProgress={scrollYProgress}
                />
              ))}
            </div>

          </div>

        </div>

      </div>
    </section>
  )
}
