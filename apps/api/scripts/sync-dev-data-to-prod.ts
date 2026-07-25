/**
 * One-off sync: copies Materials, ServiceProviders, and EquipmentRentals that
 * exist in the dev database but are missing (by name) from production, into
 * production. Existing production rows are left untouched.
 *
 * Usage: SOURCE_DATABASE_URL=<dev-url> TARGET_DATABASE_URL=<prod-url> \
 *   npx tsx scripts/sync-dev-data-to-prod.ts
 */
import { PrismaClient } from '@prisma/client'

const sourceUrl = process.env.SOURCE_DATABASE_URL
const targetUrl = process.env.TARGET_DATABASE_URL

if (!sourceUrl || !targetUrl) {
  console.error('SOURCE_DATABASE_URL and TARGET_DATABASE_URL must both be set.')
  process.exit(1)
}

const source = new PrismaClient({ datasources: { db: { url: sourceUrl } } })
const target = new PrismaClient({ datasources: { db: { url: targetUrl } } })

async function syncMaterials() {
  const [sourceRows, targetRows] = await Promise.all([
    source.material.findMany(),
    target.material.findMany({ select: { name: true } }),
  ])
  const existing = new Set(targetRows.map((r) => r.name))
  const missing = sourceRows.filter((r) => !existing.has(r.name))

  for (const m of missing) {
    await target.material.create({
      data: {
        name: m.name,
        category: m.category,
        phase: m.phase,
        brand: m.brand,
        description: m.description,
        imageUrl: m.imageUrl,
        price: m.price,
        unit: m.unit,
        available: m.available,
      },
    })
    console.log(`  + material: ${m.name}`)
  }
  console.log(`Materials: ${missing.length} added, ${sourceRows.length - missing.length} already present.`)
}

async function syncServiceProviders() {
  const [sourceRows, targetRows] = await Promise.all([
    source.serviceProvider.findMany(),
    target.serviceProvider.findMany({ select: { name: true } }),
  ])
  const existing = new Set(targetRows.map((r) => r.name))
  const missing = sourceRows.filter((r) => !existing.has(r.name))

  for (const p of missing) {
    await target.serviceProvider.create({
      data: {
        name: p.name,
        role: p.role,
        phase: p.phase,
        phone: p.phone,
        email: p.email,
        city: p.city,
        locality: p.locality,
        experienceYears: p.experienceYears,
        rating: p.rating,
        profilePhotoUrl: p.profilePhotoUrl,
        description: p.description,
        specialties: p.specialties,
        minimumRate: p.minimumRate,
        rateUnit: p.rateUnit,
        reviewStatus: p.reviewStatus,
      },
    })
    console.log(`  + provider: ${p.name}`)
  }
  console.log(`Service providers: ${missing.length} added, ${sourceRows.length - missing.length} already present.`)
}

async function syncEquipment() {
  const [sourceRows, targetRows] = await Promise.all([
    source.equipmentRental.findMany(),
    target.equipmentRental.findMany({ select: { name: true } }),
  ])
  const existing = new Set(targetRows.map((r) => r.name))
  const missing = sourceRows.filter((r) => !existing.has(r.name))

  for (const e of missing) {
    await target.equipmentRental.create({
      data: {
        name: e.name,
        category: e.category,
        rentPerDay: e.rentPerDay,
        imageUrl: e.imageUrl,
        description: e.description,
        specs: e.specs,
        available: e.available,
      },
    })
    console.log(`  + equipment: ${e.name}`)
  }
  console.log(`Equipment: ${missing.length} added, ${sourceRows.length - missing.length} already present.`)
}

async function main() {
  await syncMaterials()
  await syncServiceProviders()
  await syncEquipment()
}

main()
  .catch((e) => {
    console.error('Failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await source.$disconnect()
    await target.$disconnect()
  })
