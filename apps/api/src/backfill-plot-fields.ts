/**
 * One-off back-fill: clear construction status, furnishing and BHK on Plot
 * records.
 *
 * Plots are bare land, so "Ready / Under Construction", a furnishing level and
 * a room count never applied to them. The forms used to show those fields for
 * every property type, so plots captured before that fix carry stale values.
 * The apps now hide them and every save clears them, but existing rows need
 * this pass.
 *
 * Read-only by default — prints what it would change. Pass --apply to write.
 *
 *   npm run backfill:plot-fields            # dry run
 *   npm run backfill:plot-fields -- --apply # write
 *
 * Writing against the production database additionally requires
 * ALLOW_DESTRUCTIVE=yes (see lib/db-guard.ts).
 */
import { PrismaClient } from '@prisma/client'
import { assertNotProduction, isProductionDatabase } from './lib/db-guard.js'
import { serializeProperty } from './lib/serialize.js'
import { syncToWebsite } from './lib/websiteSync.js'

const prisma = new PrismaClient()

const apply = process.argv.includes('--apply')

// websiteSync wants a Fastify logger; console is close enough for a CLI run.
const log = {
  info:  (...a: unknown[]) => console.log('  ', ...a),
  warn:  (...a: unknown[]) => console.warn('  ', ...a),
  error: (...a: unknown[]) => console.error('  ', ...a),
} as any

async function main() {
  const stale = await prisma.property.findMany({
    where: {
      propertyType: 'Plot',
      OR: [
        { furnishing: { not: null } },
        { bhk: { not: null } },
        { status: { not: 'Ready' } },
      ],
    },
    include: { agent: true },
  })

  console.log(
    `${stale.length} plot record(s) carry construction/furnishing/BHK values ` +
    `(database: ${isProductionDatabase() ? 'PRODUCTION' : 'dev'})`
  )

  for (const p of stale) {
    const fields = [
      p.status !== 'Ready' ? `status="${p.status}" → "Ready"` : null,
      p.furnishing        ? `furnishing="${p.furnishing}" → null` : null,
      p.bhk !== null      ? `bhk=${p.bhk} → null` : null,
    ].filter(Boolean)
    console.log(`  ${p.id}  ${p.title}${p.published ? '  [published]' : ''}`)
    console.log(`      ${fields.join(', ')}`)
  }

  if (stale.length === 0) return

  if (!apply) {
    console.log('\nDry run — nothing written. Re-run with --apply to make these changes.')
    return
  }

  assertNotProduction()

  const { count } = await prisma.property.updateMany({
    where: { id: { in: stale.map(p => p.id) } },
    data: { status: 'Ready', furnishing: null, bhk: null },
  })
  console.log(`\nUpdated ${count} record(s).`)

  // The public website holds its own copy, so published plots have to be
  // pushed again or they keep showing the furnishing we just cleared.
  const published = stale.filter(p => p.published)
  if (published.length === 0) return

  const fresh = await prisma.property.findMany({
    where: { id: { in: published.map(p => p.id) } },
    include: { agent: true },
  })
  // Owner contact is internal-only — strip it before it leaves this API.
  const properties = fresh.map(row => {
    const { ownerName: _n, ownerPhone: _p, ...publicProperty } = serializeProperty(row)
    return publicProperty
  })

  console.log(`Re-syncing ${properties.length} published plot(s) to the website...`)
  await syncToWebsite({ properties }, log)
}

main()
  .catch(err => { console.error(err); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
