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
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Properties</h1>
          <p className="mt-1 text-sm text-concrete">{items.length} listings</p>
        </div>
        <Link to="/properties/new" className="bg-ink px-5 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-bone hover:bg-ochre-dark">
          + New property
        </Link>
      </div>

      {loading ? (
        <p className="font-mono text-sm text-concrete">Loading…</p>
      ) : (
        <div className="overflow-x-auto border border-ink/10">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-bone-dim text-left font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Type</th>
                <th className="p-3">Locality</th>
                <th className="p-3">Price</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-t border-ink/10">
                  <td className="p-3 font-medium text-ink">{p.title}</td>
                  <td className="p-3 text-ink-soft">{p.listingType}</td>
                  <td className="p-3 text-ink-soft">{p.locality}</td>
                  <td className="p-3 text-ochre-dark">{p.priceLabel}</td>
                  <td className="p-3 text-right">
                    <Link to={`/properties/${p.slug}`} className="mr-4 font-mono text-xs uppercase tracking-[0.12em] text-ink hover:text-ochre-dark">Edit</Link>
                    <button onClick={() => remove(p)} className="font-mono text-xs uppercase tracking-[0.12em] text-ochre-dark hover:text-ink">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
