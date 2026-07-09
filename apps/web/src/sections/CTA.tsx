import { CONTACT } from '../lib/data'
import Reveal from '../components/motion/Reveal'

export default function CTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-ochre to-ochre-dark text-bone shadow-inner">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_50%)]" />
      <Reveal
        as="div"
        className="relative z-10 mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 lg:flex-row lg:items-center"
      >
        <div>
          <h2 className="max-w-xl font-display text-3xl font-semibold leading-tight text-bone sm:text-4xl">
            Ready to buy, sell, or build? Let’s talk.
          </h2>
          <p className="mt-3 max-w-md text-bone/80">
            Tell us what you’re looking for and we’ll get back within one working day.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href={`https://wa.me/${CONTACT.whatsapp}`}
            className="inline-flex items-center bg-bone px-7 py-3.5 font-mono text-xs uppercase tracking-[0.15em] text-ink transition-colors hover:bg-sand"
          >
            WhatsApp us
          </a>
          <a
            href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
            className="inline-flex items-center border border-bone/40 px-7 py-3.5 font-mono text-xs uppercase tracking-[0.15em] text-bone transition-colors hover:bg-bone hover:text-ink"
          >
            {CONTACT.phone}
          </a>
        </div>
      </Reveal>
    </section>
  )
}
