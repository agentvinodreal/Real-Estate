import { useEffect, useState, lazy, Suspense } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Share2, Check } from 'lucide-react'
import Seo from '../components/Seo'
import Placeholder from '../components/Placeholder'
import Photo from '../components/Photo'
import InquiryForm from '../components/InquiryForm'

const GalleryLightbox = lazy(() => import('../components/GalleryLightbox'))
const PropertyMap = lazy(() => import('../components/PropertyMap'))

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
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [shareCopied, setShareCopied] = useState(false)

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
    return (
      <div className="animate-pulse">
        {/* Breadcrumb skeleton */}
        <div className="mx-auto max-w-7xl px-5 pt-6 sm:px-8">
          <div className="shimmer bg-ink/5 h-4 w-28 rounded-sm" />
        </div>

        {/* Title skeleton */}
        <div className="mx-auto max-w-7xl px-5 pb-8 pt-4 sm:px-8">
          <div className="shimmer bg-ink/5 h-3.5 w-16 rounded-sm mb-3" />
          <div className="shimmer bg-ink/10 h-10 w-2/3 sm:h-12 rounded-sm" />
        </div>

        {/* Gallery skeleton */}
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="shimmer blueprint aspect-[16/9] w-full" />
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shimmer blueprint aspect-[4/3] w-full" />
            ))}
          </div>
        </div>

        {/* Price block skeleton */}
        <div className="mx-auto max-w-7xl px-5 mt-6 sm:px-8 flex items-baseline justify-between border-b border-ink/10 pb-6">
          <div>
            <div className="shimmer bg-ink/5 h-3 w-10 rounded-sm mb-1" />
            <div className="shimmer bg-ochre/15 h-8 w-40 rounded-sm" />
          </div>
          <div>
            <div className="shimmer bg-ink/5 h-3 w-10 rounded-sm mb-1" />
            <div className="shimmer bg-ink/5 h-5 w-24 rounded-sm" />
          </div>
        </div>

        {/* Body skeleton */}
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.6fr_1fr]">
          {/* Left column */}
          <div>
            <div className="shimmer bg-ink/10 h-7 w-32 rounded-sm mb-4" />
            <div className="space-y-2 mb-10">
              <div className="shimmer bg-ink/5 h-4 w-full rounded-sm" />
              <div className="shimmer bg-ink/5 h-4 w-full rounded-sm" />
              <div className="shimmer bg-ink/5 h-4 w-3/4 rounded-sm" />
            </div>

            <div className="shimmer bg-ink/10 h-7 w-40 rounded-sm mb-4" />
            <div className="grid grid-cols-2 gap-x-10 gap-y-4 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border-t border-ink/10 py-3">
                  <div className="shimmer bg-ink/5 h-3 w-12 rounded-sm mb-1" />
                  <div className="shimmer bg-ink/5 h-5 w-24 rounded-sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div>
            <div className="shimmer bg-ink/5 h-[320px] w-full border border-ink/10 rounded-sm" />
          </div>
        </div>
      </div>
    )
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

  async function handleShare() {
    const shareUrl = `${window.location.origin}/properties/${p.slug}`
    const shareData = {
      title: p.title,
      text: `${p.title} — ${p.locality}, ${p.city}. ${p.priceLabel}`,
      url: shareUrl,
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // user cancelled share sheet — no-op
      }
      return
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    } catch {
      // clipboard unavailable — nothing more we can do
    }
  }

  return (
    <div className="pb-20 md:pb-0">
      <Seo
        title={`${p.title}, ${p.locality}`}
        description={p.description ?? `${p.listingType} — ${p.propertyType} in ${p.locality}, ${p.city}. ${p.priceLabel}.`}
        path={`/properties/${p.slug}`}
        image={p.images && p.images.length > 0 ? p.images[0] : undefined}
        jsonLd={jsonLd}
      />
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-5 pt-6 sm:px-8 flex items-center justify-between">
        <Link to="/properties" className="font-mono text-xs uppercase tracking-[0.15em] text-concrete hover:text-ochre-dark">
          ← All properties
        </Link>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.15em] text-concrete hover:text-ochre-dark cursor-pointer"
        >
          {shareCopied ? (
            <>
              <Check size={14} /> Link copied
            </>
          ) : (
            <>
              <Share2 size={14} /> Share
            </>
          )}
        </button>
      </div>

      {/* Title */}
      <div className="mx-auto max-w-7xl px-5 pb-8 pt-4 sm:px-8">
        <span className="inline-block bg-ink px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-bone">
          {p.listingType}
        </span>
        <div className="mt-3">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{p.title}</h1>
        </div>
      </div>

      {/* Gallery */}
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Mobile swipable gallery */}
        <div className="md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2">
          {p.images && p.images.length > 0 ? (
            p.images.map((imgUrl, idx) => (
              <button
                key={imgUrl}
                onClick={() => {
                  setGalleryOpen(true)
                  setGalleryIndex(idx)
                }}
                className="w-[85vw] shrink-0 snap-center relative aspect-[16/10] bg-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ochre cursor-pointer"
              >
                <Photo src={imgUrl} seed={`${p.slug}-mob-${idx}`} className="h-full w-full" objectFit="cover" />
                <span className="absolute bottom-3 right-3 bg-ink/80 text-bone font-mono text-[0.62rem] px-2 py-1 uppercase tracking-wider">
                  {idx + 1} / {p.images.length}
                </span>
              </button>
            ))
          ) : (
            <Placeholder label={`${p.title} — main`} className="w-[85vw] shrink-0 aspect-[16/10]" />
          )}
        </div>

        {/* Desktop grid gallery */}
        <div className="hidden md:block">
          {p.images && p.images.length > 0 ? (
            <div className="relative group cursor-pointer overflow-hidden" onClick={() => { setGalleryOpen(true); setGalleryIndex(0) }}>
              <Photo src={p.images[0]} seed={p.slug} label={`${p.title} - main`} className="aspect-[16/9] w-full bg-ink transition-transform duration-500 group-hover:scale-[1.02]" objectFit="contain" />
              {p.images.length > 1 && (
                <button 
                  className="absolute bottom-4 right-4 bg-ink/80 hover:bg-ochre hover:text-ink text-bone font-mono text-[0.65rem] uppercase tracking-[0.15em] px-4 py-2 transition-colors duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    setGalleryOpen(true);
                    setGalleryIndex(0);
                  }}
                >
                  View all {p.images.length} photos
                </button>
              )}
            </div>
          ) : (
            <Placeholder label={`${p.title} — main`} className="aspect-[16/9] w-full" />
          )}
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {p.images && p.images.length > 1 ? (
              p.images.slice(1, 5).map((imgUrl, idx) => (
                <button
                  key={imgUrl}
                  onClick={() => {
                    setGalleryOpen(true);
                    setGalleryIndex(idx + 1);
                  }}
                  className="group relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ochre aspect-[4/3] w-full bg-ink"
                >
                  <Photo src={imgUrl} seed={`${p.slug}-${idx}`} className="h-full w-full transition-transform duration-300 group-hover:scale-105" objectFit="cover" />
                </button>
              ))
            ) : (
              ['Living', 'Kitchen', 'Bedroom', 'Exterior'].map((lbl) => (
                <Placeholder key={lbl} label={lbl} className="aspect-[4/3] w-full" />
              ))
            )}
          </div>
        </div>
      </div>

      {p.images && p.images.length > 0 && (
        <Suspense fallback={null}>
          <GalleryLightbox
            images={p.images}
            open={galleryOpen}
            startIndex={galleryIndex}
            onClose={() => setGalleryOpen(false)}
          />
        </Suspense>
      )}

      {/* Price block below images */}
      <div className="mx-auto max-w-7xl px-5 mt-6 sm:px-8 flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between border-b border-ink/10 pb-6">
        <div>
          <span className="font-mono text-[0.6rem] text-concrete uppercase tracking-[0.15em]">Price</span>
          <div className="font-display text-3xl font-semibold text-ochre-dark mt-1">{p.priceLabel}</div>
        </div>
        <div className="sm:text-right">
          <span className="font-mono text-[0.6rem] text-concrete uppercase tracking-[0.15em]">Rate</span>
          <div className="font-mono text-sm text-ink-soft mt-1">{pricePerSqft(p.priceInr, p.areaSqft)}</div>
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
              <Spec label="Location" value={`${p.locality}, ${p.city}`} />
              <Spec label="Address" value={p.address} />
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

          {p.floorPlanUrl && (
            <section className="mt-10">
              <h2 className="font-display text-2xl font-semibold text-ink">Floor Plan</h2>
              <div className="mt-4 border border-ink/10 p-4 bg-bone/30">
                <Photo
                  src={p.floorPlanUrl}
                  seed={`${p.slug}-floor-plan`}
                  label={`${p.title} - Floor Plan`}
                  className="aspect-[4/3] w-full max-w-2xl mx-auto bg-ink"
                  objectFit="contain"
                />
              </div>
            </section>
          )}

          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-ink">Location</h2>
            {p.address && <p className="mt-3 text-sm text-ink-soft">{p.address}</p>}
            <p className="mt-1 text-sm font-semibold text-ink">{p.locality}, {p.city}</p>
            <div className="mt-4">
              {p.lat && p.lng ? (
                <Suspense fallback={<div className="aspect-[4/3] sm:aspect-[16/7] w-full bg-ink/5 animate-pulse rounded-sm shimmer" />}>
                  <PropertyMap lat={p.lat} lng={p.lng} title={p.title} className="aspect-[4/3] sm:aspect-[16/7] w-full" />
                </Suspense>
              ) : (
                <div className="relative border border-ink/10 aspect-[4/3] sm:aspect-[16/7] w-full">
                  <Placeholder label="No Location Pinned" className="w-full h-full" />
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right: sticky contact */}
        <aside id="inquiry-section" className="lg:sticky lg:top-24 lg:self-start mb-12 md:mb-0">
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

      {/* Sticky Bottom Inquiry Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-ink/10 bg-teal/95 text-bone p-3 gap-3 md:hidden backdrop-blur">
        <a
          href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
          className="flex-1 bg-ochre text-center py-3 font-mono text-[0.7rem] uppercase tracking-wider text-teal-dark font-semibold transition-colors active:bg-ochre-dark"
        >
          Call Us
        </a>
        <button
          onClick={() => {
            const element = document.getElementById('inquiry-section');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="flex-1 border border-bone/30 text-center py-3 font-mono text-[0.7rem] uppercase tracking-wider transition-colors active:bg-bone/10 cursor-pointer"
        >
          Inquire Now
        </button>
      </div>
    </div>
  )
}
