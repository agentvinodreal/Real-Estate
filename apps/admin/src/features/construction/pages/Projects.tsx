import { useEffect, useState, type FormEvent } from 'react'
import { AnimatePresence } from 'motion/react'
import { Plus, X } from 'lucide-react'
import { adminApi } from '../../../shared/lib/adminApi'
import type { ConstructionProject } from '@carry/shared'
import { Badge, Button, Card, CardGrid, DetailModal, DetailRow, EmptyState, FormPanel, Input, Label, LoadingState, PageHeader, Textarea } from '../../../shared/components/ui'

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

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
  const [viewProject, setViewProject] = useState<ConstructionProject | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [beforeImages, setBeforeImages] = useState<string[]>([])
  const [afterImages, setAfterImages] = useState<string[]>([])
  const [stageImages, setStageImages] = useState<string[]>([])
  const [heroImage, setHeroImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState<'before' | 'after' | 'hero' | 'stage' | null>(null)
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

  function startEdit(p: ConstructionProject) {
    setEditingId(p.id)
    setForm({
      title: p.title,
      category: p.category,
      location: p.location,
      areaSqft: p.areaSqft != null ? String(p.areaSqft) : '',
      durationMonths: p.durationMonths != null ? String(p.durationMonths) : '',
      packageTier: p.packageTier ?? 'Premium',
      description: p.description ?? '',
    })
    setBeforeImages(p.beforeImages ?? [])
    setAfterImages(p.afterImages ?? [])
    setStageImages(p.stageImages ?? [])
    setHeroImage(p.heroImage ?? null)
    setError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setBeforeImages([])
    setAfterImages([])
    setStageImages([])
    setHeroImage(null)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, target: 'before' | 'after' | 'hero' | 'stage') {
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
        } else if (target === 'after') {
          setAfterImages((prev) => [...prev, data.secure_url])
        } else if (target === 'stage') {
          setStageImages((prev) => [...prev, data.secure_url])
        } else {
          setHeroImage(data.secure_url)
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

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const payload = {
      title: form.title,
      slug: slugify(form.title),
      category: form.category,
      location: form.location,
      areaSqft: form.areaSqft ? Number(form.areaSqft) : null,
      durationMonths: form.durationMonths ? Number(form.durationMonths) : null,
      packageTier: form.packageTier,
      description: form.description || null,
      heroImage,
      beforeImages,
      afterImages,
      stageImages,
    }
    try {
      if (editingId) {
        await adminApi.updateProject(editingId, payload)
      } else {
        await adminApi.createProject(payload)
      }
      closeForm()
      load()
    } catch {
      setError('Could not save case study. Please check the fields and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Construction Projects"
        subtitle={`${items.length} case studies`}
        actions={
          <Button
            variant={showForm ? 'outline' : 'primary'}
            icon={showForm ? <X className="h-3.5 w-3.5" strokeWidth={2} /> : <Plus className="h-3.5 w-3.5" strokeWidth={2} />}
            onClick={() => (showForm ? closeForm() : setShowForm(true))}
          >
            {showForm ? 'Close' : 'New case study'}
          </Button>
        }
      />

      <AnimatePresence>
        {showForm && (
          <FormPanel onSubmit={save} className="mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 -mb-2">
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete">
                  {editingId ? 'Editing case study' : 'New case study'}
                </span>
              </div>
              <div className="col-span-2">
                <Label>Title</Label>
                <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <Label>Category</Label>
                <Input required value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="Turnkey Villa" />
              </div>
              <div>
                <Label>Location</Label>
                <Input required value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
              </div>
              <div>
                <Label>Area (sq ft)</Label>
                <Input type="number" value={form.areaSqft} onChange={(e) => setForm((f) => ({ ...f, areaSqft: e.target.value }))} />
              </div>
              <div>
                <Label>Duration (months)</Label>
                <Input type="number" value={form.durationMonths} onChange={(e) => setForm((f) => ({ ...f, durationMonths: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea className="min-h-[80px]" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="col-span-2 my-2 border-t border-ink/5 pt-4">
                <Label>Hero Image</Label>
                <p className="mt-0.5 font-mono text-[0.6rem] text-concrete">Shown on the project card and detail page banner. Upload one, or pick from photos already uploaded below.</p>
                <div className="mt-2 flex items-center gap-3">
                  {heroImage && (
                    <div className="relative">
                      <img src={heroImage} alt="Hero" className="h-16 w-20 border-2 border-ochre object-cover" />
                      <button
                        type="button"
                        onClick={() => setHeroImage(null)}
                        className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-bone"
                        aria-label="Clear hero image"
                      >
                        <X className="h-2.5 w-2.5" strokeWidth={2.5} />
                      </button>
                    </div>
                  )}
                  <label className="cursor-pointer border border-ink/20 bg-ink/5 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-ink-soft hover:border-ink hover:text-ink">
                    {uploading === 'hero' ? 'Uploading…' : 'Upload New'}
                    <input type="file" accept="image/*" disabled={!!uploading} onChange={(e) => handleFileUpload(e, 'hero')} className="hidden" />
                  </label>
                </div>

                {(beforeImages.length > 0 || afterImages.length > 0) && (
                  <div className="mt-3">
                    <span className="block font-mono text-[0.55rem] uppercase tracking-wide text-concrete">Or choose from uploaded photos</span>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {[...beforeImages, ...afterImages].map((url, idx) => (
                        <button
                          type="button"
                          key={`${url}-${idx}`}
                          onClick={() => setHeroImage(url)}
                          className={`relative h-10 w-12 shrink-0 overflow-hidden border ${heroImage === url ? 'border-2 border-ochre' : 'border-ink/10 hover:border-ink/30'}`}
                        >
                          <img src={url} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="col-span-2 my-2 grid grid-cols-2 gap-4 border-t border-ink/5 pt-4">
                <div>
                  <Label>Before Construction Photos</Label>
                  <div className="mt-1 flex items-center gap-3">
                    <label className="cursor-pointer border border-ink/20 bg-ink/5 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-ink-soft hover:border-ink hover:text-ink">
                      {uploading === 'before' ? 'Uploading…' : 'Select Files'}
                      <input type="file" multiple accept="image/*" disabled={!!uploading} onChange={(e) => handleFileUpload(e, 'before')} className="hidden" />
                    </label>
                  </div>
                  {beforeImages.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {beforeImages.map((url, idx) => (
                        <img key={idx} src={url} alt="Before" className="h-10 w-12 border border-ink/10 object-cover" />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Completed Construction Photos</Label>
                  <div className="mt-1 flex items-center gap-3">
                    <label className="cursor-pointer border border-ink/20 bg-ink/5 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-ink-soft hover:border-ink hover:text-ink">
                      {uploading === 'after' ? 'Uploading…' : 'Select Files'}
                      <input type="file" multiple accept="image/*" disabled={!!uploading} onChange={(e) => handleFileUpload(e, 'after')} className="hidden" />
                    </label>
                  </div>
                  {afterImages.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {afterImages.map((url, idx) => (
                        <img key={idx} src={url} alt="After" className="h-10 w-12 border border-ochre/30 object-cover" />
                      ))}
                    </div>
                  )}
                </div>

                <div className="col-span-2">
                  <Label>On-site Progress Photos</Label>
                  <p className="mt-0.5 font-mono text-[0.6rem] text-concrete">Shown in the "On-site progress" gallery on the project detail page (e.g. foundation, structure, finishing).</p>
                  <div className="mt-1 flex items-center gap-3">
                    <label className="cursor-pointer border border-ink/20 bg-ink/5 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-ink-soft hover:border-ink hover:text-ink">
                      {uploading === 'stage' ? 'Uploading…' : 'Select Files'}
                      <input type="file" multiple accept="image/*" disabled={!!uploading} onChange={(e) => handleFileUpload(e, 'stage')} className="hidden" />
                    </label>
                  </div>
                  {stageImages.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {stageImages.map((url, idx) => (
                        <img key={idx} src={url} alt="On-site progress" className="h-10 w-12 border border-teal/40 object-cover" />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {error && <p className="col-span-2 font-mono text-xs text-ochre-dark">{error}</p>}

              <div className="col-span-2 flex gap-3 border-t border-ink/5 pt-4">
                <Button type="submit" busy={busy}>
                  {editingId ? 'Save changes' : 'Create case study'}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
              </div>
            </div>
          </FormPanel>
        )}
      </AnimatePresence>

      {loading ? (
        <LoadingState label="Loading case studies…" />
      ) : items.length === 0 ? (
        <EmptyState>No case studies found. Click "New case study" to create one.</EmptyState>
      ) : (
        <CardGrid>
          <AnimatePresence mode="popLayout">
            {items.map((p) => (
              <Card key={p.id}>
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-sans text-lg font-semibold leading-snug text-ink">{p.title}</h3>
                    <Badge tone="ink">{p.category}</Badge>
                  </div>

                  <p className="mt-1 font-mono text-xs uppercase tracking-wider text-concrete">{p.location}</p>

                  <div className="mt-4 grid grid-cols-2 gap-y-1.5 border-t border-ink/5 pt-3 font-mono text-[0.65rem] uppercase tracking-wider text-ink-soft">
                    <div>Area: <span className="text-ink">{p.areaSqft ? `${p.areaSqft.toLocaleString('en-IN')} sq ft` : 'N/A'}</span></div>
                    <div>Duration: <span className="text-ink">{p.durationMonths ? `${p.durationMonths} mths` : 'N/A'}</span></div>
                    <div>Tier: <span className="text-ink">{p.packageTier ?? 'N/A'}</span></div>
                  </div>

                  {((p.beforeImages && p.beforeImages.length > 0) || (p.afterImages && p.afterImages.length > 0) || (p.stageImages && p.stageImages.length > 0)) && (
                    <div className="mt-4 border-t border-ink/5 pt-3">
                      <span className="mb-1.5 block font-mono text-[0.55rem] uppercase tracking-wide text-concrete">Showcase Photos</span>
                      <div className="flex flex-wrap gap-1.5">
                        {p.beforeImages?.map((url, idx) => (
                          <img key={`before-${idx}`} src={url} alt="Before" className="h-8 w-10 border border-ink/10 object-cover" />
                        ))}
                        {p.afterImages?.map((url, idx) => (
                          <img key={`after-${idx}`} src={url} alt="After" className="h-8 w-10 border border-ochre/40 object-cover" />
                        ))}
                        {p.stageImages?.map((url, idx) => (
                          <img key={`stage-${idx}`} src={url} alt="On-site progress" className="h-8 w-10 border border-teal/40 object-cover" />
                        ))}
                      </div>
                      {(!p.beforeImages?.length || !p.afterImages?.length) && (
                        <p className="mt-1.5 font-mono text-[0.55rem] text-ochre-dark">
                          {!p.beforeImages?.length && !p.afterImages?.length ? 'No before/after pair — slider will show placeholders' : !p.afterImages?.length ? 'Missing "after" photo — before/after slider will show placeholders' : 'Missing "before" photo — before/after slider will show placeholders'}
                        </p>
                      )}
                      {!p.stageImages?.length && (
                        <p className="font-mono text-[0.55rem] text-ochre-dark">No on-site progress photos — that gallery will show placeholders</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-end gap-4 border-t border-ink/5 pt-3">
                  <button onClick={() => setViewProject(p)} className="cursor-pointer font-mono text-xs uppercase tracking-[0.12em] text-teal transition-colors hover:text-ink">
                    View
                  </button>
                  <button onClick={() => startEdit(p)} className="cursor-pointer font-mono text-xs uppercase tracking-[0.12em] text-ink-soft transition-colors hover:text-ink">
                    Edit
                  </button>
                  <button onClick={() => remove(p)} className="cursor-pointer font-mono text-xs uppercase tracking-[0.12em] text-ochre-dark transition-colors hover:text-ink">
                    Delete
                  </button>
                </div>
              </Card>
            ))}
          </AnimatePresence>
        </CardGrid>
      )}

      <AnimatePresence>
        {viewProject && (
          <DetailModal
            title={viewProject.title}
            imageUrl={viewProject.heroImage ?? viewProject.afterImages?.[0] ?? viewProject.beforeImages?.[0] ?? null}
            imageAlt={viewProject.title}
            badge={<Badge tone="ink">{viewProject.category}</Badge>}
            onClose={() => setViewProject(null)}
          >
            <DetailRow label="Location" value={viewProject.location} />
            <DetailRow label="Tier" value={viewProject.packageTier} />
            <DetailRow label="Area" value={viewProject.areaSqft ? `${viewProject.areaSqft.toLocaleString('en-IN')} sq ft` : null} />
            <DetailRow label="Duration" value={viewProject.durationMonths ? `${viewProject.durationMonths} months` : null} />
            <div className="col-span-2">
              <DetailRow label="Description" value={viewProject.description} />
            </div>
            {((viewProject.beforeImages?.length ?? 0) > 0 || (viewProject.afterImages?.length ?? 0) > 0 || (viewProject.stageImages?.length ?? 0) > 0) && (
              <div className="col-span-2">
                <Label className="mb-1.5">Showcase Photos</Label>
                <div className="flex flex-wrap gap-1.5">
                  {viewProject.beforeImages?.map((url, idx) => (
                    <img key={`before-${idx}`} src={url} alt="Before" className="h-14 w-18 border border-ink/10 object-cover" />
                  ))}
                  {viewProject.afterImages?.map((url, idx) => (
                    <img key={`after-${idx}`} src={url} alt="After" className="h-14 w-18 border border-ochre/40 object-cover" />
                  ))}
                  {viewProject.stageImages?.map((url, idx) => (
                    <img key={`stage-${idx}`} src={url} alt="On-site progress" className="h-14 w-18 border border-teal/40 object-cover" />
                  ))}
                </div>
                {(!viewProject.beforeImages?.length || !viewProject.afterImages?.length) && (
                  <p className="mt-1.5 font-mono text-[0.6rem] text-ochre-dark">
                    {!viewProject.beforeImages?.length && !viewProject.afterImages?.length ? 'No before/after pair — slider will show placeholders' : !viewProject.afterImages?.length ? 'Missing "after" photo — before/after slider will show placeholders' : 'Missing "before" photo — before/after slider will show placeholders'}
                  </p>
                )}
                {!viewProject.stageImages?.length && (
                  <p className="font-mono text-[0.6rem] text-ochre-dark">No on-site progress photos — that gallery will show placeholders</p>
                )}
              </div>
            )}
          </DetailModal>
        )}
      </AnimatePresence>
    </div>
  )
}
