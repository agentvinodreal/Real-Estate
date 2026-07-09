import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, formatInr } from '@carry/shared'
import { adminApi } from '../lib/adminApi'

const empty = {
  id: '',
  title: '',
  slug: '',
  listingType: 'Sale',
  propertyType: 'Apartment',
  bhk: '',
  priceInr: '',
  areaSqft: '',
  carpetAreaSqft: '',
  builtupAreaSqft: '',
  city: 'Pune',
  locality: '',
  status: 'ready',
  furnishing: '',
  reraNumber: '',
  description: '',
  amenities: '',
  featured: false,
  published: true,
}

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const field = 'w-full border border-ink/20 bg-bone px-3 py-2.5 text-sm text-ink focus:border-ochre focus:outline-none'
const label = 'font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete'

export default function PropertyForm() {
  const { slug } = useParams<{ slug: string }>()
  const isEdit = slug && slug !== 'new'
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    api.getProperty(slug!).then((p) => {
      setForm({
        id: p.id,
        title: p.title,
        slug: p.slug,
        listingType: p.listingType,
        propertyType: p.propertyType,
        bhk: p.bhk?.toString() ?? '',
        priceInr: p.priceInr.toString(),
        areaSqft: p.areaSqft.toString(),
        carpetAreaSqft: p.carpetAreaSqft?.toString() ?? '',
        builtupAreaSqft: p.builtupAreaSqft?.toString() ?? '',
        city: p.city,
        locality: p.locality,
        status: p.status,
        furnishing: p.furnishing ?? '',
        reraNumber: p.reraNumber ?? '',
        description: p.description ?? '',
        amenities: p.amenities.join(', '),
        featured: p.featured,
        published: p.published,
      })
    })
  }, [slug, isEdit])

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const priceInr = Number(form.priceInr)
    const payload: Record<string, unknown> = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      listingType: form.listingType,
      propertyType: form.propertyType,
      bhk: form.bhk ? Number(form.bhk) : null,
      priceInr,
      priceLabel: formatInr(priceInr),
      areaSqft: Number(form.areaSqft),
      carpetAreaSqft: form.carpetAreaSqft ? Number(form.carpetAreaSqft) : null,
      builtupAreaSqft: form.builtupAreaSqft ? Number(form.builtupAreaSqft) : null,
      city: form.city,
      locality: form.locality,
      status: form.status,
      furnishing: form.furnishing || null,
      reraNumber: form.reraNumber || null,
      description: form.description || null,
      amenities: form.amenities.split(',').map((a) => a.trim()).filter(Boolean),
      featured: form.featured,
      published: form.published,
    }
    try {
      if (isEdit) await adminApi.updateProperty(form.id, payload)
      else await adminApi.createProperty(payload)
      navigate('/properties')
    } catch {
      setError('Could not save. Check the fields and try again.')
      setBusy(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-semibold text-ink">{isEdit ? 'Edit property' : 'New property'}</h1>

      <form onSubmit={onSubmit} className="mt-6 grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={label}>Title</label>
          <input required className={field} value={form.title} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div>
          <label className={label}>Slug (auto if blank)</label>
          <input className={field} value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder={slugify(form.title)} />
        </div>
        <div>
          <label className={label}>Listing type</label>
          <select className={field} value={form.listingType} onChange={(e) => set('listingType', e.target.value)}>
            {['Sale', 'Resale', 'Under Construction'].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Property type</label>
          <select className={field} value={form.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
            {['Apartment', 'Villa', 'Plot', 'Commercial'].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Status</label>
          <select className={field} value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="ready">Ready to move</option>
            <option value="under_construction">Under construction</option>
          </select>
        </div>
        <div>
          <label className={label}>BHK</label>
          <input className={field} type="number" value={form.bhk} onChange={(e) => set('bhk', e.target.value)} />
        </div>
        <div>
          <label className={label}>Price (₹)</label>
          <input required className={field} type="number" value={form.priceInr} onChange={(e) => set('priceInr', e.target.value)} />
        </div>
        <div>
          <label className={label}>Total area (sq ft)</label>
          <input required className={field} type="number" value={form.areaSqft} onChange={(e) => set('areaSqft', e.target.value)} />
        </div>
        <div>
          <label className={label}>Carpet area (sq ft)</label>
          <input className={field} type="number" value={form.carpetAreaSqft} onChange={(e) => set('carpetAreaSqft', e.target.value)} />
        </div>
        <div>
          <label className={label}>Built-up area (sq ft)</label>
          <input className={field} type="number" value={form.builtupAreaSqft} onChange={(e) => set('builtupAreaSqft', e.target.value)} />
        </div>
        <div>
          <label className={label}>City</label>
          <input required className={field} value={form.city} onChange={(e) => set('city', e.target.value)} />
        </div>
        <div>
          <label className={label}>Locality</label>
          <input required className={field} value={form.locality} onChange={(e) => set('locality', e.target.value)} />
        </div>
        <div>
          <label className={label}>Furnishing</label>
          <input className={field} value={form.furnishing} onChange={(e) => set('furnishing', e.target.value)} />
        </div>
        <div>
          <label className={label}>RERA number</label>
          <input className={field} value={form.reraNumber} onChange={(e) => set('reraNumber', e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className={label}>Amenities (comma separated)</label>
          <input className={field} value={form.amenities} onChange={(e) => set('amenities', e.target.value)} placeholder="Clubhouse, Gym, Parking" />
        </div>
        <div className="col-span-2">
          <label className={label}>Description</label>
          <textarea className={`${field} min-h-[100px]`} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} /> Featured
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} /> Published
        </label>

        {error && <p className="col-span-2 text-sm text-ochre-dark">{error}</p>}

        <div className="col-span-2 flex gap-3">
          <button type="submit" disabled={busy} className="bg-ink px-6 py-3 font-mono text-xs uppercase tracking-[0.15em] text-bone hover:bg-ochre-dark disabled:opacity-60">
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create property'}
          </button>
          <button type="button" onClick={() => navigate('/properties')} className="border border-ink/25 px-6 py-3 font-mono text-xs uppercase tracking-[0.15em] text-ink hover:border-ochre">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
