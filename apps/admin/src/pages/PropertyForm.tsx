import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, formatInr } from '@carry/shared'
import { adminApi } from '../lib/adminApi'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? 'piwpzbke'

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
  city: 'Patna',
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

  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

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
      setImages(p.images ?? [])
    })
  }, [slug, isEdit])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError('')

    try {
      const sigData = await adminApi.getUploadSignature()

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        const formData = new FormData()
        formData.append('file', file)
        formData.append('api_key', sigData.apiKey)
        formData.append('timestamp', String(sigData.timestamp))
        formData.append('signature', sigData.signature)
        formData.append('folder', sigData.folder)

        const res = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error?.message || 'Cloudinary upload failed')
        }

        const data = await res.json()
        setImages((prev) => [...prev, data.secure_url])
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to upload one or more images. Please configure your Cloudinary environment keys.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function setHero(index: number) {
    if (index === 0) return
    setImages((prev) => {
      const copy = [...prev]
      const [item] = copy.splice(index, 1)
      copy.unshift(item)
      return copy
    })
  }

  function deleteImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

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
      images,
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

        {/* Cloudinary Gallery Section */}
        <div className="col-span-2 border-t border-ink/10 pt-6">
          <h2 className="font-display text-xl font-semibold text-ink">Property Gallery</h2>
          
          <div className="mt-3 flex items-center justify-center border border-dashed border-ink/30 bg-bone-dim p-6 text-center">
            <div>
              <p className="text-sm text-ink-soft">
                {uploading ? 'Uploading to Cloudinary...' : 'Upload multiple photos directly to Cloudinary'}
              </p>
              <label className="mt-3 inline-block cursor-pointer bg-ink px-4 py-2 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bone hover:bg-ochre-dark transition-colors">
                {uploading ? 'Uploading…' : 'Select Files'}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={uploading}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((imgUrl, idx) => {
                const isHero = idx === 0
                return (
                  <div key={imgUrl} className={`group relative aspect-[4/3] border overflow-hidden bg-bone-dim ${isHero ? 'border-ochre shadow-md ring-1 ring-ochre' : 'border-ink/10'}`}>
                    <img
                      src={imgUrl.startsWith('http') ? imgUrl : `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto,f_auto/${imgUrl}`}
                      alt={`Gallery item ${idx}`}
                      className="h-full w-full object-cover"
                    />
                    
                    {isHero && (
                      <span className="absolute left-1.5 top-1.5 bg-ochre px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-bone">
                        Hero
                      </span>
                    )}

                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/65 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {!isHero && (
                        <button
                          type="button"
                          onClick={() => setHero(idx)}
                          className="bg-bone text-ochre px-2.5 py-1 text-[0.6rem] font-mono uppercase tracking-wider transition-colors hover:bg-ochre hover:text-bone"
                        >
                          Make Hero
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteImage(idx)}
                        className="bg-bone text-ink px-2.5 py-1 text-[0.6rem] font-mono uppercase tracking-wider transition-colors hover:bg-red-700 hover:text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

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
