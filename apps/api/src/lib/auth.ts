import type { FastifyReply, FastifyRequest } from 'fastify'

/**
 * Admin guard for write routes.
 *
 * DEV: checks `Authorization: Bearer <ADMIN_API_KEY>` so the API is usable
 * immediately without Firebase set up.
 *
 * PRODUCTION: swap the body of this function to verify a Firebase ID token:
 *
 *   import { getAuth } from 'firebase-admin/auth'
 *   const decoded = await getAuth().verifyIdToken(token)
 *   if (!decoded.admin) throw new Error('not admin')   // custom claim
 *
 * The admin dashboard sends the Firebase user's ID token as the Bearer token,
 * so the route contract does not change.
 */
export async function verifyAdmin(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const expected = process.env.ADMIN_API_KEY

  if (!expected || token !== expected) {
    return reply.code(401).send({ error: 'Unauthorized' })
  }
}
