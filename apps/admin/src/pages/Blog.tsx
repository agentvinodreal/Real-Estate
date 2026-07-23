import { useEffect, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Loader2, Plus, X } from 'lucide-react'
import { adminApi } from '../lib/adminApi'
import type { BlogPost } from '@carry/shared'
import { Badge, Button, Card, CardGrid, DetailModal, DetailRow, EmptyState, FormPanel, Input, Label, LoadingState, PageHeader, Textarea } from '../components/ui'

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const emptyForm = {
  title: '',
  excerpt: '',
  body: '',
  metaTitle: '',
  metaDescription: '',
}

export default function Blog() {
  const [items, setItems] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [viewPost, setViewPost] = useState<BlogPost | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [coverImage, setCoverImage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function load() {
    setLoading(true)
    adminApi
      .listBlogPosts()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function remove(id: string) {
    if (!confirm('Delete this article? This cannot be undone.')) return
    await adminApi.deleteBlogPost(id)
    setItems((xs) => xs.filter((x) => x.id !== id))
  }

  function startEdit(post: BlogPost) {
    setEditId(post.id)
    setForm({
      title: post.title,
      excerpt: post.excerpt ?? '',
      body: post.body,
      metaTitle: post.metaTitle ?? '',
      metaDescription: post.metaDescription ?? '',
    })
    setCoverImage(post.coverImage ?? '')
    setError('')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function closeForm() {
    setShowForm(false)
    setEditId(null)
    setForm(emptyForm)
    setCoverImage('')
    setError('')
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
      setCoverImage(data.secure_url)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to upload cover image.')
    } finally {
      setUploading(false)
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')

    try {
      if (editId) {
        await adminApi.updateBlogPost(editId, {
          title: form.title,
          excerpt: form.excerpt,
          body: form.body,
          coverImage: coverImage || null,
          metaTitle: form.metaTitle || null,
          metaDescription: form.metaDescription || null,
        })
      } else {
        await adminApi.createBlogPost({
          title: form.title,
          slug: slugify(form.title),
          excerpt: form.excerpt,
          body: form.body,
          coverImage: coverImage || null,
          metaTitle: form.metaTitle || null,
          metaDescription: form.metaDescription || null,
          published: true,
        })
      }
      closeForm()
      load()
    } catch {
      setError(editId ? 'Could not save changes. Please try again.' : 'Could not publish article. Make sure the title/slug is unique.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Blog & Guides"
        subtitle={`${items.length} articles published`}
        actions={
          <Button
            variant={showForm ? 'outline' : 'primary'}
            icon={showForm ? <X className="h-3.5 w-3.5" strokeWidth={2} /> : <Plus className="h-3.5 w-3.5" strokeWidth={2} />}
            onClick={() => (showForm ? closeForm() : setShowForm(true))}
          >
            {showForm ? 'Cancel' : 'Write Article'}
          </Button>
        }
      />

      <AnimatePresence>
        {showForm && (
          <FormPanel onSubmit={save} className="mb-12 max-w-3xl">
            <h2 className="mb-6 font-display text-lg font-semibold text-ink">{editId ? 'Edit Article' : 'New Blog Article'}</h2>

            {error && <p className="mb-4 text-xs font-semibold text-ochre-dark">{error}</p>}

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Article Title</Label>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Turnkey Construction Costs in Patna (2026)"
                />
                {!editId && <p className="mt-1 font-mono text-[0.6rem] text-concrete">Slug: /blog/{slugify(form.title || 'untitled')}</p>}
              </div>

              <div className="md:col-span-2">
                <Label>Short Excerpt (2 sentences)</Label>
                <Input
                  required
                  value={form.excerpt}
                  onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                  placeholder="A brief summary shown in lists."
                />
              </div>

              <div className="md:col-span-2">
                <Label>Cover Image</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="block w-full cursor-pointer text-xs text-ink-soft file:mr-4 file:border-0 file:bg-ink/5 file:px-4 file:py-2 file:text-ink hover:file:bg-ink/10"
                />
                {uploading && (
                  <p className="mt-1 flex items-center gap-1.5 font-mono text-[0.6rem] text-ochre-dark">
                    <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} /> Uploading to Cloudinary…
                  </p>
                )}
                {coverImage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative mt-3 h-32 w-48 overflow-hidden border border-ink/10 bg-ink"
                  >
                    <img src={coverImage} alt="Preview" className="h-full w-full object-cover" />
                  </motion.div>
                )}
              </div>

              <div className="md:col-span-2">
                <Label>Article Content (HTML/Markdown)</Label>
                <Textarea
                  required
                  rows={10}
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder="Write your article body here. Support HTML tags..."
                />
              </div>

              <div>
                <Label>SEO Meta Title (Optional)</Label>
                <Input value={form.metaTitle} onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))} />
              </div>

              <div>
                <Label>SEO Meta Description (Optional)</Label>
                <Input value={form.metaDescription} onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))} />
              </div>
            </div>

            <Button type="submit" variant="accent" busy={busy || uploading} className="mt-6">
              {editId ? 'Save Changes' : 'Publish Article'}
            </Button>
          </FormPanel>
        )}
      </AnimatePresence>

      {loading ? (
        <LoadingState label="Loading articles…" />
      ) : items.length === 0 ? (
        <EmptyState>No articles published yet. Click "Write Article" to start.</EmptyState>
      ) : (
        <CardGrid>
          <AnimatePresence mode="popLayout">
            {items.map((post) => (
              <Card key={post.id}>
                <div>
                  {post.coverImage && (
                    <div className="relative mb-4 aspect-[16/9] w-full overflow-hidden border border-ink/5 bg-ink">
                      <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <h3 className="font-sans text-lg font-semibold leading-snug text-ink">{post.title}</h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-concrete">{post.excerpt}</p>
                  <p className="mt-3 font-mono text-[0.6rem] text-concrete">/blog/{post.slug}</p>
                </div>

                <div className="mt-6 flex items-center justify-end gap-4 border-t border-ink/5 pt-3">
                  <button onClick={() => setViewPost(post)} className="cursor-pointer font-mono text-xs uppercase tracking-[0.12em] text-teal transition-colors hover:text-ink">
                    View
                  </button>
                  <button onClick={() => startEdit(post)} className="cursor-pointer font-mono text-xs uppercase tracking-[0.12em] text-ink-soft transition-colors hover:text-ink">
                    Edit
                  </button>
                  <button onClick={() => remove(post.id)} className="cursor-pointer font-mono text-xs uppercase tracking-[0.12em] text-ochre-dark hover:text-ink">
                    Delete
                  </button>
                </div>
              </Card>
            ))}
          </AnimatePresence>
        </CardGrid>
      )}

      <AnimatePresence>
        {viewPost && (
          <DetailModal
            title={viewPost.title}
            imageUrl={viewPost.coverImage}
            imageAlt={viewPost.title}
            badge={<Badge tone={viewPost.published ? 'teal' : 'concrete'}>{viewPost.published ? 'Published' : 'Draft'}</Badge>}
            onClose={() => setViewPost(null)}
          >
            <div className="col-span-2">
              <DetailRow label="Slug" value={`/blog/${viewPost.slug}`} />
            </div>
            <div className="col-span-2">
              <DetailRow label="Excerpt" value={viewPost.excerpt} />
            </div>
            <DetailRow label="SEO Meta Title" value={viewPost.metaTitle} />
            <DetailRow label="SEO Meta Description" value={viewPost.metaDescription} />
            <div className="col-span-2">
              <Label className="mb-0.5">Article Body</Label>
              <div className="max-h-64 overflow-y-auto whitespace-pre-wrap border border-ink/10 bg-bone-dim/30 p-3 text-xs leading-relaxed text-ink-soft">
                {viewPost.body}
              </div>
            </div>
          </DetailModal>
        )}
      </AnimatePresence>
    </div>
  )
}
