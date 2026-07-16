import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { verifyAdmin } from '../lib/auth.js'

export default async function serviceProvidersRoutes(app: FastifyInstance) {
  // GET /service-providers (public list)
  app.get(
    '/service-providers',
    {
      schema: {
        tags: ['Marketplace'],
        summary: 'List service providers',
        querystring: {
          type: 'object',
          properties: {
            role: { type: 'string' },
            city: { type: 'string' },
            q: { type: 'string' },
            includeAll: { type: 'boolean' },
          },
        },
      },
    },
    async (request) => {
      const query = request.query as { role?: string; city?: string; q?: string; includeAll?: boolean }
      const whereClause: any = {}

      const includeAll = query.includeAll === true || (query.includeAll as any) === 'true'
      if (!includeAll) {
        whereClause.reviewStatus = 'approved'
      }

      if (query.role) {
        whereClause.role = query.role
      }
      if (query.city) {
        whereClause.city = { contains: query.city, mode: 'insensitive' }
      }
      if (query.q) {
        whereClause.name = { contains: query.q, mode: 'insensitive' }
      }

      const rows = await prisma.serviceProvider.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      })
      return { data: rows }
    },
  )

  // POST /service-providers (admin - create)
  app.post(
    '/service-providers',
    {
      preHandler: verifyAdmin,
      schema: {
        tags: ['Marketplace'],
        summary: 'Create service provider (admin)',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name', 'role', 'phone', 'city'],
          properties: {
            name: { type: 'string' },
            role: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string', nullable: true },
            city: { type: 'string' },
            locality: { type: 'string', nullable: true },
            experienceYears: { type: 'integer', nullable: true },
            profilePhotoUrl: { type: 'string', nullable: true },
            description: { type: 'string', nullable: true },
            specialties: { type: 'array', items: { type: 'string' } },
            minimumRate: { type: 'integer', nullable: true },
            rateUnit: { type: 'string', nullable: true },
            reviewStatus: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const row = await prisma.serviceProvider.create({
        data: request.body as any,
      })
      return reply.code(201).send(row)
    },
  )

  // PATCH /service-providers/:id (admin - update)
  app.patch(
    '/service-providers/:id',
    {
      preHandler: verifyAdmin,
      schema: {
        tags: ['Marketplace'],
        summary: 'Update service provider (admin)',
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
            role: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string', nullable: true },
            city: { type: 'string' },
            locality: { type: 'string', nullable: true },
            experienceYears: { type: 'integer', nullable: true },
            profilePhotoUrl: { type: 'string', nullable: true },
            description: { type: 'string', nullable: true },
            specialties: { type: 'array', items: { type: 'string' } },
            minimumRate: { type: 'integer', nullable: true },
            rateUnit: { type: 'string', nullable: true },
            reviewStatus: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      try {
        const row = await prisma.serviceProvider.update({
          where: { id },
          data: request.body as any,
        })
        return row
      } catch {
        return reply.code(404).send({ error: 'Service provider not found' })
      }
    },
  )

  // DELETE /service-providers/:id (admin - delete)
  app.delete(
    '/service-providers/:id',
    {
      preHandler: verifyAdmin,
      schema: {
        tags: ['Marketplace'],
        summary: 'Delete service provider (admin)',
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
      await prisma.serviceProvider.delete({
        where: { id },
      })
      return reply.code(204).send()
    },
  )
}
