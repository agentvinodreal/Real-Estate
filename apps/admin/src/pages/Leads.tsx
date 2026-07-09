import { useEffect, useState } from 'react'
import { adminApi, type Lead } from '../lib/adminApi'

const STATUSES = ['new', 'contacted', 'visit', 'closed']
const statusColor: Record<string, string> = {
  new: 'bg-ochre text-bone',
  contacted: 'bg-steel text-bone',
  visit: 'bg-ink text-bone',
  closed: 'bg-concrete text-bone',
}

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

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Leads</h1>
          <p className="mt-1 text-sm text-concrete">{leads.length} total enquiries</p>
        </div>
      </div>

      {loading ? (
        <p className="font-mono text-sm text-concrete">Loading…</p>
      ) : leads.length === 0 ? (
        <p className="border border-dashed border-ink/20 p-10 text-center text-ink-soft">No leads yet.</p>
      ) : (
        <div className="overflow-x-auto border border-ink/10">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-bone-dim text-left font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Source</th>
                <th className="p-3">Message</th>
                <th className="p-3">When</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-t border-ink/10 align-top">
                  <td className="p-3 font-medium text-ink">{l.name}</td>
                  <td className="p-3"><a href={`tel:${l.phone}`} className="text-ochre-dark">{l.phone}</a></td>
                  <td className="p-3 text-ink-soft">{l.sourcePage ?? '—'}</td>
                  <td className="p-3 text-ink-soft">{l.message ?? '—'}</td>
                  <td className="p-3 text-concrete">{new Date(l.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="p-3">
                    <select
                      value={l.status}
                      onChange={(e) => change(l.id, e.target.value)}
                      className={`border-0 px-2 py-1 font-mono text-[0.6rem] uppercase tracking-[0.12em] ${statusColor[l.status] ?? ''}`}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
