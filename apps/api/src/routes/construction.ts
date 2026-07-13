import type { FastifyInstance } from 'fastify'
import type { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { serializeProject } from '../lib/serialize.js'
import { verifyAdmin } from '../lib/auth.js'

const projectBody = {
  type: 'object',
  required: ['slug', 'title', 'category', 'location'],
  properties: {
    slug: { type: 'string' },
    title: { type: 'string' },
    category: { type: 'string' },
    location: { type: 'string' },
    areaSqft: { type: 'integer', nullable: true },
    durationMonths: { type: 'integer', nullable: true },
    packageTier: { type: 'string', nullable: true },
    description: { type: 'string', nullable: true },
    processStages: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, body: { type: 'string' } } } },
    beforeImages: { type: 'array', items: { type: 'string' } },
    afterImages: { type: 'array', items: { type: 'string' } },
    stageImages: { type: 'array', items: { type: 'string' } },
    published: { type: 'boolean' },
  },
} as const

export default async function constructionRoutes(app: FastifyInstance) {
  app.get(
    '/construction-projects',
    {
      schema: {
        tags: ['Construction'],
        summary: 'List construction projects',
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
          prisma.constructionProject.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.constructionProject.count({ where }),
        ])
        return { data: rows.map(serializeProject), total, page, limit }
      }

      const rows = await prisma.constructionProject.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      })
      return { data: rows.map(serializeProject) }
    },
  )

  app.get(
    '/construction-projects/:slug',
    {
      schema: {
        tags: ['Construction'],
        summary: 'Get one construction project by slug',
        params: { type: 'object', properties: { slug: { type: 'string' } }, required: ['slug'] },
      },
    },
    async (request, reply) => {
      const { slug } = request.params as { slug: string }
      const row = await prisma.constructionProject.findUnique({ where: { slug } })
      if (!row) return reply.code(404).send({ error: 'Project not found' })
      return serializeProject(row)
    },
  )

  app.post(
    '/construction-projects',
    { preHandler: verifyAdmin, schema: { tags: ['Construction'], summary: 'Create project (admin)', security: [{ bearerAuth: [] }], body: projectBody } },
    async (request, reply) => {
      const { processStages, beforeImages, afterImages, stageImages, ...rest } = request.body as Record<string, any>
      const row = await prisma.constructionProject.create({
        data: {
          ...rest,
          beforeImages: beforeImages ?? [],
          afterImages: afterImages ?? [],
          stageImages: stageImages ?? [],
        } as Prisma.ConstructionProjectCreateInput,
      })
      return reply.code(201).send(serializeProject(row))
    },
  )

  app.delete(
    '/construction-projects/:id',
    { preHandler: verifyAdmin, schema: { tags: ['Construction'], summary: 'Delete project (admin)', security: [{ bearerAuth: [] }], params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } } },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      try {
        await prisma.constructionProject.delete({ where: { id } })
        return { deleted: true }
      } catch {
        return reply.code(404).send({ error: 'Project not found' })
      }
    },
  )

  app.patch(
    '/construction-projects/:id',
    {
      preHandler: verifyAdmin,
      schema: {
        tags: ['Construction'],
        summary: 'Update project (admin)',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        body: {
          type: 'object',
          properties: {
            slug: { type: 'string' },
            title: { type: 'string' },
            category: { type: 'string' },
            location: { type: 'string' },
            areaSqft: { type: 'integer', nullable: true },
            durationMonths: { type: 'integer', nullable: true },
            packageTier: { type: 'string', nullable: true },
            description: { type: 'string', nullable: true },
            processStages: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, body: { type: 'string' } } } },
            beforeImages: { type: 'array', items: { type: 'string' } },
            afterImages: { type: 'array', items: { type: 'string' } },
            stageImages: { type: 'array', items: { type: 'string' } },
            published: { type: 'boolean' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { processStages, ...body } = request.body as Record<string, any>

      try {
        const row = await prisma.constructionProject.update({
          where: { id },
          data: body as any,
        })
        return serializeProject(row)
      } catch {
        return reply.code(404).send({ error: 'Project not found' })
      }
    },
  )
}

