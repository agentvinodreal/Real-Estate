/**
 * Updates imageUrl in the DB for the 4 marketplace materials
 * that have stale SVG / placeholder paths.
 *
 * Usage: npm run -w apps/api update:material-images
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const updates = [
  {
    name: 'M25 Grade Ready-Mix Concrete',
    imageUrl: '/ready_mix_concrete_v2.jpg',
  },
  {
    name: 'Toughened Glass & Door Hardware Set',
    imageUrl: '/toughened_glass_hardware_v2.jpg',
  },
  {
    name: 'Rajasthan White Marble Slab',
    imageUrl: '/rajasthan_white_marble.jpg',
  },
  {
    name: 'Living Room Furniture & Curtain Set',
    imageUrl: '/furniture_curtains.jpg',
  },
  {
    name: 'Ultratech Cement',
    imageUrl: '/cement.png',
  },
  {
    name: 'Tata Tiscon TMT Steel Rebar',
    imageUrl: '/steel.png',
  },
  {
    name: 'Red Clay Bricks',
    imageUrl: '/bricks.png',
  },
  {
    name: 'River Sand (Fine Quality)',
    imageUrl: '/sand.png',
  },
  {
    name: 'Crushed Stone Aggregate (20mm)',
    imageUrl: '/aggregate.png',
  },
]

async function main() {
  for (const u of updates) {
    const result = await prisma.material.updateMany({
      where: { name: u.name },
      data: { imageUrl: u.imageUrl },
    })
    console.log(`Updated "${u.name}": ${result.count} row(s) → ${u.imageUrl}`)
  }
}

main()
  .catch((e) => {
    console.error('Failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
