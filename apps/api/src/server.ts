import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

import healthRoutes from './routes/health.js'
import propertyRoutes from './routes/properties.js'
import constructionRoutes from './routes/construction.js'
import leadRoutes from './routes/leads.js'
import testimonialRoutes from './routes/testimonials.js'

const PORT = Number(process.env.PORT ?? 4000)
const API_PREFIX = '/api/v1'

async function main() {
  const app = Fastify({ logger: true })

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
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
        { name: 'System' },
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
  }, { prefix: API_PREFIX })

  await app.ready()

  await app.listen({ port: PORT, host: '0.0.0.0' })
  app.log.info(`Swagger UI → http://localhost:${PORT}/api/docs`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
