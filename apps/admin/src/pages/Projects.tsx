import { useEffect, useState, type FormEvent } from 'react'
import { adminApi } from '../lib/adminApi'
import type { ConstructionProject } from '@carry/shared'

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const field = 'w-full border border-ink/20 bg-bone px-3 py-2.5 text-sm text-ink focus:border-ochre focus:outline-none'
const label = 'font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete'

const emptyForm = { title: '', category: '', location: '', areaSqft: '', durationMonths: '', packageTier: 'Premium', description: '' }

export default function Projects() {
  const [items, setItems] = useState<ConstructionProject[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
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

  async function create(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    await adminApi.createProject({
      title: form.title,
      slug: slugify(form.title),
      category: form.category,
      location: form.location,
      areaSqft: form.areaSqft ? Number(form.areaSqft) : null,
      durationMonths: form.durationMonths ? Number(form.durationMonths) : null,
      packageTier: form.packageTier,
      description: form.description || null,
    })
    setBusy(false)
    setForm(emptyForm)
    setShowForm(false)
    load()
  }

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Construction projects</h1>
          <p className="mt-1 text-sm text-concrete">{items.length} case studies</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="bg-ink px-5 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-bone hover:bg-ochre-dark">
          {showForm ? 'Close' : '+ New project'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="mb-8 grid grid-cols-2 gap-4 border border-ink/15 bg-bone-dim p-6">
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
          <button type="submit" disabled={busy} className="bg-ink px-6 py-3 font-mono text-xs uppercase tracking-[0.15em] text-bone hover:bg-ochre-dark disabled:opacity-60">
            {busy ? 'Saving…' : 'Create project'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="font-mono text-sm text-concrete">Loading…</p>
      ) : (
        <div className="overflow-x-auto border border-ink/10">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-bone-dim text-left font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Location</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-t border-ink/10">
                  <td className="p-3 font-medium text-ink">{p.title}</td>
                  <td className="p-3 text-ink-soft">{p.category}</td>
                  <td className="p-3 text-ink-soft">{p.location}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => remove(p)} className="font-mono text-xs uppercase tracking-[0.12em] text-ochre-dark hover:text-ink">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
