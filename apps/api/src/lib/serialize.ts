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
  amenities: string
  images: string
}

export function serializeProperty(p: PropertyRow) {
  return {
    ...p,
    amenities: parseJson<string[]>(p.amenities, []),
    images: parseJson<string[]>(p.images, []),
  }
}

type ProjectRow = Record<string, unknown> & {
  processStages: string
  beforeImages: string
  afterImages: string
  stageImages: string
}

export function serializeProject(p: ProjectRow) {
  return {
    ...p,
    processStages: parseJson<{ title: string; body: string }[]>(p.processStages, []),
    beforeImages: parseJson<string[]>(p.beforeImages, []),
    afterImages: parseJson<string[]>(p.afterImages, []),
    stageImages: parseJson<string[]>(p.stageImages, []),
  }
}
