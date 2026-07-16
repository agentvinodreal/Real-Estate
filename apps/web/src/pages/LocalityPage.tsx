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
  'boring-road': {
    name: 'Boring Road',
    tagline: "Patna's Commercial Core",
    description: "Boring Road has emerged as one of Patna's premier residential & commercial hubs. Home to key business complexes, coaching centers, and premium shopping, it offers excellent rental yields.",
    landmarks: ['Boring Road Chauraha', 'Pantaloon Store', 'Harihar Chamber', 'Mona Cinema'],
    avgPricePerSqft: '₹8,500 – ₹10,200',
  },
  danapur: {
    name: 'Danapur',
    tagline: "Premium Residential Extension",
    description: "Danapur is known for its quiet residential neighborhoods, proximity to the Ganges, and upscale high-rises. A favorite choice for professionals, army personnel, and high-income families.",
    landmarks: ['Danapur Railway Station', 'Army Cantonment Area', 'Radiant International School', 'Danapur Ghat'],
    avgPricePerSqft: '₹5,500 – ₹7,500',
  },
  'ashiana-nagar': {
    name: 'Ashiana Nagar',
    tagline: "Connectivity Center of West Patna",
    description: "Ashiana Nagar is a hyper-growth residential hub positioned right off Bailey Road. Offering vast options in multi-specialty developments, it boasts quick access to top schools and markets.",
    landmarks: ['Ashiana Mod', 'D-Mart Bailey Road', 'St. Karen\'s School', 'Passport Seva Kendra'],
    avgPricePerSqft: '₹6,500 – ₹8,000',
  },
  'bailey-road': {
    name: 'Bailey Road',
    tagline: "Development Corridor of Patna",
    description: "Bailey Road is the engine of Patna's growth, housing key administrative buildings, luxury hotels, and transit routes. Gated layouts here offer high connectivity and solid appreciation.",
    landmarks: ['Patna Zoo', 'Saguna More', 'Paras HMRI Hospital', 'Patliputra Junction'],
    avgPricePerSqft: '₹7,200 – ₹9,800',
  },
  'raja-bazar': {
    name: 'Raja Bazar',
    tagline: "Central & Accessible Medical Hub",
    description: "Raja Bazar stands as one of Patna's busiest central neighborhoods, located directly along Bailey Road. Excellent infrastructure, medical services, and retail define this hub.",
    landmarks: ['IGIMS Hospital', 'Pillar 50 (Bailey Road)', 'Raja Bazar Flyover', 'Patna Market'],
    avgPricePerSqft: '₹8,000 – ₹11,000',
  },
  'patliputra-colony': {
    name: 'Patliputra Colony',
    tagline: "Patna's Most Prestigious Address",
    description: "Patliputra Colony is famous for its leafy green lanes, luxury bungalows, corporate offices, and peaceful residential layout. It remains the gold standard of real estate in Patna.",
    landmarks: ['Patliputra Golambar', 'Kurji Holy Family Hospital', 'Pataliputra Sports Complex', 'Loyola High School'],
    avgPricePerSqft: '₹11,000 – ₹15,500',
  },
  kankarbagh: {
    name: 'Kankarbagh',
    tagline: "Massive Planned Residential Colony",
    description: "Kankarbagh is one of the largest planned residential colonies in Asia. It features self-contained sectors with parks, sports stadiums, hospitals, and integrated markets.",
    landmarks: ['Patliputra Sports Complex Stadium', 'Kankarbagh Auto Stand', 'Doctor\'s Colony', 'Tiwari Bechar Chowk'],
    avgPricePerSqft: '₹6,000 – ₹8,200',
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
        title={`Properties for sale in ${config.name}, Patna — Guide & Listings`}
        description={`Explore flats, apartments, villas, and commercial real estate in ${config.name}, Patna. Average rates: ${config.avgPricePerSqft}.`}
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
