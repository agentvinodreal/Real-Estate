import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const properties = [
  { slug: 'skyline-heights-3bhk', title: 'Skyline Heights', listingType: 'Sale', propertyType: 'Apartment', bhk: 3, priceInr: 13500000, priceLabel: '₹1.35 Cr', areaSqft: 1450, city: 'Pune', locality: 'Kharadi', status: 'under_construction', furnishing: 'Semi-furnished', reraNumber: 'P52100012345', lat: 18.5515, lng: 73.9497, featured: true, description: 'A modern 3 BHK with skyline views, clubhouse, and covered parking in the heart of Kharadi.' },
  { slug: 'the-orchard-villa', title: 'The Orchard Villa', listingType: 'Sale', propertyType: 'Villa', bhk: 4, priceInr: 31000000, priceLabel: '₹3.10 Cr', areaSqft: 3200, city: 'Pune', locality: 'Baner', status: 'ready', furnishing: 'Unfurnished', reraNumber: 'P52100067890', lat: 18.5590, lng: 73.7868, featured: true, description: 'Independent 4 BHK villa with private garden, terrace, and premium fittings.' },
  { slug: 'green-meadows-plot', title: 'Green Meadows Plot', listingType: 'Resale', propertyType: 'Plot', bhk: null, priceInr: 8500000, priceLabel: '₹85 L', areaSqft: 2400, city: 'Pune', locality: 'Wagholi', status: 'ready', reraNumber: 'P52100011223', lat: 18.5800, lng: 73.9820, description: 'NA-sanctioned residential plot in a gated layout with clear title.' },
  { slug: 'metro-square-2bhk', title: 'Metro Square', listingType: 'Under Construction', propertyType: 'Apartment', bhk: 2, priceInr: 7200000, priceLabel: '₹72 L', areaSqft: 980, city: 'Pune', locality: 'Hinjewadi', status: 'under_construction', furnishing: 'Unfurnished', reraNumber: 'P52100099887', lat: 18.5913, lng: 73.7389, description: 'Well-connected 2 BHK near the IT park, possession in 18 months.' },
  { slug: 'riverside-resale-3bhk', title: 'Riverside Residency', listingType: 'Resale', propertyType: 'Apartment', bhk: 3, priceInr: 11000000, priceLabel: '₹1.10 Cr', areaSqft: 1360, city: 'Pune', locality: 'Mundhwa', status: 'ready', furnishing: 'Fully-furnished', reraNumber: 'P52100055443', lat: 18.5330, lng: 73.9330, description: 'Ready-to-move 3 BHK with riverside views and modular kitchen.' },
  { slug: 'commerce-hub-office', title: 'Commerce Hub', listingType: 'Sale', propertyType: 'Commercial', bhk: null, priceInr: 24000000, priceLabel: '₹2.40 Cr', areaSqft: 1800, city: 'Pune', locality: 'Viman Nagar', status: 'ready', reraNumber: 'P52100077665', lat: 18.5679, lng: 73.9143, description: 'Grade-A office space with ample parking and 24x7 access.' },
]

const amenitiesPool = ['Clubhouse', 'Gymnasium', 'Covered Parking', 'Power Backup', '24x7 Security', 'Landscaped Garden', 'Kids Play Area', 'Lift']

const projects = [
  {
    slug: 'kulkarni-residence-baner',
    title: 'Kulkarni Residence',
    category: 'Turnkey Villa',
    location: 'Baner, Pune',
    areaSqft: 3400,
    durationMonths: 14,
    packageTier: 'Premium',
    description: 'A ground-plus-two villa taken from concept design to handover, including interiors.',
    processStages: [
      { title: 'Design', body: 'Architecture + 3D visualisation approved in 3 weeks.' },
      { title: 'Structure', body: 'RCC frame completed with M30 concrete.' },
      { title: 'Finishing', body: 'Italian marble, modular kitchen, false ceilings.' },
    ],
  },
  {
    slug: 'shaikh-duplex-wagholi',
    title: 'Shaikh Duplex',
    category: 'Custom Home',
    location: 'Wagholi, Pune',
    areaSqft: 2200,
    durationMonths: 11,
    packageTier: 'Basic',
    description: 'A compact duplex built on a 2,400 sq ft plot with an efficient, sunlit layout.',
    processStages: [
      { title: 'Consultation', body: 'Budget and layout finalised around the family’s needs.' },
      { title: 'Construction', body: 'Delivered on a fixed timeline with weekly updates.' },
    ],
  },
  {
    slug: 'sharma-interiors-kharadi',
    title: 'Sharma Apartment Interiors',
    category: 'Interior Fit-out',
    location: 'Kharadi, Pune',
    areaSqft: 1450,
    durationMonths: 3,
    packageTier: 'Luxury',
    description: 'Full interior fit-out for a 3 BHK — carpentry, lighting, and soft furnishings.',
    processStages: [
      { title: 'Design', body: 'Mood boards and material selection.' },
      { title: 'Execution', body: 'Bespoke carpentry and lighting installed.' },
    ],
  },
]

const testimonials = [
  { name: 'Rohan & Meera Kulkarni', location: 'Baner, Pune', rating: 5, quote: 'Carry Construction handled our villa from the first drawing to the final coat of paint. Zero surprises, delivered on time.' },
  { name: 'Aditya Sharma', location: 'Kharadi, Pune', rating: 5, quote: 'They found us a resale flat, negotiated well, and sorted every document. It felt genuinely transparent.' },
  { name: 'Fatima Shaikh', location: 'Wagholi, Pune', rating: 5, quote: 'The weekly site updates meant I always knew where my money was going. Rare in this industry.' },
]

const materials = [
  { name: 'Ultratech Cement', category: 'Cement', brand: 'Ultratech', description: 'Grade-53 OPC cement ideal for structural and heavy reinforcement works.', price: 440, unit: 'per bag', available: true },
  { name: 'Tata Tiscon TMT Steel Rebar', category: 'Steel', brand: 'Tata Tiscon', description: 'Fe 550D grade high-strength corrosion-resistant steel rebar.', price: 62000, unit: 'per ton', available: true },
  { name: 'Red Clay Bricks', category: 'Bricks', brand: 'Local Premium', description: 'First-class table-molded red clay bricks with excellent compression strength.', price: 8, unit: 'per piece', available: true },
  { name: 'River Sand (Fine Quality)', category: 'Sand', brand: 'Silt-Free River Sand', description: 'Clean river sand washed and graded for plastering and high-strength concrete mixes.', price: 4500, unit: 'per brass', available: true },
  { name: 'Crushed Stone Aggregate (20mm)', category: 'Aggregate', brand: 'Deccan Quarry', description: 'Hard basalt crushed blue metal aggregate for heavy concrete structure build.', price: 3800, unit: 'per brass', available: true },
]

const serviceProviders = [
  { name: 'Professional Plumbing Service', role: 'Plumber', phone: '+91 90000 00000', city: 'Pune', locality: 'Kharadi', experienceYears: 12, rating: 4.8, description: 'Leakage detection, pipeline installation, bathroom fittings, and drainage repairs by certified plumbers.', specialties: ['Leakage Repair', 'Pipe Fitting', 'Drainage Cleaning'], minimumRate: 1200, rateUnit: 'per day' },
  { name: 'Certified Electrical Works', role: 'Electrician', phone: '+91 90000 00000', city: 'Pune', locality: 'Baner', experienceYears: 10, rating: 4.9, description: 'Home rewiring, short-circuit troubleshooting, electrical panel installation, and appliance setup.', specialties: ['Home Rewiring', 'Appliance Install', 'Troubleshooting'], minimumRate: 1200, rateUnit: 'per day' },
  { name: 'Premium Painting Service', role: 'Painter', phone: '+91 90000 00000', city: 'Pune', locality: 'Wagholi', experienceYears: 8, rating: 4.7, description: 'Interior and exterior wall painting, wall putty work, and decorative texture coatings.', specialties: ['Wall Putty', 'Texture Coating', 'Exterior Painting'], minimumRate: 900, rateUnit: 'per day' },
  { name: 'Bespoke Carpentry Service', role: 'Carpenter', phone: '+91 90000 00000', city: 'Pune', locality: 'Hinjewadi', experienceYears: 9, rating: 4.8, description: 'Modular kitchen assembly, wardrobe repairs, door installations, and furniture polishing.', specialties: ['Modular Assembly', 'Door Install', 'Furniture Polish'], minimumRate: 1200, rateUnit: 'per day' },
  { name: 'Premium Masonry & Brickwork', role: 'Mason', phone: '+91 90000 00000', city: 'Pune', locality: 'Mundhwa', experienceYears: 11, rating: 4.6, description: 'Quality brickwork, plastering, tile laying, and concrete structural masonry.', specialties: ['Tile Laying', 'Plastering', 'Brickwork'], minimumRate: 1000, rateUnit: 'per day' },
  { name: 'Construction Helper Crew', role: 'Labour', phone: '+91 90000 00000', city: 'Pune', locality: 'Viman Nagar', experienceYears: 6, rating: 4.5, description: 'General construction helpers for site cleanup, material hauling, and excavation assistance.', specialties: ['Site Cleanup', 'Material Hauling', 'Helper Services'], minimumRate: 850, rateUnit: 'per day' },
]

const equipmentRentals = [
  { name: 'JCB Excavator 3DX', category: 'Earthmoving', rentPerDay: 9500, specs: ['Operating Weight: 7460 kg', 'Engine Power: 74 HP', 'Bucket Capacity: 0.26 cum'], description: 'Versatile backhoe loader for site excavation, trenching, and soil clearance. Operator and diesel included.', available: true },
  { name: 'Concrete Mixer Machine (1 Bag)', category: 'Concrete', rentPerDay: 1500, specs: ['Drum Capacity: 10/7 CFT', 'Power: 5 HP Diesel Engine', 'Mix Rate: 2-3 min per batch'], description: 'Portable diesel concrete mixer for on-site slab casting and structural columns.', available: true },
  { name: 'Scaffolding Steel Frames (100 Sets)', category: 'Scaffolding', rentPerDay: 500, specs: ['Material: Heavy Duty GI Steel', 'Max Height: 40 meters', 'Includes: H-Frames, Cross Bracing, Jack base'], description: 'Safe and modular structural steel scaffolding frames for tall building plastering and paint jobs.', available: true },
  { name: 'Mobile Escort Crane 15T', category: 'Lifting', rentPerDay: 12000, specs: ['Lifting Capacity: 15 Ton', 'Boom Length: 15 meters', 'Drive: 2WD/4WD diesel'], description: 'High stability pick and carry escort crane for lifting heavy beams, column cages, and machinery.', available: true },
]

async function main() {
  console.log('Seeding…')

  // Clean DB with proper order
  await prisma.lead.deleteMany()
  await prisma.property.deleteMany()
  await prisma.constructionProject.deleteMany()
  await prisma.labour.deleteMany()
  await prisma.shop.deleteMany()
  await prisma.testimonial.deleteMany()
  await prisma.material.deleteMany()
  await prisma.serviceProvider.deleteMany()
  await prisma.equipmentRental.deleteMany()
  await prisma.agent.deleteMany()

  // Create default agent
  const defaultAgent = await prisma.agent.create({
    data: {
      clerkUserId: 'user_dummy_agent',
      name: 'Carry Operations',
      email: 'ops@carryconstruction.com',
      phone: '+91 98765 43210',
      status: 'active',
    },
  })

  // Create properties linked to the agent
  for (const [i, p] of properties.entries()) {
    await prisma.property.create({
      data: {
        ...p,
        agentId: defaultAgent.id,
        amenities: amenitiesPool.slice(0, 5 + (i % 3)),
        images: [],
      },
    })
  }

  // Create construction projects linked to the agent
  for (const proj of projects) {
    const { processStages, ...rest } = proj
    await prisma.constructionProject.create({
      data: {
        ...rest,
        agentId: defaultAgent.id,
        beforeImages: [],
        afterImages: [],
        stageImages: [],
      },
    })
  }

  // Create testimonials
  for (const t of testimonials) {
    await prisma.testimonial.create({ data: t })
  }

  // Create materials
  for (const mat of materials) {
    await prisma.material.create({ data: mat })
  }

  // Create service providers
  for (const sp of serviceProviders) {
    await prisma.serviceProvider.create({ data: sp })
  }

  // Create equipment rentals
  for (const eq of equipmentRentals) {
    await prisma.equipmentRental.create({ data: eq })
  }

  const counts = {
    agents: await prisma.agent.count(),
    properties: await prisma.property.count(),
    projects: await prisma.constructionProject.count(),
    testimonials: await prisma.testimonial.count(),
    materials: await prisma.material.count(),
    serviceProviders: await prisma.serviceProvider.count(),
    equipmentRentals: await prisma.equipmentRental.count(),
  }
  console.log('Seeded successfully:', counts)
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

