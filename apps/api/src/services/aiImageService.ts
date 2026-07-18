import { Buffer } from 'node:buffer'
import { generateImage } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

export interface ImageGenerationResult {
  imageBuffer: Buffer;
  mimeType: string;
  model: string;
  estimatedCostUsd: number;
}

// Dynamic Unsplash placeholder selection depending on the design style/features in the prompt.
// The real render is a modern furnished interior, so placeholders are interior shots too.
function getDynamicFallbackImage(prompt: string): string {
  const promptLower = prompt.toLowerCase()

  if (promptLower.includes('traditional') || promptLower.includes('indian')) {
    // Warm traditional-styled living interior
    return 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80'
  }
  if (promptLower.includes('vastu')) {
    // Bright, warm, airy living space
    return 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80'
  }
  if (promptLower.includes('minimalist')) {
    // Clean minimalist interior
    return 'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?auto=format&fit=crop&w=800&q=80'
  }
  if (promptLower.includes('open-plan')) {
    // Open-concept living, dining and kitchen
    return 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80'
  }

  // Default modern contemporary furnished living room
  return 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'
}

export async function generateFloorPlanImage(prompt: string): Promise<ImageGenerationResult> {
  const gatewayKey = process.env.AI_GATEWAY_API_KEY
  const gatewayUrl = process.env.AI_GATEWAY_URL
  const openrouterKey = process.env.OPENROUTER_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  // 1. Try Vercel AI Gateway (Recommended for Dev/Test)
  if (gatewayKey && gatewayUrl) {
    try {
      console.log('Generating image via Vercel AI Gateway...')
      const gatewayOpenAI = createOpenAI({
        apiKey: gatewayKey,
        baseURL: gatewayUrl,
      })
      const modelName = process.env.AI_GATEWAY_IMAGE_MODEL || 'google/imagen-4.0-generate-001'

      const { image } = await generateImage({
        model: gatewayOpenAI.image(modelName),
        prompt: prompt,
      })

      const base64Bytes = image.base64
      if (base64Bytes) {
        return {
          imageBuffer: Buffer.from(base64Bytes, 'base64'),
          mimeType: 'image/png',
          model: `vercel-gateway:${modelName}`,
          estimatedCostUsd: 0.04,
        }
      }
    } catch (err: any) {
      console.error('Failed to generate image via Vercel AI Gateway:', err)
      // Fall through to OpenRouter / direct keys
    }
  }

  // 2. Try OpenRouter (Production / Fallback)
  if (openrouterKey) {
    try {
      console.log('Generating image via OpenRouter...')
      const model = process.env.OPENROUTER_IMAGE_MODEL || 'google/gemini-2.5-flash-image'
      
      const openrouter = createOpenAI({
        apiKey: openrouterKey,
        baseURL: 'https://openrouter.ai/api/v1',
      })

      const { image } = await generateImage({
        model: openrouter.image(model),
        prompt: prompt,
      })

      const base64Bytes = image.base64
      if (base64Bytes) {
        return {
          imageBuffer: Buffer.from(base64Bytes, 'base64'),
          mimeType: 'image/png',
          model: model,
          estimatedCostUsd: 0.03,
        }
      }
    } catch (err: any) {
      console.error('Failed to generate image via OpenRouter:', err)
      // Fall through
    }
  }

  // 3. Try Direct Gemini Key
  if (geminiKey) {
    try {
      console.log('Generating image via direct Gemini API...')
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${geminiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: { text: prompt },
            imageGenerationConfig: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '1:1',
            },
          }),
        }
      )

      if (response.ok) {
        const data = (await response.json()) as any
        const base64Bytes = data.generatedImages?.[0]?.image?.imageBytes
        if (base64Bytes) {
          return {
            imageBuffer: Buffer.from(base64Bytes, 'base64'),
            mimeType: 'image/jpeg',
            model: 'gemini-imagen-3',
            estimatedCostUsd: 0.03,
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to generate image via direct Gemini API:', err)
    }
  }

  // 4. Try Direct OpenAI Key
  if (openaiKey) {
    try {
      console.log('Generating image via direct OpenAI API...')
      const directOpenAI = createOpenAI({
        apiKey: openaiKey,
      })

      const { image } = await generateImage({
        model: directOpenAI.image('dall-e-3'),
        prompt: prompt,
      })

      const base64Bytes = image.base64
      if (base64Bytes) {
        return {
          imageBuffer: Buffer.from(base64Bytes, 'base64'),
          mimeType: 'image/png',
          model: 'dall-e-3',
          estimatedCostUsd: 0.04,
        }
      }
    } catch (err: any) {
      console.error('Failed to generate image via direct OpenAI API:', err)
    }
  }

  // Fallback / Mock behavior if no keys exist or all providers failed
  console.warn('All image providers failed or no keys are configured. Using context-sensitive dynamic placeholder image.')
  
  const placeholderUrl = getDynamicFallbackImage(prompt)
  try {
    const placeholderResponse = await fetch(placeholderUrl)
    if (placeholderResponse.ok) {
      const arrayBuffer = await placeholderResponse.arrayBuffer()
      return {
        imageBuffer: Buffer.from(arrayBuffer),
        mimeType: 'image/jpeg',
        model: 'dev-mock-placeholder',
        estimatedCostUsd: 0,
      }
    }
  } catch (err) {
    console.error('Failed to fetch high-quality placeholder image:', err)
  }

  // Final 1x1 fallback if fetch fails
  const MOCK_FLOOR_PLAN_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  return {
    imageBuffer: Buffer.from(MOCK_FLOOR_PLAN_BASE64, 'base64'),
    mimeType: 'image/png',
    model: 'dev-mock-1x1',
    estimatedCostUsd: 0,
  }
}
