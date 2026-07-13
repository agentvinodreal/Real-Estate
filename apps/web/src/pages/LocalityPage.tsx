import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Seo from '../components/Seo'
import PropertyCard from '../components/PropertyCard'
import PropertyCardSkeleton from '../components/PropertyCardSkeleton'
import { api, type Property } from '@carry/shared'

type LocalityConfig = {
  name: string
  tagline: string
  description: string
  landmarks: string[]
  avgPricePerSqft: string
}

const LOCALITIES: Record<string, LocalityConfig> = {
  kharadi: {
    name: 'Kharadi',
    tagline: "Pune's IT Corridor",
    description: "Kharadi has emerged as one of Pune's premier residential & commercial IT hubs. Home to EON Free Zone and World Trade Center, it offers excellent rental yields and premium gated communities.",
    landmarks: ['EON IT Park', 'World Trade Center', 'Radisson Blu Hotel', 'Phoenix Marketcity Mall'],
    avgPricePerSqft: '₹7,500 – ₹9,200',
  },
  baner: {
    name: 'Baner',
    tagline: "Premium Residential & Café District",
    description: "Baner is known for its sophisticated café culture, proximity to Hinjewadi Phase 1, and upscale residential high-rises. A favorite choice for IT professionals and high-income families.",
    landmarks: ['Balewadi High Street', 'Jupiter Hospital', 'National Insurance Academy', 'Baner Hill Reserve'],
    avgPricePerSqft: '₹8,500 – ₹10,500',
  },
  wakad: {
    name: 'Wakad',
    tagline: "Connectivity Center of West Pune",
    description: "Wakad is a hyper-growth residential hub positioned right on the Pune-Bangalore highway. Offering vast options in multi-specialty developments, it boasts quick access to Hinjewadi IT park.",
    landmarks: ['Phoenix Mall of the Millennium', 'D-Mart Wakad', 'Indira College', 'Bhujbal Chowk'],
    avgPricePerSqft: '₹6,800 – ₹8,200',
  },
  hinjewadi: {
    name: 'Hinjewadi',
    tagline: "Silicon Valley of Pune",
    description: "Hinjewadi is the engine of Pune's IT growth, housing hundreds of global tech companies across Phase 1, 2, and 3. Gated layouts here offer high connectivity and solid appreciation.",
    landmarks: ['Infosys Circle Phase 1', 'Wipro Phase 2', 'Grand Highstreet Mall', 'Hinjewadi Metro Line'],
    avgPricePerSqft: '₹6,200 – ₹7,800',
  },
  'viman-nagar': {
    name: 'Viman Nagar',
    tagline: "Central, Upscale & Connected",
    description: "Viman Nagar stands as one of Pune's most affluent central neighborhoods, located directly next to the Pune Airport. Excellent infrastructure, luxury shopping, and top schools define this hub.",
    landmarks: ['Pune International Airport', 'Symbiosis Campus', 'Phoenix Marketcity', 'Joggers Park'],
    avgPricePerSqft: '₹10,000 – ₹13,000',
  },
  'koregaon-park': {
    name: 'Koregaon Park',
    tagline: "Pune's Most Prestigious Address",
    description: "Koregaon Park is famous for its leafy green lanes, luxury bungalows, high-end fine dining, and historical significance. It remains the gold standard of real estate in Pune.",
    landmarks: ['Osho Ashram', 'German Bakery', 'Jewel Square Mall', 'Mundwa Bridge Junction'],
    avgPricePerSqft: '₹14,000 – ₹18,500',
  },
  hadapsar: {
    name: 'Hadapsar',
    tagline: "Magarpatta & Industrial Hub",
    description: "Hadapsar hosts Magarpatta City and SP Infocity, making it a self-contained IT township hub. Gated townships here feature massive gardens, sports clubs, and integrated schools.",
    landmarks: ['Magarpatta Cybercity', 'Amanora Mall', 'Seasons Mall', 'SP Infocity'],
    avgPricePerSqft: '₹7,000 – ₹8,800',
  },
}

export default function LocalityPage() {
  const { locality } = useParams<{ locality: string }>()
  const slug = locality?.toLowerCase() || ''
  const config = LOCALITIES[slug]

  const [items, setItems] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    
    // We pass locality as search query or backend filter param.
    // Assuming backend /properties accepts filter values or we filter client-side.
    api
      .listProperties({ q: config?.name || slug, limit: '24' })
      .then((res) => {
        // Double check matching locality just in case
        const matched = res.data.filter(
          (p) => p.locality.toLowerCase() === slug || p.locality.toLowerCase().includes(slug)
        )
        setItems(matched.length > 0 ? matched : res.data.slice(0, 6)) // fallback to general if none matched
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [slug, config])

  if (!config) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-24 text-center sm:px-8">
        <h1 className="font-display text-3xl font-semibold text-ink">Locality not covered</h1>
        <p className="text-sm text-concrete mt-1">We currently do not have specialized guides for this area.</p>
        <Link to="/properties" className="mt-4 inline-block font-mono text-xs uppercase tracking-[0.15em] text-ochre-dark">
          ← View all properties
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Seo
        title={`Properties for sale in ${config.name}, Pune — Guide & Listings`}
        description={`Explore flats, apartments, villas, and commercial real estate in ${config.name}, Pune. Average rates: ${config.avgPricePerSqft}.`}
        path={`/properties/area/${slug}`}
      />

      {/* Locality Header */}
      <div className="border-b border-ink/10 bg-bone-dim">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:py-16 sm:px-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <span className="kicker">{config.tagline}</span>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
              Living in {config.name}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft max-w-xl">
              {config.description}
            </p>
          </div>
          
          {/* Quick Stats Box */}
          <div className="bg-bone border border-ink/10 p-6 flex flex-col justify-center">
            <h3 className="font-mono text-[0.65rem] uppercase tracking-wider text-concrete">Quick insights</h3>
            <div className="mt-4">
              <span className="font-mono text-[0.6rem] uppercase tracking-wider text-concrete">Avg. Price Rate</span>
              <div className="font-display text-2xl font-bold text-ochre-dark mt-0.5">{config.avgPricePerSqft}</div>
            </div>
            <div className="mt-4">
              <span className="font-mono text-[0.6rem] uppercase tracking-wider text-concrete">Key Landmarks</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {config.landmarks.map((l) => (
                  <span key={l} className="bg-ink/5 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-ink-soft rounded-sm">
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <h2 className="font-display text-2xl font-semibold text-ink mb-8">
          Available Listings in {config.name}
        </h2>

        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="border border-dashed border-ink/20 py-20 text-center">
            <p className="font-display text-xl text-ink">No direct listings available right now in {config.name}.</p>
            <p className="text-xs text-concrete mt-1">Submit an enquiry and our advisory team will source options for you.</p>
            <Link to="/contact" className="mt-4 inline-flex bg-ink text-bone font-mono text-xs uppercase tracking-[0.15em] px-6 py-2.5">
              Contact Advisor
            </Link>
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
