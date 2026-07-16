import { Buffer } from 'node:buffer'

export interface ImageGenerationResult {
  imageBuffer: Buffer;
  mimeType: string;
  model: string;
  estimatedCostUsd: number;
}

// A fallback base64 encoded simple mock floor plan image (transparent grid or outline)
// so developers can test the page without needing expensive API keys.
const MOCK_FLOOR_PLAN_BASE64 = 
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="; // 1x1 pixel fallback or a nice default image

export async function generateFloorPlanImage(prompt: string): Promise<ImageGenerationResult> {
  const openrouterKey = process.env.OPENROUTER_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  if (openrouterKey) {
    try {
      const model = process.env.OPENROUTER_IMAGE_MODEL || 'google/gemini-2.5-flash-image'
      const response = await fetch('https://openrouter.ai/api/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openrouterKey}`,
          'HTTP-Referer': 'https://carryconstruction.com',
          'X-Title': 'Carry Construction',
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          n: 1,
          response_format: 'b64_json',
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let parsed: any = {}
        try { parsed = JSON.parse(errorText) } catch {}
        // 402 = no credits, 404 = model not found — fall through to next provider silently
        if (response.status === 402 || response.status === 404) {
          console.warn(`OpenRouter skipped (${response.status}): ${parsed?.error?.message ?? errorText}`)
        } else {
          throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
        }
      } else {
        const data = (await response.json()) as any
        const base64Bytes = data.data?.[0]?.b64_json
        if (!base64Bytes) {
          throw new Error('No image bytes returned from OpenRouter API')
        }

        return {
          imageBuffer: Buffer.from(base64Bytes, 'base64'),
          mimeType: 'image/png',
          model: model,
          estimatedCostUsd: 0.03,
        }
      }
    } catch (err: any) {
      console.error('Failed to generate image via OpenRouter:', err)
      throw new Error(`AI Image Generation (OpenRouter) failed: ${err.message}`)
    }
  }

  if (geminiKey) {
    try {
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

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Gemini Imagen API error: ${response.status} - ${errorText}`)
      }

      const data = (await response.json()) as any
      const base64Bytes = data.generatedImages?.[0]?.image?.imageBytes
      if (!base64Bytes) {
        throw new Error('No image bytes returned from Gemini Imagen API')
      }

      return {
        imageBuffer: Buffer.from(base64Bytes, 'base64'),
        mimeType: 'image/jpeg',
        model: 'gemini-imagen-3',
        estimatedCostUsd: 0.03,
      }
    } catch (err: any) {
      console.error('Failed to generate image via Gemini:', err)
      throw new Error(`AI Image Generation (Gemini) failed: ${err.message}`)
    }
  }

  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          response_format: 'b64_json',
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
      }

      const data = (await response.json()) as any
      const base64Bytes = data.data?.[0]?.b64_json
      if (!base64Bytes) {
        throw new Error('No image bytes returned from OpenAI API')
      }

      return {
        imageBuffer: Buffer.from(base64Bytes, 'base64'),
        mimeType: 'image/png',
        model: 'dall-e-3',
        estimatedCostUsd: 0.04,
      }
    } catch (err: any) {
      console.error('Failed to generate image via OpenAI:', err)
      throw new Error(`AI Image Generation (OpenAI) failed: ${err.message}`)
    }
  }

  // Fallback / Mock behavior if no keys exist
  console.warn('None of OPENROUTER_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY is set. Using a static development mock image — every generation will look identical regardless of input.')
  
  // We can fetch a nice placeholder floor plan from a public URL to make the mock look realistic!
  try {
    const placeholderResponse = await fetch('https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80')
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

  return {
    imageBuffer: Buffer.from(MOCK_FLOOR_PLAN_BASE64, 'base64'),
    mimeType: 'image/png',
    model: 'dev-mock-1x1',
    estimatedCostUsd: 0,
  }
}
