import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Check, Download, Eye, Pencil, Trash2 } from 'lucide-react'
import { getAuthToken } from '../../../shared/lib/adminApi'
import { fieldOpsApi } from '../lib/fieldOpsApi'
import { runMutation } from '../lib/runMutation'
import { img } from '../lib/img'
import { downloadZip } from '../lib/downloadZip'
import {
  FURNISHING_TYPES,
  LISTING_TYPES,
  PLOT_ALLOWED_USE_TYPES,
  PREFERRED_TENANT_TYPES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  REVIEW_STATUSES,
} from '../lib/constants'
import type { FieldOpsProperty, Paginated } from '../lib/types'
import { Detail, Gallery, LocationBlock, ReviewBadge } from '../components/RecordParts'
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
  listingType: string
  propertyType: string
  city: string
}

const LIMIT = 20

const EMPTY_FILTERS: FilterState = {
  agentId: '',
  reviewStatus: '',
  listingType: '',
  propertyType: '',
  city: '',
}

export default function Properties() {
  const [items, setItems] = useState<FieldOpsProperty[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<FieldOpsProperty | null>(null)
  const [downloadingZip, setDownloadingZip] = useState(false)
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)

  // Edit modal
  const [editId, setEditId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPropertyType, setEditPropertyType] = useState('')
  const [editListingType, setEditListingType] = useState('')
  const [editBhk, setEditBhk] = useState('')
  const [editPriceInr, setEditPriceInr] = useState('')
  const [editPriceLabel, setEditPriceLabel] = useState('')
  const [editAreaSqft, setEditAreaSqft] = useState('')
  const [editLocality, setEditLocality] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editReraNumber, setEditReraNumber] = useState('')
  const [editOwnerName, setEditOwnerName] = useState('')
  const [editOwnerPhone, setEditOwnerPhone] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editFurnishing, setEditFurnishing] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editImages, setEditImages] = useState('')
  const [editFloorPlanUrl, setEditFloorPlanUrl] = useState('')
  const [editLat, setEditLat] = useState('')
  const [editLng, setEditLng] = useState('')
  const [editSecurityDeposit, setEditSecurityDeposit] = useState('')
  const [editAvailableFrom, setEditAvailableFrom] = useState('')
  const [editPreferredTenant, setEditPreferredTenant] = useState('')
  const [editPetFriendly, setEditPetFriendly] = useState(false)
  const [editMaintenanceCharges, setEditMaintenanceCharges] = useState('')
  const [editLeaseDuration, setEditLeaseDuration] = useState('')
  const [editLockInPeriod, setEditLockInPeriod] = useState('')
  const [editCamCharges, setEditCamCharges] = useState('')
  const [editPlotAllowedUse, setEditPlotAllowedUse] = useState('')
  const [editPublished, setEditPublished] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const buildQuery = useCallback((f: FilterState, p: number) => {
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) })
    if (f.agentId) params.set('agentId', f.agentId)
    if (f.reviewStatus) params.set('reviewStatus', f.reviewStatus)
    if (f.listingType) params.set('listingType', f.listingType)
    if (f.propertyType) params.set('propertyType', f.propertyType)
    if (f.city) params.set('city', f.city)
    return `/properties?${params}`
  }, [])

  const fetchData = useCallback(
    async (f: FilterState, p: number) => {
      setLoading(true)
      setError(null)
      try {
        const token = await getAuthToken()
        if (!token) throw new Error('Not authenticated')
        const res = await fieldOpsApi.get<Paginated<FieldOpsProperty>>(buildQuery(f, p), token)
        setItems(res.data)
        setTotal(res.total)
        setPage(p)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch properties')
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

  function startEdit(p: FieldOpsProperty) {
    setEditId(p.id)
    setEditTitle(p.title)
    setEditPropertyType(p.propertyType)
    setEditListingType(p.listingType)
    setEditBhk(p.bhk !== undefined && p.bhk !== null ? String(p.bhk) : '')
    setEditPriceInr(String(p.priceInr))
    setEditPriceLabel(p.priceLabel)
    setEditAreaSqft(p.areaSqft !== undefined && p.areaSqft !== null ? String(p.areaSqft) : '')
    setEditLocality(p.locality)
    setEditCity(p.city)
    setEditAddress(p.address || '')
    setEditReraNumber(p.reraNumber || '')
    setEditOwnerName(p.ownerName || '')
    setEditOwnerPhone(p.ownerPhone || '')
    setEditStatus(p.status)
    setEditFurnishing(p.furnishing || '')
    setEditDescription(p.description || '')
    setEditImages(p.images ? p.images.join(', ') : '')
    setEditFloorPlanUrl(p.floorPlanUrl || '')
    setEditLat(p.lat !== undefined && p.lat !== null ? String(p.lat) : '')
    setEditLng(p.lng !== undefined && p.lng !== null ? String(p.lng) : '')
    setEditSecurityDeposit(p.securityDeposit !== undefined && p.securityDeposit !== null ? String(p.securityDeposit) : '')
    setEditAvailableFrom(p.availableFrom || '')
    setEditPreferredTenant(p.preferredTenant || '')
    setEditPetFriendly(p.petFriendly || false)
    setEditMaintenanceCharges(
      p.maintenanceCharges !== undefined && p.maintenanceCharges !== null ? String(p.maintenanceCharges) : '',
    )
    setEditLeaseDuration(p.leaseDuration !== undefined && p.leaseDuration !== null ? String(p.leaseDuration) : '')
    setEditLockInPeriod(p.lockInPeriod !== undefined && p.lockInPeriod !== null ? String(p.lockInPeriod) : '')
    setEditCamCharges(p.camCharges !== undefined && p.camCharges !== null ? String(p.camCharges) : '')
    setEditPlotAllowedUse(p.plotAllowedUse || '')
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

      // Bare land has no rooms, no construction stage and no furnishing —
      // keep these cleared so an admin edit can't reintroduce them
      const isPlot = editPropertyType === 'Plot'
      // Plots have no listing type control, so pin the value rather than
      // letting whatever the record loaded with leak back out
      const listingType = isPlot ? 'Sale' : editListingType

      const payload: any = {
        title: editTitle.trim() || undefined,
        propertyType: editPropertyType || undefined,
        listingType: listingType || undefined,
        bhk: isPlot || editPropertyType === 'Commercial' ? null : editBhk ? parseInt(editBhk, 10) : null,
        priceInr: editPriceInr ? parseInt(editPriceInr, 10) : undefined,
        priceLabel: editPriceLabel.trim() || undefined,
        areaSqft: editAreaSqft ? parseInt(editAreaSqft, 10) : null,
        locality: editLocality.trim() || undefined,
        city: editCity.trim() || undefined,
        address: editAddress.trim() || null,
        reraNumber: editReraNumber.trim() || null,
        ownerName: editOwnerName.trim() || null,
        ownerPhone: editOwnerPhone.trim() || null,
        status: isPlot ? 'Ready' : editStatus || undefined,
        furnishing: isPlot ? null : editFurnishing || null,
        description: editDescription.trim() || null,
        images: editImages ? editImages.split(',').map((s) => s.trim()).filter(Boolean) : [],
        floorPlanUrl: editFloorPlanUrl.trim() || null,
        lat: editLat ? parseFloat(editLat) : null,
        lng: editLng ? parseFloat(editLng) : null,
        published: editPublished,
        // Allowed Use describes the land itself, not a rental agreement, so it
        // is sent for any plot rather than only for rented ones
        plotAllowedUse: isPlot ? editPlotAllowedUse || null : null,
      }

      if (listingType === 'Rent') {
        payload.securityDeposit = editSecurityDeposit ? parseInt(editSecurityDeposit, 10) : null
        payload.availableFrom = editAvailableFrom.trim() || null
        payload.preferredTenant = editPreferredTenant || null
        payload.petFriendly = editPetFriendly
        payload.maintenanceCharges = editMaintenanceCharges ? parseInt(editMaintenanceCharges, 10) : null
        payload.leaseDuration = editLeaseDuration ? parseInt(editLeaseDuration, 10) : null
        payload.lockInPeriod = editLockInPeriod ? parseInt(editLockInPeriod, 10) : null
        payload.camCharges = editCamCharges ? parseInt(editCamCharges, 10) : null
      } else {
        // Switching a record away from Rent must clear the rent-only fields,
        // otherwise the old values linger on the record. Mirrors the agent form.
        payload.securityDeposit = null
        payload.availableFrom = null
        payload.preferredTenant = null
        payload.petFriendly = null
        payload.maintenanceCharges = null
        payload.leaseDuration = null
        payload.lockInPeriod = null
        payload.camCharges = null
      }

      const updated = await fieldOpsApi.patch<FieldOpsProperty>(`/properties/${editId}`, payload, token)
      setItems((prev) => prev.map((p) => (p.id === editId ? updated : p)))
      if (selected?.id === editId) setSelected(updated)
      setEditId(null)
    } catch (err: any) {
      setEditError(err.message || 'Failed to update property record')
    } finally {
      setEditLoading(false)
    }
  }

  async function markReviewed(id: string) {
    const token = await getAuthToken()
    if (!token) return
    const ok = await runMutation('Failed to mark this property reviewed', () =>
      fieldOpsApi.patch(`/properties/${id}`, { reviewStatus: 'reviewed' }, token),
    )
    if (!ok) return
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, reviewStatus: 'reviewed' } : p)))
    if (selected?.id === id) setSelected((s) => (s ? { ...s, reviewStatus: 'reviewed' } : s))
  }

  /**
   * Publishing is what pushes the listing to the public website: the Field Ops
   * API fires syncToWebsiteInBackground on this PATCH. Unpublishing sends
   * `published: false`, which hides it there rather than deleting it.
   *
   * The API rejects a publish when the record has no areaSqft, because the
   * website stores that column as required — runMutation surfaces that instead
   * of letting the click appear to do nothing.
   */
  async function togglePublished(id: string, currentPublished: boolean) {
    const token = await getAuthToken()
    if (!token) return
    const newPublished = !currentPublished
    const ok = await runMutation('Failed to change publish status', () =>
      fieldOpsApi.patch(`/properties/${id}`, { published: newPublished }, token),
    )
    if (!ok) return
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, published: newPublished } : p)))
    if (selected?.id === id) setSelected((s) => (s ? { ...s, published: newPublished } : s))
  }

  async function deleteRecord(id: string) {
    if (!confirm('Delete this property record permanently?')) return
    const token = await getAuthToken()
    if (!token) return
    const ok = await runMutation('Failed to delete this property', () => fieldOpsApi.delete(`/properties/${id}`, token))
    if (!ok) return
    setItems((prev) => prev.filter((p) => p.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  async function handleDownloadAllZip(prop: FieldOpsProperty) {
    setDownloadingZip(true)
    try {
      await downloadZip(prop.title, [
        { folder: 'gallery', publicIds: prop.images },
        { folder: '', publicIds: prop.floorPlanUrl ? [prop.floorPlanUrl] : [] },
      ])
    } catch {
      alert('Failed to generate ZIP download')
    } finally {
      setDownloadingZip(false)
    }
  }

  const isPlot = editPropertyType === 'Plot'

  return (
    <div>
      <PageHeader title="Properties" subtitle={`${total} records`} />

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
        <FilterField label="Property type">
          <Select value={filters.propertyType} onChange={(e) => applyFilters({ ...filters, propertyType: e.target.value })}>
            <option value="">All types</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="Listing type">
          <Select value={filters.listingType} onChange={(e) => applyFilters({ ...filters, listingType: e.target.value })}>
            <option value="">All listings</option>
            {LISTING_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="City">
          <Input
            placeholder="Filter by city…"
            value={filters.city}
            onChange={(e) => applyFilters({ ...filters, city: e.target.value })}
          />
        </FilterField>
      </FilterBar>

      {error && <ErrorNote>{error}</ErrorNote>}

      {loading ? (
        <LoadingState label="Loading properties…" />
      ) : items.length === 0 ? (
        <EmptyState>No properties match these filters.</EmptyState>
      ) : (
        <CardGrid>
          {items.map((p) => (
            <Card key={p.id}>
              <div>
                {p.images && p.images[0] && (
                  <img
                    src={img.card(p.images[0])}
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
                  <Badge tone="steel">{p.propertyType}</Badge>
                  <Badge tone="ink">{p.listingType}</Badge>
                </div>

                <dl className="flex flex-col gap-2 text-sm">
                  <Row label={p.listingType === 'Rent' ? 'Rent' : 'Price'} value={p.priceLabel} />
                  <Row label="Where" value={`${p.locality}, ${p.city}`} />
                  <Row label="Area" value={p.areaSqft ? `${p.areaSqft} sq ft` : '—'} />
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
          ))}
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
                <Detail label="Type" value={selected.propertyType} />
                <Detail label="Listing" value={selected.listingType} />
                <Detail
                  label={selected.listingType === 'Rent' ? 'Rent' : 'Price'}
                  value={`${selected.priceLabel}${selected.listingType === 'Rent' ? ' / month' : ''}`}
                />
                <Detail label="Area" value={selected.areaSqft ? `${selected.areaSqft} sq ft` : '—'} />
                <Detail label="City" value={selected.city} />
                <Detail label="Locality" value={selected.locality} />
                {selected.bhk ? <Detail label="BHK" value={selected.bhk} /> : null}
                {selected.propertyType !== 'Plot' && selected.furnishing ? (
                  <Detail label="Furnishing" value={selected.furnishing} />
                ) : null}
                {selected.reraNumber ? <Detail label="RERA" mono value={selected.reraNumber} /> : null}
                {selected.propertyType !== 'Plot' && selected.status ? (
                  <Detail label="Construction status" value={selected.status} />
                ) : null}
                <Detail label="Submitted by" value={selected.agent ? `${selected.agent.name} (${selected.agent.email})` : '—'} />

                {/* Owner contact is internal — it is never included in the website sync payload. */}
                {(selected.ownerName || selected.ownerPhone) && (
                  <Detail
                    label="Owner contact (internal)"
                    value={`${selected.ownerName || '—'}${selected.ownerPhone ? ` · ${selected.ownerPhone}` : ''}`}
                  />
                )}

                {selected.listingType === 'Rent' && (
                  <>
                    {selected.securityDeposit != null && (
                      <Detail label="Security deposit" value={`₹${selected.securityDeposit.toLocaleString('en-IN')}`} />
                    )}
                    {selected.availableFrom && (
                      <Detail label="Available from" value={new Date(selected.availableFrom).toLocaleDateString()} />
                    )}
                    {selected.preferredTenant && <Detail label="Preferred tenant" value={selected.preferredTenant} />}
                    {selected.petFriendly != null && (
                      <Detail label="Pet friendly" value={selected.petFriendly ? 'Yes' : 'No'} />
                    )}
                    {selected.maintenanceCharges != null && (
                      <Detail label="Maintenance / mo" value={`₹${selected.maintenanceCharges.toLocaleString('en-IN')}`} />
                    )}
                    {selected.leaseDuration != null && (
                      <Detail label="Lease duration" value={`${selected.leaseDuration} months`} />
                    )}
                    {selected.lockInPeriod != null && <Detail label="Lock-in period" value={`${selected.lockInPeriod} months`} />}
                    {selected.camCharges != null && (
                      <Detail label="CAM charges / mo" value={`₹${selected.camCharges.toLocaleString('en-IN')}`} />
                    )}
                  </>
                )}

                {/* Allowed Use is a property of the land, so it shows for any
                    plot rather than only inside the rent details */}
                {selected.plotAllowedUse && <Detail label="Plot allowed use" value={selected.plotAllowedUse} />}
              </div>

              {selected.description && (
                <div className="mt-6">
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete">Description</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{selected.description}</p>
                </div>
              )}

              <LocationBlock lat={selected.lat} lng={selected.lng} />
              <Gallery title="Photos" publicIds={selected.images ?? []} filePrefix={selected.title} />
              <Gallery
                title="Floor plan"
                publicIds={selected.floorPlanUrl ? [selected.floorPlanUrl] : []}
                filePrefix={`${selected.title}-floor-plan`}
              />

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
              <h2 className="mb-5 font-display text-xl font-semibold text-ink">Edit property</h2>
              {editError && <p className="mb-4 text-sm text-red-600">{editError}</p>}

              <div className="flex flex-col gap-4">
                <div>
                  <Label>Property title *</Label>
                  <Input required value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                </div>

                <div className={`grid gap-4 ${isPlot ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  <div>
                    <Label>Property type *</Label>
                    <Select required value={editPropertyType} onChange={(e) => setEditPropertyType(e.target.value)}>
                      {PROPERTY_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </Select>
                  </div>
                  {/* Listing type doesn't apply to bare land — plots are recorded as Sale */}
                  {!isPlot && (
                    <div>
                      <Label>Listing type *</Label>
                      <Select required value={editListingType} onChange={(e) => setEditListingType(e.target.value)}>
                        {LISTING_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}
                </div>

                <div className={`grid gap-4 ${isPlot || editPropertyType === 'Commercial' ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  {/* BHK doesn't apply to land or commercial space */}
                  {!isPlot && editPropertyType !== 'Commercial' && (
                    <div>
                      <Label>BHK</Label>
                      <Input type="number" value={editBhk} onChange={(e) => setEditBhk(e.target.value)} />
                    </div>
                  )}
                  <div>
                    <Label>Price (INR) *</Label>
                    <Input type="number" required value={editPriceInr} onChange={(e) => setEditPriceInr(e.target.value)} />
                  </div>
                  <div>
                    <Label>Price label *</Label>
                    <Input required value={editPriceLabel} onChange={(e) => setEditPriceLabel(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Area (sq ft)</Label>
                    <Input type="number" value={editAreaSqft} onChange={(e) => setEditAreaSqft(e.target.value)} />
                  </div>
                  <div>
                    <Label>Locality *</Label>
                    <Input required value={editLocality} onChange={(e) => setEditLocality(e.target.value)} />
                  </div>
                  <div>
                    <Label>City *</Label>
                    <Input required value={editCity} onChange={(e) => setEditCity(e.target.value)} />
                  </div>
                </div>

                {/* Construction status and furnishing don't apply to bare land */}
                {!isPlot && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Status *</Label>
                      <Select required value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                        {PROPERTY_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label>Furnishing status</Label>
                      <Select value={editFurnishing} onChange={(e) => setEditFurnishing(e.target.value)}>
                        <option value="">None</option>
                        {FURNISHING_TYPES.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                )}

                {/* Allowed Use describes the land itself, not a rental agreement,
                    so it shows for any plot rather than only for rented ones */}
                {isPlot && (
                  <div>
                    <Label>Plot allowed use</Label>
                    <Select value={editPlotAllowedUse} onChange={(e) => setEditPlotAllowedUse(e.target.value)}>
                      <option value="">None</option>
                      {PLOT_ALLOWED_USE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                <div>
                  <Label>Full address</Label>
                  <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>RERA number</Label>
                    <Input value={editReraNumber} onChange={(e) => setEditReraNumber(e.target.value)} />
                  </div>
                  <div>
                    <Label>Latitude</Label>
                    <Input type="number" step="any" value={editLat} onChange={(e) => setEditLat(e.target.value)} />
                  </div>
                  <div>
                    <Label>Longitude</Label>
                    <Input type="number" step="any" value={editLng} onChange={(e) => setEditLng(e.target.value)} />
                  </div>
                </div>

                <p className="mt-2 border-b border-ink/10 pb-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete">
                  Owner contact — internal only, never shown on the public website
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Owner name</Label>
                    <Input value={editOwnerName} onChange={(e) => setEditOwnerName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Owner phone</Label>
                    <Input value={editOwnerPhone} onChange={(e) => setEditOwnerPhone(e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="min-h-20"
                  />
                </div>
                <div>
                  <Label>Cloudinary image IDs (comma-separated)</Label>
                  <Input value={editImages} onChange={(e) => setEditImages(e.target.value)} />
                </div>
                <div>
                  <Label>Floor plan URL / ID</Label>
                  <Input value={editFloorPlanUrl} onChange={(e) => setEditFloorPlanUrl(e.target.value)} />
                </div>

                {editListingType === 'Rent' && (
                  <>
                    <p className="mt-2 border-b border-ink/10 pb-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete">
                      Rent specifics
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Security deposit</Label>
                        <Input
                          type="number"
                          value={editSecurityDeposit}
                          onChange={(e) => setEditSecurityDeposit(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Available from</Label>
                        <Input
                          placeholder="YYYY-MM-DD"
                          value={editAvailableFrom}
                          onChange={(e) => setEditAvailableFrom(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Preferred tenant</Label>
                        <Select value={editPreferredTenant} onChange={(e) => setEditPreferredTenant(e.target.value)}>
                          <option value="">None</option>
                          {PREFERRED_TENANT_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Maintenance charges</Label>
                        <Input
                          type="number"
                          value={editMaintenanceCharges}
                          onChange={(e) => setEditMaintenanceCharges(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Lease duration (months)</Label>
                        <Input type="number" value={editLeaseDuration} onChange={(e) => setEditLeaseDuration(e.target.value)} />
                      </div>
                      <div>
                        <Label>Lock-in period (months)</Label>
                        <Input type="number" value={editLockInPeriod} onChange={(e) => setEditLockInPeriod(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 items-end gap-4">
                      <div>
                        <Label>CAM charges</Label>
                        <Input type="number" value={editCamCharges} onChange={(e) => setEditCamCharges(e.target.value)} />
                      </div>
                      <label className="flex cursor-pointer items-center gap-2 pb-2.5 text-sm text-ink">
                        <input
                          type="checkbox"
                          checked={editPetFriendly}
                          onChange={(e) => setEditPetFriendly(e.target.checked)}
                          className="h-4 w-4 cursor-pointer accent-ochre"
                        />
                        Pet friendly
                      </label>
                    </div>
                  </>
                )}

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
