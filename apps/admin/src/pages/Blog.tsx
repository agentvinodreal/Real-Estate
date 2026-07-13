import { useEffect, useState, type FormEvent } from 'react'
import { adminApi } from '../lib/adminApi'
import type { BlogPost } from '@carry/shared'

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const field =
  'w-full border border-ink/20 bg-bone px-3 py-2.5 text-sm text-ink focus:border-ochre focus:outline-none'
const label = 'font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete'

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
      // Using Cloudinary public_id or secure_url directly
      setCoverImage(data.secure_url)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to upload cover image.')
    } finally {
      setUploading(false)
    }
  }

  async function create(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')

    try {
      const slug = slugify(form.title)
      await adminApi.createBlogPost({
        title: form.title,
        slug,
        excerpt: form.excerpt,
        body: form.body,
        coverImage: coverImage || null,
        metaTitle: form.metaTitle || null,
        metaDescription: form.metaDescription || null,
        published: true,
      })
      setForm(emptyForm)
      setCoverImage('')
      setShowForm(false)
      load()
    } catch (err: any) {
      setError('Could not publish article. Make sure the title/slug is unique.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Blog & Guides</h1>
          <p className="mt-1 text-sm text-concrete">{items.length} articles published</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-ink px-5 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-bone hover:bg-ochre-dark cursor-pointer"
        >
          {showForm ? 'Cancel' : '+ Write Article'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="mb-12 border border-ink/10 bg-bone p-6 max-w-3xl">
          <h2 className="font-display text-lg font-semibold text-ink mb-6">New Blog Article</h2>

          {error && <p className="mb-4 text-xs font-semibold text-ochre-dark">{error}</p>}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={label}>Article Title</label>
              <input
                required
                className={field}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Turnkey Construction Costs in Pune (2026)"
              />
              <p className="mt-1 font-mono text-[0.6rem] text-concrete">
                Slug: /blog/{slugify(form.title || 'untitled')}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className={label}>Short Excerpt (2 sentences)</label>
              <input
                required
                className={field}
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                placeholder="A brief summary shown in lists."
              />
            </div>

            <div className="md:col-span-2">
              <label className={label}>Cover Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="block w-full text-xs text-ink-soft file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-ink/5 file:text-ink hover:file:bg-ink/10 cursor-pointer"
              />
              {uploading && <p className="mt-1 font-mono text-[0.6rem] text-ochre-dark animate-pulse">Uploading to Cloudinary…</p>}
              {coverImage && (
                <div className="mt-3 relative h-32 w-48 border border-ink/10 overflow-hidden bg-ink">
                  <img src={coverImage} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className={label}>Article Content (HTML/Markdown)</label>
              <textarea
                required
                rows={10}
                className={field}
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Write your article body here. Support HTML tags..."
              />
            </div>

            <div>
              <label className={label}>SEO Meta Title (Optional)</label>
              <input
                className={field}
                value={form.metaTitle}
                onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))}
              />
            </div>

            <div>
              <label className={label}>SEO Meta Description (Optional)</label>
              <input
                className={field}
                value={form.metaDescription}
                onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy || uploading}
            className="mt-6 bg-teal px-6 py-3 font-mono text-xs uppercase tracking-[0.15em] text-bone hover:bg-teal-dark disabled:opacity-60 cursor-pointer"
          >
            {busy ? 'Publishing…' : 'Publish Article'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <p className="font-mono text-sm text-concrete animate-pulse">Loading Articles…</p>
        </div>
      ) : items.length === 0 ? (
        <p className="border border-dashed border-ink/20 p-10 text-center text-ink-soft bg-bone-dim/30">
          No articles published yet. Click "+ Write Article" to start.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((post) => (
            <div
              key={post.id}
              className="flex flex-col justify-between border border-ink/10 bg-bone p-5 hover:border-ink/20 shadow-sm transition-all"
            >
              <div>
                {post.coverImage && (
                  <div className="relative mb-4 overflow-hidden aspect-[16/9] w-full bg-ink border border-ink/5">
                    <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <h3 className="font-sans text-lg font-semibold text-ink leading-snug">{post.title}</h3>
                <p className="mt-2 text-xs text-concrete line-clamp-2 leading-relaxed">{post.excerpt}</p>
                <p className="mt-3 font-mono text-[0.6rem] text-concrete">/blog/{post.slug}</p>
              </div>

              <div className="mt-6 flex items-center justify-end gap-4 border-t border-ink/5 pt-3">
                <button
                  onClick={() => remove(post.id)}
                  className="font-mono text-xs uppercase tracking-[0.12em] text-ochre-dark hover:text-ink cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
