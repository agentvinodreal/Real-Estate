import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../lib/adminApi'
import type { Property } from '@carry/shared'

export default function Properties() {
  const [items, setItems] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    adminApi.listProperties().then(setItems).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function remove(p: Property) {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return
    await adminApi.deleteProperty(p.id)
    setItems((xs) => xs.filter((x) => x.id !== p.id))
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Properties</h1>
          <p className="mt-1 text-sm text-concrete">{items.length} active listings</p>
        </div>
        <Link to="/properties/new" className="bg-ink px-5 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-bone hover:bg-ochre-dark">
          + New property
        </Link>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <p className="font-mono text-sm text-concrete animate-pulse">Loading Properties…</p>
        </div>
      ) : items.length === 0 ? (
        <p className="border border-dashed border-ink/20 p-10 text-center text-ink-soft bg-bone-dim/30">
          No properties found. Click "+ New property" to create one.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <div
              key={p.id}
              className="group flex flex-col justify-between border border-ink/10 bg-bone p-5 hover:border-ink/20 shadow-sm transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-sans text-lg font-semibold text-ink leading-snug">
                    {p.title}
                  </h3>
                  <span className="font-mono text-[0.65rem] bg-ink/5 px-2.5 py-0.5 uppercase tracking-wider text-ink-soft whitespace-nowrap">
                    {p.listingType}
                  </span>
                </div>

                <p className="mt-1 text-xs text-concrete font-mono uppercase tracking-wider">
                  {p.locality}, {p.city}
                </p>

                <div className="mt-4 flex items-baseline justify-between border-y border-ink/5 py-2.5 my-3">
                  <span className="font-mono text-[0.65rem] text-concrete uppercase tracking-wide">Price</span>
                  <span className="font-sans text-base font-semibold text-ochre-dark">{p.priceLabel}</span>
                </div>

                <div className="grid grid-cols-2 gap-y-1.5 font-mono text-[0.65rem] text-ink-soft uppercase tracking-wider">
                  <div>Type: <span className="text-ink">{p.propertyType}</span></div>
                  <div>BHK: <span className="text-ink">{p.bhk ?? 'N/A'}</span></div>
                  <div className="col-span-2">Area: <span className="text-ink">{p.areaSqft.toLocaleString('en-IN')} sq ft</span></div>
                </div>

                <div className="mt-4 flex gap-2">
                  {p.featured && (
                    <span className="border border-ochre/30 bg-ochre/5 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-ochre-dark">
                      Featured
                    </span>
                  )}
                  {p.published ? (
                    <span className="border border-green-600/30 bg-green-600/5 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-green-700">
                      Published
                    </span>
                  ) : (
                    <span className="border border-ink/20 bg-ink/5 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-concrete">
                      Draft
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-4 border-t border-ink/5 pt-3">
                <Link
                  to={`/properties/${p.slug}`}
                  className="font-mono text-xs uppercase tracking-[0.12em] text-ink hover:text-ochre-dark transition-colors"
                >
                  Edit listing
                </Link>
                <button
                  onClick={() => remove(p)}
                  className="font-mono text-xs uppercase tracking-[0.12em] text-ochre-dark hover:text-ink transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
