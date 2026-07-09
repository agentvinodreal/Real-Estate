import { useEffect, useState, type FormEvent } from 'react'
import { adminApi } from '../lib/adminApi'
import type { ConstructionProject } from '@carry/shared'

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const field = 'w-full border border-ink/20 bg-bone px-3 py-2.5 text-sm text-ink focus:border-ochre focus:outline-none'
const label = 'font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete'

const emptyForm = {
  title: '',
  category: '',
  location: '',
  areaSqft: '',
  durationMonths: '',
  packageTier: 'Premium',
  description: '',
}

export default function Projects() {
  const [items, setItems] = useState<ConstructionProject[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [beforeImages, setBeforeImages] = useState<string[]>([])
  const [afterImages, setAfterImages] = useState<string[]>([])
  const [uploading, setUploading] = useState<'before' | 'after' | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function load() {
    setLoading(true)
    adminApi.listProjects().then(setItems).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function remove(p: ConstructionProject) {
    if (!confirm(`Delete "${p.title}"?`)) return
    await adminApi.deleteProject(p.id)
    setItems((xs) => xs.filter((x) => x.id !== p.id))
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, target: 'before' | 'after') {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(target)
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
          throw new Error(errData.error?.message || 'Upload failed')
        }

        const data = await res.json()
        if (target === 'before') {
          setBeforeImages((prev) => [...prev, data.secure_url])
        } else {
          setAfterImages((prev) => [...prev, data.secure_url])
        }
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to upload images.')
    } finally {
      setUploading(null)
      e.target.value = ''
    }
  }

  async function create(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await adminApi.createProject({
        title: form.title,
        slug: slugify(form.title),
        category: form.category,
        location: form.location,
        areaSqft: form.areaSqft ? Number(form.areaSqft) : null,
        durationMonths: form.durationMonths ? Number(form.durationMonths) : null,
        packageTier: form.packageTier,
        description: form.description || null,
        beforeImages,
        afterImages,
      })
      setForm(emptyForm)
      setBeforeImages([])
      setAfterImages([])
      setShowForm(false)
      load()
    } catch {
      setError('Could not save case study. Please check the fields and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Construction Projects</h1>
          <p className="mt-1 text-sm text-concrete">{items.length} case studies</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-ink px-5 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-bone hover:bg-ochre-dark cursor-pointer"
        >
          {showForm ? 'Close' : '+ New case study'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="mb-8 grid grid-cols-2 gap-4 border border-ink/10 bg-bone-dim/40 p-6 shadow-sm">
          <div className="col-span-2">
            <label className={label}>Title</label>
            <input required className={field} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className={label}>Category</label>
            <input required className={field} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="Turnkey Villa" />
          </div>
          <div>
            <label className={label}>Location</label>
            <input required className={field} value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          </div>
          <div>
            <label className={label}>Area (sq ft)</label>
            <input className={field} type="number" value={form.areaSqft} onChange={(e) => setForm((f) => ({ ...f, areaSqft: e.target.value }))} />
          </div>
          <div>
            <label className={label}>Duration (months)</label>
            <input className={field} type="number" value={form.durationMonths} onChange={(e) => setForm((f) => ({ ...f, durationMonths: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className={label}>Description</label>
            <textarea className={`${field} min-h-[80px]`} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>

          {/* Project Images Upload */}
          <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-ink/5 pt-4 my-2">
            <div>
              <label className={label}>Before Construction Photos</label>
              <div className="mt-1 flex items-center gap-3">
                <label className="cursor-pointer bg-ink/5 border border-ink/20 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-ink-soft hover:border-ink hover:text-ink">
                  {uploading === 'before' ? 'Uploading…' : 'Select Files'}
                  <input type="file" multiple accept="image/*" disabled={!!uploading} onChange={(e) => handleFileUpload(e, 'before')} className="hidden" />
                </label>
              </div>
              {beforeImages.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {beforeImages.map((url, idx) => (
                    <img key={idx} src={url} alt="Before" className="h-10 w-12 object-cover border border-ink/10" />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className={label}>Completed Construction Photos</label>
              <div className="mt-1 flex items-center gap-3">
                <label className="cursor-pointer bg-ink/5 border border-ink/20 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-ink-soft hover:border-ink hover:text-ink">
                  {uploading === 'after' ? 'Uploading…' : 'Select Files'}
                  <input type="file" multiple accept="image/*" disabled={!!uploading} onChange={(e) => handleFileUpload(e, 'after')} className="hidden" />
                </label>
              </div>
              {afterImages.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {afterImages.map((url, idx) => (
                    <img key={idx} src={url} alt="After" className="h-10 w-12 object-cover border border-ochre/30" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <p className="col-span-2 text-xs text-ochre-dark font-mono">{error}</p>}

          <div className="col-span-2 flex gap-3 border-t border-ink/5 pt-4">
            <button type="submit" disabled={busy} className="bg-ink px-6 py-3 font-mono text-xs uppercase tracking-[0.15em] text-bone hover:bg-ochre-dark disabled:opacity-60 cursor-pointer">
              {busy ? 'Saving…' : 'Create case study'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="border border-ink/25 px-6 py-3 font-mono text-xs uppercase tracking-[0.15em] text-ink hover:border-ochre cursor-pointer">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <p className="font-mono text-sm text-concrete animate-pulse">Loading Case Studies…</p>
        </div>
      ) : items.length === 0 ? (
        <p className="border border-dashed border-ink/20 p-10 text-center text-ink-soft bg-bone-dim/30">
          No case studies found. Click "+ New case study" to create one.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <div
              key={p.id}
              className="flex flex-col justify-between border border-ink/10 bg-bone p-5 hover:border-ink/20 shadow-sm transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-sans text-lg font-semibold text-ink leading-snug">
                    {p.title}
                  </h3>
                  <span className="font-mono text-[0.65rem] bg-ink/5 px-2.5 py-0.5 uppercase tracking-wider text-ink-soft whitespace-nowrap">
                    {p.category}
                  </span>
                </div>

                <p className="mt-1 text-xs text-concrete font-mono uppercase tracking-wider">
                  {p.location}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-y-1.5 font-mono text-[0.65rem] text-ink-soft uppercase tracking-wider border-t border-ink/5 pt-3">
                  <div>Area: <span className="text-ink">{p.areaSqft ? `${p.areaSqft.toLocaleString('en-IN')} sq ft` : 'N/A'}</span></div>
                  <div>Duration: <span className="text-ink">{p.durationMonths ? `${p.durationMonths} mths` : 'N/A'}</span></div>
                  <div>Tier: <span className="text-ink">{p.packageTier ?? 'N/A'}</span></div>
                </div>

                {((p.beforeImages && p.beforeImages.length > 0) || (p.afterImages && p.afterImages.length > 0)) && (
                  <div className="mt-4 border-t border-ink/5 pt-3">
                    <span className="font-mono text-[0.55rem] text-concrete uppercase tracking-wide block mb-1.5">Showcase Photos</span>
                    <div className="flex flex-wrap gap-1.5">
                      {p.beforeImages?.map((url, idx) => (
                        <img key={`before-${idx}`} src={url} alt="Before" className="h-8 w-10 object-cover border border-ink/10" />
                      ))}
                      {p.afterImages?.map((url, idx) => (
                        <img key={`after-${idx}`} src={url} alt="After" className="h-8 w-10 object-cover border-ochre/40 border" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end border-t border-ink/5 pt-3">
                <button
                  onClick={() => remove(p)}
                  className="font-mono text-xs uppercase tracking-[0.12em] text-ochre-dark hover:text-ink transition-colors cursor-pointer"
                >
                  Delete case study
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
