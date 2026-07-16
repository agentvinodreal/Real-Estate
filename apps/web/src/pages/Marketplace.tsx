import { useEffect, useState, useMemo } from 'react'
import Seo from '../components/Seo'
import { api, type Material, type ServiceProvider, type EquipmentRental } from '@carry/shared'
import { Star, Check } from 'lucide-react'
import { useCart } from '../context/CartContext'

type TabType = 'providers' | 'materials' | 'equipment'

const tabClass = (active: boolean) =>
  `flex-1 shrink-0 py-3 sm:py-4 text-center font-mono text-[0.62rem] sm:text-xs uppercase tracking-wider sm:tracking-[0.18em] transition-all border-b-2 cursor-pointer ${
    active
      ? 'border-teal text-teal font-semibold bg-teal/5'
      : 'border-ink/10 text-concrete hover:text-ink hover:border-ink/30'
  }`

const inputNumberClass =
  'w-16 border border-ink/20 bg-bone px-2 py-1 font-mono text-xs text-ink text-center focus:border-teal focus:outline-none'

const getMaterialImage = (category: string) => {
  if (category === 'Cement') return '/cement.png'
  if (category === 'Steel') return '/steel.png'
  if (category === 'Bricks') return '/bricks.png'
  if (category === 'Sand') return '/sand.png'
  if (category === 'Aggregate') return '/aggregate.png'
  return '/materials_banner.png'
}

const getEquipmentImage = (name: string) => {
  if (name.includes('Excavator')) return '/excavator.png'
  if (name.includes('Mixer')) return '/mixer.png'
  if (name.includes('Scaffolding')) return '/scaffolding.png'
  if (name.includes('Crane')) return '/crane.png'
  return '/equipment_banner.png'
}

const getServicemanImage = (role: string) => {
  if (role === 'Plumber') return '/plumber.png'
  if (role === 'Electrician') return '/electrician.png'
  if (role === 'Painter') return '/painter.png'
  if (role === 'Carpenter') return '/carpenter.png'
  if (role === 'Mason') return '/mason.png'
  return '/servicemen_banner.png'
}

export default function Marketplace() {
  const [activeTab, setActiveTab] = useState<TabType>('providers')
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

  // Filters state
  const [providerRole, setProviderRole] = useState<string>('')
  const [providerSearch, setProviderSearch] = useState<string>('')
  const [materialCategory, setMaterialCategory] = useState<string>('')
  const [equipmentCategory, setEquipmentCategory] = useState<string>('')

  useEffect(() => {
    setLoading(true)
    const promises = [
      api.listServiceProviders().then((res) => setProviders(res.data)).catch(() => []),
      api.listMaterials().then((res) => setMaterials(res.data)).catch(() => []),
      api.listEquipmentRentals().then((res) => setEquipment(res.data)).catch(() => []),
    ]
    Promise.all(promises).finally(() => setLoading(false))
  }, [])

  // Filter handlers
  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      const matchRole = !providerRole || p.role === providerRole
      const matchText =
        !providerSearch ||
        p.name.toLowerCase().includes(providerSearch.toLowerCase()) ||
        (p.locality && p.locality.toLowerCase().includes(providerSearch.toLowerCase()))
      return matchRole && matchText
    })
  }, [providers, providerRole, providerSearch])

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      return !materialCategory || m.category === materialCategory
    })
  }, [materials, materialCategory])

  const filteredEquipment = useMemo(() => {
    return equipment.filter((e) => {
      return !equipmentCategory || e.category === equipmentCategory
    })
  }, [equipment, equipmentCategory])

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
                {/* Visual Banner */}
                <div className="mb-10 overflow-hidden border border-ink/10 bg-bone-dim">
                  <div className="grid md:grid-cols-[1.2fr_0.8fr]">
                    <div className="flex flex-col justify-center p-8 sm:p-12">
                      <span className="kicker">Carry Servicemen Fleet</span>
                      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
                        Hire Experienced Professionals
                      </h2>
                      <p className="mt-4 text-sm text-ink-soft leading-relaxed font-sans">
                        Accredited electricians, plumbers, carpenters, painters, and masons managed and backed directly by Carry Construction's strict quality assurance standards. Equipped with premium materials and standard tooling.
                      </p>
                    </div>
                    <div className="aspect-[4/3] md:aspect-auto">
                      <img
                        src="/servicemen_banner.png"
                        alt="Carry Construction Servicemen"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    placeholder="Search servicemen (e.g. Plumber, Kankarbagh)..."
                    value={providerSearch}
                    onChange={(e) => setProviderSearch(e.target.value)}
                    className="flex-1 border border-ink/20 bg-bone px-3 py-2.5 text-sm text-ink placeholder:text-concrete focus:border-teal focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {['', 'Plumber', 'Electrician', 'Painter', 'Carpenter', 'Mason', 'Labour'].map((role) => (
                      <button
                        key={role}
                        onClick={() => setProviderRole(role)}
                        className={`border px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-wider transition cursor-pointer ${
                          providerRole === role
                            ? 'border-teal bg-teal text-bone'
                            : 'border-ink/15 hover:border-ink/30 text-ink'
                        }`}
                      >
                        {role || 'All Workers'}
                      </button>
                    ))}
                  </div>
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
                                src={getServicemanImage(sp.role)}
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
                              {sp.name}
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
                {/* Visual Banner */}
                <div className="mb-10 overflow-hidden border border-ink/10 bg-bone-dim">
                  <div className="grid md:grid-cols-[1.2fr_0.8fr]">
                    <div className="flex flex-col justify-center p-8 sm:p-12">
                      <span className="kicker">Carry Sourced Materials</span>
                      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
                        Premium Raw Materials
                      </h2>
                      <p className="mt-4 text-sm text-ink-soft leading-relaxed font-sans">
                        We source directly from certified grade-A manufacturers like Ultratech and Tata Tiscon, ensuring anti-corrosive reinforcement and structural longevity for every batch. Complete logistics and dispatch managed by our fleet.
                      </p>
                    </div>
                    <div className="aspect-[4/3] md:aspect-auto">
                      <img
                        src="/materials_banner.png"
                        alt="Carry Construction Materials Warehouse"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Category Filters */}
                <div className="mb-8 flex flex-wrap gap-2">
                  {['', 'Cement', 'Steel', 'Bricks', 'Sand', 'Aggregate'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setMaterialCategory(cat)}
                      className={`border px-4 py-2 font-mono text-[0.68rem] uppercase tracking-wider transition cursor-pointer ${
                        materialCategory === cat
                          ? 'border-teal bg-teal text-bone'
                          : 'border-ink/15 hover:border-ink/30 text-ink'
                      }`}
                    >
                      {cat || 'All Materials'}
                    </button>
                  ))}
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
                                src={getMaterialImage(mat.category)}
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
                {/* Visual Banner */}
                <div className="mb-10 overflow-hidden border border-ink/10 bg-bone-dim">
                  <div className="grid md:grid-cols-[1.2fr_0.8fr]">
                    <div className="flex flex-col justify-center p-8 sm:p-12">
                      <span className="kicker">Carry Rental Fleet</span>
                      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
                        Heavy Duty Construction Machinery
                      </h2>
                      <p className="mt-4 text-sm text-ink-soft leading-relaxed font-sans">
                        Rent excavators, concrete mixers, lift cranes, and heavy scaffolding units directly from our yard. Fully certified, safety-audited, and deployed with experienced operators and diesel setups for on-site convenience.
                      </p>
                    </div>
                    <div className="aspect-[4/3] md:aspect-auto">
                      <img
                        src="/equipment_banner.png"
                        alt="Carry Construction Machinery"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Category Filters */}
                <div className="mb-8 flex flex-wrap gap-2">
                  {['', 'Earthmoving', 'Concrete', 'Scaffolding', 'Lifting'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setEquipmentCategory(cat)}
                      className={`border px-4 py-2 font-mono text-[0.68rem] uppercase tracking-wider transition cursor-pointer ${
                        equipmentCategory === cat
                          ? 'border-teal bg-teal text-bone'
                          : 'border-ink/15 hover:border-ink/30 text-ink'
                      }`}
                    >
                      {cat || 'All Equipment'}
                    </button>
                  ))}
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
                                src={getEquipmentImage(eq.name)}
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
