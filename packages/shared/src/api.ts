import type {
  ConstructionProject,
  LeadInput,
  Paginated,
  Property,
  Testimonial,
} from './types'

const BASE = '/api/v1'

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json() as Promise<T>
}

export type PropertyFilters = {
  listingType?: string
  propertyType?: string
  bhk?: string
  city?: string
  locality?: string
  status?: string
  minPrice?: string
  maxPrice?: string
  q?: string
  sort?: string
  page?: string
  limit?: string
}

export const api = {
  listProperties(filters: PropertyFilters = {}): Promise<Paginated<Property>> {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(filters)) {
      if (v) params.set(k, v)
    }
    const qs = params.toString()
    return getJson<Paginated<Property>>(`/properties${qs ? `?${qs}` : ''}`)
  },

  getProperty(slug: string): Promise<Property> {
    return getJson<Property>(`/properties/${slug}`)
  },

  listConstruction(): Promise<{ data: ConstructionProject[] }> {
    return getJson<{ data: ConstructionProject[] }>('/construction-projects')
  },

  getConstruction(slug: string): Promise<ConstructionProject> {
    return getJson<ConstructionProject>(`/construction-projects/${slug}`)
  },

  listTestimonials(): Promise<{ data: Testimonial[] }> {
    return getJson<{ data: Testimonial[] }>('/testimonials')
  },

  async createLead(body: LeadInput): Promise<{ id: string; status: string }> {
    const res = await fetch(`${BASE}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`Could not submit enquiry (${res.status})`)
    return res.json()
  },
}
