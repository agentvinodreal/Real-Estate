import type { ConstructionProject, Paginated, Property } from '@carry/shared'

const BASE = '/api/v1'
const TOKEN_KEY = 'carry_admin_token'

export const adminAuth = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

async function authFetch(path: string, init: RequestInit = {}) {
  const token = adminAuth.get()
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token ?? ''}`,
      ...(init.headers ?? {}),
    },
  })
  if (res.status === 401) throw new Error('unauthorized')
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res
}

export type Lead = {
  id: string
  name: string
  phone: string
  email: string | null
  sourcePage: string | null
  propertyId: string | null
  projectId: string | null
  message: string | null
  status: string
  createdAt: string
}

export const adminApi = {
  /** Validates the stored token by calling a protected endpoint. */
  async verify(): Promise<boolean> {
    try {
      await authFetch('/leads')
      return true
    } catch {
      return false
    }
  },

  async listLeads(): Promise<Lead[]> {
    const res = await authFetch('/leads')
    return (await res.json()).data
  },

  async setLeadStatus(id: string, status: string): Promise<void> {
    await authFetch(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
  },

  // Properties (list is public; writes are admin)
  async listProperties(): Promise<Property[]> {
    const res = await fetch(`${BASE}/properties?limit=60`)
    return ((await res.json()) as Paginated<Property>).data
  },

  async createProperty(data: Record<string, unknown>): Promise<Property> {
    const res = await authFetch('/properties', { method: 'POST', body: JSON.stringify(data) })
    return res.json()
  },

  async updateProperty(id: string, data: Record<string, unknown>): Promise<Property> {
    const res = await authFetch(`/properties/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    return res.json()
  },

  async deleteProperty(id: string): Promise<void> {
    await authFetch(`/properties/${id}`, { method: 'DELETE' })
  },

  // Construction projects
  async listProjects(): Promise<ConstructionProject[]> {
    const res = await fetch(`${BASE}/construction-projects`)
    return (await res.json()).data
  },

  async createProject(data: Record<string, unknown>): Promise<ConstructionProject> {
    const res = await authFetch('/construction-projects', { method: 'POST', body: JSON.stringify(data) })
    return res.json()
  },

  async deleteProject(id: string): Promise<void> {
    await authFetch(`/construction-projects/${id}`, { method: 'DELETE' })
  },
}
