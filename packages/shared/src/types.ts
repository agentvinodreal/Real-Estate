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
  published?: boolean
  createdAt?: string
}

export type BlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  coverImage: string | null
  body: string
  metaTitle: string | null
  metaDescription: string | null
  published: boolean
  createdAt: string
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
  marketplaceType?: 'Material' | 'Equipment' | 'ServiceProvider'
  itemId?: string
  itemQty?: number
}

export type Material = {
  id: string
  name: string
  category: string
  brand: string
  description: string | null
  imageUrl: string | null
  price: number | null
  unit: string | null
  available: boolean
  createdAt: string
}

export type ServiceProvider = {
  id: string
  name: string
  role: 'Contractor' | 'Civil Engineer' | 'Architect' | 'Labour'
  phone: string
  email: string | null
  city: string
  locality: string | null
  experienceYears: number | null
  rating: number | null
  profilePhotoUrl: string | null
  description: string | null
  specialties: string[]
  minimumRate: number | null
  rateUnit: string | null
  reviewStatus: string
  createdAt: string
}

export type EquipmentRental = {
  id: string
  name: string
  category: string
  rentPerDay: number
  imageUrl: string | null
  description: string | null
  specs: string[]
  available: boolean
  createdAt: string
}
