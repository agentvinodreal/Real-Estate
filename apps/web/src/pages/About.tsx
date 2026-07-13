import Seo from '../components/Seo'
import Photo from '../components/Photo'
import Stats from '../sections/Stats'
import CTA from '../sections/CTA'
import Reveal from '../components/motion/Reveal'
import { CONTACT } from '../lib/data'

const MILESTONES = [
  { year: '2012', title: 'Founded in Pune', body: 'Started as a boutique construction consultancy focused on quality structural engineering.' },
  { year: '2015', title: 'First 100 Homes', body: 'Expanded to end-to-end turnkey residential builds across West Pune.' },
  { year: '2018', title: 'RERA Registration & Compliance', body: 'Enforced full RERA alignment on all managed properties for absolute client safety.' },
  { year: '2021', title: 'Commercial & Layouts Expansion', body: 'Launched commercial design services and custom layout plotting divisions.' },
  { year: '2024', title: '600+ Families Served', body: 'Crossed the milestone of 600+ families trusted us with their buy, resale, or construction needs.' },
]

const VALUES = [
  {
    title: 'One Team, One Promise',
    body: 'We own the entire journey from initial architectural design to structural execution and interior handover. No blame games, no hidden sub-contractor fees.'
  },
  {
    title: 'Transparent Pricing',
    body: 'We quote construction packages transparently on a per-square-foot basis. Every specification and material brand is detailed clearly before signing.'
  },
  {
    title: 'Built to Last',
    body: 'We use strictly certified Grade-A reinforcement steel, premium anti-corrosive concrete, and follow rigorous on-site quality checklists.'
  }
]

export default function About() {
  return (
    <div>
      <Seo
        title="About Us — 12+ Years building homes in Pune"
        description="Learn more about Carry Construction. Turnkey residential home builders, structural design experts, and RERA-verified property experts in Pune."
        path="/about"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: 'Carry Construction',
          url: 'https://www.carryconstruction.com',
          telephone: CONTACT.phone,
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Pune',
            addressRegion: 'Maharashtra',
            addressCountry: 'IN'
          },
          description: 'Property sale, resale, and turnkey construction services in Pune.'
        }}
      />

      {/* Header */}
      <section className="border-b border-ink/10 bg-bone-dim">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:py-16 sm:px-8">
          <span className="kicker">Our story</span>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-[1.03] tracking-tight text-ink sm:text-5xl lg:text-6xl max-w-3xl">
            Built on trust. <br />Delivered with <span className="text-ochre">craft.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            For over a decade, Carry Construction has simplified home construction and real estate acquisition in Pune. We bridge the gap between design and delivery under one accountable roof.
          </p>
        </div>
      </section>

      {/* Founder / Team */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:py-20 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <Photo
              seed="founder-portrait"
              label="Carry Construction Team Leader"
              className="aspect-[4/5] w-full max-w-md border border-ink/10 shadow-sm"
            />
          </Reveal>
          <Reveal className="flex flex-col justify-center">
            <span className="kicker">Leadership</span>
            <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
              Meet our founder.
            </h2>
            <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-ochre-dark font-mono">
              Mr. Carry Dev — Founder & Technical Director
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              With a degree in structural engineering and over 15 years of construction experience, Mr. Carry Dev founded this firm with one goal: to replace client anxiety with accountability.
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              “In Pune, homebuilders often struggle with delays, structural compromises, and pricing surprises. We set out to change this by vertical integration — structural engineering, architectural layouting, and real estate advising all happening within the same room.”
            </p>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="bg-bone-dim border-y border-ink/10">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:py-20 sm:px-8">
          <span className="kicker">Our philosophy</span>
          <h2 className="mt-4 max-w-2xl font-display text-2xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Values we live by.
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.1} className="bg-bone p-8 border border-ink/10 shadow-sm">
                <span className="font-mono text-sm text-ochre-dark">0{i + 1}</span>
                <h3 className="mt-6 font-display text-xl font-semibold text-ink">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{v.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:py-20 sm:px-8">
        <span className="kicker">Milestones</span>
        <h2 className="mt-4 max-w-2xl font-display text-2xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
          The path we travelled.
        </h2>

        <div className="mt-16 relative border-l border-ink/10 pl-8 ml-4 space-y-12">
          {MILESTONES.map((m, i) => (
            <Reveal key={m.year} delay={i * 0.05} className="relative">
              {/* Year dot overlay */}
              <div className="absolute -left-[41px] top-1.5 h-4 w-4 rounded-full bg-ochre border-4 border-bone shadow-sm" />
              <div className="font-mono text-xs font-semibold text-ochre-dark mb-1">{m.year}</div>
              <h3 className="font-display text-xl font-semibold text-ink">{m.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft max-w-2xl">{m.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Stats component */}
      <Stats />

      {/* CTA component */}
      <CTA />
    </div>
  )
}
