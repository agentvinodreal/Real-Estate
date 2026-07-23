import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { verifyAdmin, verifyUser, clerkClient } from '../lib/auth.js'

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
            marketplaceType: { type: 'string', nullable: true },
            itemId: { type: 'string', nullable: true },
            itemQty: { type: 'integer', nullable: true },
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
        marketplaceType?: string
        itemId?: string
        itemQty?: number
      }
      const lead = await prisma.lead.create({ data: body })
      // TODO: fire Resend email + WhatsApp deep link here.
      return reply.code(201).send({ id: lead.id, status: lead.status })
    },
  )

  // ── Leads inbox (admin) ──────────────────────────────────────────
  app.get(
    '/leads',
    {
      preHandler: verifyAdmin,
      schema: {
        tags: ['Leads'],
        summary: 'List leads (admin)',
        security: [{ bearerAuth: [] }],
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

      if (page && limit) {
        const [rows, total] = await Promise.all([
          prisma.lead.findMany({
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.lead.count(),
        ])
        return { data: rows, total, page, limit }
      }

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

  // ── Delete a lead (admin) ────────────────────────────────────────
  app.delete(
    '/leads/:id',
    {
      preHandler: verifyAdmin,
      schema: {
        tags: ['Leads'],
        summary: 'Delete a lead (admin)',
        security: [{ bearerAuth: [] }],
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      try {
        await prisma.lead.delete({ where: { id } })
        return reply.code(204).send()
      } catch {
        return reply.code(404).send({ error: 'Lead not found' })
      }
    },
  )

  // ── User's own leads (authenticated) ───────────────────────────────
  app.get(
    '/leads/my',
    {
      preHandler: verifyUser,
      schema: {
        tags: ['Leads'],
        summary: 'List my own enquiries / orders',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request) => {
      const payload = (request as any).user
      const user = await clerkClient.users.getUser(payload.sub)
      
      const emails = user.emailAddresses.map((e) => e.emailAddress).filter(Boolean) as string[]
      const phones = user.phoneNumbers.map((p) => p.phoneNumber).filter(Boolean) as string[]

      // Generate search conditions matching email or last 10 digits of phone number
      const emailOrPhoneConditions: any[] = []
      
      if (emails.length > 0) {
        emailOrPhoneConditions.push({ email: { in: emails } })
      }
      
      for (const phone of phones) {
        const cleanPhone = phone.replace(/[^0-9]/g, '')
        if (cleanPhone.length >= 10) {
          const suffix = cleanPhone.slice(-10)
          emailOrPhoneConditions.push({ phone: { contains: suffix } })
        } else {
          emailOrPhoneConditions.push({ phone: { contains: cleanPhone } })
        }
      }

      if (emailOrPhoneConditions.length === 0) {
        return { data: [] }
      }

      const rows = await prisma.lead.findMany({
        where: {
          OR: emailOrPhoneConditions,
        },
        orderBy: { createdAt: 'desc' },
      })

      return { data: rows }
    },
  )
}
