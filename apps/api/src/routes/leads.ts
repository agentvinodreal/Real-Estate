import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { verifyAdmin } from '../lib/auth.js'

export default async function leadRoutes(app: FastifyInstance) {
  // ── Submit a lead (public) ───────────────────────────────────────
  app.post(
    '/leads',
    {
      // basic abuse protection on the public write endpoint
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
      schema: {
        tags: ['Leads'],
        summary: 'Submit an enquiry / quote request',
        body: {
          type: 'object',
          required: ['name', 'phone'],
          properties: {
            name: { type: 'string', minLength: 2 },
            phone: { type: 'string', minLength: 6 },
            email: { type: 'string', nullable: true },
            sourcePage: { type: 'string', nullable: true },
            propertyId: { type: 'string', nullable: true },
            projectId: { type: 'string', nullable: true },
            message: { type: 'string', nullable: true },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as {
        name: string
        phone: string
        email?: string
        sourcePage?: string
        propertyId?: string
        projectId?: string
        message?: string
      }
      const lead = await prisma.lead.create({ data: body })
      // TODO: fire Resend email + WhatsApp deep link here.
      return reply.code(201).send({ id: lead.id, status: lead.status })
    },
  )

  // ── Leads inbox (admin) ──────────────────────────────────────────
  app.get(
    '/leads',
    { preHandler: verifyAdmin, schema: { tags: ['Leads'], summary: 'List leads (admin)', security: [{ bearerAuth: [] }] } },
    async () => {
      const rows = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } })
      return { data: rows }
    },
  )

  // ── Update lead status (admin) ───────────────────────────────────
  app.patch(
    '/leads/:id',
    {
      preHandler: verifyAdmin,
      schema: {
        tags: ['Leads'],
        summary: 'Update lead status (admin)',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        body: {
          type: 'object',
          properties: { status: { type: 'string', enum: ['new', 'contacted', 'visit', 'closed'] } },
          required: ['status'],
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { status } = request.body as { status: string }
      try {
        const row = await prisma.lead.update({ where: { id }, data: { status } })
        return row
      } catch {
        return reply.code(404).send({ error: 'Lead not found' })
      }
    },
  )
}
