/**
 * Inbound sync webhook for the Field Ops panel (carry-admin-suryansh.web.app).
 *
 * The two systems run on separate databases and separate Clerk instances, so a
 * Clerk token can't authenticate this hop. Instead the caller presents a shared
 * secret in `x-sync-secret`, matched against SYNC_SECRET on this side.
 *
 * Field Ops calls this on publish AND on unpublish — an unpublish is just
 * `published: false`, which hides the listing here. This endpoint never deletes.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { timingSafeEqual } from 'node:crypto'
import { prisma } from '../lib/prisma.js'
import { upsertProperty, upsertProject } from '../lib/syncImport.js'

/** Constant-time compare so the secret can't be recovered by timing the response. */
function secretMatches(provided: string, expected: string) {
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

async function verifySyncSecret(request: FastifyRequest, reply: FastifyReply) {
  const expected = process.env.SYNC_SECRET
  if (!expected) {
    request.log.error('SYNC_SECRET is not configured — rejecting sync request')
    return reply.code(503).send({ error: 'Sync is not configured on this server' })
  }

  const provided = request.headers['x-sync-secret']
  if (typeof provided !== 'string' || !secretMatches(provided, expected)) {
    return reply.code(401).send({ error: 'Unauthorized' })
  }
}

const itemSchema = {
  type: 'object',
  required: ['id', 'title'],
  additionalProperties: true,
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    published: { type: 'boolean' },
  },
} as const

export default async function syncRoutes(app: FastifyInstance) {
  app.post(
    '/sync',
    {
      preHandler: verifySyncSecret,
      // A publish burst shouldn't trip the global 120/min limit.
      config: { rateLimit: { max: 600, timeWindow: '1 minute' } },
      schema: {
        tags: ['Sync'],
        summary: 'Upsert properties/projects published in the Field Ops panel',
        description:
          'Authenticated with the `x-sync-secret` header. Accepts one or many items; ' +
          'send `published: false` to hide a listing. Never deletes.',
        body: {
          type: 'object',
          additionalProperties: false,
          properties: {
            properties: { type: 'array', items: itemSchema },
            projects: { type: 'array', items: itemSchema },
          },
        },
      },
    },
    async (request, reply) => {
      const { properties = [], projects = [] } = request.body as {
        properties?: any[]
        projects?: any[]
      }

      if (properties.length === 0 && projects.length === 0) {
        return reply.code(400).send({ error: 'Nothing to sync — send `properties` and/or `projects`' })
      }

      const synced: string[] = []
      const failed: { id: string; error: string }[] = []

      for (const p of properties) {
        try {
          await upsertProperty(prisma, p)
          synced.push(p.id)
        } catch (err) {
          request.log.error({ err, id: p.id }, 'property sync failed')
          failed.push({ id: p.id, error: err instanceof Error ? err.message : 'unknown error' })
        }
      }

      for (const p of projects) {
        try {
          await upsertProject(prisma, p)
          synced.push(p.id)
        } catch (err) {
          request.log.error({ err, id: p.id }, 'project sync failed')
          failed.push({ id: p.id, error: err instanceof Error ? err.message : 'unknown error' })
        }
      }

      // 207 when the batch was partly rejected, so the caller knows to retry.
      return reply.code(failed.length > 0 ? 207 : 200).send({
        ok: failed.length === 0,
        syncedCount: synced.length,
        synced,
        failed,
      })
    },
  )
}
