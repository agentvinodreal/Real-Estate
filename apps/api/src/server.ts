import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import fastifyStatic from '@fastify/static'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

import healthRoutes from './routes/health.js'
import propertyRoutes from './routes/properties.js'
import constructionRoutes from './routes/construction.js'
import leadRoutes from './routes/leads.js'
import testimonialRoutes from './routes/testimonials.js'
import uploadsRoutes from './routes/uploads.js'
import materialsRoutes from './routes/materials.js'
import blogRoutes from './routes/blog.js'
import geocodeRoutes from './routes/geocode.js'
import serviceProvidersRoutes from './routes/serviceProviders.js'
import equipmentRentalsRoutes from './routes/equipmentRentals.js'
import homeDesignerRoutes from './routes/homeDesigner.js'
import syncRoutes from './routes/sync.js'

const PORT = Number(process.env.PORT ?? 4000)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WEB_DIST = path.resolve(__dirname, '../../web/dist')
const ADMIN_DIST = path.resolve(__dirname, '../../admin/dist')
const API_PREFIX = '/api/v1'

const app = Fastify({ logger: true })

async function init() {
  await app.register(cors, {
    origin: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' })

  // ── OpenAPI / Swagger ──────────────────────────────────────────
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Carry Construction API',
        description: 'Property sale, resale, construction projects, and leads.',
        version: '0.1.0',
      },
      servers: [{ url: `http://localhost:${PORT}`, description: 'Local dev' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', description: 'Clerk session token (admin role required)' },
        },
      },
      tags: [
        { name: 'Properties' },
        { name: 'Construction' },
        { name: 'Leads' },
        { name: 'Testimonials' },
        { name: 'Blog' },
        { name: 'System' },
        { name: 'Home Designer' },
        { name: 'Sync' },
      ],
    },
  })

  await app.register(swaggerUi, {
    routePrefix: '/api/docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
  })

  // ── Routes ─────────────────────────────────────────────────────
  await app.register(healthRoutes)
  await app.register(async (api) => {
    await api.register(propertyRoutes)
    await api.register(constructionRoutes)
    await api.register(leadRoutes)
    await api.register(testimonialRoutes)
    await api.register(uploadsRoutes)
    await api.register(materialsRoutes)
    await api.register(blogRoutes)
    await api.register(geocodeRoutes)
    await api.register(serviceProvidersRoutes)
    await api.register(equipmentRentalsRoutes)
    await api.register(homeDesignerRoutes)
    await api.register(syncRoutes)
  }, { prefix: API_PREFIX })

  // ── Serve built web app (SPA fallback) ───────────────────────
  const serveStatic = fs.existsSync(WEB_DIST) && fs.existsSync(ADMIN_DIST)
  if (serveStatic) {
    await app.register(fastifyStatic, {
      root: WEB_DIST,
      prefix: '/',
    })

    // ── Serve built admin app at /admin ───────────────────────
    await app.register(fastifyStatic, {
      root: ADMIN_DIST,
      prefix: '/admin/',
      decorateReply: false,
    })

    // SPA fallback — /admin/* → admin index.html, everything else → web index.html
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/admin')) {
        reply.sendFile('index.html', ADMIN_DIST)
      } else {
        reply.sendFile('index.html', WEB_DIST)
      }
    })
  }

  await app.ready()
}

const initPromise = init()

if (!process.env.VERCEL) {
  initPromise
    .then(async () => {
      await app.listen({ port: PORT, host: '0.0.0.0' })
      app.log.info(`Swagger UI → http://localhost:${PORT}/api/docs`)
      app.log.info(`Web app    → http://localhost:${PORT}/`)
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}

export default async function handler(req: any, res: any) {
  await initPromise
  app.server.emit('request', req, res)
}

