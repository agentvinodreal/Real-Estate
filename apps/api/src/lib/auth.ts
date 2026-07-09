import type { FastifyReply, FastifyRequest } from 'fastify'
import { createClerkClient, verifyToken } from '@clerk/backend'

const secretKey = process.env.CLERK_SECRET_KEY ?? ''
const clerkClient = createClerkClient({ secretKey })

/**
 * Admin guard for write routes. Verifies a Clerk session token (sent as
 * `Authorization: Bearer <token>` by both apps/admin and apps/web), then
 * requires `publicMetadata.role === 'admin'` on the signed-in user.
 *
 * Promote a user to admin with: tsx apps/api/scripts/set-admin-role.ts <email>
 */
export async function verifyAdmin(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!token || !secretKey) {
    return reply.code(401).send({ error: 'Unauthorized' })
  }

  try {
    const payload = await verifyToken(token, { secretKey })
    const user = await clerkClient.users.getUser(payload.sub)
    if (user.publicMetadata?.role !== 'admin') {
      return reply.code(403).send({ error: 'Forbidden' })
    }
  } catch {
    return reply.code(401).send({ error: 'Unauthorized' })
  }
}
