// Helpers to (de)serialize the JSON-string fields so the API always sends/receives
// real arrays/objects while the DB stores portable JSON strings.

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

type PropertyRow = Record<string, unknown> & {
  amenities: string[]
  images: string[]
}

export function serializeProperty(p: PropertyRow) {
  return {
    ...p,
    amenities: Array.isArray(p.amenities) ? p.amenities : [],
    images: Array.isArray(p.images) ? p.images : [],
  }
}

type ProjectRow = Record<string, unknown> & {
  processStages: string
  beforeImages: string[]
  afterImages: string[]
  stageImages: string[]
}

export function serializeProject(p: ProjectRow) {
  return {
    ...p,
    processStages: parseJson<{ title: string; body: string }[]>(p.processStages, []),
    beforeImages: Array.isArray(p.beforeImages) ? p.beforeImages : [],
    afterImages: Array.isArray(p.afterImages) ? p.afterImages : [],
    stageImages: Array.isArray(p.stageImages) ? p.stageImages : [],
  }
}
