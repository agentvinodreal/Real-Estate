import type { FastifyInstance } from 'fastify'
import crypto from 'node:crypto'
import { verifyAdmin } from '../lib/auth.js'

export default async function uploadsRoutes(app: FastifyInstance) {
  app.get(
    '/uploads/sign',
    {
      preHandler: verifyAdmin,
      schema: {
        tags: ['System'],
        summary: 'Generate signed upload signature for Cloudinary (admin)',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME
      const apiKey = process.env.CLOUDINARY_API_KEY
      const apiSecret = process.env.CLOUDINARY_API_SECRET

      if (!cloudName || !apiKey || !apiSecret) {
        return reply.code(500).send({
          error: 'Cloudinary environment variables CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET are not configured on the server.',
        })
      }

      const timestamp = Math.round(new Date().getTime() / 1000)
      const folder = 'properties'

      // Construct signing string sorted alphabetically by keys: folder=properties&timestamp=<timestamp>
      const parameterString = `folder=${folder}&timestamp=${timestamp}`
      
      // Calculate HMAC/SHA1 signature
      const signature = crypto
        .createHash('sha1')
        .update(parameterString + apiSecret)
        .digest('hex')

      return {
        signature,
        timestamp,
        apiKey,
        cloudName,
        folder,
      }
    },
  )
}
