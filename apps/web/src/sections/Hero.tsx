import { Suspense, lazy } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import Photo from '../components/Photo'
import { CONTACT } from '../lib/data'
import useCanRender3D from '../hooks/useCanRender3D'
import { EASE_OUT_EXPO } from '../lib/motion'

const Hero3D = lazy(() => import('../components/hero/Hero3D'))

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
}

export default function Hero() {
  const can3D = useCanRender3D()

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-24 lg:pt-20">
        {/* Copy */}
        <motion.div className="flex flex-col justify-center" variants={container} initial="hidden" animate="show">
          <motion.span variants={item} className="kicker">Sale · Resale · Construction</motion.span>
          <motion.h1
            variants={item}
            className="mt-5 font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-7xl"
          >
            We build the
            <br />
            place you’ll
            <br />
            <span className="text-ochre">call home.</span>
          </motion.h1>
          <motion.p variants={item} className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">
            From finding the right property to constructing it end-to-end —
            Carry Construction takes you from design to execution with one
            accountable team.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/properties"
              className="inline-flex items-center bg-ink px-7 py-3.5 font-mono text-xs uppercase tracking-[0.15em] text-bone transition-colors hover:bg-ochre-dark"
            >
              View properties
            </Link>
            <a
              href={`https://wa.me/${CONTACT.whatsapp}`}
              className="inline-flex items-center border border-ink/25 px-7 py-3.5 font-mono text-xs uppercase tracking-[0.15em] text-ink transition-colors hover:border-ochre hover:text-ochre-dark"
            >
              Talk on WhatsApp
            </a>
          </motion.div>

          <motion.div variants={item} className="mt-10 flex items-center gap-8 border-t border-ink/10 pt-6">
            <div>
              <div className="font-display text-2xl font-semibold text-ink">12+</div>
              <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-concrete">Years</div>
            </div>
            <div>
              <div className="font-display text-2xl font-semibold text-ink">40</div>
              <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-concrete">Projects</div>
            </div>
            <div>
              <div className="font-display text-2xl font-semibold text-ink">2.5M</div>
              <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-concrete">Sq ft built</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Image / 3D */}
        <div className="relative">
          {can3D ? (
            <Suspense fallback={<Photo seed="hero-project" label="Hero project" className="aspect-[4/5] w-full" />}>
              <div className="aspect-[4/5] w-full">
                <Hero3D />
              </div>
            </Suspense>
          ) : (
            <Photo seed="hero-project" label="Hero project" className="aspect-[4/5] w-full" />
          )}
          {/* floating spec card */}
          <div className="absolute -bottom-5 -left-5 hidden bg-ink px-6 py-5 text-bone sm:block">
            <div className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-ochre">Now building</div>
            <div className="mt-1 font-display text-xl font-semibold">Skyline Heights, Kharadi</div>
            <div className="mt-1 font-mono text-xs text-bone/60">3 BHK · 1,450 sq ft · RERA verified</div>
          </div>
        </div>
      </div>
    </section>
  )
}
