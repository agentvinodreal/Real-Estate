import type {
  ConstructionProject,
  LeadInput,
  Paginated,
  Property,
  Testimonial,
  Material,
  BlogPost,
  ServiceProvider,
  EquipmentRental,
} from './types'

const BASE = ((import.meta as any).env?.VITE_API_URL || '') + '/api/v1'

let getToken: (() => Promise<string | null>) | null = null
export function setTokenGetter(fn: () => Promise<string | null>) {
  getToken = fn
}

async function authFetch(path: string, init: RequestInit = {}) {
  const token = getToken ? await getToken() : null
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token ?? ''}`,
  }
  if (init.body) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...init.headers,
    },
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res
}

async function getJson<T>(path: string): Promise<T> {
  // Always hit the network so admin additions/deletions surface immediately —
  // never serve a stale cached list.
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store' })
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

  geocode(q: string): Promise<{ lat: number; lng: number; formattedAddress: string; provider: string }> {
    return getJson(`/geocode?q=${encodeURIComponent(q)}`)
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

  async submitTestimonial(body: Omit<Testimonial, 'id'>): Promise<Testimonial> {
    const res = await fetch(`${BASE}/testimonials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`Could not submit testimonial (${res.status})`)
    return res.json() as Promise<Testimonial>
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

  listMaterials(filters: { category?: string } = {}): Promise<{ data: Material[] }> {
    const params = new URLSearchParams()
    if (filters.category) params.set('category', filters.category)
    const qs = params.toString()
    return getJson<{ data: Material[] }>(`/materials${qs ? `?${qs}` : ''}`)
  },

  listServiceProviders(filters: { role?: string; city?: string; q?: string } = {}): Promise<{ data: ServiceProvider[] }> {
    const params = new URLSearchParams()
    if (filters.role) params.set('role', filters.role)
    if (filters.city) params.set('city', filters.city)
    if (filters.q) params.set('q', filters.q)
    const qs = params.toString()
    return getJson<{ data: ServiceProvider[] }>(`/service-providers${qs ? `?${qs}` : ''}`)
  },

  listEquipmentRentals(filters: { category?: string } = {}): Promise<{ data: EquipmentRental[] }> {
    const params = new URLSearchParams()
    if (filters.category) params.set('category', filters.category)
    const qs = params.toString()
    return getJson<{ data: EquipmentRental[] }>(`/equipment-rentals${qs ? `?${qs}` : ''}`)
  },

  listBlogPosts(): Promise<{ data: BlogPost[] }> {
    return getJson<{ data: BlogPost[] }>('/blog')
  },

  getBlogPost(slug: string): Promise<BlogPost> {
    return getJson<BlogPost>(`/blog/${slug}`)
  },

  async listMyLeads(): Promise<{ data: any[] }> {
    const res = await authFetch('/leads/my')
    return res.json()
  },
}
