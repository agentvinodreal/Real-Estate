import type { FastifyReply, FastifyRequest } from 'fastify'
import { createClerkClient, verifyToken } from '@clerk/backend'

const secretKey = process.env.CLERK_SECRET_KEY ?? ''
export const clerkClient = createClerkClient({ secretKey })

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
    
    // Check if role is present in custom session claims (Optimized Path: < 2ms)
    const role = (payload as any).role || (payload as any).metadata?.role
    if (role === 'admin') {
      return
    }

    // Fallback path if custom claims aren't set in Clerk Dashboard yet (REST API Call)
    const user = await clerkClient.users.getUser(payload.sub)
    if (user.publicMetadata?.role !== 'admin') {
      return reply.code(403).send({ error: 'Forbidden' })
    }
  } catch {
    return reply.code(401).send({ error: 'Unauthorized' })
  }
}

/**
 * User guard for standard authenticated routes. Verifies a Clerk session token
 * and attaches the decoded token payload to request.user.
 */
export async function verifyUser(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!token || !secretKey) {
    return reply.code(401).send({ error: 'Unauthorized' })
  }

  try {
    const payload = await verifyToken(token, { secretKey })
    ;(request as any).user = payload
  } catch {
    return reply.code(401).send({ error: 'Unauthorized' })
  }
}

