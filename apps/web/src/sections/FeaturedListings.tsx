import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PropertyCard from '../components/PropertyCard'
import { api, type Property } from '@carry/shared'

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
      <div className="flex flex-wrap items-end justify-between gap-4">
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
      </div>

      {loading ? (
        <p className="mt-12 font-mono text-sm text-concrete">Loading properties…</p>
      ) : (
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <PropertyCard key={p.slug} property={p} />
          ))}
        </div>
      )}
    </section>
  )
}
