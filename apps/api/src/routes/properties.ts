import type { FastifyInstance } from 'fastify'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { serializeProperty } from '../lib/serialize.js'
import { verifyAdmin } from '../lib/auth.js'

const propertyBody = {
  type: 'object',
  required: ['slug', 'title', 'listingType', 'propertyType', 'priceInr', 'priceLabel', 'areaSqft', 'city', 'locality', 'status'],
  properties: {
    slug: { type: 'string' },
    title: { type: 'string' },
    listingType: { type: 'string', enum: ['Sale', 'Resale', 'Under Construction'] },
    propertyType: { type: 'string', enum: ['Apartment', 'Villa', 'Plot', 'Commercial'] },
    bhk: { type: 'integer', nullable: true },
    priceInr: { type: 'integer' },
    priceLabel: { type: 'string' },
    areaSqft: { type: 'integer' },
    carpetAreaSqft: { type: 'integer', nullable: true },
    builtupAreaSqft: { type: 'integer', nullable: true },
    city: { type: 'string' },
    locality: { type: 'string' },
    address: { type: 'string', nullable: true },
    lat: { type: 'number', nullable: true },
    lng: { type: 'number', nullable: true },
    status: { type: 'string', enum: ['ready', 'under_construction'] },
    furnishing: { type: 'string', nullable: true },
    reraNumber: { type: 'string', nullable: true },
    description: { type: 'string', nullable: true },
    amenities: { type: 'array', items: { type: 'string' } },
    images: { type: 'array', items: { type: 'string' } },
    floorPlanUrl: { type: 'string', nullable: true },
    videoUrl: { type: 'string', nullable: true },
    featured: { type: 'boolean' },
    published: { type: 'boolean' },
  },
} as const

export default async function propertyRoutes(app: FastifyInstance) {
  // ── List + filter ────────────────────────────────────────────────
  app.get(
    '/properties',
    {
      schema: {
        tags: ['Properties'],
        summary: 'List & filter properties',
        querystring: {
          type: 'object',
          properties: {
            listingType: { type: 'string' },
            propertyType: { type: 'string' },
            bhk: { type: 'integer' },
            city: { type: 'string' },
            locality: { type: 'string' },
            status: { type: 'string' },
            minPrice: { type: 'integer' },
            maxPrice: { type: 'integer' },
            q: { type: 'string', description: 'Free text on title/locality' },
            sort: { type: 'string', enum: ['newest', 'price_asc', 'price_desc', 'area_desc'], default: 'newest' },
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 60, default: 12 },
          },
        },
      },
    },
    async (request) => {
      const q = request.query as Record<string, string | number | undefined>
      const page = Number(q.page ?? 1)
      const limit = Number(q.limit ?? 12)

      const where: Prisma.PropertyWhereInput = { published: true }
      if (q.listingType) where.listingType = String(q.listingType)
      if (q.propertyType) where.propertyType = String(q.propertyType)
      if (q.bhk) where.bhk = Number(q.bhk)
      if (q.city) where.city = String(q.city)
      if (q.locality) where.locality = { contains: String(q.locality) }
      if (q.status) where.status = String(q.status)
      if (q.minPrice || q.maxPrice) {
        where.priceInr = {}
        if (q.minPrice) where.priceInr.gte = Number(q.minPrice)
        if (q.maxPrice) where.priceInr.lte = Number(q.maxPrice)
      }
      if (q.q) {
        where.OR = [
          { title: { contains: String(q.q) } },
          { locality: { contains: String(q.q) } },
          { city: { contains: String(q.q) } },
        ]
      }

      const orderBy: Prisma.PropertyOrderByWithRelationInput =
        q.sort === 'price_asc' ? { priceInr: 'asc' }
        : q.sort === 'price_desc' ? { priceInr: 'desc' }
        : q.sort === 'area_desc' ? { areaSqft: 'desc' }
        : { createdAt: 'desc' }

      const [rows, total] = await Promise.all([
        prisma.property.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
        prisma.property.count({ where }),
      ])

      return { data: rows.map(serializeProperty), total, page, limit }
    },
  )

  // ── Detail by slug ───────────────────────────────────────────────
  app.get(
    '/properties/:slug',
    {
      schema: {
        tags: ['Properties'],
        summary: 'Get one property by slug',
        params: { type: 'object', properties: { slug: { type: 'string' } }, required: ['slug'] },
      },
    },
    async (request, reply) => {
      const { slug } = request.params as { slug: string }
      const row = await prisma.property.findUnique({ where: { slug } })
      if (!row) return reply.code(404).send({ error: 'Property not found' })
      return serializeProperty(row)
    },
  )

  // ── Create (admin) ───────────────────────────────────────────────
  app.post(
    '/properties',
    { preHandler: verifyAdmin, schema: { tags: ['Properties'], summary: 'Create property (admin)', security: [{ bearerAuth: [] }], body: propertyBody } },
    async (request, reply) => {
      const body = request.body as Record<string, unknown>
      const row = await prisma.property.create({
        data: {
          ...body,
          amenities: JSON.stringify(body.amenities ?? []),
          images: JSON.stringify(body.images ?? []),
        } as Prisma.PropertyCreateInput,
      })
      return reply.code(201).send(serializeProperty(row))
    },
  )

  // ── Update (admin) ───────────────────────────────────────────────
  app.patch(
    '/properties/:id',
    { preHandler: verifyAdmin, schema: { tags: ['Properties'], summary: 'Update property (admin)', security: [{ bearerAuth: [] }], params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } } },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as Record<string, unknown>
      const data: Record<string, unknown> = { ...body }
      if (body.amenities) data.amenities = JSON.stringify(body.amenities)
      if (body.images) data.images = JSON.stringify(body.images)
      try {
        const row = await prisma.property.update({ where: { id }, data })
        return serializeProperty(row)
      } catch {
        return reply.code(404).send({ error: 'Property not found' })
      }
    },
  )

  // ── Delete (admin) ───────────────────────────────────────────────
  app.delete(
    '/properties/:id',
    { preHandler: verifyAdmin, schema: { tags: ['Properties'], summary: 'Delete property (admin)', security: [{ bearerAuth: [] }], params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } } },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      try {
        await prisma.property.delete({ where: { id } })
        return { deleted: true }
      } catch {
        return reply.code(404).send({ error: 'Property not found' })
      }
    },
  )
}
