import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Phone, MessageCircle, Trash2, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import type { Lead } from '../lib/adminApi'
import { Button, EmptyState, IconButton, LoadingState, PageHeader } from '../components/ui'
import { EASE_OUT_EXPO } from '../lib/motion'

const STATUS_ORDER = ['new', 'contacted', 'visit', 'closed']
const COLUMNS = [
  { id: 'new', title: 'New Enquiries', accent: 'bg-ochre' },
  { id: 'contacted', title: 'Contacted', accent: 'bg-steel' },
  { id: 'visit', title: 'Site Visit', accent: 'bg-ink' },
  { id: 'closed', title: 'Closed', accent: 'bg-concrete' },
]

type OutletContext = {
  leads: Lead[]
  loading: boolean
  changeLeadStatus: (id: string, status: string) => Promise<void>
  deleteLead: (id: string) => Promise<void>
  loadLeads: () => Promise<void>
}

export default function Leads() {
  const { leads, loading, changeLeadStatus, deleteLead } = useOutletContext<OutletContext>()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const isOrder = (l: Lead) => !!l.marketplaceType || l.sourcePage === '/marketplace-cart' || l.sourcePage?.startsWith('/marketplace')
  const filteredLeads = leads.filter((l) => !isOrder(l))

  async function moveLead(id: string, currentStatus: string, direction: number) {
    const currentIndex = STATUS_ORDER.indexOf(currentStatus)
    const nextIndex = currentIndex + direction
    if (nextIndex >= 0 && nextIndex < STATUS_ORDER.length) {
      await changeLeadStatus(id, STATUS_ORDER[nextIndex])
    }
  }

  async function handleDelete(id: string, customerName: string) {
    if (!confirm(`Delete the enquiry from "${customerName}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await deleteLead(id)
    } catch (err) {
      console.error(err)
      alert('Failed to delete the enquiry.')
    } finally {
      setDeletingId(null)
    }
  }

  function exportCSV(list: Lead[]) {
    const rows = list.map(
      (l) =>
        `"${l.name.replace(/"/g, '""')}","${l.phone}","${l.email || ''}","${l.status}","${l.sourcePage || ''}","${
          l.message ? l.message.replace(/"/g, '""') : ''
        }","${new Date(l.createdAt).toLocaleDateString('en-IN')}"`
    )
    const csv = ['Name,Phone,Email,Status,Source Page,Message,Date', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads_export_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  return (
    <div>
      <PageHeader
        title="Lead Pipeline"
        subtitle={`${filteredLeads.length} total enquiries · Manage customer status and visit schedules`}
        actions={
          <Button variant="outline" icon={<Download className="h-3.5 w-3.5" strokeWidth={1.8} />} onClick={() => exportCSV(filteredLeads)}>
            Export CSV
          </Button>
        }
      />

      {loading ? (
        <LoadingState label="Loading pipeline…" />
      ) : filteredLeads.length === 0 ? (
        <EmptyState>No leads received yet.</EmptyState>
      ) : (
        <div className="grid items-start gap-6 md:grid-cols-4">
          {COLUMNS.map((col) => {
            const list = filteredLeads.filter((l) => l.status === col.id)
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
                      No cards here
                    </div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {list.map((l) => (
                        <LeadCard
                          key={l.id}
                          lead={l}
                          deleting={deletingId === l.id}
                          onDelete={() => handleDelete(l.id, l.name)}
                          onMoveBack={l.status !== 'new' ? () => moveLead(l.id, l.status, -1) : undefined}
                          onMoveForward={l.status !== 'closed' ? () => moveLead(l.id, l.status, 1) : undefined}
                        />
                      ))}
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

function LeadCard({
  lead: l,
  deleting,
  onDelete,
  onMoveBack,
  onMoveForward,
}: {
  lead: Lead
  deleting: boolean
  onDelete: () => void
  onMoveBack?: () => void
  onMoveForward?: () => void
}) {
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
          <h3 className="font-sans text-sm font-semibold leading-tight text-ink">{l.name}</h3>
          <span className="whitespace-nowrap font-mono text-[0.55rem] text-concrete">
            {new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        </div>

        <div className="mt-2 font-mono text-xs">
          <a href={`tel:${l.phone}`} className="block text-ochre-dark hover:underline">
            {l.phone}
          </a>
          {l.email && <span className="block truncate text-[0.7rem] text-concrete">{l.email}</span>}
        </div>

        {l.message && (
          <div className="mt-2.5 border-l-2 border-ink/10 bg-bone-dim/30 px-2 py-1.5 font-sans text-xs leading-normal text-ink-soft">
            "{l.message}"
          </div>
        )}

        {l.sourcePage && (
          <div className="mt-2 font-mono text-[0.55rem] uppercase tracking-wide text-concrete">
            Ref: {l.sourcePage.replace('/properties/', '')}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-ink/5 pt-3">
        <div className="flex items-center gap-3">
          <a href={`tel:${l.phone}`} className="text-concrete transition-colors hover:text-ink" title="Call client">
            <Phone className="h-4 w-4" strokeWidth={1.8} />
          </a>
          <a
            href={`https://wa.me/${l.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(l.name)},%20this%20is%20Carry%20Construction.`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-concrete transition-colors hover:text-teal"
            title="Send WhatsApp message"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
          </a>
        </div>

        <div className="flex items-center gap-1.5">
          <IconButton danger disabled={deleting} onClick={onDelete} title="Delete enquiry">
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
