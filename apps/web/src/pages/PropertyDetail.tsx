import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Seo from '../components/Seo'
import Placeholder from '../components/Placeholder'
import Photo from '../components/Photo'
import InquiryForm from '../components/InquiryForm'
import { api, pricePerSqft, statusLabel, type Property } from '@carry/shared'
import { CONTACT } from '../lib/data'

function Spec({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="border-t border-ink/10 py-3">
      <dt className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete">{label}</dt>
      <dd className="mt-1 font-medium text-ink">{value}</dd>
    </div>
  )
}

export default function PropertyDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [property, setProperty] = useState<Property | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'notfound'>('loading')

  useEffect(() => {
    if (!slug) return
    setState('loading')
    api
      .getProperty(slug)
      .then((p) => {
        setProperty(p)
        setState('ready')
      })
      .catch(() => setState('notfound'))
  }, [slug])

  if (state === 'loading') {
    return <p className="mx-auto max-w-7xl px-5 py-24 font-mono text-sm text-concrete sm:px-8">Loading property…</p>
  }

  if (state === 'notfound' || !property) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-24 text-center sm:px-8">
        <h1 className="font-display text-3xl font-semibold text-ink">Property not found</h1>
        <Link to="/properties" className="mt-4 inline-block font-mono text-xs uppercase tracking-[0.15em] text-ochre-dark">
          ← Back to all properties
        </Link>
      </div>
    )
  }

  const p = property

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Residence',
    name: p.title,
    description: p.description ?? undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: p.locality,
      addressRegion: p.city,
      addressCountry: 'IN',
    },
    floorSize: { '@type': 'QuantitativeValue', value: p.areaSqft, unitCode: 'FTK' },
    numberOfRooms: p.bhk ?? undefined,
    offers: { '@type': 'Offer', price: p.priceInr, priceCurrency: 'INR' },
  }

  return (
    <div>
      <Seo
        title={`${p.title}, ${p.locality}`}
        description={p.description ?? `${p.listingType} — ${p.propertyType} in ${p.locality}, ${p.city}. ${p.priceLabel}.`}
        path={`/properties/${p.slug}`}
        jsonLd={jsonLd}
      />
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-5 pt-6 sm:px-8">
        <Link to="/properties" className="font-mono text-xs uppercase tracking-[0.15em] text-concrete hover:text-ochre-dark">
          ← All properties
        </Link>
      </div>

      {/* Title */}
      <div className="mx-auto max-w-7xl px-5 pb-8 pt-4 sm:px-8">
        <span className="inline-block bg-ink px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-bone">
          {p.listingType}
        </span>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{p.title}</h1>
            <p className="mt-2 text-ink-soft">{p.locality}, {p.city}</p>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-semibold text-ochre-dark">{p.priceLabel}</div>
            <div className="font-mono text-xs text-concrete">{pricePerSqft(p.priceInr, p.areaSqft)}</div>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {p.images && p.images.length > 0 ? (
          <Photo src={p.images[0]} seed={p.slug} label={`${p.title} - main`} className="aspect-[16/9] w-full bg-ink" objectFit="contain" />
        ) : (
          <Placeholder label={`${p.title} — main`} className="aspect-[16/9] w-full" />
        )}
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {p.images && p.images.length > 1 ? (
            p.images.slice(1, 5).map((imgUrl, idx) => (
              <Photo key={imgUrl} src={imgUrl} seed={`${p.slug}-${idx}`} className="aspect-[4/3] w-full bg-ink" objectFit="contain" />
            ))
          ) : (
            ['Living', 'Kitchen', 'Bedroom', 'Exterior'].map((lbl) => (
              <Placeholder key={lbl} label={lbl} className="aspect-[4/3] w-full" />
            ))
          )}
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Left: details */}
        <div>
          {p.description && (
            <section>
              <h2 className="font-display text-2xl font-semibold text-ink">Overview</h2>
              <p className="mt-3 leading-relaxed text-ink-soft">{p.description}</p>
            </section>
          )}

          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-ink">Specifications</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-10 sm:grid-cols-3">
              <Spec label="Type" value={p.propertyType} />
              <Spec label="Configuration" value={p.bhk ? `${p.bhk} BHK` : '—'} />
              <Spec label="Status" value={statusLabel(p.status)} />
              <Spec label="Built-up area" value={p.builtupAreaSqft ? `${p.builtupAreaSqft.toLocaleString('en-IN')} sq ft` : `${p.areaSqft.toLocaleString('en-IN')} sq ft`} />
              <Spec label="Carpet area" value={p.carpetAreaSqft ? `${p.carpetAreaSqft.toLocaleString('en-IN')} sq ft` : null} />
              <Spec label="Furnishing" value={p.furnishing} />
              <Spec label="RERA" value={p.reraNumber} />
            </dl>
          </section>

          {p.amenities.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-2xl font-semibold text-ink">Amenities</h2>
              <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {p.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-sm text-ink-soft">
                    <span className="h-1.5 w-1.5 bg-ochre" />
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-ink">Location</h2>
            <div className="relative mt-4">
              <Placeholder label="Mappls map" className="aspect-[16/7] w-full" />
              <div className="absolute bottom-3 left-3 bg-ink px-3 py-2 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-bone">
                {p.locality}, {p.city}
                {p.lat && p.lng ? ` · ${p.lat.toFixed(3)}, ${p.lng.toFixed(3)}` : ''}
              </div>
            </div>
            <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-concrete">
              Interactive Mappls map wires in here
            </p>
          </section>
        </div>

        {/* Right: sticky contact */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <InquiryForm propertyId={p.id} sourcePage={`/properties/${p.slug}`} />

          <div className="mt-3 grid grid-cols-2 gap-3">
            <a
              href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
              className="border border-ink/25 py-3 text-center font-mono text-xs uppercase tracking-[0.15em] text-ink transition-colors hover:border-ochre hover:text-ochre-dark"
            >
              Call
            </a>
            <a
              href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(`Hi, I'm interested in ${p.title} (${p.locality})`)}`}
              className="bg-ochre py-3 text-center font-mono text-xs uppercase tracking-[0.15em] text-ink transition-colors hover:bg-ochre-dark hover:text-bone"
            >
              WhatsApp
            </a>
          </div>
        </aside>
      </div>
    </div>
  )
}
