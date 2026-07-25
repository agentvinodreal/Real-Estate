/**
 * Fallback stock/category photos for marketplace listings (service providers,
 * materials, equipment) that don't have an admin-uploaded imageUrl yet.
 * Shared between the web and admin apps so both render the same image for
 * the same listing.
 */

export const SERVICEMAN_IMAGES: Record<string, string> = {
  Plumber: '/plumber.png',
  Electrician: '/electrician.png',
  Painter: '/painter.png',
  Carpenter: '/carpenter.png',
  Mason: '/mason.png',
  Contractor: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=800&q=80',
  'Civil Engineer': 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80',
  Architect: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  Labour: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
  'Earthwork / JCB Contractor': '/excavator.png',
  'Bar Bending / Steel Fixing Team': '/steel.png',
  'Shuttering (Centering) Contractor': '/scaffolding.png',
  'Borewell / Tubewell Contractor': 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80',
  'Water Tanker Supplier': '/water_tanker.png',
  'Anti-Termite Treatment Service': '/termite_treatment.jpg',
  'Waterproofing Contractor': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
  'Site Security / Chowkidar': '/site_security.jpg',
  'Electricity Board Liaison': '/power_liaison.jpg',
  'Modular Kitchen Company': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
  'Flooring Mason': 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=800&q=80',
  Fabricator: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
  'UPVC / Aluminium Window Vendor': '/upvc_window.jpg',
  'POP / False Ceiling Contractor': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
  'Solar Installer': '/solar_panel.jpg',
  'Inverter / Genset Vendor': 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=800&q=80',
  'RO / Water Purifier Installer': '/ro_purifier.jpg',
  'Septic Tank / Soak Pit Contractor': '/septic_tank.jpg',
  'Rainwater Harvesting Installer': '/rainwater_harvesting.jpg',
  'Landscaping / Gardener': 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80',
  'CCTV & Security System Installer': '/cctv_security.jpg',
  'Broadband / DTH Installer': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
  'Pest Control Service': '/pest_control.jpg',
  'Deep-Cleaning Service': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
  'Completion Certificate Liaison': '/building_permit.jpg',
  'Property Tax Assessment': 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
  'Home Insurance Agent': '/home_insurance.jpg',
  'Packers & Movers': '/packers_movers.jpg',
  'Pandit / Purohit': 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80',
  'Tent House': 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
  'Caterer / Halwai': 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
  Decorator: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
  'Photographer / Videographer': 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80',
  'Invitation Cards / Digital Invites': 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
  'Sound System / DJ': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
}

export const MATERIAL_IMAGES: Record<string, string> = {
  Cement: '/cement.png',
  Steel: '/steel.png',
  Bricks: '/bricks.png',
  Sand: '/sand.png',
  Aggregate: '/aggregate.png',
  'RMC (Ready-Mix Concrete)': '/ready_mix_concrete_v2.jpg',
  'Tile / Marble / Granite': '/rajasthan_white_marble.jpg',
  'Glass & Hardware': '/toughened_glass_hardware_v2.jpg',
  'Sanitaryware & CP Fittings': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
  Flooring: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=800&q=80',
  'Furniture & Furnishing': '/furniture_curtains.jpg',
}

export function getServicemanImage(role: string, name?: string): string {
  if (SERVICEMAN_IMAGES[role]) return SERVICEMAN_IMAGES[role]
  const lowerRole = role.toLowerCase()
  const lowerName = (name || '').toLowerCase()

  if (lowerRole.includes('plumb') || lowerName.includes('plumb')) return '/plumber.png'
  if (lowerRole.includes('electr') || lowerName.includes('electr')) return '/electrician.png'
  if (lowerRole.includes('paint') || lowerName.includes('paint')) return '/painter.png'
  if (lowerRole.includes('carpent') || lowerName.includes('wood')) return '/carpenter.png'
  if (lowerRole.includes('mason') || lowerRole.includes('tile')) return '/mason.png'
  if (lowerRole.includes('engineer') || lowerRole.includes('structur')) return SERVICEMAN_IMAGES['Civil Engineer']
  if (lowerRole.includes('architect') || lowerRole.includes('design')) return SERVICEMAN_IMAGES['Architect']
  if (lowerRole.includes('jcb') || lowerRole.includes('earth')) return '/excavator.png'
  if (lowerRole.includes('steel') || lowerRole.includes('rebar')) return '/steel.png'
  if (lowerRole.includes('shutter') || lowerRole.includes('centering')) return '/scaffolding.png'
  if (lowerRole.includes('solar')) return SERVICEMAN_IMAGES['Solar Installer']
  if (lowerRole.includes('clean')) return SERVICEMAN_IMAGES['Deep-Cleaning Service']
  if (lowerRole.includes('pest')) return SERVICEMAN_IMAGES['Pest Control Service']
  if (lowerRole.includes('cctv') || lowerRole.includes('secur')) return SERVICEMAN_IMAGES['CCTV & Security System Installer']
  if (lowerRole.includes('water') || lowerRole.includes('tanker') || lowerName.includes('water')) return SERVICEMAN_IMAGES['Water Tanker Supplier']
  if (lowerRole.includes('kitchen')) return SERVICEMAN_IMAGES['Modular Kitchen Company']
  if (lowerRole.includes('pack') || lowerRole.includes('move')) return SERVICEMAN_IMAGES['Packers & Movers']

  return 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80'
}

export function getMaterialImage(category: string, name?: string): string {
  const lowerCat = category.toLowerCase()
  const lowerName = (name || '').toLowerCase()

  if (lowerName.includes('toughened glass') || lowerName.includes('glass & door') || lowerName.includes('door hardware')) return '/toughened_glass_hardware_v2.jpg'
  if (lowerName.includes('rajasthan white marble') || lowerName.includes('white marble') || lowerName.includes('makrana')) return '/rajasthan_white_marble.jpg'
  if (lowerName.includes('m25') || lowerName.includes('ready-mix concrete') || lowerName.includes('rmc')) return '/ready_mix_concrete_v2.jpg'
  if (lowerName.includes('living room furniture') || lowerName.includes('curtain set') || lowerName.includes('furniture & curtain')) return '/furniture_curtains.jpg'

  if (MATERIAL_IMAGES[category]) return MATERIAL_IMAGES[category]

  if (lowerCat.includes('cement') || lowerName.includes('cement')) return '/cement.png'
  if (lowerCat.includes('steel') || lowerName.includes('steel') || lowerName.includes('tmt')) return '/steel.png'
  if (lowerCat.includes('brick') || lowerName.includes('brick')) return '/bricks.png'
  if (lowerCat.includes('sand') || lowerName.includes('sand')) return '/sand.png'
  if (lowerCat.includes('aggregate') || lowerName.includes('stone') || lowerName.includes('metal')) return '/aggregate.png'
  if (lowerCat.includes('concrete') || lowerCat.includes('rmc')) return '/ready_mix_concrete_v2.jpg'
  if (lowerCat.includes('tile') || lowerCat.includes('marble') || lowerCat.includes('granite')) return '/rajasthan_white_marble.jpg'
  if (lowerCat.includes('glass') || lowerCat.includes('hardware')) return '/toughened_glass_hardware_v2.jpg'
  if (lowerCat.includes('sanitary') || lowerCat.includes('cp') || lowerName.includes('wc') || lowerName.includes('basin')) return MATERIAL_IMAGES['Sanitaryware & CP Fittings']
  if (lowerCat.includes('floor')) return MATERIAL_IMAGES['Flooring']
  if (lowerCat.includes('furniture') || lowerCat.includes('furnish')) return '/furniture_curtains.jpg'

  return 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80'
}

export function getEquipmentImage(name: string, category?: string): string {
  const n = (name + ' ' + (category || '')).toLowerCase()
  if (n.includes('excavator') || n.includes('jcb') || n.includes('earthmoving')) return '/excavator.png'
  if (n.includes('mixer') || n.includes('concrete')) return '/mixer.png'
  if (n.includes('scaffold') || n.includes('shuttering')) return '/scaffolding.png'
  if (n.includes('crane') || n.includes('lifting')) return '/crane.png'
  if (n.includes('drill') || n.includes('tool') || n.includes('power')) return 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'
  return 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80'
}
