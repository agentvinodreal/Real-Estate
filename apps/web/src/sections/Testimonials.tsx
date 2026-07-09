import { motion } from 'motion/react'
import { TESTIMONIALS } from '../lib/data'
import Photo from '../components/Photo'
import Reveal from '../components/motion/Reveal'
import { dummyAvatar } from '../lib/images'
import { EASE_OUT_EXPO } from '../lib/motion'

export default function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <Reveal className="max-w-2xl">
        <span className="kicker">In their words</span>
        <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Trusted by 600+ families.
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.1}>
            <motion.figure
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
              className="flex h-full flex-col border-t-2 border-ochre pt-6"
            >
              <blockquote className="flex-1 font-display text-lg leading-relaxed text-ink">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <Photo seed={t.name} label={t.name} className="h-11 w-11 shrink-0" rounded src={dummyAvatar(t.name)} />
                <div>
                  <div className="font-semibold text-ink">{t.name}</div>
                  <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-concrete">
                    {t.location}
                  </div>
                </div>
              </figcaption>
            </motion.figure>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
