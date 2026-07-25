// Canonical marketplace category taxonomy, grouped by build life-cycle phase.
// `role` (ServiceProvider) and `category` (Material) are free-text columns in the DB —
// these lists are the single source of truth for admin/web dropdowns and filters,
// replacing the previously duplicated, drifted hardcoded arrays in each app.

export const PHASES = ['construction', 'finishing', 'post_construction', 'event'] as const
export type Phase = (typeof PHASES)[number]

export const PHASE_LABELS: Record<Phase, string> = {
  construction: 'Construction',
  finishing: 'Finishing',
  post_construction: 'Post-Construction',
  event: 'Housewarming & Events',
}

export const SERVICE_PROVIDER_ROLES: Record<Phase, string[]> = {
  construction: [
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
  ],
  finishing: [
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
  ],
  post_construction: [
    'Landscaping / Gardener',
    'CCTV & Security System Installer',
    'Broadband / DTH Installer',
    'Pest Control Service',
    'Deep-Cleaning Service',
    'Completion Certificate Liaison',
    'Property Tax Assessment',
    'Home Insurance Agent',
    'Packers & Movers',
  ],
  event: [
    'Pandit / Purohit',
    'Tent House',
    'Caterer / Halwai',
    'Decorator',
    'Photographer / Videographer',
    'Invitation Cards / Digital Invites',
    'Sound System / DJ',
  ],
}

export const MATERIAL_CATEGORIES: Record<Exclude<Phase, 'event'>, string[]> = {
  construction: ['Cement', 'Steel', 'Bricks', 'Sand', 'Aggregate', 'RMC (Ready-Mix Concrete)', 'Other'],
  finishing: [
    'Flooring',
    'Tile / Marble / Granite',
    'Glass & Hardware',
    'Sanitaryware & CP Fittings',
    'Other',
  ],
  post_construction: ['Furniture & Furnishing', 'Other'],
}

export const EQUIPMENT_CATEGORIES = ['Earthmoving', 'Concrete', 'Scaffolding', 'Lifting', 'Power Tools', 'Other']
