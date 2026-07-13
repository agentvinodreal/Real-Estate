import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { verifyAdmin } from '../lib/auth.js'

export default async function materialsRoutes(app: FastifyInstance) {
  // GET /materials (public list)
  app.get(
    '/materials',
    {
      schema: {
        tags: ['Materials'],
        summary: 'List raw construction materials used in buildings',
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
            category: { type: 'string' },
          },
        },
      },
    },
    async (request) => {
      const q = request.query as { page?: number; limit?: number; category?: string }
      const page = q.page ? Number(q.page) : undefined
      const limit = q.limit ? Number(q.limit) : undefined
      const category = q.category

      const whereClause: any = {}
      if (category) {
        whereClause.category = category
      }

      if (page && limit) {
        const [rows, total] = await Promise.all([
          prisma.material.findMany({
            where: whereClause,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.material.count({ where: whereClause }),
        ])
        return { data: rows, total, page, limit }
      }

      const rows = await prisma.material.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      })
      return { data: rows }
    },
  )

  // POST /materials (admin - create)
  app.post(
    '/materials',
    {
      preHandler: verifyAdmin,
      schema: {
        tags: ['Materials'],
        summary: 'Create material listing (admin)',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name', 'category', 'brand'],
          properties: {
            name: { type: 'string' },
            category: { type: 'string' },
            brand: { type: 'string' },
            description: { type: 'string', nullable: true },
            imageUrl: { type: 'string', nullable: true },
            price: { type: 'integer', nullable: true },
            unit: { type: 'string', nullable: true },
            available: { type: 'boolean' },
          },
        },
      },
    },
    async (request, reply) => {
      const row = await prisma.material.create({
        data: request.body as any,
      })
      return reply.code(201).send(row)
    },
  )

  // DELETE /materials/:id (admin - delete)
  app.delete(
    '/materials/:id',
    {
      preHandler: verifyAdmin,
      schema: {
        tags: ['Materials'],
        summary: 'Delete material listing (admin)',
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
      await prisma.material.delete({
        where: { id },
      })
      return reply.code(204).send()
    },
  )

  // PATCH /materials/:id (admin - update)
  app.patch(
    '/materials/:id',
    {
      preHandler: verifyAdmin,
      schema: {
        tags: ['Materials'],
        summary: 'Update material listing (admin)',
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
            brand: { type: 'string' },
            description: { type: 'string', nullable: true },
            imageUrl: { type: 'string', nullable: true },
            price: { type: 'integer', nullable: true },
            unit: { type: 'string', nullable: true },
            available: { type: 'boolean' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      try {
        const row = await prisma.material.update({
          where: { id },
          data: request.body as any,
        })
        return row
      } catch {
        return reply.code(404).send({ error: 'Material not found' })
      }
    },
  )
}


