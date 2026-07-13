import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { verifyAdmin } from '../lib/auth.js'

const blogBody = {
  type: 'object',
  required: ['slug', 'title', 'excerpt', 'body'],
  properties: {
    slug: { type: 'string' },
    title: { type: 'string' },
    excerpt: { type: 'string' },
    coverImage: { type: 'string', nullable: true },
    body: { type: 'string' },
    metaTitle: { type: 'string', nullable: true },
    metaDescription: { type: 'string', nullable: true },
    published: { type: 'boolean', default: true },
  },
} as const

export default async function blogRoutes(app: FastifyInstance) {
  // ── GET /blog (public list) ──────────────────────────────────────
  app.get(
    '/blog',
    {
      schema: {
        tags: ['Blog'],
        summary: 'List blog posts',
        querystring: {
          type: 'object',
          properties: {
            includeUnpublished: { type: 'boolean', default: false, description: 'Include drafts' },
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
          },
        },
      },
    },
    async (request) => {
      const q = request.query as { includeUnpublished?: boolean; page?: number; limit?: number }
      const where = q.includeUnpublished ? {} : { published: true }
      const page = q.page ? Number(q.page) : undefined
      const limit = q.limit ? Number(q.limit) : undefined

      if (page && limit) {
        const [rows, total] = await Promise.all([
          prisma.blogPost.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.blogPost.count({ where }),
        ])
        return { data: rows, total, page, limit }
      }

      const rows = await prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      })
      return { data: rows }
    },
  )

  // ── GET /blog/:slug (public detail) ──────────────────────────────
  app.get(
    '/blog/:slug',
    {
      schema: {
        tags: ['Blog'],
        summary: 'Get a single blog post by slug',
        params: {
          type: 'object',
          required: ['slug'],
          properties: {
            slug: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { slug } = request.params as { slug: string }
      const row = await prisma.blogPost.findUnique({
        where: { slug },
      })
      if (!row) {
        return reply.code(404).send({ error: 'Blog post not found' })
      }
      return row
    },
  )

  // ── POST /blog (admin create) ────────────────────────────────────
  app.post(
    '/blog',
    {
      preHandler: verifyAdmin,
      schema: {
        tags: ['Blog'],
        summary: 'Create a blog post (admin)',
        security: [{ bearerAuth: [] }],
        body: blogBody,
      },
    },
    async (request, reply) => {
      const body = request.body as any
      try {
        const row = await prisma.blogPost.create({
          data: body,
        })
        return reply.code(201).send(row)
      } catch (err: any) {
        if (err.code === 'P2002') {
          return reply.code(409).send({ error: 'A blog post with this slug already exists' })
        }
        throw err
      }
    },
  )

  // ── PATCH /blog/:id (admin update) ────────────────────────────────
  app.patch(
    '/blog/:id',
    {
      preHandler: verifyAdmin,
      schema: {
        tags: ['Blog'],
        summary: 'Update a blog post (admin)',
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
            slug: { type: 'string' },
            title: { type: 'string' },
            excerpt: { type: 'string' },
            coverImage: { type: 'string', nullable: true },
            body: { type: 'string' },
            metaTitle: { type: 'string', nullable: true },
            metaDescription: { type: 'string', nullable: true },
            published: { type: 'boolean' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as any
      try {
        const row = await prisma.blogPost.update({
          where: { id },
          data: body,
        })
        return row
      } catch (err: any) {
        if (err.code === 'P2025') {
          return reply.code(404).send({ error: 'Blog post not found' })
        }
        if (err.code === 'P2002') {
          return reply.code(409).send({ error: 'A blog post with this slug already exists' })
        }
        throw err
      }
    },
  )

  // ── DELETE /blog/:id (admin delete) ──────────────────────────────
  app.delete(
    '/blog/:id',
    {
      preHandler: verifyAdmin,
      schema: {
        tags: ['Blog'],
        summary: 'Delete a blog post (admin)',
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
        await prisma.blogPost.delete({
          where: { id },
        })
        return reply.code(200).send({ deleted: true })
      } catch (err: any) {
        if (err.code === 'P2025') {
          return reply.code(404).send({ error: 'Blog post not found' })
        }
        throw err
      }
    },
  )
}
