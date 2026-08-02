import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Check, Eye, Pencil, Trash2 } from 'lucide-react'
import { getAuthToken } from '../../../shared/lib/adminApi'
import { fieldOpsApi } from '../lib/fieldOpsApi'
import { runMutation } from '../lib/runMutation'
import { img } from '../lib/img'
import { GENDERS, REVIEW_STATUSES, SKILL_TYPES } from '../lib/constants'
import type { Labour as LabourRecord, Paginated } from '../lib/types'
import { Detail, ReviewBadge } from '../components/RecordParts'
import {
  Button,
  Card,
  CardGrid,
  Combobox,
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
  gender: string
  skillLevel: string
  skillType: string
  city: string
}

const LIMIT = 20

const EMPTY_FILTERS: FilterState = {
  agentId: '',
  reviewStatus: '',
  gender: '',
  skillLevel: '',
  skillType: '',
  city: '',
}

/** Street-level address, assembled only from the parts that are filled in. */
function fullAddress(l: LabourRecord) {
  return [l.houseNo, l.street, l.locality, l.city, l.pincode].filter(Boolean).join(', ')
}

export default function Labour() {
  const [items, setItems] = useState<LabourRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<LabourRecord | null>(null)
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)

  // Edit modal
  const [editId, setEditId] = useState<string | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editAge, setEditAge] = useState('')
  const [editGender, setEditGender] = useState('')
  const [editSkillLevel, setEditSkillLevel] = useState('')
  const [editSkillType, setEditSkillType] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editProfilePhotoUrl, setEditProfilePhotoUrl] = useState('')
  const [editMinimumWage, setEditMinimumWage] = useState('')
  const [editHouseNo, setEditHouseNo] = useState('')
  const [editStreet, setEditStreet] = useState('')
  const [editLocality, setEditLocality] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editPincode, setEditPincode] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const buildQuery = useCallback((f: FilterState, p: number) => {
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) })
    if (f.agentId) params.set('agentId', f.agentId)
    if (f.reviewStatus) params.set('reviewStatus', f.reviewStatus)
    if (f.gender) params.set('gender', f.gender)
    if (f.skillLevel) params.set('skillLevel', f.skillLevel)
    if (f.skillType) params.set('skillType', f.skillType)
    if (f.city) params.set('city', f.city)
    return `/labour?${params}`
  }, [])

  const fetchData = useCallback(
    async (f: FilterState, p: number) => {
      setLoading(true)
      setError(null)
      try {
        const token = await getAuthToken()
        if (!token) throw new Error('Not authenticated')
        const res = await fieldOpsApi.get<Paginated<LabourRecord>>(buildQuery(f, p), token)
        setItems(res.data)
        setTotal(res.total)
        setPage(p)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch labour records')
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

  function startEdit(l: LabourRecord) {
    setEditId(l.id)
    setEditFullName(l.fullName)
    setEditAge(String(l.age))
    setEditGender(l.gender)
    setEditSkillLevel(l.skillLevel)
    setEditSkillType(l.skillType || '')
    setEditPhone(l.phone)
    setEditProfilePhotoUrl(l.profilePhotoUrl || '')
    setEditMinimumWage(l.minimumWage ? String(l.minimumWage) : '')
    setEditHouseNo(l.houseNo || '')
    setEditStreet(l.street || '')
    setEditLocality(l.locality || '')
    setEditCity(l.city || '')
    setEditPincode(l.pincode || '')
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
      const updated = await fieldOpsApi.patch<LabourRecord>(
        `/labour/${editId}`,
        {
          fullName: editFullName.trim() || undefined,
          age: editAge ? parseInt(editAge, 10) : undefined,
          gender: editGender || undefined,
          skillLevel: editSkillLevel || undefined,
          skillType: editSkillType.trim() || null,
          phone: editPhone.trim() || undefined,
          profilePhotoUrl: editProfilePhotoUrl.trim() || null,
          minimumWage: editMinimumWage ? parseInt(editMinimumWage, 10) : null,
          houseNo: editHouseNo.trim() || null,
          street: editStreet.trim() || null,
          locality: editLocality.trim() || null,
          city: editCity.trim() || null,
          pincode: editPincode.trim() || null,
        },
        token,
      )
      setItems((prev) => prev.map((l) => (l.id === editId ? updated : l)))
      if (selected?.id === editId) setSelected(updated)
      setEditId(null)
    } catch (err: any) {
      setEditError(err.message || 'Failed to update labour record')
    } finally {
      setEditLoading(false)
    }
  }

  async function markReviewed(id: string) {
    const token = await getAuthToken()
    if (!token) return
    const ok = await runMutation('Failed to mark this record reviewed', () =>
      fieldOpsApi.patch(`/labour/${id}`, { reviewStatus: 'reviewed' }, token),
    )
    if (!ok) return
    setItems((prev) => prev.map((l) => (l.id === id ? { ...l, reviewStatus: 'reviewed' } : l)))
    if (selected?.id === id) setSelected((s) => (s ? { ...s, reviewStatus: 'reviewed' } : s))
  }

  async function deleteRecord(id: string) {
    if (!confirm('Delete this labour record permanently?')) return
    const token = await getAuthToken()
    if (!token) return
    const ok = await runMutation('Failed to delete this record', () => fieldOpsApi.delete(`/labour/${id}`, token))
    if (!ok) return
    setItems((prev) => prev.filter((l) => l.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  return (
    <div>
      <PageHeader title="Servicemen" subtitle={`${total} records`} />

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
        <FilterField label="Gender">
          <Select value={filters.gender} onChange={(e) => applyFilters({ ...filters, gender: e.target.value })}>
            <option value="">All genders</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="Skill level">
          <Select value={filters.skillLevel} onChange={(e) => applyFilters({ ...filters, skillLevel: e.target.value })}>
            <option value="">All skill levels</option>
            <option value="Skilled">Skilled</option>
            <option value="Non-Skilled">Non-Skilled</option>
          </Select>
        </FilterField>
        <FilterField label="Skill type">
          <Select value={filters.skillType} onChange={(e) => applyFilters({ ...filters, skillType: e.target.value })}>
            <option value="">All skills</option>
            {SKILL_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
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
        <LoadingState label="Loading servicemen…" />
      ) : items.length === 0 ? (
        <EmptyState>No servicemen match these filters.</EmptyState>
      ) : (
        <CardGrid>
          {items.map((l) => (
            <Card key={l.id}>
              <div>
                <div className="mb-4 flex items-start gap-3">
                  {l.profilePhotoUrl ? (
                    <img
                      src={img.thumb(l.profilePhotoUrl)}
                      alt={l.fullName}
                      loading="lazy"
                      className="h-12 w-12 shrink-0 border border-ink/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-sand font-mono text-sm text-concrete">
                      {l.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-lg font-semibold text-ink">{l.fullName}</h3>
                    <p className="mt-0.5 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-concrete">
                      {l.skillType || l.skillLevel}
                    </p>
                  </div>
                  <ReviewBadge status={l.reviewStatus} />
                </div>

                <dl className="flex flex-col gap-2 text-sm">
                  <Row label="Age / Gender" value={`${l.age} · ${l.gender}`} />
                  <Row label="Phone" value={l.phone} />
                  <Row label="Wage/day" value={l.minimumWage ? `₹${l.minimumWage.toLocaleString('en-IN')}` : '—'} />
                  <Row label="City" value={l.city || '—'} />
                  <Row label="Agent" value={l.agent?.name || '—'} />
                </dl>
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-ink/10 pt-4">
                <IconButton onClick={() => setSelected(l)} aria-label={`View ${l.fullName}`}>
                  <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
                </IconButton>
                <IconButton onClick={() => startEdit(l)} aria-label={`Edit ${l.fullName}`}>
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
                </IconButton>
                {l.reviewStatus !== 'reviewed' && (
                  <IconButton onClick={() => markReviewed(l.id)} aria-label={`Mark ${l.fullName} reviewed`}>
                    <Check className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </IconButton>
                )}
                <IconButton danger onClick={() => deleteRecord(l.id)} aria-label={`Delete ${l.fullName}`}>
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
              <div className="mb-6 flex items-start gap-4">
                {selected.profilePhotoUrl ? (
                  <img
                    src={img.card(selected.profilePhotoUrl)}
                    alt={selected.fullName}
                    className="h-20 w-20 shrink-0 border border-ink/10 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-sand font-display text-2xl text-concrete">
                    {selected.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="font-display text-2xl font-semibold text-ink">{selected.fullName}</h2>
                  <div className="mt-2">
                    <ReviewBadge status={selected.reviewStatus} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Detail label="Age" value={selected.age} />
                <Detail label="Gender" value={selected.gender} />
                <Detail label="Skill level" value={selected.skillLevel} />
                <Detail label="Skill type" value={selected.skillType || '—'} />
                <Detail
                  label="Phone"
                  mono
                  value={
                    <a href={`tel:${selected.phone}`} className="text-ochre-dark hover:text-ink">
                      {selected.phone}
                    </a>
                  }
                />
                <Detail
                  label="Minimum wage / day"
                  value={selected.minimumWage ? `₹${selected.minimumWage.toLocaleString('en-IN')}` : '—'}
                />
                <div className="col-span-2">
                  <Detail label="Address" value={fullAddress(selected) || '—'} />
                </div>
                <Detail label="Submitted by" value={selected.agent ? `${selected.agent.name} (${selected.agent.email})` : '—'} />
                <Detail label="Created" value={new Date(selected.createdAt).toLocaleString()} />
              </div>

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
          <Modal onClose={() => setEditId(null)} className="max-h-[90vh] max-w-lg overflow-y-auto">
            <form onSubmit={handleEdit} className="p-6">
              <h2 className="mb-5 font-display text-xl font-semibold text-ink">Edit serviceman</h2>
              {editError && <p className="mb-4 text-sm text-red-600">{editError}</p>}

              <div className="flex flex-col gap-4">
                <div>
                  <Label>Full name *</Label>
                  <Input required value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Age *</Label>
                    <Input type="number" required value={editAge} onChange={(e) => setEditAge(e.target.value)} />
                  </div>
                  <div>
                    <Label>Gender *</Label>
                    <Select required value={editGender} onChange={(e) => setEditGender(e.target.value)}>
                      <option value="">Select gender</option>
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Skill level *</Label>
                    <Select required value={editSkillLevel} onChange={(e) => setEditSkillLevel(e.target.value)}>
                      <option value="">Select level</option>
                      <option value="Skilled">Skilled</option>
                      <option value="Non-Skilled">Non-Skilled</option>
                    </Select>
                  </div>
                  {/* Skill type only applies to skilled workers — mirrors the field app. */}
                  {editSkillLevel === 'Skilled' && (
                    <div>
                      <Label>Skill type</Label>
                      <Combobox value={editSkillType} onChange={setEditSkillType} options={[...SKILL_TYPES]} placeholder="Start typing…" />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone *</Label>
                    <Input required value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                  </div>
                  <div>
                    <Label>Minimum wage (per day, INR)</Label>
                    <Input
                      type="number"
                      value={editMinimumWage}
                      onChange={(e) => setEditMinimumWage(e.target.value)}
                      placeholder="e.g. 500"
                    />
                  </div>
                </div>
                <div>
                  <Label>Profile photo URL / Cloudinary public ID</Label>
                  <Input value={editProfilePhotoUrl} onChange={(e) => setEditProfilePhotoUrl(e.target.value)} />
                </div>

                <p className="mt-2 border-b border-ink/10 pb-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete">
                  Address
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>House no</Label>
                    <Input value={editHouseNo} onChange={(e) => setEditHouseNo(e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label>Street</Label>
                    <Input value={editStreet} onChange={(e) => setEditStreet(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Locality</Label>
                    <Input value={editLocality} onChange={(e) => setEditLocality(e.target.value)} />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input value={editCity} onChange={(e) => setEditCity(e.target.value)} />
                  </div>
                  <div>
                    <Label>Pincode</Label>
                    <Input value={editPincode} onChange={(e) => setEditPincode(e.target.value)} />
                  </div>
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
