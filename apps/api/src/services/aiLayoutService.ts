import type { FloorPlanInputs } from '../services/promptBuilder.js'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

export interface RoomRect {
  id: string
  label: string
  category: 'living' | 'kitchen' | 'bedroom' | 'bathroom' | 'extra' | 'outdoor'
  x: number
  y: number
  width: number
  height: number
  areaSqft: number
  zone: string
  zoneLabel: string
}

export interface FloorPlanLayout {
  plotWidthFt: number
  plotHeightFt: number
  rooms: RoomRect[]
}

const STYLE_ASPECT: Record<string, number> = {
  modern: 1.35,
  traditional: 1.1,
  vastu: 1.2,
  minimalist: 1.4,
  'open-plan': 1.45,
}

export async function generate2DLayout(
  inputs: FloorPlanInputs,
  specialRequirements: string
): Promise<FloorPlanLayout> {
  const { bhk, areaSqft, style, facing, floor, extras } = inputs
  const aspect = STYLE_ASPECT[style] ?? 1.3
  const plotWidthFt = Math.sqrt(areaSqft * aspect)
  const plotHeightFt = areaSqft / plotWidthFt

  const prompt = `You are an expert Indian residential architect designing a 2D floor plan layout.
Inputs:
- BHK: ${bhk}
- Area: ${areaSqft} sqft
- Style: ${style}
- Facing: ${facing}
- Floor: ${floor}
- Extras: ${extras.join(', ')}
- User Special Requirements: "${specialRequirements}"

The plot dimensions are:
- Width: ${plotWidthFt.toFixed(1)} ft
- Height: ${plotHeightFt.toFixed(1)} ft

Your task is to position and size rooms to tile this plot area exactly.

You MUST return a JSON object matching this TypeScript structure:
{
  "plotWidthFt": number,
  "plotHeightFt": number,
  "rooms": [
    {
      "id": string, // Unique identifier e.g. "living", "kitchen", "bed1", "bath1", "pooja", "balcony"
      "label": string, // Display name e.g. "Living Room", "Kitchen", "Master Bedroom", "Attached Bath", "Pooja Room", etc.
      "category": "living" | "kitchen" | "bedroom" | "bathroom" | "extra" | "outdoor",
      "x": number, // X coordinate in feet from top-left (0 to plotWidthFt)
      "y": number, // Y coordinate in feet from top-left (0 to plotHeightFt)
      "width": number, // width of room in feet
      "height": number, // height of room in feet
      "areaSqft": number, // room area (width * height)
      "zone": string, // Vastu zone direction (e.g. "NE", "SE", "SW", "NW", "NC", "SC", "MW", "ME", "MC")
      "zoneLabel": string // Vastu direction label (e.g. "Northeast", "Southeast", "Southwest", "Northwest", "North", "South", "West", "East", "Center")
    }
  ]
}

Layout guidelines:
1. Ensure the rooms TILE the plot area exactly. There should be NO overlaps and NO gaps between rooms.
2. The coordinates (x, y) represent the top-left corner of each room, starting at (0, 0) up to (plotWidthFt, plotHeightFt).
3. The sum of width/height segments along rows/columns must align. Typically, the plot is divided into 2 or 3 rows, and each row contains 2 or 3 rooms side by side.
4. Adhere to Vastu Shastra if style is 'vastu' or 'traditional' (e.g. Master Bedroom in SW, Kitchen in SE, Bathrooms in NW/West, Pooja Room in NE).
5. Modify the room layout, dimensions, or relative positioning based on the User Special Requirements (e.g., if they ask for a "massive master bedroom" or "open kitchen next to living room", adjust the sizes/layout accordingly).
6. Return ONLY the raw JSON object. Do not wrap it in markdown code blocks (\`\`\`json) or include any surrounding conversational text.`

  const gatewayKey = process.env.AI_GATEWAY_API_KEY
  const gatewayUrl = process.env.AI_GATEWAY_URL
  const openrouterKey = process.env.OPENROUTER_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  // 1. Try Vercel AI Gateway (Recommended for Dev/Test)
  if (gatewayKey && gatewayUrl) {
    try {
      console.log('Generating 2D layout via Vercel AI Gateway...')
      const gatewayOpenAI = createOpenAI({
        apiKey: gatewayKey,
        baseURL: gatewayUrl,
      })
      const modelName = process.env.AI_GATEWAY_TEXT_MODEL || 'google/gemini-2.5-flash'

      const { text } = await generateText({
        model: gatewayOpenAI(modelName),
        prompt: prompt,
      })

      if (text) {
        const layout = JSON.parse(text)
        if (layout.rooms && layout.rooms.length > 0) return layout
      }
    } catch (err: any) {
      console.warn('Failed to generate 2D layout via Vercel AI Gateway:', err)
      // Fall through
    }
  }

  // 2. Try OpenRouter (Production / Fallback)
  if (openrouterKey) {
    try {
      console.log('Generating 2D layout via OpenRouter...')
      const model = process.env.OPENROUTER_TEXT_MODEL || 'google/gemini-2.5-flash'
      
      const openrouter = createOpenAI({
        apiKey: openrouterKey,
        baseURL: 'https://openrouter.ai/api/v1',
      })

      const { text } = await generateText({
        model: openrouter(model),
        prompt: prompt,
      })

      if (text) {
        const layout = JSON.parse(text)
        if (layout.rooms && layout.rooms.length > 0) return layout
      }
    } catch (err: any) {
      console.warn('Failed to generate 2D layout via OpenRouter:', err)
      // Fall through
    }
  }

  // 3. Try Direct Gemini API
  if (geminiKey) {
    try {
      console.log('Generating 2D layout via direct Gemini API...')
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          }),
        }
      )

      if (response.ok) {
        const data = await response.json() as any
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) {
          const layout = JSON.parse(text)
          if (layout.rooms && layout.rooms.length > 0) return layout
        }
      }
    } catch (err: any) {
      console.warn('Failed to generate 2D layout via direct Gemini API:', err)
    }
  }

  // 4. Try Direct OpenAI API
  if (openaiKey) {
    try {
      console.log('Generating 2D layout via direct OpenAI API...')
      const directOpenAI = createOpenAI({
        apiKey: openaiKey,
      })

      const { text } = await generateText({
        model: directOpenAI('gpt-4o-mini'),
        prompt: prompt,
      })

      if (text) {
        const layout = JSON.parse(text)
        if (layout.rooms && layout.rooms.length > 0) return layout
      }
    } catch (err: any) {
      console.warn('Failed to generate 2D layout via direct OpenAI API:', err)
    }
  }

  // Fallback / Mock Behavior if all providers failed or no keys are configured
  console.warn('Using mock AI layout generation fallback.')
  return generateMockCustomLayout(plotWidthFt, plotHeightFt, inputs, specialRequirements)
}

function generateMockCustomLayout(
  w: number,
  h: number,
  inputs: FloorPlanInputs,
  reqs: string
): FloorPlanLayout {
  const rooms: RoomRect[] = []
  const halfW = w / 2
  const halfH = h / 2

  if (inputs.bhk === 1) {
    rooms.push({
      id: 'living',
      label: reqs.toLowerCase().includes('living') ? 'Living Room (Customized)' : 'Living Room',
      category: 'living',
      x: 0,
      y: 0,
      width: halfW,
      height: h,
      areaSqft: halfW * h,
      zone: 'NE',
      zoneLabel: 'Northeast',
    })
    rooms.push({
      id: 'bed1',
      label: reqs.toLowerCase().includes('bed') ? 'Master Bedroom (Customized)' : 'Master Bedroom',
      category: 'bedroom',
      x: halfW,
      y: 0,
      width: halfW,
      height: halfH,
      areaSqft: halfW * halfH,
      zone: 'SW',
      zoneLabel: 'Southwest',
    })
    rooms.push({
      id: 'kitchen',
      label: 'Kitchen',
      category: 'kitchen',
      x: halfW,
      y: halfH,
      width: halfW / 2,
      height: halfH,
      areaSqft: (halfW / 2) * halfH,
      zone: 'SE',
      zoneLabel: 'Southeast',
    })
    rooms.push({
      id: 'bath1',
      label: 'Bathroom',
      category: 'bathroom',
      x: halfW + halfW / 2,
      y: halfH,
      width: halfW / 2,
      height: halfH,
      areaSqft: (halfW / 2) * halfH,
      zone: 'NW',
      zoneLabel: 'Northwest',
    })
  } else {
    // 2BHK+ Mock
    rooms.push({
      id: 'living',
      label: 'Living Room',
      category: 'living',
      x: 0,
      y: 0,
      width: w,
      height: halfH,
      areaSqft: w * halfH,
      zone: 'NC',
      zoneLabel: 'North',
    })
    rooms.push({
      id: 'bed1',
      label: 'Master Bedroom',
      category: 'bedroom',
      x: 0,
      y: halfH,
      width: halfW,
      height: halfH,
      areaSqft: halfW * halfH,
      zone: 'SW',
      zoneLabel: 'Southwest',
    })
    rooms.push({
      id: 'bed2',
      label: 'Bedroom 2',
      category: 'bedroom',
      x: halfW,
      y: halfH,
      width: halfW / 2,
      height: halfH / 2,
      areaSqft: (halfW / 2) * (halfH / 2),
      zone: 'NE',
      zoneLabel: 'Northeast',
    })
    rooms.push({
      id: 'kitchen',
      label: 'Kitchen',
      category: 'kitchen',
      x: halfW,
      y: halfH + halfH / 2,
      width: halfW / 2,
      height: halfH / 2,
      areaSqft: (halfW / 2) * (halfH / 2),
      zone: 'SE',
      zoneLabel: 'Southeast',
    })
  }

  return {
    plotWidthFt: w,
    plotHeightFt: h,
    rooms,
  }
}
