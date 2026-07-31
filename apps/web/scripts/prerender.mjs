// Build-time prerendering: renders each route in a headless browser and writes
// the resulting HTML to dist/<route>/index.html.
//
// The app is a client-rendered SPA, so without this every URL serves the same
// empty shell — same title, same description, no body text. Search crawlers and
// (more importantly) link-preview bots like WhatsApp/Facebook, which never run
// JavaScript, see nothing.
//
// We drive a real browser rather than react-dom/server because Clerk, three.js
// and motion all assume a DOM.
//
//   node scripts/prerender.mjs
//   API_URL=... node scripts/prerender.mjs   # to include dynamic detail pages

import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { preview } from 'vite'
import puppeteer from 'puppeteer'

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const API = process.env.API_URL ?? 'https://carry-website-api.vercel.app'

const STATIC_ROUTES = [
  '/',
  '/properties',
  '/construction',
  '/marketplace',
  '/home-designer',
  '/about',
  '/blog',
  '/contact',
  '/privacy',
  '/terms',
]

async function safeFetch(path) {
  try {
    const res = await fetch(`${API}/api/v1${path}`)
    if (!res.ok) return { data: [] }
    return await res.json()
  } catch {
    console.warn(`  ! could not reach ${API}${path} — skipping those routes`)
    return { data: [] }
  }
}

/** Detail pages are the ones worth indexing, so pull their slugs from the API. */
async function dynamicRoutes() {
  const [props, projects, posts] = await Promise.all([
    // Unpaginated: the API caps `limit` at 60 but returns every row without it.
    safeFetch('/properties'),
    safeFetch('/construction-projects'),
    safeFetch('/blog'),
  ])
  return [
    ...(props.data ?? []).map((p) => `/properties/${p.slug}`),
    ...(projects.data ?? []).map((p) => `/construction/${p.slug}`),
    ...(posts.data ?? []).map((p) => `/blog/${p.slug}`),
  ]
}

const routes = [...STATIC_ROUTES, ...(await dynamicRoutes())]
console.log(`Prerendering ${routes.length} routes…`)

const server = await preview({
  root: join(dirname(fileURLToPath(import.meta.url)), '..'),
  preview: { port: 4173, strictPort: true },
  logLevel: 'warn',
})
const base = `http://localhost:4173`

const browser = await puppeteer.launch({ headless: true })
let ok = 0
let failed = 0

for (const route of routes) {
  const page = await browser.newPage()
  try {
    await page.goto(`${base}${route}`, { waitUntil: 'networkidle0', timeout: 45_000 })
    // Wait for React to actually paint something into the root.
    await page.waitForFunction(() => document.getElementById('root')?.children.length > 0, {
      timeout: 15_000,
    })

    // index.html ships a fallback <title>/description, and React hoists the
    // per-page ones alongside them — so the raw HTML ends up with several of
    // each. Crawlers read the *first* one they find, which would be the
    // generic fallback. Collapse each tag down to the value the browser
    // actually settled on.
    await page.evaluate(() => {
      const effectiveTitle = document.title
      document.querySelectorAll('title').forEach((n) => n.remove())
      const title = document.createElement('title')
      title.textContent = effectiveTitle
      document.head.prepend(title)

      // Last one wins: page-level <Seo> renders after any default.
      const keepLast = (selector, attr) => {
        const seen = new Set()
        for (const node of [...document.querySelectorAll(selector)].reverse()) {
          const key = node.getAttribute(attr)
          if (seen.has(key)) node.remove()
          else seen.add(key)
        }
      }
      keepLast('meta[name]', 'name')
      keepLast('meta[property]', 'property')
      keepLast('link[rel="canonical"]', 'rel')
    })

    const html = await page.content()
    const outDir = route === '/' ? DIST : join(DIST, route)
    mkdirSync(outDir, { recursive: true })
    writeFileSync(join(outDir, 'index.html'), html)

    const title = await page.title()
    console.log(`  ✓ ${route}  —  ${title}`)
    ok++
  } catch (err) {
    console.warn(`  ✗ ${route}  —  ${err.message.split('\n')[0]}`)
    failed++
  } finally {
    await page.close()
  }
}

await browser.close()
await server.close()

console.log(`\nPrerendered ${ok} routes${failed ? `, ${failed} failed` : ''}.`)
if (failed) process.exitCode = 1
