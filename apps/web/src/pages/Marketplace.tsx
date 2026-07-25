import { useEffect, useState, useMemo } from 'react'
import Seo from '../components/Seo'
import {
  api,
  type Material,
  type ServiceProvider,
  type EquipmentRental,
  SERVICE_PROVIDER_ROLES,
  MATERIAL_CATEGORIES,
  EQUIPMENT_CATEGORIES,
} from '@carry/shared'
import { Star, Check } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { cldAuto } from '../lib/cloudinary'
import MarketplaceSearch from '../components/MarketplaceSearch'

type TabType = 'providers' | 'materials' | 'equipment'

const ALL_PROVIDER_ROLES = Array.from(new Set(Object.values(SERVICE_PROVIDER_ROLES).flat()))
const ALL_MATERIAL_CATEGORIES = Array.from(new Set(Object.values(MATERIAL_CATEGORIES).flat()))
const ALL_EQUIPMENT_CATEGORIES = Array.from(new Set(EQUIPMENT_CATEGORIES))

const tabClass = (active: boolean) =>
  `flex-1 shrink-0 py-3 sm:py-4 text-center font-mono text-[0.62rem] sm:text-xs uppercase tracking-wider sm:tracking-[0.18em] transition-all border-b-2 cursor-pointer ${
    active
      ? 'border-teal text-teal font-semibold bg-teal/5'
      : 'border-ink/10 text-concrete hover:text-ink hover:border-ink/30'
  }`

const inputNumberClass =
  'w-16 border border-ink/20 bg-bone px-2 py-1 font-mono text-xs text-ink text-center focus:border-teal focus:outline-none'

const cleanProviderName = (name: string, role: string) => {
  if (!name) return role
  let cleaned = name
    .replace(/\bpatna\b/gi, '')
    .replace(/\bkumar\b/gi, '')
    .replace(/\bverma\b/gi, '')
    .replace(/\bsingh\b/gi, '')
    .replace(/\bshree\b/gi, '')
    .replace(/\bganga\b/gi, '')
    .replace(/\bsuraksha\b/gi, '')
    .replace(/\bdampshield\b/gi, '')
    .replace(/\bclearview\b/gi, '')
    .replace(/\bsunpower\b/gi, '')
    .replace(/\baquapure\b/gi, '')
    .replace(/\bcleanflow\b/gi, '')
    .replace(/\braincatch\b/gi, '')
    .replace(/\bgreenscape\b/gi, '')
    .replace(/\bsecurehome\b/gi, '')
    .replace(/\bconnectfast\b/gi, '')
    .replace(/\bsafehome\b/gi, '')
    .replace(/\bsparklepro\b/gi, '')
    .replace(/\bcivicworks\b/gi, '')
    .replace(/\bsecurelife\b/gi, '')
    .replace(/\bsafemove\b/gi, '')
    .trim()
    .replace(/^\s*-\s*/, '')
    .replace(/\s{2,}/g, ' ')

  if (!cleaned || cleaned.length < 3) {
    if (role === 'Water Tanker Supplier') return 'Water Tanker Delivery Service'
    return `${role} Services`
  }

  if (role === 'Water Tanker Supplier' || cleaned.toLowerCase().includes('water tanker')) {
    return 'Water Tanker Delivery Service'
  }

  return cleaned
}

const SERVICEMAN_IMAGES: Record<string, string> = {
  Plumber: '/plumber.png',
  Electrician: '/electrician.png',
  Painter: '/painter.png',
  Carpenter: '/carpenter.png',
  Mason: '/mason.png',
  Contractor: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=800&q=80',
  'Civil Engineer': 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80',
  Architect: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  Labour: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
  'Earthwork / JCB Contractor': '/excavator.png',
  'Bar Bending / Steel Fixing Team': '/steel.png',
  'Shuttering (Centering) Contractor': '/scaffolding.png',
  'Borewell / Tubewell Contractor': 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80',
  'Water Tanker Supplier': '/water_tanker.png',
  'Anti-Termite Treatment Service': '/termite_treatment.jpg',
  'Waterproofing Contractor': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
  'Site Security / Chowkidar': '/site_security.jpg',
  'Electricity Board Liaison': '/power_liaison.jpg',
  'Modular Kitchen Company': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
  'Flooring Mason': 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=800&q=80',
  Fabricator: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
  'UPVC / Aluminium Window Vendor': '/upvc_window.jpg',
  'POP / False Ceiling Contractor': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
  'Solar Installer': '/solar_panel.jpg',
  'Inverter / Genset Vendor': 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=800&q=80',
  'RO / Water Purifier Installer': '/ro_purifier.jpg',
  'Septic Tank / Soak Pit Contractor': '/septic_tank.jpg',
  'Rainwater Harvesting Installer': '/rainwater_harvesting.jpg',
  'Landscaping / Gardener': 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80',
  'CCTV & Security System Installer': '/cctv_security.jpg',
  'Broadband / DTH Installer': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
  'Pest Control Service': '/pest_control.jpg',
  'Deep-Cleaning Service': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
  'Completion Certificate Liaison': '/building_permit.jpg',
  'Property Tax Assessment': 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
  'Home Insurance Agent': '/home_insurance.jpg',
  'Packers & Movers': '/packers_movers.jpg',
  'Pandit / Purohit': 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80',
  'Tent House': 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
  'Caterer / Halwai': 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
  Decorator: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
  'Photographer / Videographer': 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80',
  'Invitation Cards / Digital Invites': 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
  'Sound System / DJ': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
}

const MATERIAL_IMAGES: Record<string, string> = {
  Cement: '/cement.png',
  Steel: '/steel.png',
  Bricks: '/bricks.png',
  Sand: '/sand.png',
  Aggregate: '/aggregate.png',
  'RMC (Ready-Mix Concrete)': '/ready_mix_concrete_v2.jpg',
  'Tile / Marble / Granite': '/rajasthan_white_marble.jpg',
  'Glass & Hardware': '/toughened_glass_hardware_v2.jpg',
  'Sanitaryware & CP Fittings': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
  Flooring: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=800&q=80',
  'Furniture & Furnishing': '/furniture_curtains.jpg',
}

const getServicemanImage = (role: string, name?: string) => {
  if (SERVICEMAN_IMAGES[role]) return SERVICEMAN_IMAGES[role]
  const lowerRole = role.toLowerCase()
  const lowerName = (name || '').toLowerCase()

  if (lowerRole.includes('plumb') || lowerName.includes('plumb')) return '/plumber.png'
  if (lowerRole.includes('electr') || lowerName.includes('electr')) return '/electrician.png'
  if (lowerRole.includes('paint') || lowerName.includes('paint')) return '/painter.png'
  if (lowerRole.includes('carpent') || lowerName.includes('wood')) return '/carpenter.png'
  if (lowerRole.includes('mason') || lowerRole.includes('tile')) return '/mason.png'
  if (lowerRole.includes('engineer') || lowerRole.includes('structur')) return SERVICEMAN_IMAGES['Civil Engineer']
  if (lowerRole.includes('architect') || lowerRole.includes('design')) return SERVICEMAN_IMAGES['Architect']
  if (lowerRole.includes('jcb') || lowerRole.includes('earth')) return '/excavator.png'
  if (lowerRole.includes('steel') || lowerRole.includes('rebar')) return '/steel.png'
  if (lowerRole.includes('shutter') || lowerRole.includes('centering')) return '/scaffolding.png'
  if (lowerRole.includes('solar')) return SERVICEMAN_IMAGES['Solar Installer']
  if (lowerRole.includes('clean')) return SERVICEMAN_IMAGES['Deep-Cleaning Service']
  if (lowerRole.includes('pest')) return SERVICEMAN_IMAGES['Pest Control Service']
  if (lowerRole.includes('cctv') || lowerRole.includes('secur')) return SERVICEMAN_IMAGES['CCTV & Security System Installer']
  if (lowerRole.includes('water') || lowerRole.includes('tanker') || lowerName.includes('water')) return SERVICEMAN_IMAGES['Water Tanker Supplier']
  if (lowerRole.includes('kitchen')) return SERVICEMAN_IMAGES['Modular Kitchen Company']
  if (lowerRole.includes('pack') || lowerRole.includes('move')) return SERVICEMAN_IMAGES['Packers & Movers']

  return 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80'
}

const getMaterialImage = (category: string, name?: string) => {
  const lowerCat = category.toLowerCase()
  const lowerName = (name || '').toLowerCase()

  if (lowerName.includes('toughened glass') || lowerName.includes('glass & door') || lowerName.includes('door hardware')) return '/toughened_glass_hardware_v2.jpg'
  if (lowerName.includes('rajasthan white marble') || lowerName.includes('white marble') || lowerName.includes('makrana')) return '/rajasthan_white_marble.jpg'
  if (lowerName.includes('m25') || lowerName.includes('ready-mix concrete') || lowerName.includes('rmc')) return '/ready_mix_concrete_v2.jpg'
  if (lowerName.includes('living room furniture') || lowerName.includes('curtain set') || lowerName.includes('furniture & curtain')) return '/furniture_curtains.jpg'

  if (MATERIAL_IMAGES[category]) return MATERIAL_IMAGES[category]

  if (lowerCat.includes('cement') || lowerName.includes('cement')) return '/cement.png'
  if (lowerCat.includes('steel') || lowerName.includes('steel') || lowerName.includes('tmt')) return '/steel.png'
  if (lowerCat.includes('brick') || lowerName.includes('brick')) return '/bricks.png'
  if (lowerCat.includes('sand') || lowerName.includes('sand')) return '/sand.png'
  if (lowerCat.includes('aggregate') || lowerName.includes('stone') || lowerName.includes('metal')) return '/aggregate.png'
  if (lowerCat.includes('concrete') || lowerCat.includes('rmc')) return '/ready_mix_concrete_v2.jpg'
  if (lowerCat.includes('tile') || lowerCat.includes('marble') || lowerCat.includes('granite')) return '/rajasthan_white_marble.jpg'
  if (lowerCat.includes('glass') || lowerCat.includes('hardware')) return '/toughened_glass_hardware_v2.jpg'
  if (lowerCat.includes('sanitary') || lowerCat.includes('cp') || lowerName.includes('wc') || lowerName.includes('basin')) return MATERIAL_IMAGES['Sanitaryware & CP Fittings']
  if (lowerCat.includes('floor')) return MATERIAL_IMAGES['Flooring']
  if (lowerCat.includes('furniture') || lowerCat.includes('furnish')) return '/furniture_curtains.jpg'

  return 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80'
}

const getEquipmentImage = (name: string, category?: string) => {
  const n = (name + ' ' + (category || '')).toLowerCase()
  if (n.includes('excavator') || n.includes('jcb') || n.includes('earthmoving')) return '/excavator.png'
  if (n.includes('mixer') || n.includes('concrete')) return '/mixer.png'
  if (n.includes('scaffold') || n.includes('shuttering')) return '/scaffolding.png'
  if (n.includes('crane') || n.includes('lifting')) return '/crane.png'
  if (n.includes('drill') || n.includes('tool') || n.includes('power')) return 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'
  return 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80'
}

export default function Marketplace() {
  // Honor a `?tab=` param so admin "View" links land on the right section.
  const initialTab = ((): TabType => {
    const t = new URLSearchParams(window.location.search).get('tab')
    return t === 'materials' || t === 'equipment' || t === 'providers' ? t : 'providers'
  })()
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [providers, setProviders] = useState<ServiceProvider[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [equipment, setEquipment] = useState<EquipmentRental[]>([])
  const [loading, setLoading] = useState(true)

  const { addToCart } = useCart()

  // Local card state configurations
  const [matQuantities, setMatQuantities] = useState<Record<string, number>>({})
  const [eqQuantities, setEqQuantities] = useState<Record<string, number>>({})
  const [eqDurations, setEqDurations] = useState<Record<string, number>>({})
  const [spQuantities, setSpQuantities] = useState<Record<string, number>>({})
  const [spDurations, setSpDurations] = useState<Record<string, number>>({})

  // Feedback notifications
  const [addedItemFeedback, setAddedItemFeedback] = useState<string | null>(null)

  // Search state — one free-text query per tab, matched against every relevant field
  const [providerQuery, setProviderQuery] = useState<string>('')
  const [materialQuery, setMaterialQuery] = useState<string>('')
  const [equipmentQuery, setEquipmentQuery] = useState<string>('')

  useEffect(() => {
    let cancelled = false

    function loadData(showSpinner = false) {
      if (showSpinner) setLoading(true)
      const promises = [
        api.listServiceProviders().then((res) => !cancelled && setProviders(res.data)).catch(() => []),
        api.listMaterials().then((res) => !cancelled && setMaterials(res.data)).catch(() => []),
        api.listEquipmentRentals().then((res) => !cancelled && setEquipment(res.data)).catch(() => []),
      ]
      Promise.all(promises).finally(() => !cancelled && showSpinner && setLoading(false))
    }

    loadData(true)

    // Refetch when the user returns to the tab so admin add/edit/delete
    // changes surface without a manual refresh.
    function onVisible() {
      if (document.visibilityState === 'visible') loadData(false)
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [])

  // Filter handlers — a single query matched against every relevant field
  const filteredProviders = useMemo(() => {
    const q = providerQuery.trim().toLowerCase()
    if (!q) return providers
    return providers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        (p.locality && p.locality.toLowerCase().includes(q)) ||
        p.specialties.some((s) => s.toLowerCase().includes(q))
    )
  }, [providers, providerQuery])

  const filteredMaterials = useMemo(() => {
    const q = materialQuery.trim().toLowerCase()
    if (!q) return materials
    return materials.filter(
      (m) => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q) || m.brand.toLowerCase().includes(q)
    )
  }, [materials, materialQuery])

  const filteredEquipment = useMemo(() => {
    const q = equipmentQuery.trim().toLowerCase()
    if (!q) return equipment
    return equipment.filter(
      (e) => e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || e.specs.some((s) => s.toLowerCase().includes(q))
    )
  }, [equipment, equipmentQuery])

  // Cart operations
  function handleAddMaterial(mat: Material) {
    const defaultQty = mat.category === 'Cement' ? 50 : mat.category === 'Bricks' ? 1000 : 1
    const qty = matQuantities[mat.id] ?? defaultQty
    if (qty <= 0) return

    addToCart(
      {
        id: `material-${mat.id}`,
        itemId: mat.id,
        name: mat.name,
        type: 'Material',
        roleOrCategory: mat.category,
        price: mat.price ?? 0,
        unit: mat.unit ?? 'unit',
      },
      qty
    )
    showFeedback(`Added ${qty} unit(s) of ${mat.name} to cart.`)
  }

  function handleAddEquipment(eq: EquipmentRental) {
    const qty = eqQuantities[eq.id] ?? 1
    const duration = eqDurations[eq.id] ?? 3
    if (qty <= 0 || duration <= 0) return

    addToCart(
      {
        id: `equipment-${eq.id}`,
        itemId: eq.id,
        name: eq.name,
        type: 'Equipment',
        roleOrCategory: eq.category,
        price: eq.rentPerDay,
        unit: 'per day',
      },
      qty,
      duration
    )
    showFeedback(`Added ${qty} machine(s) of ${eq.name} for ${duration} days.`)
  }

  function handleAddServiceman(sp: ServiceProvider) {
    const qty = spQuantities[sp.id] ?? 1
    const duration = spDurations[sp.id] ?? 5
    if (qty <= 0 || duration <= 0) return

    addToCart(
      {
        id: `service-${sp.id}`,
        itemId: sp.id,
        name: sp.name,
        type: 'ServiceProvider',
        roleOrCategory: sp.role,
        price: sp.minimumRate ?? 0,
        unit: sp.rateUnit ?? 'per day',
      },
      qty,
      duration
    )
    showFeedback(`Hired ${qty} ${sp.role}(s) for ${duration} days.`)
  }

  function showFeedback(msg: string) {
    setAddedItemFeedback(msg)
    setTimeout(() => {
      setAddedItemFeedback(null)
    }, 3000)
  }

  // Set quantity state dynamically
  const updateMatQty = (id: string, val: number) => {
    setMatQuantities((prev) => ({ ...prev, [id]: val }))
  }
  const updateEqQty = (id: string, val: number) => {
    setEqQuantities((prev) => ({ ...prev, [id]: val }))
  }
  const updateEqDur = (id: string, val: number) => {
    setEqDurations((prev) => ({ ...prev, [id]: val }))
  }
  const updateSpQty = (id: string, val: number) => {
    setSpQuantities((prev) => ({ ...prev, [id]: val }))
  }
  const updateSpDur = (id: string, val: number) => {
    setSpDurations((prev) => ({ ...prev, [id]: val }))
  }

  return (
    <div className="bg-bone min-h-screen relative pb-12">
      <Seo
        title="Construction E-Commerce Marketplace — Buy, Rent & Hire"
        description="Source all construction demands directly from Carry: buy raw materials, rent machinery, and hire professional servicemen."
        path="/marketplace"
      />

      {/* Floating Action Toast */}
      {addedItemFeedback && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 bg-teal px-6 py-3 font-mono text-xs uppercase tracking-wider text-bone shadow-xl border border-ochre/25 flex items-center gap-2 animate-bounce">
          <Check className="h-4 w-4" /> {addedItemFeedback}
        </div>
      )}

      {/* Hero / Header */}
      <div className="border-b border-ink/10 bg-bone-dim">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <span className="kicker">Carry Direct Marketplace</span>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-6xl">
            Sourcing the build, <span className="text-ochre">simplified.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-ink-soft leading-relaxed">
            Configure, calculate, and order directly from Carry Construction. Add raw materials, machine rentals, and skilled servicemen to your cart for a single combined checkout order.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-[68px] z-30 border-b border-ink/10 bg-bone/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex border-x border-ink/5 overflow-x-auto whitespace-nowrap scrollbar-none">
            <button
              onClick={() => setActiveTab('providers')}
              className={tabClass(activeTab === 'providers')}
            >
              Hire Servicemen
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={tabClass(activeTab === 'materials')}
            >
              Buy Raw Materials
            </button>
            <button
              onClick={() => setActiveTab('equipment')}
              className={tabClass(activeTab === 'equipment')}
            >
              Rent Equipment
            </button>
          </div>
        </div>
      </div>

      {/* Active Tab Area */}
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        {loading ? (
          /* Global Loading Skeleton Grid */
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse border border-ink/10 bg-bone-dim p-6">
                <div className="h-4 w-1/4 bg-ink/10 font-mono"></div>
                <div className="mt-3 h-6 w-3/4 bg-ink/10"></div>
                <div className="mt-4 h-24 bg-ink/10"></div>
                <div className="mt-6 h-10 w-full bg-ink/15"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* SERVICEMEN TAB */}
            {activeTab === 'providers' && (
              <div>
                {/* Search */}
                <div className="mb-8">
                  <MarketplaceSearch
                    value={providerQuery}
                    onChange={setProviderQuery}
                    suggestions={ALL_PROVIDER_ROLES}
                    placeholder="Search servicemen — role, name, or locality…"
                  />
                </div>

                {filteredProviders.length === 0 ? (
                  <div className="border border-dashed border-ink/20 py-20 text-center">
                    <p className="font-display text-xl text-ink">No servicemen match your search.</p>
                  </div>
                ) : (
                  <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProviders.map((sp) => {
                      const count = spQuantities[sp.id] ?? 1
                      const duration = spDurations[sp.id] ?? 5

                      return (
                        <div key={sp.id} className="group relative flex flex-col justify-between border border-ink/10 bg-bone-dim p-6 hover:border-teal/30 transition-all duration-300">
                          <div>
                            <div className="overflow-hidden border border-ink/10 -mx-6 -mt-6 mb-4 aspect-video">
                              <img
                                src={sp.profilePhotoUrl ? cldAuto(sp.profilePhotoUrl) : getServicemanImage(sp.role, sp.name)}
                                alt={sp.name}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                            <div className="flex items-start justify-between">
                              <span className="font-mono text-[0.62rem] uppercase tracking-widest text-ochre-dark border border-ochre/20 bg-ochre/5 px-2 py-0.5">
                                {sp.role}
                              </span>
                              {sp.rating && (
                                <div className="flex items-center gap-1 font-mono text-xs text-ink">
                                  <Star className="h-3.5 w-3.5 fill-ochre text-ochre" />
                                  {sp.rating.toFixed(1)}
                                </div>
                              )}
                            </div>

                            <h3 className="mt-4 font-display text-xl font-bold text-ink">
                              {cleanProviderName(sp.name, sp.role)}
                            </h3>

                            <p className="mt-2 text-sm text-ink-soft leading-relaxed">
                              {sp.description || 'Professional servicemen deployed directly from Carry Construction helpdesk.'}
                            </p>

                            {sp.specialties && sp.specialties.length > 0 && (
                              <div className="mt-4 flex flex-wrap gap-1.5">
                                {sp.specialties.map((spec) => (
                                  <span
                                    key={spec}
                                    className="border border-ink/5 bg-bone px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider text-concrete"
                                  >
                                    {spec}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="mt-6 border-t border-ink/5 pt-4">
                            {/* E-Commerce Inputs on Card */}
                            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 mb-4 bg-bone border border-ink/10 p-3">
                              <div className="flex flex-col items-center">
                                <label className="font-mono text-[0.55rem] uppercase text-concrete mb-1">
                                  Count
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={count}
                                  onChange={(e) => updateSpQty(sp.id, Number(e.target.value))}
                                  className={inputNumberClass}
                                />
                              </div>
                              <div className="flex flex-col items-center">
                                <label className="font-mono text-[0.55rem] uppercase text-concrete mb-1">
                                  Duration (Days)
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={duration}
                                  onChange={(e) => updateSpDur(sp.id, Number(e.target.value))}
                                  className={inputNumberClass}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <span className="block font-mono text-[0.62rem] uppercase tracking-wider text-concrete">
                                  Rate
                                </span>
                                <span className="font-mono text-sm font-bold text-ink">
                                  ₹{(sp.minimumRate ?? 1000).toLocaleString('en-IN')} / day
                                </span>
                              </div>

                              <button
                                onClick={() => handleAddServiceman(sp)}
                                className="bg-teal px-4 py-2.5 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bone transition-colors hover:bg-teal-dark cursor-pointer"
                              >
                                Hire serviceman
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* RAW MATERIALS TAB */}
            {activeTab === 'materials' && (
              <div>
                {/* Search */}
                <div className="mb-8">
                  <MarketplaceSearch
                    value={materialQuery}
                    onChange={setMaterialQuery}
                    suggestions={ALL_MATERIAL_CATEGORIES}
                    placeholder="Search materials — category, name, or brand…"
                  />
                </div>

                {filteredMaterials.length === 0 ? (
                  <div className="border border-dashed border-ink/20 py-20 text-center">
                    <p className="font-display text-xl text-ink">No raw materials in this category.</p>
                  </div>
                ) : (
                  <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredMaterials.map((mat) => {
                      const defaultQty = mat.category === 'Cement' ? 50 : mat.category === 'Bricks' ? 1000 : 1
                      const qty = matQuantities[mat.id] ?? defaultQty

                      return (
                        <div key={mat.id} className="relative flex flex-col justify-between border border-ink/10 bg-bone-dim p-6 hover:border-teal/30 transition-all duration-300">
                          <div>
                            <div className="overflow-hidden border border-ink/10 -mx-6 -mt-6 mb-4 aspect-video">
                              <img
                                src={mat.imageUrl ? cldAuto(mat.imageUrl) : getMaterialImage(mat.category, mat.name)}
                                alt={mat.name}
                                className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                              />
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                              <span className="font-mono text-[0.62rem] uppercase tracking-wider text-concrete">
                                Brand: {mat.brand}
                              </span>
                              <span className="inline-flex items-center gap-1 font-mono text-[0.62rem] uppercase tracking-wider text-teal">
                                <Check className="h-3 w-3" /> In stock
                              </span>
                            </div>

                            <h3 className="mt-2 font-display text-xl font-bold text-ink">
                              {mat.name}
                            </h3>

                            <p className="mt-2 text-sm text-ink-soft">
                              {mat.description || 'Premium grade construction materials sourced directly from verified manufacturers.'}
                            </p>
                          </div>

                          <div className="mt-6 border-t border-ink/5 pt-4">
                            {/* E-Commerce Inputs on Card */}
                            <div className="flex items-center justify-between mb-4 bg-bone border border-ink/10 p-3">
                              <span className="font-mono text-[0.62rem] uppercase text-concrete">
                                Order Qty ({mat.unit || 'unit'})
                              </span>
                              <input
                                type="number"
                                min="1"
                                value={qty}
                                onChange={(e) => updateMatQty(mat.id, Number(e.target.value))}
                                className={inputNumberClass}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <span className="block font-mono text-[0.62rem] uppercase tracking-wider text-concrete">
                                  Price
                                </span>
                                <span className="font-mono text-sm font-bold text-ink">
                                  ₹{(mat.price ?? 400).toLocaleString('en-IN')}{' '}
                                  <span className="text-xs font-normal text-concrete">/ {mat.unit || 'unit'}</span>
                                </span>
                              </div>

                              <button
                                onClick={() => handleAddMaterial(mat)}
                                className="bg-teal px-4 py-2.5 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bone transition-colors hover:bg-teal-dark cursor-pointer"
                              >
                                Add to Cart
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* EQUIPMENT RENTALS TAB */}
            {activeTab === 'equipment' && (
              <div>
                {/* Search */}
                <div className="mb-8">
                  <MarketplaceSearch
                    value={equipmentQuery}
                    onChange={setEquipmentQuery}
                    suggestions={ALL_EQUIPMENT_CATEGORIES}
                    placeholder="Search equipment — category or name…"
                  />
                </div>

                {filteredEquipment.length === 0 ? (
                  <div className="border border-dashed border-ink/20 py-20 text-center">
                    <p className="font-display text-xl text-ink">No rental equipment available in this category.</p>
                  </div>
                ) : (
                  <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredEquipment.map((eq) => {
                      const qty = eqQuantities[eq.id] ?? 1
                      const duration = eqDurations[eq.id] ?? 3

                      return (
                        <div key={eq.id} className="relative flex flex-col justify-between border border-ink/10 bg-bone-dim p-6 hover:border-teal/30 transition-all duration-300">
                          <div>
                            <div className="overflow-hidden border border-ink/10 -mx-6 -mt-6 mb-4 aspect-video">
                              <img
                                src={eq.imageUrl ? cldAuto(eq.imageUrl) : getEquipmentImage(eq.name, eq.category)}
                                alt={eq.name}
                                className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                              />
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                              <span className="font-mono text-[0.62rem] uppercase tracking-widest text-concrete">
                                {eq.category}
                              </span>
                              <span className="inline-flex items-center gap-1 font-mono text-[0.62rem] uppercase tracking-wider text-teal">
                                <Check className="h-3 w-3" /> Available
                              </span>
                            </div>

                            <h3 className="mt-2 font-display text-xl font-bold text-ink">
                              {eq.name}
                            </h3>

                            <p className="mt-2 text-sm text-ink-soft">
                              {eq.description || 'Heavy construction machinery maintained for high performance on site.'}
                            </p>

                            {eq.specs && eq.specs.length > 0 && (
                              <div className="mt-4 border border-ink/5 bg-bone px-3 py-2.5">
                                <span className="block font-mono text-[0.58rem] uppercase tracking-widest text-concrete mb-1">
                                  Technical Specs
                                </span>
                                <ul className="space-y-1">
                                  {eq.specs.map((spec) => (
                                    <li key={spec} className="font-mono text-[0.65rem] text-ink-soft">
                                      • {spec}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          <div className="mt-6 border-t border-ink/5 pt-4">
                            {/* E-Commerce Inputs on Card */}
                            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 mb-4 bg-bone border border-ink/10 p-3">
                              <div className="flex flex-col items-center">
                                <label className="font-mono text-[0.55rem] uppercase text-concrete mb-1">
                                  Count
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={qty}
                                  onChange={(e) => updateEqQty(eq.id, Number(e.target.value))}
                                  className={inputNumberClass}
                                />
                              </div>
                              <div className="flex flex-col items-center">
                                <label className="font-mono text-[0.55rem] uppercase text-concrete mb-1">
                                  Duration (Days)
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={duration}
                                  onChange={(e) => updateEqDur(eq.id, Number(e.target.value))}
                                  className={inputNumberClass}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <span className="block font-mono text-[0.62rem] uppercase tracking-wider text-concrete">
                                  Rent Rate
                                </span>
                                <span className="font-mono text-sm font-bold text-ink">
                                  ₹{eq.rentPerDay.toLocaleString('en-IN')} / day
                                </span>
                              </div>

                              <button
                                onClick={() => handleAddEquipment(eq)}
                                className="bg-teal px-4 py-2.5 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bone transition-colors hover:bg-teal-dark cursor-pointer"
                              >
                                Rent Gear
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
