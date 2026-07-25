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

      // Fallback/Mock geocoding for development (covers standard locales in Patna)
      const queryLower = q.toLowerCase()
      let lat = 25.5941
      let lng = 85.1376
      let formattedAddress = `${q}, Patna, Bihar, India`

      if (queryLower.includes('danapur')) {
        lat = 25.6200
        lng = 85.0400
      } else if (queryLower.includes('boring road') || queryLower.includes('boringroad')) {
        lat = 25.6178
        lng = 85.1226
      } else if (queryLower.includes('kankarbagh')) {
        lat = 25.5900
        lng = 85.1500
      } else if (queryLower.includes('patliputra')) {
        lat = 25.6320
        lng = 85.1100
      } else if (queryLower.includes('raja bazar') || queryLower.includes('rajabazar')) {
        lat = 25.6080
        lng = 85.0930
      } else if (queryLower.includes('bailey road') || queryLower.includes('baileyroad')) {
        lat = 25.6110
        lng = 85.0800
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
