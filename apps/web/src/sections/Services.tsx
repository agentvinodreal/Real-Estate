import { Link } from 'react-router-dom'
import { SERVICES } from '../lib/data'

const LINKS: Record<string, string> = {
  Sale: '/properties',
  Resale: '/properties?listingType=Resale',
  Build: '/construction',
}

export default function Services() {
  return (
    <section id="services" className="border-y border-ink/10 bg-bone-dim">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="max-w-2xl">
          <span className="kicker">What we do</span>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Three ways we help you move.
          </h2>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden border border-ink/10 bg-ink/10 md:grid-cols-3">
          {SERVICES.map((s) => (
            <Link
              key={s.id}
              to={LINKS[s.tag] ?? '/'}
              className="group flex flex-col bg-bone p-8 transition-colors hover:bg-sand"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-ochre-dark">{s.id}</span>
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-concrete">{s.tag}</span>
              </div>
              <h3 className="mt-8 font-display text-2xl font-semibold text-ink">{s.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">{s.body}</p>
              <span className="mt-6 font-mono text-xs uppercase tracking-[0.15em] text-ink transition-colors group-hover:text-ochre-dark">
                Learn more →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
