/**
 * Verbatim copy of `Data collection/packages/shared/src/constants.ts`.
 * Kept local for the same reason as ./types.ts — see the note there.
 * If the Field Ops lists change, this file must follow.
 */

export const SKILL_TYPES = [
  // Construction phase
  'Contractor',
  'Civil Engineer',
  'Architect',
  'Labour',
  'Mason',
  'Earthwork / JCB Contractor',
  'Bar Bending / Steel Fixing Team',
  'Shuttering (Centering) Contractor',
  'Borewell / Tubewell Contractor',
  'Water Tanker Supplier',
  'Anti-Termite Treatment Service',
  'Waterproofing Contractor',
  'Site Security / Chowkidar',
  // Finishing phase
  'Plumber',
  'Electrician',
  'Electricity Board Liaison',
  'Painter',
  'Carpenter',
  'Modular Kitchen Company',
  'Flooring Mason',
  'Fabricator',
  'UPVC / Aluminium Window Vendor',
  'POP / False Ceiling Contractor',
  'Solar Installer',
  'Inverter / Genset Vendor',
  'RO / Water Purifier Installer',
  'Septic Tank / Soak Pit Contractor',
  'Rainwater Harvesting Installer',
  // Post-construction phase
  'Landscaping / Gardener',
  'CCTV & Security System Installer',
  'Broadband / DTH Installer',
  'Pest Control Service',
  'Deep-Cleaning Service',
  'Completion Certificate Liaison',
  'Property Tax Assessment',
  'Home Insurance Agent',
  'Packers & Movers',
  'Other',
] as const

export type SkillType = typeof SKILL_TYPES[number]

export const PROJECT_CATEGORIES = [
  'Turnkey Villa',
  'Renovation',
  'Interior',
  'Commercial Build',
] as const

export const PROPERTY_TYPES    = ['Apartment', 'Villa', 'Plot', 'Commercial']    as const
export const LISTING_TYPES     = ['Sale', 'Resale', 'Under Construction', 'Rent'] as const
export const PROPERTY_STATUSES = ['Ready', 'Under Construction']                  as const
export const FURNISHING_TYPES  = ['Unfurnished', 'Semi-Furnished', 'Furnished']  as const
export const PACKAGE_TIERS     = ['Basic', 'Premium', 'Luxury']                  as const
export const GENDERS           = ['Male', 'Female', 'Other']                     as const
export const REVIEW_STATUSES   = ['pending', 'reviewed', 'deleted']              as const

export const PREFERRED_TENANT_TYPES = ['Family', 'Bachelor', 'Company', 'Any'] as const
export const PLOT_ALLOWED_USE_TYPES = ['Residential', 'Commercial', 'Agriculture', 'Any'] as const

// BHK options for the chip selector
export const BHK_OPTIONS = [1, 2, 3, 4, 5] as const

// Price label formatter — converts raw INR to display label
export function formatPriceLabel(priceInr: number): string {
  if (priceInr >= 10_000_000) {
    return `₹${(priceInr / 10_000_000).toFixed(2)} Cr`
  }
  if (priceInr >= 100_000) {
    return `₹${(priceInr / 100_000).toFixed(2)} L`
  }
  return `₹${priceInr.toLocaleString('en-IN')}`
}

// Shop type suggestions (agent can type any free-text value)
export const SHOP_TYPES = [
  // Construction phase
  'Cement',
  'Steel',
  'Bricks',
  'Sand',
  'Aggregate',
  'RMC (Ready-Mix Concrete)',
  // Finishing phase
  'Flooring',
  'Tile / Marble / Granite',
  'Glass & Hardware',
  'Sanitaryware & CP Fittings',
  // Post-construction phase
  'Furniture & Furnishing',
  'Other',
] as const

export type ShopType = typeof SHOP_TYPES[number]
