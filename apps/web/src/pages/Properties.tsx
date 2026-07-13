import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Seo from '../components/Seo'
import PropertyCard from '../components/PropertyCard'
import PropertyCardSkeleton from '../components/PropertyCardSkeleton'
import { api, type Property } from '@carry/shared'
import { SlidersHorizontal } from 'lucide-react'

const LISTING_TYPES = ['Sale', 'Resale', 'Under Construction']
const PROPERTY_TYPES = ['Apartment', 'Villa', 'Plot', 'Commercial']
const BHKS = ['1', '2', '3', '4']
const BUDGETS: { label: string; value: string; min?: string; max?: string }[] = [
  { label: 'Any budget', value: '' },
  { label: 'Up to ₹75 L', value: '0-7500000', max: '7500000' },
  { label: '₹75 L – ₹1.25 Cr', value: '7500000-12500000', min: '7500000', max: '12500000' },
  { label: '₹1.25 – ₹2 Cr', value: '12500000-20000000', min: '12500000', max: '20000000' },
  { label: 'Above ₹2 Cr', value: '20000000-', min: '20000000' },
]
const SORTS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: low to high', value: 'price_asc' },
  { label: 'Price: high to low', value: 'price_desc' },
  { label: 'Largest area', value: 'area_desc' },
]

const selectClass =
  "w-full appearance-none border border-ink/20 bg-bone px-3 py-2.5 pr-8 font-mono text-xs uppercase tracking-[0.12em] text-ink focus:border-teal focus:outline-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%238b857a%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_8px_center] bg-[size:16px] bg-no-repeat"

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-teal/40 bg-teal/10 px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-teal">
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="hover:text-ochre font-bold cursor-pointer"
      >
        ✕
      </button>
    </span>
  )
}

export default function Properties() {
  const [params, setParams] = useSearchParams()
  const [items, setItems] = useState<Property[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showFiltersMobile, setShowFiltersMobile] = useState(false)

  const filters = useMemo(
    () => ({
      q: params.get('q') ?? '',
      listingType: params.get('listingType') ?? '',
      propertyType: params.get('propertyType') ?? '',
      bhk: params.get('bhk') ?? '',
      budget: params.get('budget') ?? '',
      sort: params.get('sort') ?? 'newest',
    }),
    [params],
  )

  const activeCount = useMemo(
    () =>
      [filters.listingType, filters.propertyType, filters.bhk, filters.budget].filter(
        Boolean
      ).length,
    [filters],
  )

  function update(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  function reset() {
    setParams(new URLSearchParams(), { replace: true })
  }

  useEffect(() => {
    setLoading(true)
    const budget = BUDGETS.find((b) => b.value === filters.budget)
    api
      .listProperties({
        q: filters.q,
        listingType: filters.listingType,
        propertyType: filters.propertyType,
        bhk: filters.bhk,
        minPrice: budget?.min,
        maxPrice: budget?.max,
        sort: filters.sort,
        limit: '24',
      })
      .then((res) => {
        setItems(res.data)
        setTotal(res.total)
      })
      .catch(() => {
        setItems([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [filters])

  const hasFilters =
    filters.q || filters.listingType || filters.propertyType || filters.bhk || filters.budget

  return (
    <div>
      <Seo
        title="Properties for sale & resale in Pune"
        description="Browse RERA-verified apartments, villas, plots, and commercial properties for sale and resale across Pune."
        path="/properties"
      />
      {/* Page header */}
      <div className="border-b border-ink/10 bg-bone-dim">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <span className="kicker">Properties</span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
            Find your next address.
          </h1>
          <p className="mt-3 max-w-xl text-ink-soft">
            Sale, resale, and under-construction homes across {items[0]?.city ?? 'Pune'} — every listing RERA-verified.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="sticky top-[68px] z-30 border-b border-ink/10 bg-bone/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-5 py-4 sm:px-8">
          {/* Mobile Search and Filters toggle */}
          <div className="flex gap-3 md:hidden">
            <input
              value={filters.q}
              onChange={(e) => update('q', e.target.value)}
              placeholder="Search locality…"
              className="flex-1 border border-ink/20 bg-bone px-3 py-2.5 text-sm text-ink placeholder:text-concrete focus:border-teal focus:outline-none"
            />
            <button
              onClick={() => setShowFiltersMobile((v) => !v)}
              className={`flex items-center gap-2 border px-4 py-2.5 font-mono text-xs uppercase tracking-wider transition cursor-pointer ${
                showFiltersMobile || activeCount > 0
                  ? 'border-teal bg-teal text-bone'
                  : 'border-ink/20 bg-bone text-ink'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters {activeCount > 0 && `(${activeCount})`}</span>
            </button>
          </div>

          {/* Desktop Filter Row & Mobile Accordion */}
          <div className={`${showFiltersMobile ? 'block mt-3' : 'hidden'} md:block`}>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
              <input
                value={filters.q}
                onChange={(e) => update('q', e.target.value)}
                placeholder="Search locality…"
                className="hidden md:block border border-ink/20 bg-bone px-3 py-2.5 text-sm text-ink placeholder:text-concrete focus:border-teal focus:outline-none md:col-span-1"
              />
              <select className={`${selectClass} max-md:col-span-2 md:col-span-1`} value={filters.listingType} onChange={(e) => update('listingType', e.target.value)}>
                <option value="">All types</option>
                {LISTING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select className={selectClass} value={filters.propertyType} onChange={(e) => update('propertyType', e.target.value)}>
                <option value="">Any property</option>
                {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select className={selectClass} value={filters.bhk} onChange={(e) => update('bhk', e.target.value)}>
                <option value="">Any BHK</option>
                {BHKS.map((t) => <option key={t} value={t}>{t} BHK</option>)}
              </select>
              <select className={selectClass} value={filters.budget} onChange={(e) => update('budget', e.target.value)}>
                {BHKS.length > 0 && BUDGETS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
              <select className={selectClass} value={filters.sort} onChange={(e) => update('sort', e.target.value)}>
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          {hasFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink/5 pt-3">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete">
                Active:
              </span>
              {filters.q && (
                <FilterChip label={`"${filters.q}"`} onRemove={() => update('q', '')} />
              )}
              {filters.listingType && (
                <FilterChip label={filters.listingType} onRemove={() => update('listingType', '')} />
              )}
              {filters.propertyType && (
                <FilterChip label={filters.propertyType} onRemove={() => update('propertyType', '')} />
              )}
              {filters.bhk && (
                <FilterChip label={`${filters.bhk} BHK`} onRemove={() => update('bhk', '')} />
              )}
              {filters.budget && (
                <FilterChip
                  label={BUDGETS.find((b) => b.value === filters.budget)?.label ?? filters.budget}
                  onRemove={() => update('budget', '')}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="mb-8 flex items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-concrete">
            {loading ? 'Loading…' : `${total} propert${total === 1 ? 'y' : 'ies'}`}
            {hasFilters && !loading && (
              <span className="ml-2 text-ochre-dark">({total} match{total === 1 ? '' : 'es'})</span>
            )}
          </p>
          {hasFilters && (
            <button onClick={reset} className="font-mono text-xs uppercase tracking-[0.15em] text-ochre-dark hover:text-ink cursor-pointer">
              Clear filters ✕
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="border border-dashed border-ink/20 py-20 text-center">
            <p className="font-display text-2xl text-ink">No properties match those filters.</p>
            <button onClick={reset} className="mt-4 font-mono text-xs uppercase tracking-[0.15em] text-ochre-dark">
              Reset search →
            </button>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <PropertyCard key={p.slug} property={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
