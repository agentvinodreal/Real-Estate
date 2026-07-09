import { TESTIMONIALS } from '../lib/data'

export default function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <div className="max-w-2xl">
        <span className="kicker">In their words</span>
        <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Trusted by 600+ families.
        </h2>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <figure key={t.name} className="flex flex-col border-t-2 border-ochre pt-6">
            <blockquote className="flex-1 font-display text-lg leading-relaxed text-ink">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-6">
              <div className="font-semibold text-ink">{t.name}</div>
              <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-concrete">
                {t.location}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
