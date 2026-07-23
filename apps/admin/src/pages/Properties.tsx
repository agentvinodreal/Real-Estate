import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import { Download, Plus } from 'lucide-react'
import { adminApi } from '../lib/adminApi'
import type { Property } from '@carry/shared'
import { Badge, Button, Card, CardGrid, DetailModal, DetailRow, EmptyState, LoadingState, PageHeader } from '../components/ui'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? 'piwpzbke'
const cldThumb = (img: string) =>
  img.startsWith('http') ? img : `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_400,h_225,c_fill,q_auto,f_auto/${img}`
const cldFull = (img: string) =>
  img.startsWith('http') ? img : `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto,f_auto/${img}`

export default function Properties() {
  const [items, setItems] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [viewProperty, setViewProperty] = useState<Property | null>(null)

  function load() {
    setLoading(true)
    adminApi.listProperties().then(setItems).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function remove(p: Property) {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return
    await adminApi.deleteProperty(p.id)
    setItems((xs) => xs.filter((x) => x.id !== p.id))
  }

  function exportJSONBackup(list: Property[]) {
    const backupData = list.map((p) => {
      const fullImages = (p.images ?? []).map(cldFull)
      return { ...p, backupImages: fullImages, exportedAt: new Date().toISOString() }
    })

    const jsonString = JSON.stringify(backupData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `properties_db_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  return (
    <div>
      <PageHeader
        title="Properties"
        subtitle={`${items.length} active listings`}
        actions={
          <>
            <Button variant="outline" icon={<Download className="h-3.5 w-3.5" strokeWidth={1.8} />} onClick={() => exportJSONBackup(items)}>
              Backup JSON
            </Button>
            <Link to="/properties/new">
              <Button icon={<Plus className="h-3.5 w-3.5" strokeWidth={2} />}>New property</Button>
            </Link>
          </>
        }
      />

      {loading ? (
        <LoadingState label="Loading properties…" />
      ) : items.length === 0 ? (
        <EmptyState>No properties found. Click "New property" to create one.</EmptyState>
      ) : (
        <CardGrid>
          <AnimatePresence mode="popLayout">
            {items.map((p) => (
              <Card key={p.id}>
                <div>
                  <div className="relative mb-4 flex aspect-[16/9] w-full items-center justify-center overflow-hidden border border-ink/5 bg-ink">
                    {p.images && p.images.length > 0 ? (
                      <img src={cldThumb(p.images[0])} alt={p.title} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-mono text-[0.6rem] uppercase tracking-wider text-concrete">No image uploaded</span>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-sans text-lg font-semibold leading-snug text-ink">{p.title}</h3>
                    <Badge tone="ink">{p.listingType}</Badge>
                  </div>

                  <p className="mt-1 font-mono text-xs uppercase tracking-wider text-concrete">
                    {p.locality}, {p.city}
                  </p>

                  <div className="my-3 flex items-baseline justify-between border-y border-ink/5 py-2.5">
                    <span className="font-mono text-[0.65rem] uppercase tracking-wide text-concrete">Price</span>
                    <span className="font-sans text-base font-semibold text-ochre-dark">{p.priceLabel}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-ink-soft">
                    <div>Type: <span className="text-ink">{p.propertyType}</span></div>
                    <div>BHK: <span className="text-ink">{p.bhk ?? 'N/A'}</span></div>
                    <div className="col-span-2">Area: <span className="text-ink">{p.areaSqft.toLocaleString('en-IN')} sq ft</span></div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    {p.featured && <Badge tone="ochre">Featured</Badge>}
                    {p.published ? <Badge tone="teal">Published</Badge> : <Badge tone="concrete">Draft</Badge>}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-4 border-t border-ink/5 pt-3">
                  <button onClick={() => setViewProperty(p)} className="cursor-pointer font-mono text-xs uppercase tracking-[0.12em] text-teal transition-colors hover:text-ink">
                    View
                  </button>
                  <Link to={`/properties/${p.slug}`} className="font-mono text-xs uppercase tracking-[0.12em] text-ink transition-colors hover:text-ochre-dark">
                    Edit
                  </Link>
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
        {viewProperty && (
          <DetailModal
            title={viewProperty.title}
            imageUrl={viewProperty.images?.[0] ? cldFull(viewProperty.images[0]) : null}
            imageAlt={viewProperty.title}
            badge={<Badge tone="ink">{viewProperty.listingType}</Badge>}
            onClose={() => setViewProperty(null)}
          >
            <DetailRow label="Property Type" value={viewProperty.propertyType} />
            <DetailRow label="BHK" value={viewProperty.bhk ?? null} />
            <DetailRow label="Price" value={viewProperty.priceLabel} />
            <DetailRow label="Status" value={viewProperty.status} />
            <DetailRow label="Area" value={`${viewProperty.areaSqft.toLocaleString('en-IN')} sq ft`} />
            <DetailRow
              label="Carpet / Built-up"
              value={
                viewProperty.carpetAreaSqft || viewProperty.builtupAreaSqft
                  ? `${viewProperty.carpetAreaSqft ?? '—'} / ${viewProperty.builtupAreaSqft ?? '—'} sq ft`
                  : null
              }
            />
            <DetailRow label="Location" value={`${viewProperty.locality}, ${viewProperty.city}`} />
            <DetailRow label="Furnishing" value={viewProperty.furnishing} />
            <DetailRow label="RERA" value={viewProperty.reraNumber} />
            <DetailRow label="Visibility" value={viewProperty.published ? 'Published' : 'Draft'} />
            {viewProperty.amenities.length > 0 && (
              <div className="col-span-2">
                <DetailRow label="Amenities" value={viewProperty.amenities.join(', ')} />
              </div>
            )}
            <div className="col-span-2">
              <DetailRow label="Description" value={viewProperty.description} />
            </div>
          </DetailModal>
        )}
      </AnimatePresence>
    </div>
  )
}
