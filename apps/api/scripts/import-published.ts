/**
 * Manual catch-up import for items published in the Field Ops panel
 * (carry-admin-suryansh.web.app).
 *
 * Day-to-day this is not needed — the panel's webhook (POST /api/v1/sync) keeps
 * things live. Use this to backfill anything published while the webhook was
 * down, or to seed a fresh database:
 *
 *   1. Export shared-data.json from the Field Ops project.
 *   2. Drop it at this repo's root.
 *   3. Run:
 *        npm run import:published -w apps/api             # → carry_dev
 *        npm run import:published -w apps/api -- --prod   # → neondb
 *
 * Shares its mapping with the webhook (src/lib/syncImport.ts) so the two can't
 * drift. Only ever creates or updates rows — it never deletes.
 */
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { upsertProperty, upsertProject } from '../src/lib/syncImport.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Target dev by default; --prod switches to the live database.
const useProd = process.argv.includes('--prod')
const envFile = path.join(__dirname, useProd ? '../.env.production' : '../.env')
if (!fs.existsSync(envFile)) {
  console.error(`❌ ${path.basename(envFile)} not found in apps/api/`)
  process.exit(1)
}
process.loadEnvFile(envFile)

// Constructed after loadEnvFile so it picks up the right DATABASE_URL.
const prisma = new PrismaClient()

async function main() {
  const filePath = path.join(__dirname, '../../../shared-data.json')
  if (!fs.existsSync(filePath)) {
    console.error('\n❌ shared-data.json not found. Run the export in the Field Ops project first!')
    return
  }

  const { properties = [], projects = [] } = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const dbName = (process.env.DATABASE_URL ?? '').split('/').pop()?.split('?')[0]
  console.log(`→ importing into ${dbName}\n`)

  let ok = 0
  let skipped = 0

  for (const p of properties) {
    try {
      await upsertProperty(prisma, p)
      console.log(`  ✓ ${p.title}${p.published === false ? ' (unpublished)' : ''}`)
      ok++
    } catch (err) {
      console.warn(`  ⚠️  skipped "${p.title}" — ${err instanceof Error ? err.message : err}`)
      skipped++
    }
  }

  for (const p of projects) {
    try {
      await upsertProject(prisma, p)
      console.log(`  ✓ ${p.title}`)
      ok++
    } catch (err) {
      console.warn(`  ⚠️  skipped project "${p.title}" — ${err instanceof Error ? err.message : err}`)
      skipped++
    }
  }

  console.log(`\n✅ Synced ${ok} item(s) into ${dbName}${skipped ? ` — ${skipped} skipped` : ''}.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
