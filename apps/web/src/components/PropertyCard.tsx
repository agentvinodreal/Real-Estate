import { Link } from 'react-router-dom'
import Photo from './Photo'
import type { Property } from '@carry/shared'

const tagColor: Record<string, string> = {
  Sale: 'bg-ochre text-bone',
  Resale: 'bg-steel text-bone',
  'Under Construction': 'bg-ink text-bone',
}

export default function PropertyCard({ property: l }: { property: Property }) {
  return (
    <Link to={`/properties/${l.slug}`} className="group flex flex-col">
      <div className="relative overflow-hidden">
        <Photo
          seed={l.slug}
          label={l.title}
          className="aspect-[4/3] w-full transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <span
          className={`absolute left-3 top-3 px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] ${tagColor[l.listingType] ?? 'bg-ink text-bone'}`}
        >
          {l.listingType}
        </span>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <h3 className="font-display text-xl font-semibold text-ink group-hover:text-ochre-dark">
          {l.title}
        </h3>
        <span className="font-display text-lg font-semibold text-ochre-dark">{l.priceLabel}</span>
      </div>
      <p className="mt-1 text-sm text-concrete">
        {l.locality}, {l.city}
      </p>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-ink/10 pt-4 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-ink-soft">
        <span>{l.propertyType}</span>
        {l.bhk ? <span>{l.bhk} BHK</span> : null}
        <span>{l.areaSqft.toLocaleString('en-IN')} sq ft</span>
      </div>
      {l.reraNumber ? (
        <span className="mt-1 font-mono text-[0.6rem] tracking-[0.1em] text-concrete">
          RERA {l.reraNumber}
        </span>
      ) : null}
    </Link>
  )
}
