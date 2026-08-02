/**
 * Field Ops data shapes, mirroring `Data collection/packages/shared/src/types.ts`.
 *
 * Copied rather than imported: both repos publish a workspace package named
 * `@carry/shared`, and both export a `Property` with a different shape, so the
 * two cannot coexist in one workspace. The names here are prefixed where they
 * would otherwise shadow the website's own types.
 *
 * If the Field Ops Prisma schema changes, this file must follow.
 */

// ── Enums ──────────────────────────────────────────────────────────────

export type PropertyType   = 'Apartment' | 'Villa' | 'Plot' | 'Commercial'
export type ListingType    = 'Sale' | 'Resale' | 'Under Construction' | 'Rent'
export type PropertyStatus = 'Ready' | 'Under Construction'
export type FurnishingType = 'Unfurnished' | 'Semi-Furnished' | 'Furnished'
export type ReviewStatus   = 'pending' | 'reviewed' | 'deleted'
export type SkillLevel     = 'Skilled' | 'Non-Skilled'
export type PackageTier    = 'Basic' | 'Premium' | 'Luxury'
export type Gender         = 'Male' | 'Female' | 'Other'
export type AgentStatus    = 'active' | 'revoked'

// ── Models ─────────────────────────────────────────────────────────────

export interface FieldOpsAgent {
  id:          string
  clerkUserId: string
  name:        string
  email:       string
  phone?:      string
  age?:        number
  status:      AgentStatus
  createdAt:   string
  updatedAt:   string
}

/** Agent summary embedded in list responses. */
export type AgentRef = Pick<FieldOpsAgent, 'id' | 'name' | 'email'>

export interface FieldOpsProperty {
  id:           string
  title:        string
  propertyType: PropertyType
  listingType:  ListingType
  bhk?:         number
  priceInr:     number
  priceLabel:   string          // pre-formatted "₹1.35 Cr"
  areaSqft?:    number
  locality:     string
  city:         string
  address?:     string
  reraNumber?:  string
  status:       PropertyStatus
  furnishing?:  FurnishingType
  description?: string
  // Owner contact — internal use only, never sent to the public website
  ownerName?:   string
  ownerPhone?:  string
  images:       string[]        // Cloudinary public IDs
  floorPlanUrl?: string         // single Cloudinary public ID
  lat?:         number
  lng?:         number
  reviewStatus: ReviewStatus
  published?:   boolean
  agentId:      string
  agent?:       AgentRef
  createdAt:    string
  updatedAt:    string

  // Rent-specific fields (all optional)
  securityDeposit?:    number
  availableFrom?:      string   // ISO date string
  preferredTenant?:    string   // 'Family' | 'Bachelor' | 'Company' | 'Any'
  petFriendly?:        boolean
  maintenanceCharges?: number
  leaseDuration?:      number
  lockInPeriod?:       number
  camCharges?:         number
  plotAllowedUse?:     string   // 'Residential' | 'Commercial' | 'Agriculture' | 'Any'
}

export interface FieldOpsProject {
  id:             string
  title:          string
  category:       string
  location:       string
  areaSqft?:      number
  durationMonths?: number
  packageTier?:   PackageTier
  description?:   string
  beforeImages:   string[]      // Cloudinary public IDs
  afterImages:    string[]
  stageImages:    string[]
  reviewStatus:   ReviewStatus
  published?:     boolean
  agentId:        string
  agent?:         AgentRef
  createdAt:      string
  updatedAt:      string
}

export interface Labour {
  id:              string
  fullName:        string
  age:             number
  gender:          Gender
  skillLevel:      SkillLevel
  skillType?:      string        // only if Skilled
  phone:           string
  profilePhotoUrl?: string       // Cloudinary public ID
  minimumWage?:    number        // minimum wage per day in INR
  houseNo?:        string
  street?:         string
  locality?:       string
  city?:           string
  pincode?:        string
  reviewStatus:    ReviewStatus
  agentId:         string
  agent?:          AgentRef
  createdAt:       string
  updatedAt:       string
}

export interface Shop {
  id:           string
  shopName:     string
  shopType:     string             // free-text: "Cement", "Bricks", etc.
  keeperName:   string
  keeperPhone:  string
  address?:     string
  lat?:         number
  lng?:         number
  images?:      string[]
  reviewStatus: ReviewStatus
  agentId:      string
  agent?:       AgentRef
  createdAt:    string
  updatedAt:    string
}

// ── API Responses ──────────────────────────────────────────────────────

export interface Paginated<T> {
  data:  T[]
  total: number
  page:  number
  limit: number
}
