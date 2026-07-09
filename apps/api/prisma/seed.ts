import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const properties = [
  { slug: 'skyline-heights-3bhk', title: 'Skyline Heights', listingType: 'Sale', propertyType: 'Apartment', bhk: 3, priceInr: 13500000, priceLabel: '₹1.35 Cr', areaSqft: 1450, carpetAreaSqft: 1180, builtupAreaSqft: 1450, city: 'Pune', locality: 'Kharadi', status: 'under_construction', furnishing: 'Semi-furnished', reraNumber: 'P52100012345', lat: 18.5515, lng: 73.9497, featured: true, description: 'A modern 3 BHK with skyline views, clubhouse, and covered parking in the heart of Kharadi.' },
  { slug: 'the-orchard-villa', title: 'The Orchard Villa', listingType: 'Sale', propertyType: 'Villa', bhk: 4, priceInr: 31000000, priceLabel: '₹3.10 Cr', areaSqft: 3200, carpetAreaSqft: 2650, builtupAreaSqft: 3200, city: 'Pune', locality: 'Baner', status: 'ready', furnishing: 'Unfurnished', reraNumber: 'P52100067890', lat: 18.5590, lng: 73.7868, featured: true, description: 'Independent 4 BHK villa with private garden, terrace, and premium fittings.' },
  { slug: 'green-meadows-plot', title: 'Green Meadows Plot', listingType: 'Resale', propertyType: 'Plot', bhk: null, priceInr: 8500000, priceLabel: '₹85 L', areaSqft: 2400, city: 'Pune', locality: 'Wagholi', status: 'ready', reraNumber: 'P52100011223', lat: 18.5800, lng: 73.9820, description: 'NA-sanctioned residential plot in a gated layout with clear title.' },
  { slug: 'metro-square-2bhk', title: 'Metro Square', listingType: 'Under Construction', propertyType: 'Apartment', bhk: 2, priceInr: 7200000, priceLabel: '₹72 L', areaSqft: 980, carpetAreaSqft: 780, builtupAreaSqft: 980, city: 'Pune', locality: 'Hinjewadi', status: 'under_construction', furnishing: 'Unfurnished', reraNumber: 'P52100099887', lat: 18.5913, lng: 73.7389, description: 'Well-connected 2 BHK near the IT park, possession in 18 months.' },
  { slug: 'riverside-resale-3bhk', title: 'Riverside Residency', listingType: 'Resale', propertyType: 'Apartment', bhk: 3, priceInr: 11000000, priceLabel: '₹1.10 Cr', areaSqft: 1360, carpetAreaSqft: 1120, builtupAreaSqft: 1360, city: 'Pune', locality: 'Mundhwa', status: 'ready', furnishing: 'Fully-furnished', reraNumber: 'P52100055443', lat: 18.5330, lng: 73.9330, description: 'Ready-to-move 3 BHK with riverside views and modular kitchen.' },
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

async function main() {
  console.log('Seeding…')

  await prisma.property.deleteMany()
  await prisma.constructionProject.deleteMany()
  await prisma.testimonial.deleteMany()

  for (const [i, p] of properties.entries()) {
    await prisma.property.create({
      data: {
        ...p,
        amenities: JSON.stringify(amenitiesPool.slice(0, 5 + (i % 3))),
        images: JSON.stringify([]),
      },
    })
  }

  for (const proj of projects) {
    const { processStages, ...rest } = proj
    await prisma.constructionProject.create({
      data: {
        ...rest,
        processStages: JSON.stringify(processStages),
        beforeImages: JSON.stringify([]),
        afterImages: JSON.stringify([]),
        stageImages: JSON.stringify([]),
      },
    })
  }

  for (const t of testimonials) {
    await prisma.testimonial.create({ data: t })
  }

  const counts = {
    properties: await prisma.property.count(),
    projects: await prisma.constructionProject.count(),
    testimonials: await prisma.testimonial.count(),
  }
  console.log('Seeded:', counts)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
