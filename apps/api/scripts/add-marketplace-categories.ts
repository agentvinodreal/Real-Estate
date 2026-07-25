/**
 * Adds one representative listing for every construction / finishing /
 * post-construction ServiceProvider role and Material category from
 * packages/shared/src/serviceCategories.ts that doesn't already exist in the DB.
 * Purely additive and idempotent — never deletes or overwrites existing rows,
 * and skips any role/category that's already present. Event-vendor categories
 * (pandit, tent house, caterer, etc.) are intentionally excluded.
 *
 * Also corrects the `phase` of the four pre-existing finishing-trade providers
 * (Plumber, Electrician, Painter, Carpenter) that were created before the
 * `phase` column existed and defaulted to "construction".
 *
 * Usage: npm run -w apps/api add:categories
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DUMMY_PHONE = '+91 90000 00000'

const newServiceProviders = [
  // ── Construction phase ──────────────────────────────────────────────
  { role: 'Contractor', phase: 'construction', name: 'Turnkey Building Contractors', locality: 'Boring Road', experienceYears: 15, rating: 4.8, description: 'Full turnkey building contractor — foundation to handover, with in-house crew and material sourcing.', specialties: ['Turnkey Construction', 'RCC Framing', 'Project Management'], minimumRate: 2500, rateUnit: 'per day' },
  { role: 'Civil Engineer', phase: 'construction', name: 'Structural Engineering Consultants', locality: 'Patliputra Colony', experienceYears: 12, rating: 4.9, description: 'Structural design, load calculations, and site supervision for residential and commercial builds.', specialties: ['Structural Design', 'Site Supervision', 'BBS'], minimumRate: 2000, rateUnit: 'per day' },
  { role: 'Architect', phase: 'construction', name: 'Architectural Design Studio', locality: 'Bailey Road', experienceYears: 10, rating: 4.9, description: 'Residential and commercial architecture — floor plans, elevations, and interior layouts.', specialties: ['Floor Planning', '3D Elevation', 'Vaastu Compliant Design'], minimumRate: 15000, rateUnit: 'per project' },
  { role: 'Earthwork / JCB Contractor', phase: 'construction', name: 'Earthmoving & Excavation Services', locality: 'Danapur', experienceYears: 9, rating: 4.6, description: 'JCB and excavator-led earthwork — site leveling, foundation digging, and debris clearance.', specialties: ['Excavation', 'Site Leveling', 'Debris Removal'], minimumRate: 9500, rateUnit: 'per day' },
  { role: 'Bar Bending / Steel Fixing Team', phase: 'construction', name: 'Bar Bending & Steel Fixing Crew', locality: 'Kankarbagh', experienceYears: 8, rating: 4.7, description: 'Reinforcement cutting, bending, and fixing crew for columns, beams, and slabs as per BBS drawings.', specialties: ['Steel Fixing', 'BBS Execution', 'Column Cages'], minimumRate: 1100, rateUnit: 'per day' },
  { role: 'Shuttering (Centering) Contractor', phase: 'construction', name: 'Centering & Formwork Services', locality: 'Raja Bazar', experienceYears: 10, rating: 4.6, description: 'Formwork and centering for columns, beams, and slabs using steel and ply shuttering.', specialties: ['Column Shuttering', 'Slab Centering', 'Formwork Removal'], minimumRate: 1100, rateUnit: 'per day' },
  { role: 'Borewell / Tubewell Contractor', phase: 'construction', name: 'Borewell & Tubewell Drilling', locality: 'Danapur', experienceYears: 14, rating: 4.5, description: 'Borewell drilling, tubewell installation, and submersible pump fitting.', specialties: ['Borewell Drilling', 'Submersible Pump Fitting'], minimumRate: 6000, rateUnit: 'per project' },
  { role: 'Water Tanker Supplier', phase: 'construction', name: 'Water Tanker Delivery Service', locality: 'Bailey Road', experienceYears: 7, rating: 4.4, description: 'On-demand water tanker supply for site curing, construction, and drinking purposes.', specialties: ['Curing Water', 'Bulk Tanker Delivery'], minimumRate: 1200, rateUnit: 'per trip' },
  { role: 'Anti-Termite Treatment Service', phase: 'construction', name: 'Anti-Termite Treatment Service', locality: 'Boring Road', experienceYears: 11, rating: 4.7, description: 'Pre- and post-construction anti-termite chemical treatment with warranty.', specialties: ['Pre-Construction Treatment', 'Post-Construction Treatment'], minimumRate: 8000, rateUnit: 'per project' },
  { role: 'Waterproofing Contractor', phase: 'construction', name: 'Waterproofing & Sealing Solutions', locality: 'Patliputra Colony', experienceYears: 9, rating: 4.6, description: 'Terrace, bathroom, and basement waterproofing using membrane and chemical coating systems.', specialties: ['Terrace Waterproofing', 'Bathroom Waterproofing', 'Basement Sealing'], minimumRate: 45, rateUnit: 'per sqft' },
  { role: 'Site Security / Chowkidar', phase: 'construction', name: 'Site Security Watch Services', locality: 'Kankarbagh', experienceYears: 6, rating: 4.5, description: 'Round-the-clock site chowkidar and security guard deployment for construction sites.', specialties: ['24x7 Site Watch', 'Material Guarding'], minimumRate: 700, rateUnit: 'per day' },

  // ── Finishing phase ─────────────────────────────────────────────────
  { role: 'Electricity Board Liaison', phase: 'finishing', name: 'Electricity Board Liaison Service', locality: 'Raja Bazar', experienceYears: 8, rating: 4.5, description: 'New connection applications, load enhancement, and meter installation liaison with the electricity board.', specialties: ['New Connection', 'Load Enhancement', 'Meter Installation'], minimumRate: 5000, rateUnit: 'per project' },
  { role: 'Modular Kitchen Company', phase: 'finishing', name: 'Modular Kitchen Design & Assembly', locality: 'Bailey Road', experienceYears: 9, rating: 4.8, description: 'Design and installation of modular kitchens with laminate, acrylic, and PU finishes.', specialties: ['Modular Design', 'Cabinet Installation', 'Countertop Fitting'], minimumRate: 1200, rateUnit: 'per sqft' },
  { role: 'Flooring Mason', phase: 'finishing', name: 'Flooring & Tile Masonry', locality: 'Danapur', experienceYears: 10, rating: 4.6, description: 'Tile, marble, and granite flooring laying with precision leveling and jointing.', specialties: ['Tile Laying', 'Marble Fixing', 'Skirting'], minimumRate: 55, rateUnit: 'per sqft' },
  { role: 'Fabricator', phase: 'finishing', name: 'Metal & Grill Fabrication', locality: 'Kankarbagh', experienceYears: 12, rating: 4.6, description: 'Grills, gates, staircase railings, and steel structure fabrication and installation.', specialties: ['Window Grills', 'Gates', 'Staircase Railing'], minimumRate: 350, rateUnit: 'per sqft' },
  { role: 'UPVC / Aluminium Window Vendor', phase: 'finishing', name: 'UPVC & Aluminium Window Vendors', locality: 'Boring Road', experienceYears: 8, rating: 4.7, description: 'Supply and installation of UPVC and aluminium windows, doors, and partitions.', specialties: ['UPVC Windows', 'Aluminium Partitions', 'Sliding Doors'], minimumRate: 450, rateUnit: 'per sqft' },
  { role: 'POP / False Ceiling Contractor', phase: 'finishing', name: 'POP & False Ceiling Contractors', locality: 'Patliputra Colony', experienceYears: 9, rating: 4.6, description: 'Gypsum and POP false ceiling design and installation with cove lighting.', specialties: ['Gypsum Ceiling', 'POP Cornice', 'Cove Lighting'], minimumRate: 65, rateUnit: 'per sqft' },
  { role: 'Solar Installer', phase: 'finishing', name: 'Rooftop Solar Installation', locality: 'Bailey Road', experienceYears: 7, rating: 4.7, description: 'Rooftop solar panel installation with net-metering assistance for residential homes.', specialties: ['Rooftop Solar', 'Net Metering', 'On-Grid/Off-Grid Systems'], minimumRate: 45000, rateUnit: 'per kW' },
  { role: 'Inverter / Genset Vendor', phase: 'finishing', name: 'Inverter & Genset Power Backup', locality: 'Raja Bazar', experienceYears: 11, rating: 4.5, description: 'Sale and installation of home inverters, batteries, and diesel gensets.', specialties: ['Inverter Installation', 'Battery Setup', 'Genset Supply'], minimumRate: 15000, rateUnit: 'per unit' },
  { role: 'RO / Water Purifier Installer', phase: 'finishing', name: 'RO & Water Purifier Installation', locality: 'Kankarbagh', experienceYears: 6, rating: 4.6, description: 'RO and water purifier installation, plumbing tap-off, and annual maintenance.', specialties: ['RO Installation', 'AMC Service'], minimumRate: 2500, rateUnit: 'per unit' },
  { role: 'Septic Tank / Soak Pit Contractor', phase: 'finishing', name: 'Septic Tank & Sanitation Contractors', locality: 'Danapur', experienceYears: 10, rating: 4.4, description: 'Septic tank and soak pit construction as per municipal sanitation norms.', specialties: ['Septic Tank Construction', 'Soak Pit Digging'], minimumRate: 25000, rateUnit: 'per project' },
  { role: 'Rainwater Harvesting Installer', phase: 'finishing', name: 'Rainwater Harvesting Systems', locality: 'Boring Road', experienceYears: 7, rating: 4.5, description: 'Rooftop rainwater harvesting pit design and installation for groundwater recharge compliance.', specialties: ['Recharge Pit', 'Filter Chamber Setup'], minimumRate: 18000, rateUnit: 'per project' },

  // ── Post-construction phase ─────────────────────────────────────────
  { role: 'Landscaping / Gardener', phase: 'post_construction', name: 'Landscaping & Lawn Gardening', locality: 'Patliputra Colony', experienceYears: 8, rating: 4.6, description: 'Lawn laying, plant selection, and boundary greening for new homes.', specialties: ['Lawn Laying', 'Plant Landscaping', 'Boundary Greening'], minimumRate: 900, rateUnit: 'per day' },
  { role: 'CCTV & Security System Installer', phase: 'post_construction', name: 'CCTV & Smart Security System', locality: 'Bailey Road', experienceYears: 7, rating: 4.7, description: 'CCTV camera, video doorbell, and smart security system installation.', specialties: ['CCTV Setup', 'Video Doorbell', 'DVR Configuration'], minimumRate: 3000, rateUnit: 'per project' },
  { role: 'Broadband / DTH Installer', phase: 'post_construction', name: 'Broadband & DTH Installation', locality: 'Raja Bazar', experienceYears: 6, rating: 4.4, description: 'Internet broadband and DTH connection installation for new homes.', specialties: ['Broadband Setup', 'DTH Installation'], minimumRate: 800, rateUnit: 'per visit' },
  { role: 'Pest Control Service', phase: 'post_construction', name: 'Pest Control Treatment Services', locality: 'Kankarbagh', experienceYears: 9, rating: 4.6, description: 'Pre-occupancy pest control treatment covering cockroaches, termites, and rodents.', specialties: ['General Pest Control', 'Rodent Control'], minimumRate: 2500, rateUnit: 'per project' },
  { role: 'Deep-Cleaning Service', phase: 'post_construction', name: 'Post-Construction Deep Cleaning', locality: 'Danapur', experienceYears: 5, rating: 4.7, description: 'Post-construction deep cleaning — dust removal, glass cleaning, and floor polishing.', specialties: ['Post-Construction Cleaning', 'Glass Cleaning', 'Floor Polishing'], minimumRate: 6, rateUnit: 'per sqft' },
  { role: 'Completion Certificate Liaison', phase: 'post_construction', name: 'Completion Certificate Liaison', locality: 'Boring Road', experienceYears: 10, rating: 4.5, description: 'Completion certificate application and follow-up with the municipal corporation.', specialties: ['CC Filing', 'Municipal Liaison'], minimumRate: 12000, rateUnit: 'per project' },
  { role: 'Property Tax Assessment', phase: 'post_construction', name: 'Property Tax Assessment Services', locality: 'Boring Road', experienceYears: 10, rating: 4.5, description: 'Holding number allotment and property tax assessment for newly constructed homes.', specialties: ['Holding Number', 'Tax Assessment Filing'], minimumRate: 5000, rateUnit: 'per project' },
  { role: 'Home Insurance Agent', phase: 'post_construction', name: 'Home Insurance Advisory Services', locality: 'Patliputra Colony', experienceYears: 8, rating: 4.6, description: 'Structure and contents home insurance policy advisory and claims assistance.', specialties: ['Structure Insurance', 'Contents Insurance'], minimumRate: 0, rateUnit: 'per policy' },
  { role: 'Packers & Movers', phase: 'post_construction', name: 'Household Packers & Movers', locality: 'Bailey Road', experienceYears: 9, rating: 4.5, description: 'Household shifting with professional packing, loading, and transport.', specialties: ['Household Shifting', 'Packing & Loading'], minimumRate: 8000, rateUnit: 'per move' },
]

const newMaterials = [
  { category: 'RMC (Ready-Mix Concrete)', phase: 'construction', name: 'M25 Grade Ready-Mix Concrete', brand: 'Ultra Concrete RMC Plant', description: 'Factory-batched M25 grade ready-mix concrete delivered by transit mixer, ready to pour.', price: 5800, unit: 'per cum', imageUrl: '/ready_mix_concrete.svg' },
  { category: 'Tile / Marble / Granite', phase: 'finishing', name: 'Rajasthan White Marble Slab', brand: 'Makrana Marbles', description: 'Premium polished white marble slabs for flooring and cladding.', price: 180, unit: 'per sqft', imageUrl: '/rajasthan_white_marble.svg' },
  { category: 'Glass & Hardware', phase: 'finishing', name: 'Toughened Glass & Door Hardware Set', brand: 'Saint-Gobain', description: 'Toughened glass panels with hinges, locks, and door closers for interiors.', price: 120, unit: 'per sqft', imageUrl: '/toughened_glass_hardware.svg' },
  { category: 'Sanitaryware & CP Fittings', phase: 'finishing', name: 'Wall-Mounted WC & CP Fittings Set', brand: 'Hindware', description: 'Wall-mounted WC, wash basin, and chrome-plated bath fittings set.', price: 18500, unit: 'per set' },
  { category: 'Flooring', phase: 'finishing', name: 'Vitrified Floor Tiles 600x600', brand: 'Kajaria', description: 'Glossy vitrified floor tiles suitable for living rooms and bedrooms.', price: 65, unit: 'per sqft' },
  { category: 'Furniture & Furnishing', phase: 'post_construction', name: 'Living Room Furniture & Curtain Set', brand: 'HomeStyle Furnishings', description: 'Sofa, curtains, and soft furnishings package for move-in-ready homes.', price: 65000, unit: 'per set', imageUrl: '/furniture_curtains.jpg' },
]

async function main() {
  const existingRoles = new Set((await prisma.serviceProvider.findMany({ select: { role: true } })).map((r) => r.role))
  const existingCategories = new Set((await prisma.material.findMany({ select: { category: true } })).map((m) => m.category))

  let createdProviders = 0
  for (const sp of newServiceProviders) {
    if (existingRoles.has(sp.role)) continue
    await prisma.serviceProvider.create({
      data: {
        name: sp.name,
        role: sp.role,
        phase: sp.phase,
        phone: DUMMY_PHONE,
        city: 'Patna',
        locality: sp.locality,
        experienceYears: sp.experienceYears,
        rating: sp.rating,
        description: sp.description,
        specialties: sp.specialties,
        minimumRate: sp.minimumRate,
        rateUnit: sp.rateUnit,
        reviewStatus: 'approved',
      },
    })
    createdProviders++
  }

  let createdMaterials = 0
  for (const mat of newMaterials) {
    if (existingCategories.has(mat.category)) continue
    await prisma.material.create({
      data: {
        name: mat.name,
        category: mat.category,
        phase: mat.phase,
        brand: mat.brand,
        description: mat.description,
        price: mat.price,
        unit: mat.unit,
        available: true,
      },
    })
    createdMaterials++
  }

  // Correct the phase of the four pre-existing finishing-trade providers that
  // predate the `phase` column and defaulted to "construction".
  const finishingRoles = ['Plumber', 'Electrician', 'Painter', 'Carpenter']
  const phaseFixed = await prisma.serviceProvider.updateMany({
    where: { role: { in: finishingRoles }, phase: 'construction' },
    data: { phase: 'finishing' },
  })

  console.log(`Created ${createdProviders} new service providers, ${createdMaterials} new materials. Corrected phase on ${phaseFixed.count} existing rows.`)
}

main()
  .catch((e) => {
    console.error('Failed to add marketplace categories:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
