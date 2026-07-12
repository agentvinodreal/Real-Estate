import type { FastifyInstance } from 'fastify'

export default async function geocodeRoutes(app: FastifyInstance) {
  app.get(
    '/geocode',
    {
      schema: {
        tags: ['System'],
        summary: 'Geocode address using Mappls (MapmyIndia) proxy',
        querystring: {
          type: 'object',
          required: ['q'],
          properties: {
            q: { type: 'string', minLength: 2, description: 'Address or locality to geocode' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              lat: { type: 'number' },
              lng: { type: 'number' },
              formattedAddress: { type: 'string' },
              provider: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, _reply) => {
      const { q } = request.query as { q: string }
      const restKey = process.env.MAPPLS_API_KEY || process.env.MAPPLS_REST_KEY

      // If key is configured, perform geocoding via Mappls Atlas API
      if (restKey) {
        try {
          const url = `https://atlas.mappls.com/api/places/geocode?address=${encodeURIComponent(q)}&key=${restKey}`
          const res = await fetch(url)
          if (res.ok) {
            const data: any = await res.json()
            if (data?.copResults && data.copResults.length > 0) {
              const result = data.copResults[0]
              return {
                lat: Number(result.latitude),
                lng: Number(result.longitude),
                formattedAddress: result.formattedAddress || q,
                provider: 'mappls',
              }
            }
          }
        } catch (err) {
          app.log.error(err, 'Mappls Geocoding proxy error')
        }
      }

      // Fallback/Mock geocoding for development (covers standard locales in Pune)
      const queryLower = q.toLowerCase()
      let lat = 18.5204
      let lng = 73.8567
      let formattedAddress = `${q}, Pune, Maharashtra, India`

      if (queryLower.includes('baner')) {
        lat = 18.559
        lng = 73.779
      } else if (queryLower.includes('kharadi')) {
        lat = 18.551
        lng = 73.943
      } else if (queryLower.includes('wagholi')) {
        lat = 18.580
        lng = 73.980
      } else if (queryLower.includes('mundhwa')) {
        lat = 18.536
        lng = 73.916
      } else if (queryLower.includes('viman nagar')) {
        lat = 18.567
        lng = 73.914
      } else if (queryLower.includes('hinjewadi')) {
        lat = 18.591
        lng = 73.738
      }

      return {
        lat,
        lng,
        formattedAddress,
        provider: 'mock-development',
      }
    },
  )
}
