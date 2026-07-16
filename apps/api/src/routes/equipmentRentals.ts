import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { verifyAdmin } from '../lib/auth.js'

export default async function equipmentRentalsRoutes(app: FastifyInstance) {
  // GET /equipment-rentals (public list)
  app.get(
    '/equipment-rentals',
    {
      schema: {
        tags: ['Marketplace'],
        summary: 'List rental equipment',
        querystring: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            includeUnavailable: { type: 'boolean' },
          },
        },
      },
    },
    async (request) => {
      const query = request.query as { category?: string; includeUnavailable?: boolean }
      const whereClause: any = {}

      const includeUnavailable = query.includeUnavailable === true || (query.includeUnavailable as any) === 'true'
      if (!includeUnavailable) {
        whereClause.available = true
      }

      if (query.category) {
        whereClause.category = query.category
      }

      const rows = await prisma.equipmentRental.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      })
      return { data: rows }
    },
  )

  // POST /equipment-rentals (admin - create)
  app.post(
    '/equipment-rentals',
    {
      preHandler: verifyAdmin,
      schema: {
        tags: ['Marketplace'],
        summary: 'Create equipment rental listing (admin)',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name', 'category', 'rentPerDay'],
          properties: {
            name: { type: 'string' },
            category: { type: 'string' },
            rentPerDay: { type: 'integer' },
            imageUrl: { type: 'string', nullable: true },
            description: { type: 'string', nullable: true },
            specs: { type: 'array', items: { type: 'string' } },
            available: { type: 'boolean' },
          },
        },
      },
    },
    async (request, reply) => {
      const row = await prisma.equipmentRental.create({
        data: request.body as any,
      })
      return reply.code(201).send(row)
    },
  )

  // PATCH /equipment-rentals/:id (admin - update)
  app.patch(
    '/equipment-rentals/:id',
    {
      preHandler: verifyAdmin,
      schema: {
        tags: ['Marketplace'],
        summary: 'Update equipment rental listing (admin)',
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
            category: { type: 'string' },
            rentPerDay: { type: 'integer' },
            imageUrl: { type: 'string', nullable: true },
            description: { type: 'string', nullable: true },
            specs: { type: 'array', items: { type: 'string' } },
            available: { type: 'boolean' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      try {
        const row = await prisma.equipmentRental.update({
          where: { id },
          data: request.body as any,
        })
        return row
      } catch {
        return reply.code(404).send({ error: 'Equipment listing not found' })
      }
    },
  )

  // DELETE /equipment-rentals/:id (admin - delete)
  app.delete(
    '/equipment-rentals/:id',
    {
      preHandler: verifyAdmin,
      schema: {
        tags: ['Marketplace'],
        summary: 'Delete equipment rental listing (admin)',
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
      await prisma.equipmentRental.delete({
        where: { id },
      })
      return reply.code(204).send()
    },
  )
}
