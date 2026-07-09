import { useEffect, useState, type FormEvent } from 'react'
import { adminApi } from '../lib/adminApi'
import type { Material } from '@carry/shared'

const field = 'w-full border border-ink/20 bg-bone px-3 py-2.5 text-sm text-ink focus:border-ochre focus:outline-none'
const label = 'font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete'

const emptyForm = {
  name: '',
  brand: '',
  category: '',
  description: '',
}

export default function Materials() {
  const [items, setItems] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function load() {
    setLoading(true)
    adminApi.listMaterials().then(setItems).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function remove(id: string) {
    if (!confirm('Delete this material?')) return
    await adminApi.deleteMaterial(id)
    setItems((xs) => xs.filter((x) => x.id !== id))
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const sigData = await adminApi.getUploadSignature()
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
      setImageUrl(data.secure_url)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to upload image.')
    } finally {
      setUploading(false)
    }
  }

  async function create(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')

    try {
      await adminApi.createMaterial({
        name: form.name,
        brand: form.brand,
        category: form.category,
        description: form.description || null,
        imageUrl: imageUrl || null,
      })
      setForm(emptyForm)
      setImageUrl('')
      setShowForm(false)
      load()
    } catch {
      setError('Could not create material. Check all fields and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Raw Materials</h1>
          <p className="mt-1 text-sm text-concrete">{items.length} materials in showcase catalog</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-ink px-5 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-bone hover:bg-ochre-dark cursor-pointer"
        >
          {showForm ? 'Close' : '+ New material'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="mb-8 grid grid-cols-2 gap-4 border border-ink/10 bg-bone-dim/40 p-6 shadow-sm">
          <div>
            <label className={label}>Material Name</label>
            <input required className={field} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="TMT Steel Fe 550D" />
          </div>
          <div>
            <label className={label}>Brand</label>
            <input required className={field} value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} placeholder="Tata Tiscon" />
          </div>
          <div className="col-span-2">
            <label className={label}>Category</label>
            <input required className={field} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="Structural Steel (or Cement, Glass, Bricks)" />
          </div>
          <div className="col-span-2">
            <label className={label}>Description</label>
            <textarea className={`${field} min-h-[80px]`} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>

          {/* Material Image Upload */}
          <div className="col-span-2 border-t border-ink/5 pt-4 my-2">
            <label className={label}>Material Photo</label>
            <div className="mt-1.5 flex items-center gap-4">
              <label className="cursor-pointer bg-ink/5 border border-ink/20 px-4 py-2 font-mono text-[0.65rem] uppercase tracking-wider text-ink-soft hover:border-ink hover:text-ink">
                {uploading ? 'Uploading…' : 'Upload Image'}
                <input type="file" accept="image/*" disabled={uploading} onChange={handleFileUpload} className="hidden" />
              </label>
              {imageUrl && (
                <div className="relative h-14 w-16 border border-ink/10 overflow-hidden bg-bone-dim">
                  <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {error && <p className="col-span-2 text-xs text-ochre-dark font-mono">{error}</p>}

          <div className="col-span-2 flex gap-3 border-t border-ink/5 pt-4">
            <button type="submit" disabled={busy} className="bg-ink px-6 py-3 font-mono text-xs uppercase tracking-[0.15em] text-bone hover:bg-ochre-dark disabled:opacity-60 cursor-pointer">
              {busy ? 'Saving…' : 'Create material'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="border border-ink/25 px-6 py-3 font-mono text-xs uppercase tracking-[0.15em] text-ink hover:border-ochre cursor-pointer">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <p className="font-mono text-sm text-concrete animate-pulse">Loading Materials Showcase…</p>
        </div>
      ) : items.length === 0 ? (
        <p className="border border-dashed border-ink/20 p-10 text-center text-ink-soft bg-bone-dim/30">
          No materials registered yet. Click "+ New material" to start building your catalog.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <div
              key={m.id}
              className="flex flex-col justify-between border border-ink/10 bg-bone p-5 hover:border-ink/20 shadow-sm transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-sans text-base font-semibold text-ink leading-snug">
                      {m.name}
                    </h3>
                    <p className="font-mono text-[0.6rem] text-concrete uppercase tracking-wider mt-0.5">
                      Brand: {m.brand}
                    </p>
                  </div>
                  <span className="font-mono text-[0.6rem] bg-ink/5 px-2 py-0.5 uppercase tracking-wider text-ink-soft whitespace-nowrap">
                    {m.category}
                  </span>
                </div>

                {m.imageUrl && (
                  <div className="mt-3 aspect-[16/10] w-full border border-ink/5 overflow-hidden bg-bone-dim/30">
                    <img src={m.imageUrl} alt={m.name} className="h-full w-full object-cover" />
                  </div>
                )}

                {m.description && (
                  <p className="mt-3 text-xs text-ink-soft leading-relaxed">
                    {m.description}
                  </p>
                )}
              </div>

              <div className="mt-5 flex items-center justify-end border-t border-ink/5 pt-3">
                <button
                  onClick={() => remove(m.id)}
                  className="font-mono text-xs uppercase tracking-[0.12em] text-ochre-dark hover:text-ink transition-colors cursor-pointer"
                >
                  Delete material
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
