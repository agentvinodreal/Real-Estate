import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Pencil, UserX } from 'lucide-react'
import { getAuthToken } from '../../../shared/lib/adminApi'
import { fieldOpsApi } from '../lib/fieldOpsApi'
import { img } from '../lib/img'
import {
  Badge,
  Button,
  EmptyState,
  ErrorNote,
  IconButton,
  Input,
  Label,
  LoadingState,
  Modal,
  PageHeader,
} from '../../../shared/components/ui'

/**
 * Field agents, read from Clerk via the Field Ops API's admin routes.
 * `id` here is the Clerk user id, which is what the PATCH/DELETE routes key on.
 */
type AgentEntry = {
  id: string
  name?: string
  email: string
  phone?: string
  age?: number
  status: 'active' | 'pending'
  createdAt: string
  clerkUserId?: string
  imageUrl?: string
  role?: string
}

type AgentResponse = {
  id: string
  name: string
  email: string
  phone?: string
  age?: number
  status: string
  role: string
  imageUrl?: string
  createdAt: string
}

const avatar = (a: AgentEntry) =>
  a.imageUrl ? (a.imageUrl.startsWith('http') ? a.imageUrl : img.thumb(a.imageUrl)) : null

export default function Agents() {
  const [agents, setAgents] = useState<AgentEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)

  // Edit modal state — keyed by clerkUserId, which is what the API expects.
  const [editing, setEditing] = useState<AgentEntry | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAge, setEditAge] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editProfilePhotoUrl, setEditProfilePhotoUrl] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const fetchAgents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const token = await getAuthToken()
      if (!token) throw new Error('Not authenticated')
      const active = await fieldOpsApi.get<AgentResponse[]>('/agents', token)
      setAgents(active.map((u) => ({ ...u, clerkUserId: u.id, status: 'active' as const })))
    } catch (err: any) {
      setError(err.message || 'Failed to fetch agents')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  // Silent polling keeps the list fresh while an invite is being accepted.
  // Held in a ref so re-renders don't restart the interval.
  const fetchRef = useRef(fetchAgents)
  useEffect(() => {
    fetchRef.current = fetchAgents
  }, [fetchAgents])

  useEffect(() => {
    fetchRef.current(false)
    const timer = setInterval(() => fetchRef.current(true), 5000)
    return () => clearInterval(timer)
  }, [])

  function startEdit(agent: AgentEntry) {
    setEditing(agent)
    setEditName(agent.name || '')
    setEditPhone(agent.phone || '')
    setEditAge(agent.age !== undefined && agent.age !== null ? String(agent.age) : '')
    setEditEmail(agent.email || '')
    setEditProfilePhotoUrl(agent.imageUrl || '')
    setEditRole(agent.role || 'agent')
    setEditError(null)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    const clerkUserId = editing?.clerkUserId
    if (!clerkUserId) return
    setEditLoading(true)
    setEditError(null)
    try {
      const token = await getAuthToken()
      if (!token) throw new Error('Not authenticated')
      await fieldOpsApi.patch(
        `/agents/${clerkUserId}`,
        {
          name: editName.trim() || undefined,
          phone: editPhone.trim() || undefined,
          age: editAge ? parseInt(editAge, 10) : null,
          email: editEmail.trim() || undefined,
          profilePhotoUrl: editProfilePhotoUrl.trim() || null,
          role: editRole,
        },
        token,
      )
      setEditing(null)
      fetchAgents()
    } catch (err: any) {
      setEditError(err.message || 'Failed to update agent details')
    } finally {
      setEditLoading(false)
    }
  }

  async function handleRevoke(clerkUserId: string) {
    if (!confirm("Revoke this agent's access? They will no longer be able to use the agent app.")) return
    setRevoking(clerkUserId)
    try {
      const token = await getAuthToken()
      if (!token) throw new Error('Not authenticated')
      await fieldOpsApi.delete(`/agents/${clerkUserId}`, token)
      fetchAgents()
    } catch (err: any) {
      alert(err.message || 'Failed to revoke agent')
    } finally {
      setRevoking(null)
    }
  }

  return (
    <div>
      <PageHeader title="Agents" subtitle={`${agents.length} with access to the field app`} />

      {error && <ErrorNote>{error}</ErrorNote>}

      {loading ? (
        <LoadingState label="Loading agents…" />
      ) : agents.length === 0 ? (
        <EmptyState>No agents found.</EmptyState>
      ) : (
        <>
          {/* Table on desktop — these are short text columns, not image-led records. */}
          <div className="hidden overflow-x-auto border border-ink/10 md:block">
            <table className="w-full min-w-3xl border-collapse text-left">
              <thead>
                <tr className="border-b border-ink/10 bg-bone-dim/40">
                  {['', 'Name', 'Email', 'Phone', 'Age', 'Role', 'Status', 'Joined', ''].map((h, i) => (
                    <th
                      key={i}
                      className="px-4 py-3 font-mono text-[0.6rem] uppercase tracking-[0.15em] font-medium text-concrete"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id} className="border-b border-ink/5 last:border-0 hover:bg-bone-dim/30">
                    <td className="px-4 py-3">
                      <AgentAvatar agent={agent} />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-ink">{agent.name || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-soft">{agent.email}</td>
                    <td className="px-4 py-3 text-sm text-ink-soft">{agent.phone || '—'}</td>
                    <td className="px-4 py-3 text-sm text-ink-soft">{agent.age ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={agent.role === 'admin' ? 'ochre' : 'ink'}>{agent.role || 'agent'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={agent.status === 'active' ? 'teal' : 'concrete'}>{agent.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-concrete">
                      {new Date(agent.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <AgentActions agent={agent} revoking={revoking} onEdit={startEdit} onRevoke={handleRevoke} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stacked cards on mobile */}
          <div className="flex flex-col gap-4 md:hidden">
            {agents.map((agent) => (
              <div key={agent.id} className="border border-ink/10 bg-bone p-4">
                <div className="flex items-center gap-3">
                  <AgentAvatar agent={agent} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{agent.name || 'Agent profile'}</p>
                    <p className="truncate font-mono text-xs text-concrete">{agent.email}</p>
                  </div>
                  <Badge tone={agent.status === 'active' ? 'teal' : 'concrete'}>{agent.status}</Badge>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <Field label="Phone" value={agent.phone || '—'} />
                  <Field label="Age" value={agent.age ?? '—'} />
                  <Field label="Role" value={agent.role || 'agent'} />
                  <Field label="Joined" value={new Date(agent.createdAt).toLocaleDateString()} />
                </dl>
                <div className="mt-4 flex justify-end">
                  <AgentActions agent={agent} revoking={revoking} onEdit={startEdit} onRevoke={handleRevoke} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <AnimatePresence>
        {editing && (
          <Modal onClose={() => setEditing(null)} className="max-w-lg">
            <form onSubmit={handleEdit} className="p-6">
              <h2 className="mb-5 font-display text-xl font-semibold text-ink">Edit agent profile</h2>

              <div className="flex flex-col gap-4">
                <div>
                  <Label>Email address *</Label>
                  <Input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="agent@example.com"
                  />
                </div>
                <div>
                  <Label>Profile photo URL / Cloudinary public ID</Label>
                  <Input
                    value={editProfilePhotoUrl}
                    onChange={(e) => setEditProfilePhotoUrl(e.target.value)}
                    placeholder="e.g. agent_avatar_123 or https://…"
                  />
                </div>
                <div>
                  <Label>Full name</Label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="e.g. Suryansh Singh" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone number</Label>
                    <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="e.g. +91 9999999999" />
                  </div>
                  <div>
                    <Label>Age</Label>
                    <Input
                      type="number"
                      min="0"
                      max="120"
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value)}
                      placeholder="e.g. 25"
                    />
                  </div>
                </div>
                <div>
                  <Label>Role *</Label>
                  <Input required value={editRole} onChange={(e) => setEditRole(e.target.value)} placeholder="agent or admin" />
                </div>
              </div>

              {editError && <p className="mt-4 text-sm text-red-600">{editError}</p>}

              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
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

function AgentAvatar({ agent }: { agent: AgentEntry }) {
  const src = avatar(agent)
  return src ? (
    <img src={src} alt={agent.name || 'Agent'} className="h-9 w-9 shrink-0 rounded-full object-cover" />
  ) : (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand font-mono text-xs text-concrete">
      {(agent.name || agent.email || '?').charAt(0).toUpperCase()}
    </div>
  )
}

function AgentActions({
  agent,
  revoking,
  onEdit,
  onRevoke,
}: {
  agent: AgentEntry
  revoking: string | null
  onEdit: (a: AgentEntry) => void
  onRevoke: (clerkUserId: string) => void
}) {
  if (agent.status !== 'active' || !agent.clerkUserId) return null
  return (
    <div className="flex justify-end gap-2">
      <IconButton onClick={() => onEdit(agent)} aria-label={`Edit ${agent.name || agent.email}`}>
        <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
      </IconButton>
      <IconButton
        danger
        disabled={revoking === agent.clerkUserId}
        onClick={() => onRevoke(agent.clerkUserId!)}
        aria-label={`Revoke ${agent.name || agent.email}`}
      >
        <UserX className="h-3.5 w-3.5" strokeWidth={1.8} />
      </IconButton>
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{value}</dd>
    </div>
  )
}
