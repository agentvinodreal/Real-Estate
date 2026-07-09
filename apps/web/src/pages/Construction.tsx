import { useEffect, useState } from 'react'
import Seo from '../components/Seo'
import Placeholder from '../components/Placeholder'
import ConstructionCard from '../components/ConstructionCard'
import InquiryForm from '../components/InquiryForm'
import { api, type ConstructionProject } from '@carry/shared'
import { PILLARS, PACKAGES, PROCESS } from '../lib/data'

export default function Construction() {
  const [projects, setProjects] = useState<ConstructionProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .listConstruction()
      .then((res) => setProjects(res.data))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <Seo
        title="Construction services — design to execution"
        description="Turnkey home construction in Pune: architecture, structure, interiors, and project management under one accountable team."
        path="/construction"
      />
      {/* Hero */}
      <section className="border-b border-ink/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div className="flex flex-col justify-center">
            <span className="kicker">Construction services</span>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.03] tracking-tight text-ink sm:text-6xl">
              Design to execution, <span className="text-ochre">under one roof.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">
              We don’t just draw plans or lay bricks — we own the entire journey.
              One team, one point of accountability, from the first sketch to the
              day you get your keys.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#quote" className="inline-flex items-center bg-ink px-7 py-3.5 font-mono text-xs uppercase tracking-[0.15em] text-bone transition-colors hover:bg-ochre-dark">
                Get a quote
              </a>
              <a href="#projects" className="inline-flex items-center border border-ink/25 px-7 py-3.5 font-mono text-xs uppercase tracking-[0.15em] text-ink transition-colors hover:border-ochre hover:text-ochre-dark">
                See our work
              </a>
            </div>
          </div>
          <Placeholder label="Featured build" className="aspect-[4/3] w-full lg:aspect-auto" />
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <span className="kicker">What we handle</span>
        <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Four disciplines, one team.
        </h2>
        <div className="mt-12 grid gap-px overflow-hidden border border-ink/10 bg-ink/10 md:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <div key={p.id} className="bg-bone p-8">
              <span className="font-mono text-sm text-ochre-dark">{p.id}</span>
              <h3 className="mt-6 font-display text-xl font-semibold text-ink">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="border-y border-ink/10 bg-bone-dim">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <span className="kicker">How it works</span>
          <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            A process you can watch, step by step.
          </h2>
          <ol className="mt-12 grid gap-px overflow-hidden border border-ink/10 bg-ink/10 md:grid-cols-5">
            {PROCESS.map((s) => (
              <li key={s.step} className="bg-bone-dim p-6">
                <span className="font-mono text-sm text-ochre-dark">{s.step}</span>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Packages */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <span className="kicker">Packages</span>
        <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Transparent, per-sq-ft pricing.
        </h2>
        <p className="mt-3 max-w-xl text-ink-soft">Indicative rates — your final quote depends on design, site, and specification.</p>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.tier}
              className={`flex flex-col border p-8 ${pkg.highlight ? 'border-ochre bg-sand' : 'border-ink/15 bg-bone'}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl font-semibold text-ink">{pkg.tier}</h3>
                {pkg.highlight && (
                  <span className="bg-ochre px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.15em] text-bone">
                    Popular
                  </span>
                )}
              </div>
              <div className="mt-2 font-display text-3xl font-semibold text-ochre-dark">{pkg.price}</div>
              <ul className="mt-6 flex-1 space-y-2.5">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink-soft">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-ochre" />
                    {f}
                  </li>
                ))}
              </ul>
              <a href="#quote" className="mt-8 block bg-ink py-3 text-center font-mono text-xs uppercase tracking-[0.15em] text-bone transition-colors hover:bg-ochre-dark">
                Get this quote
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="border-t border-ink/10 bg-bone-dim">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <span className="kicker">Recent work</span>
          <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Projects we’ve delivered.
          </h2>
          {loading ? (
            <p className="mt-12 font-mono text-sm text-concrete">Loading projects…</p>
          ) : (
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <ConstructionCard key={p.slug} project={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quote form */}
      <section id="quote" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          <div>
            <span className="kicker">Get started</span>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              Tell us about your project.
            </h2>
            <p className="mt-5 max-w-md text-ink-soft">
              Share your plot size, location, and what you have in mind. We’ll come
              back with an indicative estimate and next steps within one working day.
            </p>
          </div>
          <InquiryForm sourcePage="/construction" heading="Request a construction quote" />
        </div>
      </section>
    </div>
  )
}
