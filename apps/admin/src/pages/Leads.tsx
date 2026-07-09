import { useEffect, useState } from 'react'
import { adminApi, type Lead } from '../lib/adminApi'

const STATUS_ORDER = ['new', 'contacted', 'visit', 'closed']
const COLUMNS = [
  { id: 'new', title: 'New Enquiries', color: 'border-ochre bg-ochre/5' },
  { id: 'contacted', title: 'Contacted', color: 'border-steel bg-steel/5' },
  { id: 'visit', title: 'Site Visit', color: 'border-ink bg-ink/5' },
  { id: 'closed', title: 'Closed', color: 'border-concrete bg-concrete/5' },
]

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    adminApi.listLeads().then(setLeads).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function change(id: string, status: string) {
    await adminApi.setLeadStatus(id, status)
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)))
  }

  async function moveLead(id: string, currentStatus: string, direction: number) {
    const currentIndex = STATUS_ORDER.indexOf(currentStatus)
    const nextIndex = currentIndex + direction
    if (nextIndex >= 0 && nextIndex < STATUS_ORDER.length) {
      const nextStatus = STATUS_ORDER[nextIndex]
      await change(id, nextStatus)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-ink">Lead Pipeline</h1>
        <p className="mt-1 text-sm text-concrete">
          {leads.length} total enquiries · Manage customer status and visit schedules
        </p>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <p className="font-mono text-sm text-concrete animate-pulse">Loading Pipeline…</p>
        </div>
      ) : leads.length === 0 ? (
        <p className="border border-dashed border-ink/20 p-10 text-center text-ink-soft bg-bone-dim/30">
          No leads received yet.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-4 align-top">
          {COLUMNS.map((col) => {
            const list = leads.filter((l) => l.status === col.id)
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
                      No cards here
                    </div>
                  ) : (
                    list.map((l) => (
                      <div
                        key={l.id}
                        className="bg-bone border border-ink/10 p-4 shadow-sm hover:border-ink/20 transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Name & Date */}
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-sans text-sm font-semibold text-ink leading-tight">
                              {l.name}
                            </h3>
                            <span className="font-mono text-[0.55rem] text-concrete whitespace-nowrap">
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
                              className="text-ochre-dark hover:underline block"
                            >
                              {l.phone}
                            </a>
                            {l.email && (
                              <span className="text-concrete text-[0.7rem] block truncate">
                                {l.email}
                              </span>
                            )}
                          </div>

                          {/* Message Quote */}
                          {l.message && (
                            <div className="mt-2.5 border-l-2 border-ink/10 bg-bone-dim/30 px-2 py-1.5 font-sans text-xs text-ink-soft leading-normal">
                              "{l.message}"
                            </div>
                          )}

                          {/* Referral info */}
                          {l.sourcePage && (
                            <div className="mt-2 font-mono text-[0.55rem] text-concrete tracking-wide uppercase">
                              Ref: {l.sourcePage.replace('/properties/', '')}
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
                              href={`https://wa.me/${l.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(l.name)},%20this%20is%20Carry%20Construction.`}
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
                                onClick={() => moveLead(l.id, l.status, -1)}
                                className="flex h-5 w-5 items-center justify-center border border-ink/10 text-concrete hover:border-ink hover:text-ink transition-colors font-mono text-[0.6rem] font-bold cursor-pointer"
                                title="Move back"
                              >
                                <span>←</span>
                              </button>
                            )}
                            {l.status !== 'closed' && (
                              <button
                                onClick={() => moveLead(l.id, l.status, 1)}
                                className="flex h-5 w-5 items-center justify-center border border-ink/10 text-concrete hover:border-ink hover:text-ink transition-colors font-mono text-[0.6rem] font-bold cursor-pointer"
                                title="Move forward"
                              >
                                <span>→</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
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
