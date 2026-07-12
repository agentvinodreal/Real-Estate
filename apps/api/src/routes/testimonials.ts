import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { verifyAdmin } from '../lib/auth.js'

export default async function testimonialRoutes(app: FastifyInstance) {
  app.get(
    '/testimonials',
    { schema: { tags: ['Testimonials'], summary: 'List published testimonials' } },
    async () => {
      const rows = await prisma.testimonial.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
      })
      return { data: rows }
    },
  )

  app.post(
    '/testimonials',
    {
      preHandler: verifyAdmin,
      schema: {
        tags: ['Testimonials'],
        summary: 'Create testimonial (admin)',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name', 'quote'],
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
      const row = await prisma.testimonial.create({ data: request.body as never })
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

