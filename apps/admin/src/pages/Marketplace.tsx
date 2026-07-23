import { useEffect, useState, useMemo, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Loader2, Plus, X } from 'lucide-react'
import { adminApi } from '../lib/adminApi'
import { cldAuto } from '../lib/cloudinary'
import type { Material, EquipmentRental, ServiceProvider } from '@carry/shared'
import { EASE_OUT_EXPO } from '../lib/motion'
import { Badge, Button, Card, CardGrid, DetailModal, DetailRow, EmptyState, FormPanel, Input, Label, LoadingState, PageHeader, Select, StatusToggle, Textarea } from '../components/ui'

type SectionTab = 'materials' | 'equipment' | 'providers'

function formatCurrency(val: number | null) {
  if (val === null) return 'N/A'
  return `₹${val.toLocaleString('en-IN')}`
}

export default function Marketplace() {
  const [activeTab, setActiveTab] = useState<SectionTab>('materials')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const [materials, setMaterials] = useState<Material[]>([])
  const [equipment, setEquipment] = useState<EquipmentRental[]>([])
  const [providers, setProviders] = useState<ServiceProvider[]>([])

  const [uploading, setUploading] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  const [matCategory, setMatCategory] = useState('Cement')
  const [matBrand, setMatBrand] = useState('')
  const [matPrice, setMatPrice] = useState('')
  const [matUnit, setMatUnit] = useState('per bag')
  const [matAvailable, setMatAvailable] = useState(true)

  const [eqCategory, setEqCategory] = useState('Earthmoving')
  const [eqRentPerDay, setEqRentPerDay] = useState('')
  const [eqSpecs, setEqSpecs] = useState('')
  const [eqAvailable, setEqAvailable] = useState(true)

  const [spRole, setSpRole] = useState('Labour')
  const [spPhone, setSpPhone] = useState('')
  const [spEmail, setSpEmail] = useState('')
  const [spCity, setSpCity] = useState('Patna')
  const [spLocality, setSpLocality] = useState('')
  const [spExperienceYears, setSpExperienceYears] = useState('')
  const [spSpecialties, setSpSpecialties] = useState('')
  const [spMinimumRate, setSpMinimumRate] = useState('')
  const [spRateUnit, setSpRateUnit] = useState('per day')
  const [spReviewStatus, setSpReviewStatus] = useState('approved')

  const [searchQuery, setSearchQuery] = useState('')

  const [viewMaterial, setViewMaterial] = useState<Material | null>(null)
  const [viewEquipment, setViewEquipment] = useState<EquipmentRental | null>(null)
  const [viewProvider, setViewProvider] = useState<ServiceProvider | null>(null)

  function loadData() {
    setLoading(true)
    setError('')
    const promises = [
      adminApi.listMaterials().then(setMaterials).catch((err) => { console.error('Failed to load materials', err) }),
      adminApi.listEquipmentRentalsAdmin().then(setEquipment).catch((err) => { console.error('Failed to load equipment', err) }),
      adminApi.listServiceProvidersAdmin().then(setProviders).catch((err) => { console.error('Failed to load providers', err) }),
    ]
    Promise.all(promises).finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  function resetForm() {
    setEditId(null)
    setName('')
    setDescription('')
    setImageUrl('')

    setMatCategory('Cement')
    setMatBrand('')
    setMatPrice('')
    setMatUnit('per bag')
    setMatAvailable(true)

    setEqCategory('Earthmoving')
    setEqRentPerDay('')
    setEqSpecs('')
    setEqAvailable(true)

    setSpRole('Labour')
    setSpPhone('')
    setSpEmail('')
    setSpCity('Patna')
    setSpLocality('')
    setSpExperienceYears('')
    setSpSpecialties('')
    setSpMinimumRate('')
    setSpRateUnit('per day')
    setSpReviewStatus('approved')

    setError('')
  }

  function handleAddNewClick() {
    resetForm()
    setShowForm((v) => !v)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError('')

    try {
      const sigData = await adminApi.getUploadSignature()
      const file = files[0]

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
      setImageUrl(cldAuto(data.secure_url))
      setSuccess('Image uploaded successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to upload image.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function toggleAvailability(id: string, currentVal: boolean, type: 'material' | 'equipment') {
    try {
      if (type === 'material') {
        await adminApi.updateMaterial(id, { available: !currentVal })
        setMaterials((prev) => prev.map((item) => item.id === id ? { ...item, available: !currentVal } : item))
      } else {
        await adminApi.updateEquipmentRental(id, { available: !currentVal })
        setEquipment((prev) => prev.map((item) => item.id === id ? { ...item, available: !currentVal } : item))
      }
      setSuccess('Availability updated successfully!')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      console.error('Failed to update status', err)
      setError('Could not update availability status.')
    }
  }

  async function toggleProviderStatus(id: string, currentVal: string) {
    const newVal = currentVal === 'approved' ? 'pending' : 'approved'
    try {
      await adminApi.updateServiceProvider(id, { reviewStatus: newVal })
      setProviders((prev) => prev.map((item) => item.id === id ? { ...item, reviewStatus: newVal } : item))
      setSuccess('Provider status updated successfully!')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      console.error('Failed to update provider status', err)
      setError('Could not update status.')
    }
  }

  async function handleDelete(id: string, itemName: string) {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) return
    setBusy(true)
    setError('')
    try {
      if (activeTab === 'materials') {
        await adminApi.deleteMaterial(id)
        setMaterials((prev) => prev.filter((item) => item.id !== id))
      } else if (activeTab === 'equipment') {
        await adminApi.deleteEquipmentRental(id)
        setEquipment((prev) => prev.filter((item) => item.id !== id))
      } else {
        await adminApi.deleteServiceProvider(id)
        setProviders((prev) => prev.filter((item) => item.id !== id))
      }
      setSuccess('Item deleted successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error(err)
      setError('Failed to delete the item.')
    } finally {
      setBusy(false)
    }
  }

  function triggerEdit(item: any) {
    resetForm()
    setEditId(item.id)
    setName(item.name)
    setDescription(item.description || '')

    if (activeTab === 'materials') {
      const mat = item as Material
      setMatCategory(mat.category)
      setMatBrand(mat.brand)
      setMatPrice(mat.price?.toString() ?? '')
      setMatUnit(mat.unit ?? 'per bag')
      setMatAvailable(mat.available)
      setImageUrl(mat.imageUrl || '')
    } else if (activeTab === 'equipment') {
      const eq = item as EquipmentRental
      setEqCategory(eq.category)
      setEqRentPerDay(eq.rentPerDay.toString())
      setEqSpecs(eq.specs?.join(', ') ?? '')
      setEqAvailable(eq.available)
      setImageUrl(eq.imageUrl || '')
    } else {
      const sp = item as ServiceProvider
      setSpRole(sp.role)
      setSpPhone(sp.phone)
      setSpEmail(sp.email || '')
      setSpCity(sp.city)
      setSpLocality(sp.locality || '')
      setSpExperienceYears(sp.experienceYears?.toString() ?? '')
      setSpSpecialties(sp.specialties?.join(', ') ?? '')
      setSpMinimumRate(sp.minimumRate?.toString() ?? '')
      setSpRateUnit(sp.rateUnit ?? 'per day')
      setSpReviewStatus(sp.reviewStatus)
      setImageUrl(sp.profilePhotoUrl || '')
    }

    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setSuccess('')

    try {
      if (activeTab === 'materials') {
        const payload = {
          name,
          category: matCategory,
          brand: matBrand,
          description: description || null,
          imageUrl: imageUrl || null,
          price: matPrice ? parseInt(matPrice, 10) : null,
          unit: matUnit || null,
          available: matAvailable,
        }

        if (editId) {
          const updated = await adminApi.updateMaterial(editId, payload)
          setMaterials((prev) => prev.map((x) => x.id === editId ? updated : x))
          setSuccess('Material updated successfully!')
        } else {
          const created = await adminApi.createMaterial(payload)
          setMaterials((prev) => [created, ...prev])
          setSuccess('Material created successfully!')
        }
      } else if (activeTab === 'equipment') {
        const payload = {
          name,
          category: eqCategory,
          description: description || null,
          imageUrl: imageUrl || null,
          rentPerDay: parseInt(eqRentPerDay, 10),
          specs: eqSpecs.split(',').map((s) => s.trim()).filter(Boolean),
          available: eqAvailable,
        }

        if (editId) {
          const updated = await adminApi.updateEquipmentRental(editId, payload)
          setEquipment((prev) => prev.map((x) => x.id === editId ? updated : x))
          setSuccess('Equipment updated successfully!')
        } else {
          const created = await adminApi.createEquipmentRental(payload)
          setEquipment((prev) => [created, ...prev])
          setSuccess('Equipment created successfully!')
        }
      } else {
        const payload = {
          name,
          role: spRole,
          phone: spPhone,
          email: spEmail || null,
          city: spCity,
          locality: spLocality || null,
          experienceYears: spExperienceYears ? parseInt(spExperienceYears, 10) : null,
          description: description || null,
          profilePhotoUrl: imageUrl || null,
          specialties: spSpecialties.split(',').map((s) => s.trim()).filter(Boolean),
          minimumRate: spMinimumRate ? parseInt(spMinimumRate, 10) : null,
          rateUnit: spRateUnit || null,
          reviewStatus: spReviewStatus,
        }

        if (editId) {
          const updated = await adminApi.updateServiceProvider(editId, payload)
          setProviders((prev) => prev.map((x) => x.id === editId ? updated : x))
          setSuccess('Service Provider updated successfully!')
        } else {
          const created = await adminApi.createServiceProvider(payload)
          setProviders((prev) => [created, ...prev])
          setSuccess('Service Provider created successfully!')
        }
      }

      resetForm()
      setShowForm(false)
    } catch (err: any) {
      console.error(err)
      setError('Could not save listing. Please check the fields and try again.')
    } finally {
      setBusy(false)
    }
  }

  const filteredMaterials = useMemo(() => {
    return materials.filter(
      (m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [materials, searchQuery])

  const filteredEquipment = useMemo(() => {
    return equipment.filter(
      (e) =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [equipment, searchQuery])

  const filteredProviders = useMemo(() => {
    return providers.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.city.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [providers, searchQuery])

  const addLabel = activeTab === 'materials' ? 'Material' : activeTab === 'equipment' ? 'Equipment' : 'Provider'

  return (
    <div>
      <PageHeader
        title="Marketplace Management"
        subtitle={
          <>
            {activeTab === 'materials' && `${filteredMaterials.length} materials listed`}
            {activeTab === 'equipment' && `${filteredEquipment.length} equipment units listed`}
            {activeTab === 'providers' && `${filteredProviders.length} service providers registered`}
          </>
        }
        actions={
          <Button
            variant={showForm ? 'outline' : 'primary'}
            icon={showForm ? <X className="h-3.5 w-3.5" strokeWidth={2} /> : <Plus className="h-3.5 w-3.5" strokeWidth={2} />}
            onClick={handleAddNewClick}
          >
            {showForm ? 'Cancel / Close' : editId ? 'Edit Listing' : `Add ${addLabel}`}
          </Button>
        }
      />

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 border-l-4 border-red-500 bg-red-50 p-4 font-mono text-xs text-red-700"
          >
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 border-l-4 border-teal bg-teal/5 p-4 font-mono text-xs text-teal"
          >
            <p>{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <FormPanel onSubmit={handleSubmit} className="mb-10">
            <h2 className="mb-6 border-b border-ink/5 pb-2 font-display text-lg font-bold text-ink">
              {editId ? `Edit ${name}` : `Add New ${addLabel === 'Provider' ? 'Service Provider' : addLabel}`}
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ultratech Cement Premium, JCB Excavator 3DX" />
              </div>

              {activeTab === 'materials' && (
                <>
                  <div>
                    <Label>Category</Label>
                    <Select value={matCategory} onChange={(e) => setMatCategory(e.target.value)}>
                      {['Cement', 'Steel', 'Bricks', 'Sand', 'Aggregate', 'Flooring', 'Glass', 'Other'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Brand</Label>
                    <Input required value={matBrand} onChange={(e) => setMatBrand(e.target.value)} placeholder="e.g. Ultratech, Tata Tiscon" />
                  </div>
                  <div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Price (INR)</Label>
                        <Input type="number" value={matPrice} onChange={(e) => setMatPrice(e.target.value)} placeholder="e.g. 420" />
                      </div>
                      <div>
                        <Label>Unit</Label>
                        <Input value={matUnit} onChange={(e) => setMatUnit(e.target.value)} placeholder="e.g. per bag, per ton" />
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1 flex items-center gap-2 py-2 md:col-span-2">
                    <input type="checkbox" id="matAvailable" checked={matAvailable} onChange={(e) => setMatAvailable(e.target.checked)} className="h-4 w-4 border-ink/20 accent-ochre" />
                    <label htmlFor="matAvailable" className="cursor-pointer select-none font-mono text-xs text-ink-soft">
                      Is available / In stock
                    </label>
                  </div>
                </>
              )}

              {activeTab === 'equipment' && (
                <>
                  <div>
                    <Label>Category</Label>
                    <Select value={eqCategory} onChange={(e) => setEqCategory(e.target.value)}>
                      {['Earthmoving', 'Concrete', 'Scaffolding', 'Lifting', 'Power Tools', 'Other'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Rent per Day (INR)</Label>
                    <Input required type="number" value={eqRentPerDay} onChange={(e) => setEqRentPerDay(e.target.value)} placeholder="e.g. 5000" />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <Label>Specs (comma-separated)</Label>
                    <Textarea className="min-h-[60px]" value={eqSpecs} onChange={(e) => setEqSpecs(e.target.value)} placeholder="e.g. Weight: 8 Tonnes, Engine: 74 HP, Max Dig Depth: 4.7m" />
                  </div>
                  <div className="col-span-1 flex items-center gap-2 py-2 md:col-span-2">
                    <input type="checkbox" id="eqAvailable" checked={eqAvailable} onChange={(e) => setEqAvailable(e.target.checked)} className="h-4 w-4 border-ink/20 accent-ochre" />
                    <label htmlFor="eqAvailable" className="cursor-pointer select-none font-mono text-xs text-ink-soft">
                      Is available for rent
                    </label>
                  </div>
                </>
              )}

              {activeTab === 'providers' && (
                <>
                  <div>
                    <Label>Role</Label>
                    <Select value={spRole} onChange={(e) => setSpRole(e.target.value)}>
                      {['Labour', 'Contractor', 'Civil Engineer', 'Architect', 'Electrician', 'Plumber', 'Painter', 'Mason', 'Carpenter'].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input required value={spPhone} onChange={(e) => setSpPhone(e.target.value)} placeholder="e.g. +91 98765 43210" />
                  </div>
                  <div>
                    <Label>Email (Optional)</Label>
                    <Input type="email" value={spEmail} onChange={(e) => setSpEmail(e.target.value)} placeholder="e.g. info@provider.com" />
                  </div>
                  <div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>City</Label>
                        <Input required value={spCity} onChange={(e) => setSpCity(e.target.value)} placeholder="e.g. Patna" />
                      </div>
                      <div>
                        <Label>Locality (Optional)</Label>
                        <Input value={spLocality} onChange={(e) => setSpLocality(e.target.value)} placeholder="e.g. Raja Bazar" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>Experience (Years)</Label>
                    <Input type="number" value={spExperienceYears} onChange={(e) => setSpExperienceYears(e.target.value)} placeholder="e.g. 5" />
                  </div>
                  <div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Minimum Rate (INR)</Label>
                        <Input type="number" value={spMinimumRate} onChange={(e) => setSpMinimumRate(e.target.value)} placeholder="e.g. 800" />
                      </div>
                      <div>
                        <Label>Rate Unit</Label>
                        <Input value={spRateUnit} onChange={(e) => setSpRateUnit(e.target.value)} placeholder="e.g. per day, per sqft" />
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <Label>Specialties (comma-separated)</Label>
                    <Textarea className="min-h-[60px]" value={spSpecialties} onChange={(e) => setSpSpecialties(e.target.value)} placeholder="e.g. Tile Laying, Plastering, Brickwork" />
                  </div>
                  <div>
                    <Label>Approval Status / Availability</Label>
                    <Select value={spReviewStatus} onChange={(e) => setSpReviewStatus(e.target.value)}>
                      <option value="approved">Approved (Visible)</option>
                      <option value="pending">Pending (Hidden)</option>
                      <option value="rejected">Rejected (Hidden)</option>
                    </Select>
                  </div>
                </>
              )}

              <div className="col-span-1 md:col-span-2">
                <Label>Description</Label>
                <Textarea className="min-h-[80px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide listing details, grade information, specifications, etc." />
              </div>

              <div className="col-span-1 border-t border-ink/5 pt-4 md:col-span-2">
                <Label>{activeTab === 'providers' ? 'Profile Photo' : 'Product Image'}</Label>
                <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="inline-flex cursor-pointer items-center gap-2 border border-ink/20 bg-bone-dim px-4 py-2 font-mono text-[0.7rem] uppercase tracking-wider text-ink-soft transition-colors hover:border-ink hover:bg-bone hover:text-ink">
                    {uploading ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                        Uploading…
                      </span>
                    ) : (
                      'Choose File / Upload'
                    )}
                    <input type="file" accept="image/*" disabled={uploading} onChange={handleFileUpload} className="hidden" />
                  </label>

                  {imageUrl ? (
                    <div className="flex items-center gap-3">
                      <img src={cldAuto(imageUrl)} alt="Uploaded preview" className="h-14 w-20 border border-ink/15 object-cover" />
                      <button type="button" onClick={() => setImageUrl('')} className="font-mono text-[0.62rem] uppercase tracking-wider text-red-600 transition-colors hover:text-red-800">
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <span className="font-mono text-xs text-concrete">No image uploaded. Fallback placeholders will be used.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t border-ink/5 pt-4">
              <Button type="button" variant="ghost" onClick={resetForm}>Reset</Button>
              <Button type="submit" busy={busy}>{editId ? 'Save Changes' : 'Create Listing'}</Button>
            </div>
          </FormPanel>
        )}
      </AnimatePresence>

      <div className="relative mb-6 flex border-b border-ink/15 text-xs sm:text-sm">
        {(['materials', 'equipment', 'providers'] as SectionTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              setSearchQuery('')
              setShowForm(false)
              setEditId(null)
            }}
            className={`relative cursor-pointer px-4 py-3 font-mono uppercase tracking-[0.15em] transition-colors sm:px-6 ${
              activeTab === tab ? 'text-ink font-semibold' : 'text-concrete hover:text-ink'
            }`}
          >
            {tab === 'materials' && 'Materials'}
            {tab === 'equipment' && 'Equipment Rentals'}
            {tab === 'providers' && 'Service Providers'}
            {activeTab === tab && (
              <motion.span layoutId="marketplace-tab-indicator" transition={{ duration: 0.3, ease: EASE_OUT_EXPO }} className="absolute inset-x-0 -bottom-px h-0.5 bg-ochre" />
            )}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <Input
          type="text"
          placeholder={`Search ${activeTab === 'materials' ? 'materials by name or brand' : activeTab === 'equipment' ? 'equipment by name or category' : 'providers by name or role'}…`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md"
        />
      </div>

      {loading ? (
        <LoadingState label="Fetching marketplace listings…" />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}>
            {activeTab === 'materials' && (
              filteredMaterials.length === 0 ? (
                <EmptyState>No materials found matching your criteria.</EmptyState>
              ) : (
                <CardGrid>
                  <AnimatePresence mode="popLayout">
                    {filteredMaterials.map((mat) => (
                      <Card key={mat.id}>
                        <div>
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <Badge tone="ink">{mat.category}</Badge>
                            <StatusToggle
                              active={mat.available}
                              onClick={() => toggleAvailability(mat.id, mat.available, 'material')}
                              activeLabel="Available"
                              inactiveLabel="Out of stock"
                            />
                          </div>

                          {mat.imageUrl ? (
                            <img src={cldAuto(mat.imageUrl)} alt={mat.name} className="mb-3 h-32 w-full border border-ink/5 object-cover" />
                          ) : (
                            <div className="mb-3 flex h-32 w-full items-center justify-center border border-ink/5 bg-bone-dim font-mono text-xs text-concrete">
                              No Image Provided
                            </div>
                          )}

                          <h3 className="line-clamp-1 font-display text-base font-bold text-ink">{mat.name}</h3>
                          <p className="mt-0.5 font-mono text-[0.65rem] uppercase text-concrete">Brand: {mat.brand}</p>
                          <p className="mt-2 line-clamp-2 min-h-[2rem] text-xs text-ink-soft">{mat.description || 'No description provided.'}</p>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-ink/5 pt-3">
                          <div>
                            <span className="block font-mono text-[0.58rem] uppercase tracking-wider text-concrete">Price</span>
                            <span className="font-mono text-sm font-bold text-ink">
                              {formatCurrency(mat.price)}
                              {mat.unit && <span className="text-[0.65rem] font-normal text-concrete"> / {mat.unit}</span>}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setViewMaterial(mat)} className="cursor-pointer font-mono text-xs uppercase tracking-wider text-teal transition-colors hover:text-ink">View</button>
                            <button onClick={() => triggerEdit(mat)} className="cursor-pointer font-mono text-xs uppercase tracking-wider text-ink transition-colors hover:text-ochre">Edit</button>
                            <button onClick={() => handleDelete(mat.id, mat.name)} className="cursor-pointer font-mono text-xs uppercase tracking-wider text-ochre-dark transition-colors hover:text-ink">Delete</button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </AnimatePresence>
                </CardGrid>
              )
            )}

            {activeTab === 'equipment' && (
              filteredEquipment.length === 0 ? (
                <EmptyState>No rental equipment found matching your criteria.</EmptyState>
              ) : (
                <CardGrid>
                  <AnimatePresence mode="popLayout">
                    {filteredEquipment.map((eq) => (
                      <Card key={eq.id}>
                        <div>
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <Badge tone="ink">{eq.category}</Badge>
                            <StatusToggle
                              active={eq.available}
                              onClick={() => toggleAvailability(eq.id, eq.available, 'equipment')}
                              activeLabel="Available"
                              inactiveLabel="Unavailable"
                            />
                          </div>

                          {eq.imageUrl ? (
                            <img src={cldAuto(eq.imageUrl)} alt={eq.name} className="mb-3 h-32 w-full border border-ink/5 object-cover" />
                          ) : (
                            <div className="mb-3 flex h-32 w-full items-center justify-center border border-ink/5 bg-bone-dim font-mono text-xs text-concrete">
                              No Image Provided
                            </div>
                          )}

                          <h3 className="line-clamp-1 font-display text-base font-bold text-ink">{eq.name}</h3>

                          {eq.specs && eq.specs.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {eq.specs.slice(0, 3).map((spec, i) => (
                                <span key={i} className="bg-bone-dim px-1.5 py-0.5 font-mono text-[0.58rem] text-ink-soft">{spec}</span>
                              ))}
                            </div>
                          )}

                          <p className="mt-2 line-clamp-2 min-h-[2rem] text-xs text-ink-soft">{eq.description || 'No description provided.'}</p>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-ink/5 pt-3">
                          <div>
                            <span className="block font-mono text-[0.58rem] uppercase tracking-wider text-concrete">Rent Cost</span>
                            <span className="font-mono text-sm font-bold text-ink">
                              {formatCurrency(eq.rentPerDay)}
                              <span className="text-[0.65rem] font-normal text-concrete"> / day</span>
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setViewEquipment(eq)} className="cursor-pointer font-mono text-xs uppercase tracking-wider text-teal transition-colors hover:text-ink">View</button>
                            <button onClick={() => triggerEdit(eq)} className="cursor-pointer font-mono text-xs uppercase tracking-wider text-ink transition-colors hover:text-ochre">Edit</button>
                            <button onClick={() => handleDelete(eq.id, eq.name)} className="cursor-pointer font-mono text-xs uppercase tracking-wider text-ochre-dark transition-colors hover:text-ink">Delete</button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </AnimatePresence>
                </CardGrid>
              )
            )}

            {activeTab === 'providers' && (
              filteredProviders.length === 0 ? (
                <EmptyState>No service providers found matching your criteria.</EmptyState>
              ) : (
                <CardGrid>
                  <AnimatePresence mode="popLayout">
                    {filteredProviders.map((sp) => (
                      <Card key={sp.id}>
                        <div>
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <Badge tone="ink">{sp.role}</Badge>
                            <StatusToggle
                              active={sp.reviewStatus === 'approved'}
                              onClick={() => toggleProviderStatus(sp.id, sp.reviewStatus)}
                              activeLabel="Approved"
                              inactiveLabel="Pending"
                            />
                          </div>

                          <div className="mb-3 flex gap-3">
                            {sp.profilePhotoUrl ? (
                              <img src={cldAuto(sp.profilePhotoUrl)} alt={sp.name} className="h-12 w-12 rounded-full border border-ink/15 object-cover" />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/15 bg-bone-dim font-mono text-[0.6rem] text-concrete">No Photo</div>
                            )}
                            <div>
                              <h3 className="font-display text-base font-bold leading-tight text-ink">{sp.name}</h3>
                              <p className="font-mono text-[0.62rem] text-concrete">{sp.city}{sp.locality ? `, ${sp.locality}` : ''}</p>
                              <p className="mt-0.5 font-mono text-[0.58rem] text-concrete">Exp: {sp.experienceYears ?? 0} Years</p>
                            </div>
                          </div>

                          <div className="space-y-0.5 font-mono text-[0.65rem] text-ink-soft">
                            <p>{sp.phone}</p>
                            {sp.email && <p>{sp.email}</p>}
                          </div>

                          {sp.specialties && sp.specialties.length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-1">
                              {sp.specialties.map((spec, i) => (
                                <span key={i} className="bg-bone-dim px-1.5 py-0.5 font-mono text-[0.58rem] text-concrete">{spec}</span>
                              ))}
                            </div>
                          )}

                          <p className="mt-2.5 line-clamp-2 min-h-[2rem] text-xs text-ink-soft">{sp.description || 'No description provided.'}</p>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-ink/5 pt-3">
                          <div>
                            <span className="block font-mono text-[0.58rem] uppercase tracking-wider text-concrete">Minimum Rate</span>
                            <span className="font-mono text-sm font-bold text-ink">
                              {formatCurrency(sp.minimumRate)}
                              {sp.rateUnit && <span className="text-[0.65rem] font-normal text-concrete"> / {sp.rateUnit}</span>}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setViewProvider(sp)} className="cursor-pointer font-mono text-xs uppercase tracking-wider text-teal transition-colors hover:text-ink">View</button>
                            <button onClick={() => triggerEdit(sp)} className="cursor-pointer font-mono text-xs uppercase tracking-wider text-ink transition-colors hover:text-ochre">Edit</button>
                            <button onClick={() => handleDelete(sp.id, sp.name)} className="cursor-pointer font-mono text-xs uppercase tracking-wider text-ochre-dark transition-colors hover:text-ink">Delete</button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </AnimatePresence>
                </CardGrid>
              )
            )}
          </motion.div>
        </AnimatePresence>
      )}

      <AnimatePresence>
        {viewMaterial && (
          <DetailModal
            title={viewMaterial.name}
            imageUrl={cldAuto(viewMaterial.imageUrl)}
            imageAlt={viewMaterial.name}
            badge={<Badge tone={viewMaterial.available ? 'teal' : 'concrete'}>{viewMaterial.available ? 'Available' : 'Unavailable'}</Badge>}
            onClose={() => setViewMaterial(null)}
          >
            <DetailRow label="Category" value={viewMaterial.category} />
            <DetailRow label="Brand" value={viewMaterial.brand} />
            <DetailRow
              label="Price"
              value={
                <>
                  {formatCurrency(viewMaterial.price)}
                  {viewMaterial.unit && <span className="text-concrete"> / {viewMaterial.unit}</span>}
                </>
              }
            />
            <div className="col-span-2">
              <DetailRow label="Description" value={viewMaterial.description} />
            </div>
          </DetailModal>
        )}

        {viewEquipment && (
          <DetailModal
            title={viewEquipment.name}
            imageUrl={cldAuto(viewEquipment.imageUrl)}
            imageAlt={viewEquipment.name}
            badge={<Badge tone={viewEquipment.available ? 'teal' : 'concrete'}>{viewEquipment.available ? 'Available' : 'Unavailable'}</Badge>}
            onClose={() => setViewEquipment(null)}
          >
            <DetailRow label="Category" value={viewEquipment.category} />
            <DetailRow label="Rent" value={`${formatCurrency(viewEquipment.rentPerDay)} / day`} />
            {viewEquipment.specs.length > 0 && (
              <div className="col-span-2">
                <DetailRow label="Specs" value={viewEquipment.specs.join(', ')} />
              </div>
            )}
            <div className="col-span-2">
              <DetailRow label="Description" value={viewEquipment.description} />
            </div>
          </DetailModal>
        )}

        {viewProvider && (
          <DetailModal
            title={viewProvider.name}
            imageUrl={cldAuto(viewProvider.profilePhotoUrl)}
            imageAlt={viewProvider.name}
            badge={<Badge tone="ochre">{viewProvider.role}</Badge>}
            onClose={() => setViewProvider(null)}
          >
            <DetailRow label="Phone" value={viewProvider.phone} />
            <DetailRow label="Email" value={viewProvider.email} />
            <DetailRow label="City" value={viewProvider.city} />
            <DetailRow label="Locality" value={viewProvider.locality} />
            <DetailRow label="Experience" value={viewProvider.experienceYears ? `${viewProvider.experienceYears} yrs` : null} />
            <DetailRow label="Rating" value={viewProvider.rating ? viewProvider.rating.toFixed(1) : null} />
            <DetailRow
              label="Rate"
              value={viewProvider.minimumRate ? `${formatCurrency(viewProvider.minimumRate)}${viewProvider.rateUnit ? ` / ${viewProvider.rateUnit}` : ''}` : null}
            />
            <DetailRow label="Status" value={viewProvider.reviewStatus} />
            {viewProvider.specialties.length > 0 && (
              <div className="col-span-2">
                <DetailRow label="Specialties" value={viewProvider.specialties.join(', ')} />
              </div>
            )}
            <div className="col-span-2">
              <DetailRow label="Description" value={viewProvider.description} />
            </div>
          </DetailModal>
        )}
      </AnimatePresence>
    </div>
  )
}
