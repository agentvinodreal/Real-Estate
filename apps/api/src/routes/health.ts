import type { FastifyInstance } from 'fastify'

export default async function healthRoutes(app: FastifyInstance) {
  app.get(
    '/health',
    {
      schema: {
        tags: ['System'],
        summary: 'Health check',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              time: { type: 'string' },
            },
          },
        },
      },
    },
    async () => ({ status: 'ok', time: new Date().toISOString() }),
  )
}
