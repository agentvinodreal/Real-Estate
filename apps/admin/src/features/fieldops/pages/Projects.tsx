import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Check, Download, Eye, Pencil, Trash2 } from 'lucide-react'
import { getAuthToken } from '../../../shared/lib/adminApi'
import { fieldOpsApi } from '../lib/fieldOpsApi'
import { runMutation } from '../lib/runMutation'
import { img } from '../lib/img'
import { downloadZip } from '../lib/downloadZip'
import { PACKAGE_TIERS, PROJECT_CATEGORIES, REVIEW_STATUSES } from '../lib/constants'
import type { FieldOpsProject, Paginated } from '../lib/types'
import { Detail, Gallery, ReviewBadge } from '../components/RecordParts'
import {
  Badge,
  Button,
  Card,
  CardGrid,
  EmptyState,
  ErrorNote,
  FilterBar,
  FilterField,
  IconButton,
  Input,
  Label,
  LoadingState,
  Modal,
  PageHeader,
  Pagination,
  Select,
  StatusToggle,
  Textarea,
} from '../../../shared/components/ui'

type FilterState = {
  agentId: string
  reviewStatus: string
  category: string
  packageTier: string
}

const LIMIT = 20

const EMPTY_FILTERS: FilterState = { agentId: '', reviewStatus: '', category: '', packageTier: '' }

/**
 * Field Ops construction projects — the agent-collected counterpart to the
 * website's own Projects page, which reads a different database.
 *
 * Routed at /field-ops/projects but deliberately absent from the Field Ops tab
 * list, matching the standalone panel where this page is commented out of both
 * the router and the sidebar. Add it to `tabs` in FieldOpsLayout to enable.
 */
export default function Projects() {
  const [items, setItems] = useState<FieldOpsProject[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<FieldOpsProject | null>(null)
  const [downloadingZip, setDownloadingZip] = useState(false)
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)

  // Edit modal
  const [editId, setEditId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editAreaSqft, setEditAreaSqft] = useState('')
  const [editDurationMonths, setEditDurationMonths] = useState('')
  const [editPackageTier, setEditPackageTier] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editBeforeImages, setEditBeforeImages] = useState('')
  const [editAfterImages, setEditAfterImages] = useState('')
  const [editStageImages, setEditStageImages] = useState('')
  const [editPublished, setEditPublished] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const buildQuery = useCallback((f: FilterState, p: number) => {
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) })
    if (f.agentId) params.set('agentId', f.agentId)
    if (f.reviewStatus) params.set('reviewStatus', f.reviewStatus)
    if (f.category) params.set('category', f.category)
    if (f.packageTier) params.set('packageTier', f.packageTier)
    return `/projects?${params}`
  }, [])

  const fetchData = useCallback(
    async (f: FilterState, p: number) => {
      setLoading(true)
      setError(null)
      try {
        const token = await getAuthToken()
        if (!token) throw new Error('Not authenticated')
        const res = await fieldOpsApi.get<Paginated<FieldOpsProject>>(buildQuery(f, p), token)
        setItems(res.data)
        setTotal(res.total)
        setPage(p)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch projects')
      } finally {
        setLoading(false)
      }
    },
    [buildQuery],
  )

  useEffect(() => {
    fetchData(EMPTY_FILTERS, 1)
  }, [fetchData])

  function applyFilters(next: FilterState) {
    setFilters(next)
    fetchData(next, 1)
  }

  function startEdit(p: FieldOpsProject) {
    setEditId(p.id)
    setEditTitle(p.title)
    setEditCategory(p.category)
    setEditLocation(p.location)
    setEditAreaSqft(p.areaSqft !== undefined && p.areaSqft !== null ? String(p.areaSqft) : '')
    setEditDurationMonths(p.durationMonths !== undefined && p.durationMonths !== null ? String(p.durationMonths) : '')
    setEditPackageTier(p.packageTier || '')
    setEditDescription(p.description || '')
    setEditBeforeImages(p.beforeImages ? p.beforeImages.join(', ') : '')
    setEditAfterImages(p.afterImages ? p.afterImages.join(', ') : '')
    setEditStageImages(p.stageImages ? p.stageImages.join(', ') : '')
    setEditPublished(p.published || false)
    setEditError(null)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editId) return
    setEditLoading(true)
    setEditError(null)
    try {
      const token = await getAuthToken()
      if (!token) throw new Error('Not authenticated')
      const updated = await fieldOpsApi.patch<FieldOpsProject>(
        `/projects/${editId}`,
        {
          title: editTitle.trim() || undefined,
          category: editCategory || undefined,
          location: editLocation.trim() || undefined,
          areaSqft: editAreaSqft ? parseInt(editAreaSqft, 10) : null,
          durationMonths: editDurationMonths ? parseInt(editDurationMonths, 10) : null,
          packageTier: editPackageTier || null,
          description: editDescription.trim() || null,
          beforeImages: editBeforeImages ? editBeforeImages.split(',').map((s) => s.trim()).filter(Boolean) : [],
          afterImages: editAfterImages ? editAfterImages.split(',').map((s) => s.trim()).filter(Boolean) : [],
          stageImages: editStageImages ? editStageImages.split(',').map((s) => s.trim()).filter(Boolean) : [],
          published: editPublished,
        },
        token,
      )
      setItems((prev) => prev.map((p) => (p.id === editId ? updated : p)))
      if (selected?.id === editId) setSelected(updated)
      setEditId(null)
    } catch (err: any) {
      setEditError(err.message || 'Failed to update project record')
    } finally {
      setEditLoading(false)
    }
  }

  async function markReviewed(id: string) {
    const token = await getAuthToken()
    if (!token) return
    const ok = await runMutation('Failed to mark this project reviewed', () =>
      fieldOpsApi.patch(`/projects/${id}`, { reviewStatus: 'reviewed' }, token),
    )
    if (!ok) return
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, reviewStatus: 'reviewed' } : p)))
    if (selected?.id === id) setSelected((s) => (s ? { ...s, reviewStatus: 'reviewed' } : s))
  }

  /** Publishing pushes the project to the public website via the API's sync hook. */
  async function togglePublished(id: string, currentPublished: boolean) {
    const token = await getAuthToken()
    if (!token) return
    const newPublished = !currentPublished
    const ok = await runMutation('Failed to change publish status', () =>
      fieldOpsApi.patch(`/projects/${id}`, { published: newPublished }, token),
    )
    if (!ok) return
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, published: newPublished } : p)))
    if (selected?.id === id) setSelected((s) => (s ? { ...s, published: newPublished } : s))
  }

  async function deleteRecord(id: string) {
    if (!confirm('Delete this project record permanently?')) return
    const token = await getAuthToken()
    if (!token) return
    const ok = await runMutation('Failed to delete this project', () => fieldOpsApi.delete(`/projects/${id}`, token))
    if (!ok) return
    setItems((prev) => prev.filter((p) => p.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  async function handleDownloadAllZip(proj: FieldOpsProject) {
    setDownloadingZip(true)
    try {
      await downloadZip(proj.title, [
        { folder: 'before', publicIds: proj.beforeImages },
        { folder: 'after', publicIds: proj.afterImages },
        { folder: 'stages', publicIds: proj.stageImages },
      ])
    } catch {
      alert('Failed to generate ZIP download')
    } finally {
      setDownloadingZip(false)
    }
  }

  return (
    <div>
      <PageHeader title="Field Ops projects" subtitle={`${total} records`} />

      <FilterBar>
        <FilterField label="Review status">
          <Select value={filters.reviewStatus} onChange={(e) => applyFilters({ ...filters, reviewStatus: e.target.value })}>
            <option value="">All statuses</option>
            {REVIEW_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="Category">
          <Select value={filters.category} onChange={(e) => applyFilters({ ...filters, category: e.target.value })}>
            <option value="">All categories</option>
            {PROJECT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="Package tier">
          <Select value={filters.packageTier} onChange={(e) => applyFilters({ ...filters, packageTier: e.target.value })}>
            <option value="">All tiers</option>
            {PACKAGE_TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </FilterField>
      </FilterBar>

      {error && <ErrorNote>{error}</ErrorNote>}

      {loading ? (
        <LoadingState label="Loading projects…" />
      ) : items.length === 0 ? (
        <EmptyState>No projects match these filters.</EmptyState>
      ) : (
        <CardGrid>
          {items.map((p) => {
            const cover = p.afterImages?.[0] || p.beforeImages?.[0] || p.stageImages?.[0]
            return (
              <Card key={p.id}>
                <div>
                  {cover && (
                    <img
                      src={img.card(cover)}
                      alt={p.title}
                      loading="lazy"
                      className="mb-4 h-36 w-full border border-ink/10 object-cover"
                    />
                  )}
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="min-w-0 flex-1 font-display text-lg font-semibold text-ink">{p.title}</h3>
                    <ReviewBadge status={p.reviewStatus} />
                  </div>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge tone="steel">{p.category}</Badge>
                    {p.packageTier && <Badge tone="ink">{p.packageTier}</Badge>}
                  </div>
                  <dl className="flex flex-col gap-2 text-sm">
                    <Row label="Location" value={p.location} />
                    <Row label="Area" value={p.areaSqft ? `${p.areaSqft} sq ft` : '—'} />
                    <Row label="Duration" value={p.durationMonths ? `${p.durationMonths} months` : '—'} />
                    <Row label="Agent" value={p.agent?.name || '—'} />
                  </dl>
                  <div className="mt-4">
                    <StatusToggle
                      active={!!p.published}
                      onClick={() => togglePublished(p.id, p.published || false)}
                      activeLabel="Published"
                      inactiveLabel="Draft"
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end gap-2 border-t border-ink/10 pt-4">
                  <IconButton onClick={() => setSelected(p)} aria-label={`View ${p.title}`}>
                    <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </IconButton>
                  <IconButton onClick={() => startEdit(p)} aria-label={`Edit ${p.title}`}>
                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </IconButton>
                  {p.reviewStatus !== 'reviewed' && (
                    <IconButton onClick={() => markReviewed(p.id)} aria-label={`Mark ${p.title} reviewed`}>
                      <Check className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </IconButton>
                  )}
                  <IconButton danger onClick={() => deleteRecord(p.id)} aria-label={`Delete ${p.title}`}>
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </IconButton>
                </div>
              </Card>
            )
          })}
        </CardGrid>
      )}

      <Pagination page={page} limit={LIMIT} total={total} onPageChange={(p) => fetchData(filters, p)} />

      {/* Detail */}
      <AnimatePresence>
        {selected && (
          <Modal onClose={() => setSelected(null)} className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <div className="p-6">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <h2 className="font-display text-2xl font-semibold text-ink">{selected.title}</h2>
                <div className="flex gap-2">
                  <ReviewBadge status={selected.reviewStatus} />
                  <Badge tone={selected.published ? 'teal' : 'concrete'}>
                    {selected.published ? 'Published' : 'Hidden / draft'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Detail label="Category" value={selected.category} />
                <Detail label="Location" value={selected.location} />
                <Detail label="Area" value={selected.areaSqft ? `${selected.areaSqft} sq ft` : '—'} />
                <Detail label="Duration" value={selected.durationMonths ? `${selected.durationMonths} months` : '—'} />
                <Detail label="Package tier" value={selected.packageTier || '—'} />
                <Detail label="Submitted by" value={selected.agent ? `${selected.agent.name} (${selected.agent.email})` : '—'} />
                <Detail label="Created" value={new Date(selected.createdAt).toLocaleString()} />
              </div>

              {selected.description && (
                <div className="mt-6">
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete">Description</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{selected.description}</p>
                </div>
              )}

              <Gallery title="Before" publicIds={selected.beforeImages ?? []} filePrefix={`${selected.title}-before`} />
              <Gallery title="After" publicIds={selected.afterImages ?? []} filePrefix={`${selected.title}-after`} />
              <Gallery title="Stages" publicIds={selected.stageImages ?? []} filePrefix={`${selected.title}-stage`} />

              <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                <Button
                  variant="outline"
                  className="mr-auto"
                  busy={downloadingZip}
                  icon={<Download className="h-3.5 w-3.5" strokeWidth={1.8} />}
                  onClick={() => handleDownloadAllZip(selected)}
                >
                  Download all (ZIP)
                </Button>
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Close
                </Button>
                <Button
                  variant={selected.published ? 'ghost' : 'accent'}
                  onClick={() => togglePublished(selected.id, selected.published || false)}
                >
                  {selected.published ? 'Unpublish' : 'Publish to web'}
                </Button>
                {selected.reviewStatus !== 'reviewed' && <Button onClick={() => markReviewed(selected.id)}>Mark reviewed</Button>}
                <Button variant="danger" onClick={() => deleteRecord(selected.id)}>
                  Delete
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Edit */}
      <AnimatePresence>
        {editId && (
          <Modal onClose={() => setEditId(null)} className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <form onSubmit={handleEdit} className="p-6">
              <h2 className="mb-5 font-display text-xl font-semibold text-ink">Edit project</h2>
              {editError && <p className="mb-4 text-sm text-red-600">{editError}</p>}

              <div className="flex flex-col gap-4">
                <div>
                  <Label>Project title *</Label>
                  <Input required value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category *</Label>
                    <Select required value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                      {PROJECT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Package tier</Label>
                    <Select value={editPackageTier} onChange={(e) => setEditPackageTier(e.target.value)}>
                      <option value="">None</option>
                      {PACKAGE_TIERS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Location *</Label>
                    <Input required value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
                  </div>
                  <div>
                    <Label>Area (sq ft)</Label>
                    <Input type="number" value={editAreaSqft} onChange={(e) => setEditAreaSqft(e.target.value)} />
                  </div>
                  <div>
                    <Label>Duration (months)</Label>
                    <Input type="number" value={editDurationMonths} onChange={(e) => setEditDurationMonths(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="min-h-20" />
                </div>
                <div>
                  <Label>Before image IDs (comma-separated)</Label>
                  <Input value={editBeforeImages} onChange={(e) => setEditBeforeImages(e.target.value)} />
                </div>
                <div>
                  <Label>After image IDs (comma-separated)</Label>
                  <Input value={editAfterImages} onChange={(e) => setEditAfterImages(e.target.value)} />
                </div>
                <div>
                  <Label>Stage image IDs (comma-separated)</Label>
                  <Input value={editStageImages} onChange={(e) => setEditStageImages(e.target.value)} />
                </div>

                <label className="mt-2 flex cursor-pointer items-center gap-2 border-t border-ink/10 pt-4 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={editPublished}
                    onChange={(e) => setEditPublished(e.target.checked)}
                    className="h-4 w-4 cursor-pointer accent-ochre"
                  />
                  Publish to website (visible on the public frontend)
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="outline" disabled={editLoading} onClick={() => setEditId(null)}>
                  Cancel
                </Button>
                <Button type="submit" busy={editLoading}>
                  Save changes
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete">{label}</dt>
      <dd className="truncate text-right text-sm text-ink-soft">{value}</dd>
    </div>
  )
}
