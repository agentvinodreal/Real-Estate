export type ListingType = 'Sale' | 'Resale' | 'Under Construction'
export type PropertyType = 'Apartment' | 'Villa' | 'Plot' | 'Commercial'

export type Property = {
  id: string
  slug: string
  title: string
  listingType: ListingType
  propertyType: PropertyType
  bhk: number | null
  priceInr: number
  priceLabel: string
  areaSqft: number
  carpetAreaSqft: number | null
  builtupAreaSqft: number | null
  city: string
  locality: string
  address: string | null
  lat: number | null
  lng: number | null
  status: string
  furnishing: string | null
  reraNumber: string | null
  description: string | null
  amenities: string[]
  images: string[]
  floorPlanUrl: string | null
  videoUrl: string | null
  featured: boolean
  published: boolean
}

export type ProcessStage = { title: string; body: string }

export type ConstructionProject = {
  id: string
  slug: string
  title: string
  category: string
  location: string
  areaSqft: number | null
  durationMonths: number | null
  packageTier: string | null
  description: string | null
  processStages: ProcessStage[]
  beforeImages: string[]
  afterImages: string[]
  stageImages: string[]
}

export type Testimonial = {
  id: string
  name: string
  location: string | null
  rating: number
  quote: string
  avatarUrl: string | null
}

export type Paginated<T> = { data: T[]; total: number; page: number; limit: number }

export type LeadInput = {
  name: string
  phone: string
  email?: string
  message?: string
  sourcePage?: string
  propertyId?: string
  projectId?: string
}
