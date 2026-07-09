import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PropertyCard from '../components/PropertyCard'
import { api, type Property } from '@carry/shared'
import Reveal from '../components/motion/Reveal'

export default function FeaturedListings() {
  const [items, setItems] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .listProperties({ limit: '6', sort: 'newest' })
      .then((res) => setItems(res.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="listings" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <span className="kicker">Featured properties</span>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Homes worth coming home to.
          </h2>
        </div>
        <Link
          to="/properties"
          className="font-mono text-xs uppercase tracking-[0.15em] text-ink hover:text-ochre-dark"
        >
          Browse all →
        </Link>
      </Reveal>

      {loading ? (
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col">
              <div className="shimmer blueprint aspect-[4/3] w-full" />
              <div className="shimmer blueprint mt-4 h-5 w-3/4" />
              <div className="shimmer blueprint mt-2 h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.07}>
              <PropertyCard property={p} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  )
}
