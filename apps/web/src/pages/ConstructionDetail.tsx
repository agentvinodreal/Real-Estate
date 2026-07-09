import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Seo from '../components/Seo'
import Placeholder from '../components/Placeholder'
import InquiryForm from '../components/InquiryForm'
import { api, type ConstructionProject } from '@carry/shared'

function Fact({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="border-l border-ink/15 pl-4">
      <dt className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete">{label}</dt>
      <dd className="mt-1 font-display text-xl font-semibold text-ink">{value}</dd>
    </div>
  )
}

export default function ConstructionDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [project, setProject] = useState<ConstructionProject | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'notfound'>('loading')

  useEffect(() => {
    if (!slug) return
    setState('loading')
    api
      .getConstruction(slug)
      .then((p) => {
        setProject(p)
        setState('ready')
      })
      .catch(() => setState('notfound'))
  }, [slug])

  if (state === 'loading') {
    return <p className="mx-auto max-w-7xl px-5 py-24 font-mono text-sm text-concrete sm:px-8">Loading project…</p>
  }

  if (state === 'notfound' || !project) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-24 text-center sm:px-8">
        <h1 className="font-display text-3xl font-semibold text-ink">Project not found</h1>
        <Link to="/construction" className="mt-4 inline-block font-mono text-xs uppercase tracking-[0.15em] text-ochre-dark">
          ← Back to construction
        </Link>
      </div>
    )
  }

  const p = project

  return (
    <div>
      <Seo
        title={`${p.title} — ${p.category}`}
        description={p.description ?? `${p.category} in ${p.location} by Carry Construction.`}
        path={`/construction/${p.slug}`}
      />
      {/* Breadcrumb + title */}
      <div className="mx-auto max-w-7xl px-5 pb-8 pt-6 sm:px-8">
        <Link to="/construction" className="font-mono text-xs uppercase tracking-[0.15em] text-concrete hover:text-ochre-dark">
          ← Construction
        </Link>
        <span className="mt-4 inline-block bg-ochre px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-bone">
          {p.category}
        </span>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{p.title}</h1>
        <p className="mt-2 text-ink-soft">{p.location}</p>
      </div>

      {/* Hero image */}
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Placeholder label={`${p.title} — completed`} className="aspect-[16/9] w-full" />
      </div>

      {/* Facts */}
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Fact label="Category" value={p.category} />
          <Fact label="Built area" value={p.areaSqft ? `${p.areaSqft.toLocaleString('en-IN')} sq ft` : null} />
          <Fact label="Duration" value={p.durationMonths ? `${p.durationMonths} months` : null} />
          <Fact label="Package" value={p.packageTier} />
        </dl>
      </div>

      {/* Body */}
      <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 sm:px-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          {p.description && (
            <section>
              <h2 className="font-display text-2xl font-semibold text-ink">About this project</h2>
              <p className="mt-3 leading-relaxed text-ink-soft">{p.description}</p>
            </section>
          )}

          {p.processStages.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-2xl font-semibold text-ink">How we built it</h2>
              <ol className="mt-4">
                {p.processStages.map((s, i) => (
                  <li key={i} className={`flex gap-6 py-5 ${i !== p.processStages.length - 1 ? 'border-b border-ink/10' : ''}`}>
                    <span className="font-mono text-sm text-ochre-dark">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-ink">{s.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Before / after */}
          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-ink">Before &amp; after</h2>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <Placeholder label="Before" className="aspect-[4/3] w-full" />
                <p className="mt-2 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete">Before</p>
              </div>
              <div>
                <Placeholder label="After" className="aspect-[4/3] w-full" />
                <p className="mt-2 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete">After</p>
              </div>
            </div>
          </section>

          {/* Stage gallery */}
          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-ink">On-site progress</h2>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {['Foundation', 'Structure', 'Finishing'].map((s) => (
                <Placeholder key={s} label={s} className="aspect-square w-full" />
              ))}
            </div>
          </section>
        </div>

        {/* Sticky quote */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <InquiryForm
            projectId={p.id}
            sourcePage={`/construction/${p.slug}`}
            heading="Build something like this"
          />
        </aside>
      </div>
    </div>
  )
}
