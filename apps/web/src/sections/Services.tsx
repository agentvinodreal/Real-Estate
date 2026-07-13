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
    <section id="services" className="border-y border-teal-dark/30 bg-teal text-bone">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:py-20 sm:px-8">
        <Reveal className="max-w-2xl">
          <span className="kicker !text-ochre">What we do</span>
          <h2 className="mt-4 font-display text-2xl font-normal tracking-tight text-bone sm:text-4xl lg:text-5xl">
            Three ways we help you move.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-px overflow-hidden border border-bone/10 bg-bone/10 md:grid-cols-3">
          {SERVICES.map((s, i) => {
            const Icon = ICONS[s.tag] ?? KeyRound
            return (
              <Reveal key={s.id} delay={i * 0.1} className="bg-teal-dark">
                <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.25, ease: EASE_OUT_EXPO }} className="h-full">
                  <Link
                    to={LINKS[s.tag] ?? '/'}
                    className="group flex h-full flex-col bg-teal p-8 transition-colors hover:bg-teal-dark"
                  >
                    <div className="flex items-center justify-between">
                      <Icon className="h-6 w-6 text-ochre" strokeWidth={1.5} />
                      <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-bone/60">{s.tag}</span>
                    </div>
                    <h3 className="mt-8 font-display text-2xl font-normal text-bone">{s.title}</h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-bone/85">{s.body}</p>
                    <span className="mt-6 font-mono text-xs uppercase tracking-[0.15em] text-bone transition-colors group-hover:text-ochre">
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
