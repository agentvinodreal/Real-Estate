import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useClerk, useUser } from '@clerk/clerk-react'
import { Logo } from '@carry/shared'
import { adminApi, type Lead } from '../lib/adminApi'

export default function Layout() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()
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

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/login')
    } else if (isLoaded && isSignedIn) {
      loadLeads()
    }
  }, [isLoaded, isSignedIn, navigate])

  if (!isLoaded) {
    return <p className="p-10 font-mono text-sm text-concrete">Checking access…</p>
  }

  if (!isSignedIn) {
    return null
  }

  if (user.publicMetadata.role !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bone px-5 text-center">
        <p className="font-display text-2xl font-semibold text-ink">Not authorized</p>
        <p className="max-w-sm text-sm text-ink-soft">
          Your account ({user.primaryEmailAddress?.emailAddress}) doesn't have admin access yet.
        </p>
        <button
          onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL + 'login' })}
          className="font-mono text-xs uppercase tracking-[0.15em] text-ink hover:text-ochre-dark"
        >
          Sign out
        </button>
      </div>
    )
  }

  const isOrder = (l: Lead) => !!l.marketplaceType || l.sourcePage === '/marketplace-cart' || l.sourcePage?.startsWith('/marketplace')

  const newLeadsCount = leads.filter((l) => !isOrder(l) && l.status === 'new').length
  const newOrdersCount = leads.filter((l) => isOrder(l) && l.status === 'new').length

  const tabs = [
    { to: '/', label: 'Leads', end: true, badge: newLeadsCount },
    { to: '/orders', label: 'Orders', end: false, badge: newOrdersCount },
    { to: '/properties', label: 'Properties', end: false },
    { to: '/projects', label: 'Projects', end: false },
    { to: '/blog', label: 'Blog', end: false },
    { to: '/testimonials', label: 'Reviews', end: false },
    { to: '/marketplace', label: 'Marketplace', end: false },
  ]

  return (
    <div className="min-h-screen bg-bone">
      <header className="border-b border-ink/10 bg-bone-dim">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-ink"><Logo /></Link>
            <span className="hidden font-mono text-[0.6rem] uppercase tracking-[0.2em] text-concrete sm:inline">
              Admin
            </span>
          </div>
          <button
            onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL + 'login' })}
            className="font-mono text-xs uppercase tracking-[0.15em] text-ink hover:text-ochre-dark"
          >
            Sign out
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-6 px-5 overflow-x-auto">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `border-b-2 pb-3 font-mono text-xs uppercase tracking-[0.15em] flex items-center gap-1.5 whitespace-nowrap ${
                  isActive ? 'border-ochre text-ink' : 'border-transparent text-concrete hover:text-ink'
                }`
              }
            >
              <span>{t.label}</span>
              {t.badge !== undefined && t.badge > 0 && (
                <span className="bg-ochre px-1.5 py-0.5 rounded-full text-white font-sans text-[0.65rem] font-bold leading-none animate-pulse">
                  {t.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <Outlet context={{ leads, loading, changeLeadStatus, loadLeads }} />
      </main>
    </div>
  )
}
