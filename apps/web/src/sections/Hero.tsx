import { Suspense, lazy } from 'react'
// import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import VillaReveal from '../components/hero/VillaReveal'
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
    <section id="top" className="relative overflow-hidden bg-teal text-bone">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-24 lg:pt-20">
        {/* Copy */}
        <motion.div className="flex flex-col justify-center" variants={container} initial="hidden" animate="show">
          <motion.span variants={item} className="kicker !text-ochre">Sale · Resale · Construction</motion.span>
          <motion.h1
            variants={item}
            className="mt-5 font-display text-3xl font-normal leading-[1.02] tracking-tight text-bone sm:text-5xl lg:text-6xl xl:text-7xl"
          >
            We build the
            <br />
            place you’ll
            <br />
            <span className="text-ochre">call home.</span>
          </motion.h1>
          <motion.p variants={item} className="mt-6 max-w-md text-lg leading-relaxed text-bone/80">
            From finding the right property to constructing it end-to-end —
            Carry Construction takes you from design to execution with one
            accountable team.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-3">
            {/* <Link
              to="/properties"
              className="inline-flex items-center bg-ochre px-7 py-3.5 font-mono text-xs uppercase tracking-[0.15em] text-teal-dark transition-colors hover:bg-ochre-dark hover:text-bone"
            >
              View properties
            </Link> */}
            <a
              href={`https://wa.me/${CONTACT.whatsapp}`}
              className="inline-flex items-center border border-bone/35 px-7 py-3.5 font-mono text-xs uppercase tracking-[0.15em] text-bone transition-colors hover:border-ochre hover:text-ochre"
            >
              Talk on WhatsApp
            </a>
          </motion.div>
        </motion.div>

        {/* Image / 3D */}
        <div className="relative">
          {can3D ? (
            <Suspense fallback={<VillaReveal className="aspect-[4/5] w-full" />}>
              <div className="aspect-[4/5] w-full">
                <Hero3D />
              </div>
            </Suspense>
          ) : (
            <VillaReveal className="aspect-[4/5] w-full" />
          )}
        </div>
      </div>
    </section>
  )
}
