import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { KeyRound, RefreshCcw, HardHat } from 'lucide-react'
import { SERVICES } from '../lib/data'
import Reveal from '../components/motion/Reveal'
import { EASE_OUT_EXPO } from '../lib/motion'

const LINKS: Record<string, string> = {
  Sale: '/properties',
  Resale: '/properties?listingType=Resale',
  Build: '/construction',
}

const ICONS: Record<string, typeof KeyRound> = {
  Sale: KeyRound,
  Resale: RefreshCcw,
  Build: HardHat,
}

export default function Services() {
  return (
    <section id="services" className="border-y border-ink/10 bg-bone-dim">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <Reveal className="max-w-2xl">
          <span className="kicker">What we do</span>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Three ways we help you move.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-px overflow-hidden border border-ink/10 bg-ink/10 md:grid-cols-3">
          {SERVICES.map((s, i) => {
            const Icon = ICONS[s.tag] ?? KeyRound
            return (
              <Reveal key={s.id} delay={i * 0.1} className="bg-bone">
                <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}>
                  <Link
                    to={LINKS[s.tag] ?? '/'}
                    className="group flex h-full flex-col bg-bone p-8 transition-colors hover:bg-sand"
                  >
                    <div className="flex items-center justify-between">
                      <Icon className="h-6 w-6 text-ochre-dark" strokeWidth={1.5} />
                      <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-concrete">{s.tag}</span>
                    </div>
                    <h3 className="mt-8 font-display text-2xl font-semibold text-ink">{s.title}</h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">{s.body}</p>
                    <span className="mt-6 font-mono text-xs uppercase tracking-[0.15em] text-ink transition-colors group-hover:text-ochre-dark">
                      Learn more →
                    </span>
                  </Link>
                </motion.div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
