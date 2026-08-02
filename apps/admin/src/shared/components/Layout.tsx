import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { Inbox, ShoppingCart, Building2, HardHat, Newspaper, Star, Store } from 'lucide-react'
import { adminApi, type Lead } from '../lib/adminApi'
import AdminShell, { type Tab } from './AdminShell'

/**
 * Website workspace. Owns the leads state that Leads and Orders consume through
 * the Outlet context, and the unread badge counts on their tabs; the chrome
 * itself lives in AdminShell, shared with the Field Ops workspace.
 */
export default function Layout() {
  const { isLoaded, isSignedIn } = useUser()
  const navigate = useNavigate()

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  async function loadLeads() {
    if (!isSignedIn) return
    setLoading(true)
    try {
      const data = await adminApi.listLeads()
      setLeads(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function changeLeadStatus(id: string, status: string) {
    await adminApi.setLeadStatus(id, status)
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)))
  }

  async function deleteLead(id: string) {
    await adminApi.deleteLead(id)
    setLeads((ls) => ls.filter((l) => l.id !== id))
  }

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/login')
    } else if (isLoaded && isSignedIn) {
      loadLeads()
    }
  }, [isLoaded, isSignedIn, navigate])

  const isOrder = (l: Lead) => !!l.marketplaceType || l.sourcePage === '/marketplace-cart' || l.sourcePage?.startsWith('/marketplace')

  const newLeadsCount = leads.filter((l) => !isOrder(l) && l.status === 'new').length
  const newOrdersCount = leads.filter((l) => isOrder(l) && l.status === 'new').length

  const tabs: Tab[] = [
    { to: '/', label: 'Leads', Icon: Inbox, end: true, badge: newLeadsCount },
    { to: '/orders', label: 'Orders', Icon: ShoppingCart, badge: newOrdersCount },
    { to: '/properties', label: 'Properties', Icon: Building2 },
    { to: '/projects', label: 'Projects', Icon: HardHat },
    { to: '/blog', label: 'Blog', Icon: Newspaper },
    { to: '/testimonials', label: 'Reviews', Icon: Star },
    { to: '/marketplace', label: 'Marketplace', Icon: Store },
  ]

  return (
    <AdminShell
      tabs={tabs}
      eyebrow={
        <>
          Construction <span className="text-ink-soft/70">/ Admin</span>
        </>
      }
      outletContext={{ leads, loading, changeLeadStatus, deleteLead, loadLeads }}
    />
  )
}
