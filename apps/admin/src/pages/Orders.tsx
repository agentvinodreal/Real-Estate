import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Phone, MessageCircle, Trash2, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { adminApi, type Lead } from '../lib/adminApi'
import type { Material, EquipmentRental, ServiceProvider } from '@carry/shared'
import { Badge, Button, EmptyState, IconButton, LoadingState, PageHeader } from '../components/ui'
import { EASE_OUT_EXPO } from '../lib/motion'

const STATUS_ORDER = ['new', 'contacted', 'visit', 'closed']
const COLUMNS = [
  { id: 'new', title: 'New Orders', accent: 'bg-ochre' },
  { id: 'contacted', title: 'Contacted', accent: 'bg-steel' },
  { id: 'visit', title: 'Scheduled', accent: 'bg-ink' },
  { id: 'closed', title: 'Completed', accent: 'bg-concrete' },
]

const TYPE_TONE = {
  Material: 'ochre',
  Equipment: 'steel',
  ServiceProvider: 'teal',
} as const

type OutletContext = {
  leads: Lead[]
  loading: boolean
  changeLeadStatus: (id: string, status: string) => Promise<void>
  deleteLead: (id: string) => Promise<void>
  loadLeads: () => Promise<void>
}

export default function Orders() {
  const { leads, loading, changeLeadStatus, deleteLead } = useOutletContext<OutletContext>()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [materials, setMaterials] = useState<Record<string, Material>>({})
  const [equipment, setEquipment] = useState<Record<string, EquipmentRental>>({})
  const [providers, setProviders] = useState<Record<string, ServiceProvider>>({})
  const [catalogLoading, setCatalogLoading] = useState(true)

  useEffect(() => {
    async function loadCatalogs() {
      setCatalogLoading(true)
      try {
        const [mList, eList, pList] = await Promise.all([
          adminApi.listMaterials().catch(() => []),
          adminApi.listEquipmentRentalsAdmin().catch(() => []),
          adminApi.listServiceProvidersAdmin().catch(() => []),
        ])

        const mMap: Record<string, Material> = {}
        mList.forEach((m) => { mMap[m.id] = m })
        const eMap: Record<string, EquipmentRental> = {}
        eList.forEach((e) => { eMap[e.id] = e })
        const pMap: Record<string, ServiceProvider> = {}
        pList.forEach((p) => { pMap[p.id] = p })

        setMaterials(mMap)
        setEquipment(eMap)
        setProviders(pMap)
      } catch (err) {
        console.error('Error loading catalogs for orders page:', err)
      } finally {
        setCatalogLoading(false)
      }
    }

    loadCatalogs()
  }, [])

  const isOrder = (l: Lead) => !!l.marketplaceType || l.sourcePage === '/marketplace-cart' || l.sourcePage?.startsWith('/marketplace')
  const filteredOrders = leads.filter(isOrder)

  async function moveOrder(id: string, currentStatus: string, direction: number) {
    const currentIndex = STATUS_ORDER.indexOf(currentStatus)
    const nextIndex = currentIndex + direction
    if (nextIndex >= 0 && nextIndex < STATUS_ORDER.length) {
      await changeLeadStatus(id, STATUS_ORDER[nextIndex])
    }
  }

  async function handleDelete(id: string, customerName: string) {
    if (!confirm(`Delete the order from "${customerName}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await deleteLead(id)
    } catch (err) {
      console.error(err)
      alert('Failed to delete the order.')
    } finally {
      setDeletingId(null)
    }
  }

  function getItemDetails(l: Lead) {
    if (l.sourcePage === '/marketplace-cart' || !l.marketplaceType) {
      return { name: 'Shopping Cart Order', details: 'Multiple items check out' }
    }
    if (!l.itemId) return { name: 'Unknown Item', details: '' }
    if (l.marketplaceType === 'Material') {
      const item = materials[l.itemId]
      return {
        name: item?.name || `Material (ID: ${l.itemId.slice(0, 5)})`,
        details: item ? `Brand: ${item.brand} · ${item.category}` : 'Materials',
      }
    }
    if (l.marketplaceType === 'Equipment') {
      const item = equipment[l.itemId]
      return {
        name: item?.name || `Equipment (ID: ${l.itemId.slice(0, 5)})`,
        details: item ? `Rent: ₹${item.rentPerDay.toLocaleString('en-IN')}/day · ${item.category}` : 'Equipment',
      }
    }
    if (l.marketplaceType === 'ServiceProvider') {
      const item = providers[l.itemId]
      return {
        name: item?.name || `Specialist (ID: ${l.itemId.slice(0, 5)})`,
        details: item ? `${item.role} · Exp: ${item.experienceYears} Years` : 'Specialist',
      }
    }
    return { name: 'Marketplace Item', details: '' }
  }

  function getWhatsAppLink(l: Lead, itemName: string) {
    let text = ''
    if (l.marketplaceType === 'Material') {
      text = `Hi ${l.name}, this is Carry Construction Admin. We received your order for ${l.itemQty || 1} units of ${itemName || 'materials'}. Let's discuss the delivery details.`
    } else if (l.marketplaceType === 'Equipment') {
      text = `Hi ${l.name}, this is Carry Construction Admin. We received your request to rent ${itemName || 'equipment'} for ${l.itemQty || 1} days. Let's schedule the delivery.`
    } else if (l.marketplaceType === 'ServiceProvider') {
      text = `Hi ${l.name}, this is Carry Construction Admin. We received your inquiry regarding hiring ${itemName || 'a specialist'}. Let's discuss your project.`
    } else {
      text = `Hi ${l.name}, this is Carry Construction Admin. We received your inquiry regarding our marketplace services.`
    }
    return `https://wa.me/${l.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`
  }

  function exportCSV(list: Lead[]) {
    const rows = list.map((l) => {
      const { name: itemName } = getItemDetails(l)
      return `"${l.name.replace(/"/g, '""')}","${l.phone}","${l.email || ''}","${l.status}","${l.marketplaceType || ''}","${itemName.replace(/"/g, '""')}","${l.itemQty || ''}","${
        l.message ? l.message.replace(/"/g, '""') : ''
      }","${new Date(l.createdAt).toLocaleDateString('en-IN')}"`
    })
    const csv = ['Customer Name,Phone,Email,Status,Type,Item Ordered,Quantity/Days,Message,Date', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders_export_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  return (
    <div>
      <PageHeader
        title="Marketplace Orders"
        subtitle={`${filteredOrders.length} total orders · Track material requests, rentals, and specialist hires`}
        actions={
          <Button variant="outline" icon={<Download className="h-3.5 w-3.5" strokeWidth={1.8} />} onClick={() => exportCSV(filteredOrders)}>
            Export CSV
          </Button>
        }
      />

      {loading || catalogLoading ? (
        <LoadingState label="Loading orders pipeline…" />
      ) : filteredOrders.length === 0 ? (
        <EmptyState>No marketplace orders received yet.</EmptyState>
      ) : (
        <div className="grid items-start gap-6 md:grid-cols-4">
          {COLUMNS.map((col) => {
            const list = filteredOrders.filter((l) => l.status === col.id)
            return (
              <div key={col.id} className="flex flex-col border border-ink/10 bg-bone-dim/10">
                <div className="flex items-center justify-between border-b border-ink/10 px-3 py-3">
                  <h2 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-ink">
                    <span className={`h-1.5 w-1.5 rounded-full ${col.accent}`} />
                    {col.title}
                  </h2>
                  <span className="rounded-full bg-ink/5 px-2 py-0.5 font-mono text-[0.65rem] text-ink-soft">{list.length}</span>
                </div>

                <div className="flex min-h-[400px] flex-1 flex-col gap-3 p-3">
                  {list.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center border border-dashed border-ink/5 p-6 text-center text-xs text-concrete">
                      No orders here
                    </div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {list.map((l) => {
                        const { name: itemName, details: itemDetails } = getItemDetails(l)
                        return (
                          <OrderCard
                            key={l.id}
                            lead={l}
                            itemName={itemName}
                            itemDetails={itemDetails}
                            deleting={deletingId === l.id}
                            onDelete={() => handleDelete(l.id, l.name)}
                            whatsAppLink={getWhatsAppLink(l, itemName)}
                            onMoveBack={l.status !== 'new' ? () => moveOrder(l.id, l.status, -1) : undefined}
                            onMoveForward={l.status !== 'closed' ? () => moveOrder(l.id, l.status, 1) : undefined}
                          />
                        )
                      })}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function OrderCard({
  lead: l,
  itemName,
  itemDetails,
  deleting,
  onDelete,
  whatsAppLink,
  onMoveBack,
  onMoveForward,
}: {
  lead: Lead
  itemName: string
  itemDetails: string
  deleting: boolean
  onDelete: () => void
  whatsAppLink: string
  onMoveBack?: () => void
  onMoveForward?: () => void
}) {
  const tone = TYPE_TONE[l.marketplaceType as keyof typeof TYPE_TONE] ?? 'concrete'

  return (
    <motion.div
      layoutId={l.id}
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
      className="flex flex-col justify-between border border-ink/10 bg-bone p-4 transition-colors hover:border-ink/20"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <Badge tone={tone} className="mb-1">{l.marketplaceType || 'Cart'}</Badge>
            <h3 className="font-sans text-sm font-semibold leading-tight text-ink">{l.name}</h3>
          </div>
          <span className="mt-1 whitespace-nowrap font-mono text-[0.55rem] text-concrete">
            {new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        </div>

        <div className="mt-2 font-mono text-xs">
          <a href={`tel:${l.phone}`} className="block font-semibold text-ochre-dark hover:underline">
            {l.phone}
          </a>
          {l.email && <span className="block truncate text-[0.7rem] text-concrete">{l.email}</span>}
        </div>

        <div className="mt-3 border-t border-ink/5 pt-3">
          <span className="block font-mono text-[0.6rem] uppercase tracking-wider text-concrete">Requested Item</span>
          <div className="mt-0.5 font-sans text-xs font-semibold text-ink">{itemName}</div>
          {itemDetails && <div className="mt-0.5 font-mono text-[0.65rem] leading-none text-concrete">{itemDetails}</div>}

          {l.marketplaceType === 'Material' && l.itemQty && (
            <div className="mt-1.5 inline-block border border-ochre/20 bg-ochre/5 px-2 py-1 font-sans text-xs font-semibold text-ochre-dark">
              Quantity: {l.itemQty} Units
            </div>
          )}
          {l.marketplaceType === 'Equipment' && l.itemQty && (
            <div className="mt-1.5 inline-block border border-steel/20 bg-steel/5 px-2 py-1 font-sans text-xs font-semibold text-steel">
              Duration: {l.itemQty} Days
            </div>
          )}
        </div>

        {l.message && (
          <div className="mt-3 border-l-2 border-ink/10 bg-bone-dim/30 px-2 py-1.5 font-sans text-xs leading-normal text-ink-soft">
            "{l.message}"
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-ink/5 pt-3">
        <div className="flex items-center gap-3">
          <a href={`tel:${l.phone}`} className="text-concrete transition-colors hover:text-ink" title="Call client">
            <Phone className="h-4 w-4" strokeWidth={1.8} />
          </a>
          <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="text-concrete transition-colors hover:text-teal" title="Send WhatsApp message">
            <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
          </a>
        </div>

        <div className="flex items-center gap-1.5">
          <IconButton danger disabled={deleting} onClick={onDelete} title="Delete order">
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
          </IconButton>
          {onMoveBack && (
            <IconButton onClick={onMoveBack} title="Move back">
              <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
            </IconButton>
          )}
          {onMoveForward && (
            <IconButton onClick={onMoveForward} title="Move forward">
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
            </IconButton>
          )}
        </div>
      </div>
    </motion.div>
  )
}
