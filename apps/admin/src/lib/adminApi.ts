import type { ConstructionProject, Paginated, Property, Material } from '@carry/shared'

const BASE = '/api/v1'

/**
 * `adminApi.*` is called from plain page components (not hooks), but needs a
 * live Clerk session token per request. `TokenBridge` (mounted once near the
 * ClerkProvider) registers `useAuth().getToken` here so every call site below
 * stays unchanged.
 */
let getToken: (() => Promise<string | null>) | null = null
export function setTokenGetter(fn: () => Promise<string | null>) {
  getToken = fn
}

async function authFetch(path: string, init: RequestInit = {}) {
  const token = getToken ? await getToken() : null
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token ?? ''}`,
      ...(init.headers ?? {}),
    },
  })
  if (res.status === 401 || res.status === 403) throw new Error('unauthorized')
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

  async getUploadSignature(): Promise<{ signature: string; timestamp: number; apiKey: string; cloudName: string; folder: string }> {
    const res = await authFetch('/uploads/sign')
    return res.json()
  },

  async listMaterials(): Promise<Material[]> {
    const res = await fetch(`${BASE}/materials`)
    return (await res.json()).data
  },

  async createMaterial(data: Record<string, unknown>): Promise<Material> {
    const res = await authFetch('/materials', { method: 'POST', body: JSON.stringify(data) })
    return res.json()
  },

  async deleteMaterial(id: string): Promise<void> {
    await authFetch(`/materials/${id}`, { method: 'DELETE' })
  },
}
