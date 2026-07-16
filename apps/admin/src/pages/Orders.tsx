import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { adminApi, type Lead } from '../lib/adminApi'
import type { Material, EquipmentRental, ServiceProvider } from '@carry/shared'

const STATUS_ORDER = ['new', 'contacted', 'visit', 'closed']
const COLUMNS = [
  { id: 'new', title: 'New Orders', color: 'border-ochre bg-ochre/5' },
  { id: 'contacted', title: 'Contacted', color: 'border-steel bg-steel/5' },
  { id: 'visit', title: 'Scheduled', color: 'border-ink bg-ink/5' },
  { id: 'closed', title: 'Completed', color: 'border-concrete bg-concrete/5' },
]

type OutletContext = {
  leads: Lead[]
  loading: boolean
  changeLeadStatus: (id: string, status: string) => Promise<void>
  loadLeads: () => Promise<void>
}

export default function Orders() {
  const { leads, loading, changeLeadStatus } = useOutletContext<OutletContext>()
  
  // Catalog maps for resolving itemId -> details
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

  async function change(id: string, status: string) {
    await changeLeadStatus(id, status)
  }

  async function moveOrder(id: string, currentStatus: string, direction: number) {
    const currentIndex = STATUS_ORDER.indexOf(currentStatus)
    const nextIndex = currentIndex + direction
    if (nextIndex >= 0 && nextIndex < STATUS_ORDER.length) {
      const nextStatus = STATUS_ORDER[nextIndex]
      await change(id, nextStatus)
    }
  }

  // Resolve item name and meta info
  function getItemDetails(l: Lead) {
    if (l.sourcePage === '/marketplace-cart' || !l.marketplaceType) {
      return {
        name: 'Shopping Cart Order',
        details: 'Multiple items check out',
      }
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
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Marketplace Orders</h1>
          <p className="mt-1 text-sm text-concrete">
            {filteredOrders.length} total orders · Track material requests, rentals, and specialist hires
          </p>
        </div>
        <button
          onClick={() => exportCSV(filteredOrders)}
          className="border border-ink/20 bg-bone px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink hover:border-ochre hover:text-ochre transition-colors cursor-pointer"
        >
          Export CSV
        </button>
      </div>

      {loading || catalogLoading ? (
        <div className="flex h-48 items-center justify-center">
          <p className="font-mono text-sm text-concrete animate-pulse">Loading Orders Pipeline…</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <p className="border border-dashed border-ink/20 p-10 text-center text-ink-soft bg-bone-dim/30">
          No marketplace orders received yet.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-4 align-top">
          {COLUMNS.map((col) => {
            const list = filteredOrders.filter((l) => l.status === col.id)
            return (
              <div key={col.id} className="flex flex-col border border-ink/10 bg-bone-dim/10">
                {/* Column Header */}
                <div className={`border-t-2 px-3 py-3 border-b border-ink/10 ${col.color} flex items-center justify-between`}>
                  <h2 className="font-mono text-xs uppercase tracking-wider font-semibold text-ink">
                    {col.title}
                  </h2>
                  <span className="font-mono text-[0.65rem] bg-ink/5 px-2 py-0.5 rounded-full text-ink-soft">
                    {list.length}
                  </span>
                </div>

                {/* Column Body / Cards List */}
                <div className="flex-1 p-3 flex flex-col gap-3 min-h-[400px]">
                  {list.length === 0 ? (
                    <div className="flex-1 border border-dashed border-ink/5 flex items-center justify-center p-6 text-center text-concrete text-xs">
                      No orders here
                    </div>
                  ) : (
                    list.map((l) => {
                      const { name: itemName, details: itemDetails } = getItemDetails(l)
                      return (
                        <div
                          key={l.id}
                          className="bg-bone border border-ink/10 p-4 shadow-sm hover:border-ink/20 transition-all flex flex-col justify-between"
                        >
                          <div>
                            {/* Header: Customer Name, Type & Date */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className={`inline-block font-mono text-[0.55rem] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-semibold mb-1 ${
                                  l.marketplaceType === 'Material' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                  l.marketplaceType === 'Equipment' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                  l.marketplaceType === 'ServiceProvider' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                  'bg-teal-100 text-teal-800 border border-teal-200'
                                }`}>
                                  {l.marketplaceType || 'Cart'}
                                </span>
                                <h3 className="font-sans text-sm font-semibold text-ink leading-tight">
                                  {l.name}
                                </h3>
                              </div>
                              <span className="font-mono text-[0.55rem] text-concrete whitespace-nowrap mt-1">
                                {new Date(l.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </span>
                            </div>

                            {/* Contact Details */}
                            <div className="mt-2 text-xs font-mono">
                              <a
                                href={`tel:${l.phone}`}
                                className="text-ochre-dark hover:underline block font-semibold"
                              >
                                {l.phone}
                              </a>
                              {l.email && (
                                <span className="text-concrete text-[0.7rem] block truncate">
                                  {l.email}
                                </span>
                              )}
                            </div>

                            {/* Item Ordered Details */}
                            <div className="mt-3 border-t border-ink/5 pt-3">
                              <span className="font-mono text-[0.6rem] uppercase tracking-wider text-concrete block">
                                Requested Item
                              </span>
                              <div className="font-sans text-xs font-semibold text-ink mt-0.5">
                                {itemName}
                              </div>
                              {itemDetails && (
                                <div className="font-mono text-[0.65rem] text-concrete mt-0.5 leading-none">
                                  {itemDetails}
                                </div>
                              )}
                              
                              {/* Quantity Details */}
                              {l.marketplaceType === 'Material' && l.itemQty && (
                                <div className="mt-1.5 font-sans text-xs bg-orange-50 border border-orange-100 px-2 py-1 rounded text-orange-950 inline-block font-semibold">
                                  Quantity: {l.itemQty} Units
                                </div>
                              )}
                              {l.marketplaceType === 'Equipment' && l.itemQty && (
                                <div className="mt-1.5 font-sans text-xs bg-blue-50 border border-blue-100 px-2 py-1 rounded text-blue-950 inline-block font-semibold">
                                  Duration: {l.itemQty} Days
                                </div>
                              )}
                            </div>

                            {/* Customer Message */}
                            {l.message && (
                              <div className="mt-3 border-l-2 border-ink/10 bg-bone-dim/30 px-2 py-1.5 font-sans text-xs text-ink-soft leading-normal">
                                "{l.message}"
                              </div>
                            )}
                          </div>

                          {/* Action shortcuts */}
                          <div className="mt-4 flex items-center justify-between border-t border-ink/5 pt-3">
                            <div className="flex items-center gap-3">
                              <a
                                href={`tel:${l.phone}`}
                                className="text-concrete hover:text-ink transition-colors"
                                title="Call client"
                              >
                                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.108-7.108c-.145-.44.02-927.02.387-.97l1.293-.97a1.125 1.125 0 00.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                </svg>
                              </a>
                              <a
                                href={getWhatsAppLink(l, itemName)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-concrete hover:text-green-600 transition-colors"
                                title="Send WhatsApp message"
                              >
                                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              </a>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {l.status !== 'new' && (
                                <button
                                  onClick={() => moveOrder(l.id, l.status, -1)}
                                  className="flex h-5 w-5 items-center justify-center border border-ink/10 text-concrete hover:border-ink hover:text-ink transition-colors font-mono text-[0.6rem] font-bold cursor-pointer"
                                  title="Move back"
                                >
                                  <span>←</span>
                                </button>
                              )}
                              {l.status !== 'closed' && (
                                <button
                                  onClick={() => moveOrder(l.id, l.status, 1)}
                                  className="flex h-5 w-5 items-center justify-center border border-ink/10 text-concrete hover:border-ink hover:text-ink transition-colors font-mono text-[0.6rem] font-bold cursor-pointer"
                                  title="Move forward"
                                >
                                  <span>→</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
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
