// Generates web/public/sitemap.xml from live API data.
// Run after the DB is seeded and the API is reachable:
//   API_URL=http://localhost:4000 node scripts/generate-sitemap.mjs
// In production point API_URL at your deployed API (or localhost on the VPS).

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const SITE = process.env.SITE_URL ?? 'https://www.carryconstruction.com'
const API = process.env.API_URL ?? 'http://localhost:4000'

const staticRoutes = ['/', '/properties', '/construction']

async function safeFetch(path) {
  try {
    const res = await fetch(`${API}/api/v1${path}`)
    if (!res.ok) return { data: [] }
    return await res.json()
  } catch {
    console.warn(`Could not reach ${API}${path} — skipping those URLs.`)
    return { data: [] }
  }
}

const urls = [...staticRoutes]

const props = await safeFetch('/properties?limit=1000')
for (const p of props.data ?? []) urls.push(`/properties/${p.slug}`)

const projects = await safeFetch('/construction-projects')
for (const p of projects.data ?? []) urls.push(`/construction/${p.slug}`)

const today = new Date().toISOString().slice(0, 10)
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url>\n    <loc>${SITE}${u}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`)
  .join('\n')}
</urlset>
`

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sitemap.xml')
writeFileSync(out, xml)
console.log(`Wrote sitemap with ${urls.length} URLs → ${out}`)
