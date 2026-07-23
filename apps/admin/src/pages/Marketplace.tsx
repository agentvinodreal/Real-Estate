import { useEffect, useState, useMemo, type FormEvent, type ReactNode } from 'react'
import { adminApi } from '../lib/adminApi'
import { cldAuto } from '../lib/cloudinary'
import type { Material, EquipmentRental, ServiceProvider } from '@carry/shared'

type SectionTab = 'materials' | 'equipment' | 'providers'

const fieldClass = 'w-full border border-ink/20 bg-bone px-3 py-2 text-sm text-ink focus:border-ochre focus:outline-none transition-colors'
const labelClass = 'font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete mb-1 block'

// Helper to format currency
function formatCurrency(val: number | null) {
  if (val === null) return 'N/A'
  return `₹${val.toLocaleString('en-IN')}`
}

// Read-only "View" row inside a DetailModal.
function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div>
      <span className={labelClass}>{label}</span>
      <span className="text-sm text-ink">{value}</span>
    </div>
  )
}

// Read-only detail overlay used by the "View" button on materials, equipment,
// and service providers — shows the record as it will appear to customers
// without leaving the admin panel.
function DetailModal({
  title,
  imageUrl,
  imageAlt,
  badge,
  onClose,
  children,
}: {
  title: string
  imageUrl?: string | null
  imageAlt: string
  badge?: ReactNode
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-ink/15 bg-bone shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {imageUrl ? (
          <img src={cldAuto(imageUrl)} alt={imageAlt} className="h-56 w-full object-cover border-b border-ink/10" />
        ) : (
          <div className="flex h-40 w-full items-center justify-center border-b border-ink/10 bg-bone-dim">
            <span className="font-mono text-xs uppercase tracking-wider text-concrete">No Image Provided</span>
          </div>
        )}
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
            {badge}
          </div>
          <div className="grid grid-cols-2 gap-4">{children}</div>
          <button
            onClick={onClose}
            className="mt-6 w-full border border-ink/20 py-2.5 font-mono text-xs uppercase tracking-wider text-ink hover:bg-ink hover:text-bone transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Marketplace() {
  const [activeTab, setActiveTab] = useState<SectionTab>('materials')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  // Lists
  const [materials, setMaterials] = useState<Material[]>([])
  const [equipment, setEquipment] = useState<EquipmentRental[]>([])
  const [providers, setProviders] = useState<ServiceProvider[]>([])

  // Cloudinary image upload status
  const [uploading, setUploading] = useState(false)

  // Form Fields
  // Shared / Dynamic
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  // Materials Form Fields
  const [matCategory, setMatCategory] = useState('Cement')
  const [matBrand, setMatBrand] = useState('')
  const [matPrice, setMatPrice] = useState('')
  const [matUnit, setMatUnit] = useState('per bag')
  const [matAvailable, setMatAvailable] = useState(true)

  // Equipment Form Fields
  const [eqCategory, setEqCategory] = useState('Earthmoving')
  const [eqRentPerDay, setEqRentPerDay] = useState('')
  const [eqSpecs, setEqSpecs] = useState('')
  const [eqAvailable, setEqAvailable] = useState(true)

  // Service Provider Form Fields
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

  // Search filter
  const [searchQuery, setSearchQuery] = useState('')

  // Read-only detail view (opened by the "View" button on each card)
  const [viewMaterial, setViewMaterial] = useState<Material | null>(null)
  const [viewEquipment, setViewEquipment] = useState<EquipmentRental | null>(null)
  const [viewProvider, setViewProvider] = useState<ServiceProvider | null>(null)

  function loadData() {
    setLoading(true)
    setError('')
    const promises = [
      adminApi.listMaterials().then(setMaterials).catch((err) => {
        console.error('Failed to load materials', err)
      }),
      adminApi.listEquipmentRentalsAdmin().then(setEquipment).catch((err) => {
        console.error('Failed to load equipment', err)
      }),
      adminApi.listServiceProvidersAdmin().then(setProviders).catch((err) => {
        console.error('Failed to load providers', err)
      })
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
    
    // Materials defaults
    setMatCategory('Cement')
    setMatBrand('')
    setMatPrice('')
    setMatUnit('per bag')
    setMatAvailable(true)

    // Equipment defaults
    setEqCategory('Earthmoving')
    setEqRentPerDay('')
    setEqSpecs('')
    setEqAvailable(true)

    // Providers defaults
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
      // Store the delivery URL with f_auto,q_auto baked in so browsers always
      // get a renderable format (iPhone HEIC uploads otherwise won't render).
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

  // Quick Availability Toggle
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

  // Quick Approval Toggle for Service Providers
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

  // Delete handlers
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

  // Edit triggers
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

  // Form Submit
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

  // Filter listings based on search query
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

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Marketplace Management</h1>
          <p className="mt-1 text-sm text-concrete">
            {activeTab === 'materials' && `${filteredMaterials.length} materials listed`}
            {activeTab === 'equipment' && `${filteredEquipment.length} equipment units listed`}
            {activeTab === 'providers' && `${filteredProviders.length} service providers registered`}
          </p>
        </div>

        <button
          onClick={handleAddNewClick}
          className="self-start bg-ink px-5 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-bone hover:bg-ochre-dark transition-colors cursor-pointer sm:self-auto"
        >
          {showForm ? 'Cancel / Close' : editId ? 'Edit Listing' : `+ Add ${activeTab === 'materials' ? 'Material' : activeTab === 'equipment' ? 'Equipment' : 'Provider'}`}
        </button>
      </div>

      {/* FEEDBACK STATUSES */}
      {error && (
        <div className="mb-6 border-l-4 border-red-500 bg-red-50 p-4 font-mono text-xs text-red-700">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 border-l-4 border-emerald-500 bg-emerald-50 p-4 font-mono text-xs text-emerald-700">
          <p>{success}</p>
        </div>
      )}

      {/* COLLAPSIBLE ADD / EDIT FORM */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-10 border border-ink/10 bg-bone-dim/40 p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-ink mb-6 pb-2 border-b border-ink/5">
            {editId ? `Edit ${name}` : `Add New ${activeTab === 'materials' ? 'Material' : activeTab === 'equipment' ? 'Equipment' : 'Service Provider'}`}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Common fields */}
            <div>
              <label className={labelClass}>Name</label>
              <input required className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ultratech Cement Premium, JCB Excavator 3DX" />
            </div>

            {/* Dynamic fields based on active tab */}
            {activeTab === 'materials' && (
              <>
                <div>
                  <label className={labelClass}>Category</label>
                  <select className={fieldClass} value={matCategory} onChange={(e) => setMatCategory(e.target.value)}>
                    {['Cement', 'Steel', 'Bricks', 'Sand', 'Aggregate', 'Flooring', 'Glass', 'Other'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Brand</label>
                  <input required className={fieldClass} value={matBrand} onChange={(e) => setMatBrand(e.target.value)} placeholder="e.g. Ultratech, Tata Tiscon" />
                </div>
                <div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Price (INR)</label>
                      <input className={fieldClass} type="number" value={matPrice} onChange={(e) => setMatPrice(e.target.value)} placeholder="e.g. 420" />
                    </div>
                    <div>
                      <label className={labelClass}>Unit</label>
                      <input className={fieldClass} value={matUnit} onChange={(e) => setMatUnit(e.target.value)} placeholder="e.g. per bag, per ton" />
                    </div>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2 flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="matAvailable"
                    checked={matAvailable}
                    onChange={(e) => setMatAvailable(e.target.checked)}
                    className="h-4 w-4 border-ink/20 accent-ochre"
                  />
                  <label htmlFor="matAvailable" className="font-mono text-xs text-ink-soft select-none cursor-pointer">
                    Is available / In stock
                  </label>
                </div>
              </>
            )}

            {activeTab === 'equipment' && (
              <>
                <div>
                  <label className={labelClass}>Category</label>
                  <select className={fieldClass} value={eqCategory} onChange={(e) => setEqCategory(e.target.value)}>
                    {['Earthmoving', 'Concrete', 'Scaffolding', 'Lifting', 'Power Tools', 'Other'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Rent per Day (INR)</label>
                  <input required className={fieldClass} type="number" value={eqRentPerDay} onChange={(e) => setEqRentPerDay(e.target.value)} placeholder="e.g. 5000" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className={labelClass}>Specs (comma-separated)</label>
                  <textarea className={`${fieldClass} min-h-[60px]`} value={eqSpecs} onChange={(e) => setEqSpecs(e.target.value)} placeholder="e.g. Weight: 8 Tonnes, Engine: 74 HP, Max Dig Depth: 4.7m" />
                </div>
                <div className="col-span-1 md:col-span-2 flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="eqAvailable"
                    checked={eqAvailable}
                    onChange={(e) => setEqAvailable(e.target.checked)}
                    className="h-4 w-4 border-ink/20 accent-ochre"
                  />
                  <label htmlFor="eqAvailable" className="font-mono text-xs text-ink-soft select-none cursor-pointer">
                    Is available for rent
                  </label>
                </div>
              </>
            )}

            {activeTab === 'providers' && (
              <>
                <div>
                  <label className={labelClass}>Role</label>
                  <select className={fieldClass} value={spRole} onChange={(e) => setSpRole(e.target.value)}>
                    {['Labour', 'Contractor', 'Civil Engineer', 'Architect', 'Electrician', 'Plumber', 'Painter', 'Mason', 'Carpenter'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input required className={fieldClass} value={spPhone} onChange={(e) => setSpPhone(e.target.value)} placeholder="e.g. +91 98765 43210" />
                </div>
                <div>
                  <label className={labelClass}>Email (Optional)</label>
                  <input className={fieldClass} type="email" value={spEmail} onChange={(e) => setSpEmail(e.target.value)} placeholder="e.g. info@provider.com" />
                </div>
                <div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>City</label>
                      <input required className={fieldClass} value={spCity} onChange={(e) => setSpCity(e.target.value)} placeholder="e.g. Patna" />
                    </div>
                    <div>
                      <label className={labelClass}>Locality (Optional)</label>
                      <input className={fieldClass} value={spLocality} onChange={(e) => setSpLocality(e.target.value)} placeholder="e.g. Raja Bazar" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Experience (Years)</label>
                  <input className={fieldClass} type="number" value={spExperienceYears} onChange={(e) => setSpExperienceYears(e.target.value)} placeholder="e.g. 5" />
                </div>
                <div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Minimum Rate (INR)</label>
                      <input className={fieldClass} type="number" value={spMinimumRate} onChange={(e) => setSpMinimumRate(e.target.value)} placeholder="e.g. 800" />
                    </div>
                    <div>
                      <label className={labelClass}>Rate Unit</label>
                      <input className={fieldClass} value={spRateUnit} onChange={(e) => setSpRateUnit(e.target.value)} placeholder="e.g. per day, per sqft" />
                    </div>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className={labelClass}>Specialties (comma-separated)</label>
                  <textarea className={`${fieldClass} min-h-[60px]`} value={spSpecialties} onChange={(e) => setSpSpecialties(e.target.value)} placeholder="e.g. Tile Laying, Plastering, Brickwork" />
                </div>
                <div>
                  <label className={labelClass}>Approval Status / Availability</label>
                  <select className={fieldClass} value={spReviewStatus} onChange={(e) => setSpReviewStatus(e.target.value)}>
                    <option value="approved">Approved (Visible)</option>
                    <option value="pending">Pending (Hidden)</option>
                    <option value="rejected">Rejected (Hidden)</option>
                  </select>
                </div>
              </>
            )}

            {/* Description - Common */}
            <div className="col-span-1 md:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea className={`${fieldClass} min-h-[80px]`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide listing details, grade information, specifications, etc." />
            </div>

            {/* Image upload */}
            <div className="col-span-1 md:col-span-2 border-t border-ink/5 pt-4">
              <label className={labelClass}>{activeTab === 'providers' ? 'Profile Photo' : 'Product Image'}</label>
              <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="cursor-pointer inline-flex items-center gap-2 border border-ink/20 bg-bone-dim px-4 py-2 font-mono text-[0.7rem] uppercase tracking-wider text-ink-soft hover:bg-bone hover:border-ink hover:text-ink transition-colors">
                  {uploading ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="animate-spin h-3 w-3 text-ink-soft" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
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
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="font-mono text-[0.62rem] uppercase tracking-wider text-red-600 hover:text-red-800 transition-colors"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-concrete font-mono">No image uploaded. Fallback placeholders will be used.</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-ink/5 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="border border-ink/10 bg-transparent px-5 py-2 font-mono text-xs uppercase tracking-[0.12em] text-concrete hover:text-ink transition-colors cursor-pointer"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={busy}
              className="bg-ink px-6 py-2 font-mono text-xs uppercase tracking-[0.12em] text-bone hover:bg-ochre-dark transition-colors cursor-pointer disabled:opacity-50"
            >
              {busy ? 'Saving…' : editId ? 'Save Changes' : 'Create Listing'}
            </button>
          </div>
        </form>
      )}

      {/* TAB SELECTOR */}
      <div className="mb-6 flex border-b border-ink/15 text-xs sm:text-sm">
        {(['materials', 'equipment', 'providers'] as SectionTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              setSearchQuery('')
              setShowForm(false)
              setEditId(null)
            }}
            className={`border-b-2 px-4 sm:px-6 py-3 font-mono uppercase tracking-[0.15em] transition-all cursor-pointer ${
              activeTab === tab
                ? 'border-ochre text-ink font-semibold'
                : 'border-transparent text-concrete hover:text-ink'
            }`}
          >
            {tab === 'materials' && 'Materials'}
            {tab === 'equipment' && 'Equipment Rentals'}
            {tab === 'providers' && 'Service Providers'}
          </button>
        ))}
      </div>

      {/* SEARCH FILTER */}
      <div className="mb-6">
        <input
          type="text"
          placeholder={`Search ${activeTab === 'materials' ? 'materials by name or brand' : activeTab === 'equipment' ? 'equipment by name or category' : 'providers by name or role'}…`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md border border-ink/10 bg-bone px-3 py-2 text-sm text-ink placeholder-concrete focus:border-ochre focus:outline-none"
        />
      </div>

      {/* LOAD STATE */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <p className="font-mono text-sm text-concrete animate-pulse">Fetching marketplace listings…</p>
        </div>
      ) : (
        <>
          {/* MATERIALS LISTING */}
          {activeTab === 'materials' && (
            filteredMaterials.length === 0 ? (
              <p className="border border-dashed border-ink/20 p-10 text-center text-ink-soft bg-bone-dim/30">
                No materials found matching your criteria.
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMaterials.map((mat: Material) => (
                  <div key={mat.id} className="border border-ink/10 bg-bone p-5 hover:border-ink/20 shadow-sm transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <span className="bg-bone-dim border border-ink/10 px-2 py-0.5 font-mono text-[0.62rem] uppercase tracking-wider text-concrete">
                          {mat.category}
                        </span>
                        <button
                          onClick={() => toggleAvailability(mat.id, mat.available, 'material')}
                          className={`font-mono text-[0.62rem] uppercase tracking-wider px-2 py-0.5 border cursor-pointer transition-colors ${
                            mat.available
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          {mat.available ? '● Available' : '○ Out of stock'}
                        </button>
                      </div>

                      {mat.imageUrl ? (
                        <img src={cldAuto(mat.imageUrl)} alt={mat.name} className="w-full h-32 object-cover border border-ink/5 mb-3" />
                      ) : (
                        <div className="w-full h-32 bg-bone-dim border border-ink/5 flex items-center justify-center text-concrete text-xs font-mono mb-3">
                          No Image Provided
                        </div>
                      )}

                      <h3 className="font-display font-bold text-ink text-base line-clamp-1">{mat.name}</h3>
                      <p className="font-mono text-[0.65rem] text-concrete uppercase mt-0.5">Brand: {mat.brand}</p>
                      
                      <p className="mt-2 text-xs text-ink-soft line-clamp-2 min-h-[2rem]">
                        {mat.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-ink/5 flex justify-between items-center">
                      <div>
                        <span className="block font-mono text-[0.58rem] uppercase tracking-wider text-concrete">Price</span>
                        <span className="font-mono text-sm font-bold text-ink">
                          {formatCurrency(mat.price)}
                          {mat.unit && <span className="text-[0.65rem] font-normal text-concrete"> / {mat.unit}</span>}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewMaterial(mat)}
                          className="font-mono text-xs uppercase tracking-wider text-teal hover:text-ink transition-colors cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          onClick={() => triggerEdit(mat)}
                          className="font-mono text-xs uppercase tracking-wider text-ink hover:text-ochre transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(mat.id, mat.name)}
                          className="font-mono text-xs uppercase tracking-wider text-ochre-dark hover:text-ink transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* EQUIPMENT RENTALS LISTING */}
          {activeTab === 'equipment' && (
            filteredEquipment.length === 0 ? (
              <p className="border border-dashed border-ink/20 p-10 text-center text-ink-soft bg-bone-dim/30">
                No rental equipment found matching your criteria.
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredEquipment.map((eq: EquipmentRental) => (
                  <div key={eq.id} className="border border-ink/10 bg-bone p-5 hover:border-ink/20 shadow-sm transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <span className="bg-bone-dim border border-ink/10 px-2 py-0.5 font-mono text-[0.62rem] uppercase tracking-wider text-concrete">
                          {eq.category}
                        </span>
                        <button
                          onClick={() => toggleAvailability(eq.id, eq.available, 'equipment')}
                          className={`font-mono text-[0.62rem] uppercase tracking-wider px-2 py-0.5 border cursor-pointer transition-colors ${
                            eq.available
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          {eq.available ? '● Available' : '○ Unavailable'}
                        </button>
                      </div>

                      {eq.imageUrl ? (
                        <img src={cldAuto(eq.imageUrl)} alt={eq.name} className="w-full h-32 object-cover border border-ink/5 mb-3" />
                      ) : (
                        <div className="w-full h-32 bg-bone-dim border border-ink/5 flex items-center justify-center text-concrete text-xs font-mono mb-3">
                          No Image Provided
                        </div>
                      )}

                      <h3 className="font-display font-bold text-ink text-base line-clamp-1">{eq.name}</h3>
                      
                      {eq.specs && eq.specs.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {eq.specs.slice(0, 3).map((spec: string, i: number) => (
                            <span key={i} className="font-mono text-[0.58rem] bg-bone-dim px-1.5 py-0.5 text-ink-soft">
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <p className="mt-2 text-xs text-ink-soft line-clamp-2 min-h-[2rem]">
                        {eq.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-ink/5 flex justify-between items-center">
                      <div>
                        <span className="block font-mono text-[0.58rem] uppercase tracking-wider text-concrete">Rent Cost</span>
                        <span className="font-mono text-sm font-bold text-ink">
                          {formatCurrency(eq.rentPerDay)}
                          <span className="text-[0.65rem] font-normal text-concrete"> / day</span>
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewEquipment(eq)}
                          className="font-mono text-xs uppercase tracking-wider text-teal hover:text-ink transition-colors cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          onClick={() => triggerEdit(eq)}
                          className="font-mono text-xs uppercase tracking-wider text-ink hover:text-ochre transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(eq.id, eq.name)}
                          className="font-mono text-xs uppercase tracking-wider text-ochre-dark hover:text-ink transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* SERVICE PROVIDERS LISTING */}
          {activeTab === 'providers' && (
            filteredProviders.length === 0 ? (
              <p className="border border-dashed border-ink/20 p-10 text-center text-ink-soft bg-bone-dim/30">
                No service providers found matching your criteria.
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProviders.map((sp: ServiceProvider) => (
                  <div key={sp.id} className="border border-ink/10 bg-bone p-5 hover:border-ink/20 shadow-sm transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <span className="bg-bone-dim border border-ink/10 px-2 py-0.5 font-mono text-[0.62rem] uppercase tracking-wider text-concrete">
                          {sp.role}
                        </span>
                        <button
                          onClick={() => toggleProviderStatus(sp.id, sp.reviewStatus)}
                          className={`font-mono text-[0.62rem] uppercase tracking-wider px-2 py-0.5 border cursor-pointer transition-colors ${
                            sp.reviewStatus === 'approved'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                          }`}
                        >
                          {sp.reviewStatus === 'approved' ? '● Approved' : '○ Pending'}
                        </button>
                      </div>

                      <div className="flex gap-3 mb-3">
                        {sp.profilePhotoUrl ? (
                          <img src={cldAuto(sp.profilePhotoUrl)} alt={sp.name} className="w-12 h-12 rounded-full object-cover border border-ink/15" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-bone-dim border border-ink/15 flex items-center justify-center text-[0.6rem] font-mono text-concrete">
                            No Photo
                          </div>
                        )}
                        <div>
                          <h3 className="font-display font-bold text-ink text-base leading-tight">{sp.name}</h3>
                          <p className="font-mono text-[0.62rem] text-concrete">{sp.city}{sp.locality ? `, ${sp.locality}` : ''}</p>
                          <p className="font-mono text-[0.58rem] text-concrete mt-0.5">Exp: {sp.experienceYears ?? 0} Years</p>
                        </div>
                      </div>

                      <div className="font-mono text-[0.65rem] text-ink-soft space-y-0.5">
                        <p>📞 {sp.phone}</p>
                        {sp.email && <p>✉️ {sp.email}</p>}
                      </div>

                      {sp.specialties && sp.specialties.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          {sp.specialties.map((spec: string, i: number) => (
                            <span key={i} className="font-mono text-[0.58rem] bg-bone-dim px-1.5 py-0.5 text-concrete">
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="mt-2.5 text-xs text-ink-soft line-clamp-2 min-h-[2rem]">
                        {sp.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-ink/5 flex justify-between items-center">
                      <div>
                        <span className="block font-mono text-[0.58rem] uppercase tracking-wider text-concrete">Minimum Rate</span>
                        <span className="font-mono text-sm font-bold text-ink">
                          {formatCurrency(sp.minimumRate)}
                          {sp.rateUnit && <span className="text-[0.65rem] font-normal text-concrete"> / {sp.rateUnit}</span>}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewProvider(sp)}
                          className="font-mono text-xs uppercase tracking-wider text-teal hover:text-ink transition-colors cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          onClick={() => triggerEdit(sp)}
                          className="font-mono text-xs uppercase tracking-wider text-ink hover:text-ochre transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(sp.id, sp.name)}
                          className="font-mono text-xs uppercase tracking-wider text-ochre-dark hover:text-ink transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}

      {viewMaterial && (
        <DetailModal
          title={viewMaterial.name}
          imageUrl={viewMaterial.imageUrl}
          imageAlt={viewMaterial.name}
          badge={
            <span
              className={`shrink-0 font-mono text-[0.62rem] uppercase tracking-wider px-2 py-0.5 border ${
                viewMaterial.available ? 'border-teal/30 text-teal' : 'border-ink/15 text-concrete'
              }`}
            >
              {viewMaterial.available ? 'Available' : 'Unavailable'}
            </span>
          }
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
          imageUrl={viewEquipment.imageUrl}
          imageAlt={viewEquipment.name}
          badge={
            <span
              className={`shrink-0 font-mono text-[0.62rem] uppercase tracking-wider px-2 py-0.5 border ${
                viewEquipment.available ? 'border-teal/30 text-teal' : 'border-ink/15 text-concrete'
              }`}
            >
              {viewEquipment.available ? 'Available' : 'Unavailable'}
            </span>
          }
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
          imageUrl={viewProvider.profilePhotoUrl}
          imageAlt={viewProvider.name}
          badge={
            <span className="shrink-0 font-mono text-[0.62rem] uppercase tracking-wider px-2 py-0.5 border border-ochre/30 text-ochre-dark">
              {viewProvider.role}
            </span>
          }
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
            value={
              viewProvider.minimumRate
                ? `${formatCurrency(viewProvider.minimumRate)}${viewProvider.rateUnit ? ` / ${viewProvider.rateUnit}` : ''}`
                : null
            }
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
    </div>
  )
}
