import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { verifyAdmin } from '../lib/auth.js'

export default async function testimonialRoutes(app: FastifyInstance) {
  app.get(
    '/testimonials',
    {
      schema: {
        tags: ['Testimonials'],
        summary: 'List published testimonials',
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
          },
        },
      },
    },
    async (request) => {
      const q = request.query as { page?: number; limit?: number }
      const page = q.page ? Number(q.page) : undefined
      const limit = q.limit ? Number(q.limit) : undefined

      const where = { published: true }

      if (page && limit) {
        const [rows, total] = await Promise.all([
          prisma.testimonial.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.testimonial.count({ where }),
        ])
        return { data: rows, total, page, limit }
      }

      const rows = await prisma.testimonial.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      })
      return { data: rows }
    },
  )

  // GET /testimonials/admin (admin - list all testimonials)
  app.get(
    '/testimonials/admin',
    {
      preHandler: verifyAdmin,
      schema: {
        tags: ['Testimonials'],
        summary: 'List all testimonials (admin)',
        security: [{ bearerAuth: [] }],
      },
    },
    async () => {
      const rows = await prisma.testimonial.findMany({
        orderBy: { createdAt: 'desc' },
      })
      return { data: rows }
    },
  )

  app.post(
    '/testimonials',
    {
      schema: {
        tags: ['Testimonials'],
        summary: 'Create testimonial / review (public)',
        body: {
          type: 'object',
          required: ['name', 'quote', 'rating'],
          properties: {
            name: { type: 'string', minLength: 2 },
            location: { type: 'string', nullable: true },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            quote: { type: 'string', minLength: 5 },
            avatarUrl: { type: 'string', nullable: true },
            published: { type: 'boolean', default: true },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as any
      const row = await prisma.testimonial.create({
        data: {
          name: body.name,
          location: body.location ?? null,
          rating: body.rating ?? 5,
          quote: body.quote,
          avatarUrl: body.avatarUrl ?? null,
          published: body.published !== undefined ? body.published : true,
        },
      })
      return reply.code(201).send(row)
    },
  )

  // PATCH /testimonials/:id (admin - update)
  app.patch(
    '/testimonials/:id',
    {
      preHandler: verifyAdmin,
      schema: {
        tags: ['Testimonials'],
        summary: 'Update testimonial (admin)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            location: { type: 'string', nullable: true },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            quote: { type: 'string' },
            avatarUrl: { type: 'string', nullable: true },
            published: { type: 'boolean' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      try {
        const row = await prisma.testimonial.update({
          where: { id },
          data: request.body as any,
        })
        return row
      } catch {
        return reply.code(404).send({ error: 'Testimonial not found' })
      }
    },
  )

  // DELETE /testimonials/:id (admin - delete)
  app.delete(
    '/testimonials/:id',
    {
      preHandler: verifyAdmin,
      schema: {
        tags: ['Testimonials'],
        summary: 'Delete testimonial (admin)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      try {
        await prisma.testimonial.delete({
          where: { id },
        })
        return reply.code(200).send({ deleted: true })
      } catch {
        return reply.code(404).send({ error: 'Testimonial not found' })
      }
    },
  )
}

