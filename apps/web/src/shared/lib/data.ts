// Dummy content — swap for real listings/projects/photos later.

export const CONTACT = {
  phone: '+91 870 036 5768',
  whatsapp: '918700365768', // digits only for wa.me
  email: 'murlimurliktr007@gmail.com',
  city: 'Katihar, Bihar',
  address: 'Carry Construction HQ, New Market, Katihar, Bihar, 854105',
  instagram: 'https://instagram.com/carryconstruction',
}

export const SERVICES = [
  {
    id: '01',
    title: 'Buy a Home',
    body: 'Curated apartments, villas, and plots — new and ready-to-move — with transparent pricing.',
    tag: 'Sale',
  },
  {
    id: '02',
    title: 'Resale & Advisory',
    body: 'Sell or buy in the secondary market with fair valuations, legal due-diligence, and end-to-end paperwork support.',
    tag: 'Resale',
  },
  {
    id: '03',
    title: 'Construction Services',
    body: 'Turnkey design-to-execution — architecture, structure, interiors, and project management under one accountable team.',
    tag: 'Build',
  },
]

export const PROCESS = [
  { step: '01', title: 'Consultation', body: 'We understand your budget, site, and vision — and set clear expectations.' },
  { step: '02', title: 'Design', body: 'Architecture and 3D plans crafted around how you actually live and work.' },
  { step: '03', title: 'Approvals', body: 'We handle sanctions and statutory paperwork so you don’t have to.' },
  { step: '04', title: 'Construction', body: 'Quality materials, fixed timelines, and stage-wise updates you can track.' },
  { step: '05', title: 'Handover', body: 'A finished, inspected home — delivered on schedule with a service warranty.' },
]

export const TESTIMONIALS = [
  {
    quote:
      'Carry Construction handled our villa from the first drawing to the final coat of paint. Zero surprises, delivered on time.',
    name: 'Rohan & Meera Kulkarni',
    location: 'Danapur, Patna',
  },
  {
    quote:
      'They found us a resale flat, negotiated well, and sorted every document. It felt genuinely transparent.',
    name: 'Aditya Sharma',
    location: 'Boring Road, Patna',
  },
  {
    quote:
      'The site updates every week meant I always knew where my money was going. Rare in this industry.',
    name: 'Fatima Shaikh',
    location: 'Kankarbagh, Patna',
  },
]

// Construction service pillars
export const PILLARS = [
  { id: '01', title: 'Architecture & Design', body: 'Concept, 3D visualisation, and working drawings shaped around how you live.' },
  { id: '02', title: 'Structural Construction', body: 'RCC frame, masonry, and finishing with quality-graded materials.' },
  { id: '03', title: 'Interiors & Fit-out', body: 'Modular kitchens, wardrobes, false ceilings, lighting, and furnishing.' },
  { id: '04', title: 'Project Management', body: 'One accountable team handling approvals, timelines, budget, and handover.' },
]

// Per-sq-ft construction packages (indicative)
export const PACKAGES = [
  {
    tier: 'Basic',
    price: '₹1,750 / sq ft',
    highlight: false,
    features: ['Standard structural spec', 'Vitrified tile flooring', 'Branded CP & sanitary', 'Emulsion paint', '1-year service warranty'],
  },
  {
    tier: 'Premium',
    price: '₹2,400 / sq ft',
    highlight: true,
    features: ['Enhanced structural spec', 'Premium tiles + wooden flooring option', 'Modular kitchen', 'Designer lighting', '3-year service warranty'],
  },
  {
    tier: 'Luxury',
    price: '₹3,600 / sq ft',
    highlight: false,
    features: ['Custom architecture', 'Imported marble & finishes', 'Full home automation', 'Landscape & facade design', '5-year service warranty'],
  },
]
