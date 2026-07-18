import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { verifyUser } from '../lib/auth.js'
import { checkRateLimit } from '../services/rateLimiter.js'
import { buildVisualizationPrompt, type FloorPlanInputs } from '../services/promptBuilder.js'
import { generateFloorPlanImage } from '../services/aiImageService.js'
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../services/cloudinary.js'
import { generate2DLayout } from '../services/aiLayoutService.js'

export default async function homeDesignerRoutes(app: FastifyInstance) {
  
  // ── GET USER QUOTA / REMAINING GENERATIONS ────────────────────────
  app.get(
    '/home-designer/quota',
    {
      preHandler: verifyUser,
      schema: {
        tags: ['Home Designer'],
        summary: 'Get remaining daily AI 3D visualization generations for logged-in user',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request) => {
      const userId = (request as any).user.sub
      const status = await checkRateLimit(userId)
      return status
    }
  )

  // ── GET USER'S SAVED FLOOR PLANS ──────────────────────────────────
  app.get(
    '/home-designer/my-plans',
    {
      preHandler: verifyUser,
      schema: {
        tags: ['Home Designer'],
        summary: 'List user\'s generated AI 3D visualizations',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request) => {
      const userId = (request as any).user.sub
      const plans = await prisma.floorPlanGeneration.findMany({
        where: {
          userId,
          status: 'completed',
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          inputs: true,
          imageUrl: true,
          status: true,
          createdAt: true,
        },
      })
      return plans
    }
  )

  // ── GET SINGLE FLOOR PLAN ─────────────────────────────────────────
  app.get(
    '/home-designer/:id',
    {
      preHandler: verifyUser,
      schema: {
        tags: ['Home Designer'],
        summary: 'Get details of a single generated AI 3D visualization',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = (request as any).user.sub
      const { id } = request.params as { id: string }

      const plan = await prisma.floorPlanGeneration.findFirst({
        where: {
          id,
          userId,
        },
        select: {
          id: true,
          inputs: true,
          imageUrl: true,
          status: true,
          createdAt: true,
        },
      })

      if (!plan) {
        return reply.code(404).send({ error: 'Floor plan not found' })
      }

      return plan
    }
  )

  // ── GENERATE A NEW FLOOR PLAN ──────────────────────────────────────
  app.post(
    '/home-designer/generate',
    {
      preHandler: verifyUser,
      schema: {
        tags: ['Home Designer'],
        summary: 'Generate a photorealistic AI 3D visualization of a floor plan concept',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['bhk', 'areaSqft', 'style', 'facing', 'extras', 'floor'],
          properties: {
            bhk: { type: 'integer', minimum: 1, maximum: 5 },
            areaSqft: { type: 'integer', minimum: 300, maximum: 10000 },
            style: { 
              type: 'string', 
              enum: ['modern', 'traditional', 'vastu', 'minimalist', 'open-plan'] 
            },
            facing: { type: 'string', enum: ['north', 'south', 'east', 'west'] },
            extras: { 
              type: 'array', 
              items: { type: 'string' } 
            },
            floor: { 
              type: 'string', 
              enum: ['ground', 'first', 'second', 'third', 'penthouse'] 
            },
            layout: {
              type: 'object',
              properties: {
                plotWidthFt: { type: 'number' },
                plotHeightFt: { type: 'number' },
                rooms: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      label: { type: 'string' },
                      category: { type: 'string' },
                      x: { type: 'number' },
                      y: { type: 'number' },
                      width: { type: 'number' },
                      height: { type: 'number' },
                      areaSqft: { type: 'number' },
                      zone: { type: 'string' },
                      zoneLabel: { type: 'string' },
                    }
                  }
                }
              },
              additionalProperties: true,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = (request as any).user.sub
      const inputs = request.body as FloorPlanInputs

      // 1. Double check Rate limit first
      const quota = await checkRateLimit(userId)
      if (!quota.allowed) {
        return reply.code(429).send({
          error: 'Daily generation limit reached. Resets at midnight IST.',
          code: 'RATE_LIMIT_EXCEEDED',
          resetsAt: quota.resetsAt,
          remainingToday: 0,
        })
      }

      // 2. Build detailed prompt from validated form input
      const prompt = buildVisualizationPrompt(inputs)

      // 3. Create a pending record first (for audit & error tracking)
      const record = await prisma.floorPlanGeneration.create({
        data: {
          userId,
          inputs: inputs as any,
          promptUsed: prompt,
          imageUrl: '',
          aiModel: 'initializing',
          status: 'pending',
        },
      })

      try {
        // 4. Generate the image (AI model layer)
        const { imageBuffer, model, estimatedCostUsd } = await generateFloorPlanImage(prompt)

        // 5. Upload image directly to Cloudinary
        const uploadResult = await uploadBufferToCloudinary(
          imageBuffer,
          'floor_plans',
          `fp_${record.id}`
        )

        // 6. Update DB record to completed
        await prisma.floorPlanGeneration.update({
          where: { id: record.id },
          data: {
            imageUrl: uploadResult.secure_url,
            cloudinaryId: uploadResult.public_id,
            aiModel: model,
            costUsd: estimatedCostUsd,
            status: 'completed',
          },
        })

        return {
          success: true,
          generationId: record.id,
          imageUrl: uploadResult.secure_url,
          remainingToday: quota.remaining - 1,
          inputs,
        }

      } catch (err: any) {
        // Log generation failure for retry/audit
        app.log.error(err, `Floor plan generation failed for ID: ${record.id}`)
        
        await prisma.floorPlanGeneration.update({
          where: { id: record.id },
          data: {
            status: 'failed',
            errorMessage: err.message || String(err),
          },
        })

        return reply.code(502).send({
          error: 'Floor plan generation failed. Please try again.',
          code: 'AI_SERVICE_ERROR',
        })
      }
    }
  )

  // ── GENERATE A CUSTOM AI 2D BLUEPRINT LAYOUT ──────────────────────
  app.post(
    '/home-designer/generate-2d',
    {
      preHandler: verifyUser,
      schema: {
        tags: ['Home Designer'],
        summary: 'Generate a custom AI 2D floor plan layout based on user inputs and special requirements',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['bhk', 'areaSqft', 'style', 'facing', 'extras', 'floor', 'specialRequirements'],
          properties: {
            bhk: { type: 'integer', minimum: 1, maximum: 5 },
            areaSqft: { type: 'integer', minimum: 300, maximum: 10000 },
            style: { 
              type: 'string', 
              enum: ['modern', 'traditional', 'vastu', 'minimalist', 'open-plan'] 
            },
            facing: { type: 'string', enum: ['north', 'south', 'east', 'west'] },
            extras: { 
              type: 'array', 
              items: { type: 'string' } 
            },
            floor: { 
              type: 'string', 
              enum: ['ground', 'first', 'second', 'third', 'penthouse'] 
            },
            specialRequirements: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = (request as any).user.sub
      const { bhk, areaSqft, style, facing, extras, floor, specialRequirements } = request.body as any

      const quota = await checkRateLimit(userId)
      if (!quota.allowed) {
        return reply.code(429).send({
          error: 'Daily generation limit reached. Resets at midnight IST.',
          code: 'RATE_LIMIT_EXCEEDED',
          resetsAt: quota.resetsAt,
          remainingToday: 0,
        })
      }

      try {
        const inputs = { bhk, areaSqft, style, facing, extras, floor }
        const layout = await generate2DLayout(inputs, specialRequirements)
        return {
          success: true,
          layout,
        }
      } catch (err: any) {
        app.log.error(err, 'Failed to generate 2D layout')
        return reply.code(502).send({
          error: 'AI 2D layout generation failed. Please try again.',
          code: 'AI_SERVICE_ERROR',
        })
      }
    }
  )

  // ── DELETE A FLOOR PLAN ───────────────────────────────────────────
  app.delete(
    '/home-designer/:id',
    {
      preHandler: verifyUser,
      schema: {
        tags: ['Home Designer'],
        summary: 'Delete a generated AI 3D visualization',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = (request as any).user.sub
      const { id } = request.params as { id: string }

      const plan = await prisma.floorPlanGeneration.findFirst({
        where: {
          id,
          userId,
        },
      })

      if (!plan) {
        return reply.code(404).send({ error: 'Floor plan not found' })
      }

      // If there's an image on Cloudinary, delete it
      if (plan.cloudinaryId) {
        try {
          await deleteFromCloudinary(plan.cloudinaryId)
        } catch (err) {
          app.log.error(err, `Failed to delete image ${plan.cloudinaryId} from Cloudinary`)
        }
      }

      // Delete database record
      await prisma.floorPlanGeneration.delete({
        where: { id },
      })

      return {
        success: true,
        message: 'Floor plan deleted successfully',
      }
    }
  )
}
