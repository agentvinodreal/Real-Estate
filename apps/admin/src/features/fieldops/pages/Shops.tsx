import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Check, Eye, Pencil, Trash2 } from 'lucide-react'
import { getAuthToken } from '../../../shared/lib/adminApi'
import { fieldOpsApi } from '../lib/fieldOpsApi'
import { runMutation } from '../lib/runMutation'
import { img } from '../lib/img'
import { REVIEW_STATUSES } from '../lib/constants'
import type { Paginated, Shop } from '../lib/types'
import { Detail, Gallery, LocationBlock, ReviewBadge } from '../components/RecordParts'
import {
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
} from '../../../shared/components/ui'

type FilterState = {
  agentId: string
  reviewStatus: string
  shopType: string
}

const LIMIT = 20

const EMPTY_FILTERS: FilterState = { agentId: '', reviewStatus: '', shopType: '' }

export default function Shops() {
  const [items, setItems] = useState<Shop[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Shop | null>(null)
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)

  // Edit modal
  const [editId, setEditId] = useState<string | null>(null)
  const [editShopName, setEditShopName] = useState('')
  const [editShopType, setEditShopType] = useState('')
  const [editKeeperName, setEditKeeperName] = useState('')
  const [editKeeperPhone, setEditKeeperPhone] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editLat, setEditLat] = useState('')
  const [editLng, setEditLng] = useState('')
  const [editImages, setEditImages] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const buildQuery = useCallback((f: FilterState, p: number) => {
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) })
    if (f.agentId) params.set('agentId', f.agentId)
    if (f.reviewStatus) params.set('reviewStatus', f.reviewStatus)
    if (f.shopType) params.set('shopType', f.shopType)
    return `/shops?${params}`
  }, [])

  const fetchData = useCallback(
    async (f: FilterState, p: number) => {
      setLoading(true)
      setError(null)
      try {
        const token = await getAuthToken()
        if (!token) throw new Error('Not authenticated')
        const res = await fieldOpsApi.get<Paginated<Shop>>(buildQuery(f, p), token)
        setItems(res.data)
        setTotal(res.total)
        setPage(p)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch shop records')
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

  function startEdit(s: Shop) {
    setEditId(s.id)
    setEditShopName(s.shopName)
    setEditShopType(s.shopType)
    setEditKeeperName(s.keeperName)
    setEditKeeperPhone(s.keeperPhone)
    setEditAddress(s.address || '')
    setEditLat(s.lat !== undefined && s.lat !== null ? String(s.lat) : '')
    setEditLng(s.lng !== undefined && s.lng !== null ? String(s.lng) : '')
    setEditImages(s.images ? s.images.join(', ') : '')
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
      const updated = await fieldOpsApi.patch<Shop>(
        `/shops/${editId}`,
        {
          shopName: editShopName.trim() || undefined,
          shopType: editShopType.trim() || undefined,
          keeperName: editKeeperName.trim() || undefined,
          keeperPhone: editKeeperPhone.trim() || undefined,
          address: editAddress.trim() || null,
          lat: editLat ? parseFloat(editLat) : null,
          lng: editLng ? parseFloat(editLng) : null,
          images: editImages ? editImages.split(',').map((s) => s.trim()).filter(Boolean) : [],
        },
        token,
      )
      setItems((prev) => prev.map((s) => (s.id === editId ? updated : s)))
      if (selected?.id === editId) setSelected(updated)
      setEditId(null)
    } catch (err: any) {
      setEditError(err.message || 'Failed to update shop record')
    } finally {
      setEditLoading(false)
    }
  }

  async function markReviewed(id: string) {
    const token = await getAuthToken()
    if (!token) return
    const ok = await runMutation('Failed to mark this shop reviewed', () =>
      fieldOpsApi.patch(`/shops/${id}`, { reviewStatus: 'reviewed' }, token),
    )
    if (!ok) return
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, reviewStatus: 'reviewed' } : s)))
    if (selected?.id === id) setSelected((s) => (s ? { ...s, reviewStatus: 'reviewed' } : s))
  }

  async function deleteRecord(id: string) {
    if (!confirm('Delete this shop record permanently?')) return
    const token = await getAuthToken()
    if (!token) return
    const ok = await runMutation('Failed to delete this shop', () => fieldOpsApi.delete(`/shops/${id}`, token))
    if (!ok) return
    setItems((prev) => prev.filter((s) => s.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  return (
    <div>
      <PageHeader title="Shops" subtitle={`${total} records`} />

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
        <FilterField label="Shop type">
          <Input
            placeholder="Filter by shop type…"
            value={filters.shopType}
            onChange={(e) => applyFilters({ ...filters, shopType: e.target.value })}
          />
        </FilterField>
      </FilterBar>

      {error && <ErrorNote>{error}</ErrorNote>}

      {loading ? (
        <LoadingState label="Loading shops…" />
      ) : items.length === 0 ? (
        <EmptyState>No shop records match these filters.</EmptyState>
      ) : (
        <CardGrid>
          {items.map((s) => (
            <Card key={s.id}>
              <div>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-lg font-semibold text-ink">{s.shopName}</h3>
                    <p className="mt-0.5 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-concrete">{s.shopType}</p>
                  </div>
                  <ReviewBadge status={s.reviewStatus} />
                </div>

                {s.images && s.images[0] && (
                  <img
                    src={img.card(s.images[0])}
                    alt={s.shopName}
                    loading="lazy"
                    className="mb-4 h-36 w-full border border-ink/10 object-cover"
                  />
                )}

                <dl className="flex flex-col gap-2 text-sm">
                  <Row label="Keeper" value={`${s.keeperName} · ${s.keeperPhone}`} />
                  <Row label="Address" value={s.address || '—'} />
                  <Row label="Agent" value={s.agent?.name || '—'} />
                  <Row label="Added" value={new Date(s.createdAt).toLocaleDateString()} />
                </dl>
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-ink/10 pt-4">
                <IconButton onClick={() => setSelected(s)} aria-label={`View ${s.shopName}`}>
                  <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
                </IconButton>
                <IconButton onClick={() => startEdit(s)} aria-label={`Edit ${s.shopName}`}>
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
                </IconButton>
                {s.reviewStatus !== 'reviewed' && (
                  <IconButton onClick={() => markReviewed(s.id)} aria-label={`Mark ${s.shopName} reviewed`}>
                    <Check className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </IconButton>
                )}
                <IconButton danger onClick={() => deleteRecord(s.id)} aria-label={`Delete ${s.shopName}`}>
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                </IconButton>
              </div>
            </Card>
          ))}
        </CardGrid>
      )}

      <Pagination page={page} limit={LIMIT} total={total} onPageChange={(p) => fetchData(filters, p)} />

      {/* Detail */}
      <AnimatePresence>
        {selected && (
          <Modal onClose={() => setSelected(null)} className="max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <h2 className="font-display text-2xl font-semibold text-ink">{selected.shopName}</h2>
                <ReviewBadge status={selected.reviewStatus} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Detail label="Shop type" value={selected.shopType} />
                <Detail label="Shopkeeper" value={selected.keeperName} />
                <Detail
                  label="Phone"
                  mono
                  value={
                    <a href={`tel:${selected.keeperPhone}`} className="text-ochre-dark hover:text-ink">
                      {selected.keeperPhone}
                    </a>
                  }
                />
                <Detail label="Submitted by" value={selected.agent ? `${selected.agent.name} (${selected.agent.email})` : '—'} />
                <div className="col-span-2">
                  <Detail label="Address" value={selected.address} />
                </div>
                <Detail label="Created" value={new Date(selected.createdAt).toLocaleString()} />
              </div>

              <LocationBlock lat={selected.lat} lng={selected.lng} />
              <Gallery title="Photos" publicIds={selected.images ?? []} filePrefix={selected.shopName} />

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Close
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
          <Modal onClose={() => setEditId(null)} className="max-w-lg">
            <form onSubmit={handleEdit} className="p-6">
              <h2 className="mb-5 font-display text-xl font-semibold text-ink">Edit shop</h2>
              {editError && <p className="mb-4 text-sm text-red-600">{editError}</p>}

              <div className="flex flex-col gap-4">
                <div>
                  <Label>Shop name *</Label>
                  <Input required value={editShopName} onChange={(e) => setEditShopName(e.target.value)} />
                </div>
                <div>
                  <Label>Shop type *</Label>
                  <Input required value={editShopType} onChange={(e) => setEditShopType(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Shopkeeper name *</Label>
                    <Input required value={editKeeperName} onChange={(e) => setEditKeeperName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Shopkeeper phone *</Label>
                    <Input required value={editKeeperPhone} onChange={(e) => setEditKeeperPhone(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Full address</Label>
                  <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Latitude</Label>
                    <Input type="number" step="any" value={editLat} onChange={(e) => setEditLat(e.target.value)} />
                  </div>
                  <div>
                    <Label>Longitude</Label>
                    <Input type="number" step="any" value={editLng} onChange={(e) => setEditLng(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Cloudinary image IDs (comma-separated)</Label>
                  <Input value={editImages} onChange={(e) => setEditImages(e.target.value)} />
                </div>
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
