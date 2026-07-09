import { CONTACT } from '../lib/data'
import Reveal from '../components/motion/Reveal'

export default function CTA() {
  return (
    <section className="shimmer relative overflow-hidden bg-ochre">
      <Reveal
        as="div"
        className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 lg:flex-row lg:items-center"
      >
        <div>
          <h2 className="max-w-xl font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            Ready to buy, sell, or build? Let’s talk.
          </h2>
          <p className="mt-3 max-w-md text-ink/75">
            Tell us what you’re looking for and we’ll get back within one working day.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href={`https://wa.me/${CONTACT.whatsapp}`}
            className="inline-flex items-center bg-ink px-7 py-3.5 font-mono text-xs uppercase tracking-[0.15em] text-bone transition-colors hover:bg-ink-soft"
          >
            WhatsApp us
          </a>
          <a
            href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
            className="inline-flex items-center border border-ink/40 px-7 py-3.5 font-mono text-xs uppercase tracking-[0.15em] text-ink transition-colors hover:bg-ink hover:text-bone"
          >
            {CONTACT.phone}
          </a>
        </div>
      </Reveal>
    </section>
  )
}
