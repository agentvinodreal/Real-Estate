import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { Building2, Users, Store, HardHat } from 'lucide-react'
import AdminShell, { type Tab } from './AdminShell'

/**
 * Field Ops workspace — records collected by field agents, served by a separate
 * API and database (see features/fieldops/lib/fieldOpsApi.ts).
 *
 * No leads state here: that is website-only, and keeping it out means switching
 * to this workspace doesn't fire a website API request.
 */
const tabs: Tab[] = [
  { to: '/field-ops/properties', label: 'Properties', Icon: Building2 },
  { to: '/field-ops/labour', label: 'Servicemen', Icon: Users },
  { to: '/field-ops/shops', label: 'Shops', Icon: Store },
  { to: '/field-ops/agents', label: 'Agents', Icon: HardHat },
]

export default function FieldOpsLayout() {
  const { isLoaded, isSignedIn } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoaded && !isSignedIn) navigate('/login')
  }, [isLoaded, isSignedIn, navigate])

  return (
    <AdminShell
      tabs={tabs}
      eyebrow={
        <>
          Field Ops <span className="text-ink-soft/70">/ Admin</span>
        </>
      }
    />
  )
}
