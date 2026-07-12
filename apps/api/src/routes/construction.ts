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
    { schema: { tags: ['Construction'], summary: 'List construction projects' } },
    async () => {
      const rows = await prisma.constructionProject.findMany({
        where: { published: true },
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
      const body = request.body as Record<string, unknown>
      const row = await prisma.constructionProject.create({
        data: {
          ...body,
          processStages: JSON.stringify(body.processStages ?? []),
          beforeImages: (body.beforeImages as string[]) ?? [],
          afterImages: (body.afterImages as string[]) ?? [],
          stageImages: (body.stageImages as string[]) ?? [],
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
      const body = request.body as Record<string, unknown>
      const data: Record<string, unknown> = { ...body }
      if (body.processStages) data.processStages = JSON.stringify(body.processStages)

      try {
        const row = await prisma.constructionProject.update({
          where: { id },
          data: data as any,
        })
        return serializeProject(row)
      } catch {
        return reply.code(404).send({ error: 'Project not found' })
      }
    },
  )
}

