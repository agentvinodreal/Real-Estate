/**
 * Shared mapping from the Field Ops panel's data shape into this project's
 * schema. Used by both the live webhook (routes/sync.ts) and the manual
 * catch-up import (scripts/import-published.ts) so the two can never drift.
 *
 * Every operation here is an upsert keyed on the source `id`. Nothing deletes:
 * an unpublish arrives as `published: false` and hides the row instead.
 */
import type { PrismaClient } from '@prisma/client'

export type IncomingAgent = { id: string; name?: string; email: string }

export type IncomingProperty = Record<string, any> & {
  id: string
  title: string
  agentId?: string
  agent?: IncomingAgent
}

export type IncomingProject = Record<string, any> & {
  id: string
  title: string
  agentId?: string
  agent?: IncomingAgent
}

/** "Under Construction" | "Ready" → the enum the API and web expect. */
export function mapStatus(raw: unknown) {
  return String(raw ?? '').toLowerCase().startsWith('ready') ? 'ready' : 'under_construction'
}

export function slugify(title: string, id: string) {
  const clean = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return `${clean}-${id.slice(-4)}`
}

/**
 * Property.agentId is a required FK and the Field Ops agent won't exist here on
 * a first sync. Matches on email first, since Agent.email is unique in both
 * systems and the two use different id spaces.
 */
export async function ensureAgent(prisma: PrismaClient, agent: IncomingAgent | undefined) {
  if (!agent?.email) return null

  const existing = await prisma.agent.findFirst({
    where: { OR: [{ id: agent.id }, { email: agent.email }] },
    select: { id: true },
  })
  if (existing) return existing.id

  const created = await prisma.agent.create({
    data: {
      id: agent.id,
      name: agent.name ?? 'Field Ops Agent',
      email: agent.email,
      // The panel carries no Clerk id for us; synthesise a stable, unique one.
      clerkUserId: `fieldops_${agent.id}`,
    },
    select: { id: true },
  })
  return created.id
}

export async function upsertProperty(prisma: PrismaClient, p: IncomingProperty) {
  const agentId = (await ensureAgent(prisma, p.agent)) ?? p.agentId
  if (!agentId) throw new Error(`property "${p.title}" has no agent`)

  const fields = {
    title: p.title,
    listingType: p.listingType,
    propertyType: p.propertyType,
    bhk: p.bhk ?? null,
    priceInr: p.priceInr,
    priceLabel: p.priceLabel,
    areaSqft: p.areaSqft,
    city: p.city,
    locality: p.locality,
    address: p.address || null,
    lat: p.lat ?? null,
    lng: p.lng ?? null,
    status: mapStatus(p.status),
    furnishing: p.furnishing || null,
    reraNumber: p.reraNumber || null,
    description: p.description || null,
    floorPlanUrl: p.floorPlanUrl || null,
    reviewStatus: p.reviewStatus ?? 'pending',
    published: p.published ?? true,
    // Postgres text[] columns — real arrays, not JSON strings.
    images: p.images ?? [],
    amenities: p.amenities ?? [],
    agentId,
  }

  return prisma.property.upsert({
    where: { id: p.id },
    // Leave any existing slug alone so live URLs never shift under visitors.
    update: fields,
    create: { id: p.id, slug: slugify(p.title, p.id), ...fields },
  })
}

export async function upsertProject(prisma: PrismaClient, p: IncomingProject) {
  const agentId = (await ensureAgent(prisma, p.agent)) ?? p.agentId
  if (!agentId) throw new Error(`project "${p.title}" has no agent`)

  const fields = {
    title: p.title,
    category: p.category,
    location: p.location,
    areaSqft: p.areaSqft ?? null,
    durationMonths: p.durationMonths ?? null,
    packageTier: p.packageTier || null,
    description: p.description || null,
    reviewStatus: p.reviewStatus ?? 'pending',
    published: p.published ?? true,
    beforeImages: p.beforeImages ?? [],
    afterImages: p.afterImages ?? [],
    stageImages: p.stageImages ?? [],
    agentId,
  }

  return prisma.constructionProject.upsert({
    where: { id: p.id },
    update: fields,
    create: { id: p.id, slug: slugify(p.title, p.id), ...fields },
  })
}
