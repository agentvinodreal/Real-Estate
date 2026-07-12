import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prisma = new PrismaClient()

async function main() {
  const filePath = path.join(__dirname, '../../../shared-data.json')
  if (!fs.existsSync(filePath)) {
    console.error('\n❌ shared-data.json not found. Run export first in the Field Ops project!')
    return
  }

  const fileData = fs.readFileSync(filePath, 'utf-8')
  const { properties, projects } = JSON.parse(fileData)

  // 1. Sync properties
  for (const p of properties) {
    // Generate an SEO-friendly slug
    const cleanSlug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const slug = `${cleanSlug}-${p.id.slice(-4)}`

    await prisma.property.upsert({
      where: { id: p.id },
      update: {
        title:        p.title,
        listingType:  p.listingType,
        propertyType: p.propertyType,
        bhk:          p.bhk,
        priceInr:     p.priceInr,
        priceLabel:   p.priceLabel,
        areaSqft:     p.areaSqft,
        city:         p.city,
        locality:     p.locality,
        address:      p.address,
        lat:          p.lat,
        lng:          p.lng,
        status:       p.status === 'Ready' ? 'ready' : 'under_construction',
        furnishing:   p.furnishing,
        reraNumber:   p.reraNumber,
        description:  p.description,
        floorPlanUrl: p.floorPlanUrl,
        published:    true,
        images:       JSON.stringify(p.images),
        amenities:    JSON.stringify(p.amenities || []),
      },
      create: {
        id:           p.id,
        slug,
        title:        p.title,
        listingType:  p.listingType,
        propertyType: p.propertyType,
        bhk:          p.bhk,
        priceInr:     p.priceInr,
        priceLabel:   p.priceLabel,
        areaSqft:     p.areaSqft,
        city:         p.city,
        locality:     p.locality,
        address:      p.address,
        lat:          p.lat,
        lng:          p.lng,
        status:       p.status === 'Ready' ? 'ready' : 'under_construction',
        furnishing:   p.furnishing,
        reraNumber:   p.reraNumber,
        description:  p.description,
        floorPlanUrl: p.floorPlanUrl,
        published:    true,
        images:       JSON.stringify(p.images),
        amenities:    JSON.stringify(p.amenities || []),
      }
    })
  }

  // 2. Sync projects
  for (const p of projects) {
    const cleanSlug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const slug = `${cleanSlug}-${p.id.slice(-4)}`

    await prisma.constructionProject.upsert({
      where: { id: p.id },
      update: {
        title:          p.title,
        category:       p.category,
        location:       p.location,
        areaSqft:       p.areaSqft,
        durationMonths: p.durationMonths,
        packageTier:    p.packageTier,
        description:    p.description,
        published:      true,
        beforeImages:   JSON.stringify(p.beforeImages || []),
        afterImages:    JSON.stringify(p.afterImages || []),
        stageImages:    JSON.stringify(p.stageImages || []),
      },
      create: {
        id:             p.id,
        slug,
        title:          p.title,
        category:       p.category,
        location:       p.location,
        areaSqft:       p.areaSqft,
        durationMonths: p.durationMonths,
        packageTier:    p.packageTier,
        description:    p.description,
        published:      true,
        beforeImages:   JSON.stringify(p.beforeImages || []),
        afterImages:    JSON.stringify(p.afterImages || []),
        stageImages:    JSON.stringify(p.stageImages || []),
      }
    })
  }

  console.log(`\n✅ Synced ${properties.length} properties and ${projects.length} projects to SQLite successfully!`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
