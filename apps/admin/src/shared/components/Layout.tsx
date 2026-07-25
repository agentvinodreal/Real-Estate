import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useClerk, useUser } from '@clerk/clerk-react'
import { AnimatePresence, motion } from 'motion/react'
import { Inbox, ShoppingCart, Building2, HardHat, Newspaper, Star, Store, LogOut } from 'lucide-react'
import { Logo } from '@carry/shared'
import { adminApi, type Lead } from '../lib/adminApi'
import { EASE_OUT_EXPO, pageTransition } from '../lib/motion'

const TAB_ICONS = {
  '/': Inbox,
  '/orders': ShoppingCart,
  '/properties': Building2,
  '/projects': HardHat,
  '/blog': Newspaper,
  '/testimonials': Star,
  '/marketplace': Store,
} as const

export default function Layout() {
  const location = useLocation()
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

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bone">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-concrete animate-pulse">Checking access…</p>
      </div>
    )
  }

  if (!isSignedIn) {
    return null
  }

  if (user.publicMetadata.role !== 'admin') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bone px-5 text-center"
      >
        <p className="font-display text-2xl font-semibold text-ink">Not authorized</p>
        <p className="max-w-sm text-sm text-ink-soft">
          Your account ({user.primaryEmailAddress?.emailAddress}) doesn't have admin access yet.
        </p>
        <button
          onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL + 'login' })}
          className="font-mono text-xs uppercase tracking-[0.15em] text-ink hover:text-ochre-dark cursor-pointer"
        >
          Sign out
        </button>
      </motion.div>
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
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-bone-dim/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3 text-ink transition-opacity hover:opacity-70">
            <Logo showWordmark={false} />
            <span className="flex flex-col leading-tight">
              <span className="font-display text-xl font-semibold text-ink">Carry</span>
              <span className="font-mono text-[0.55rem] font-medium uppercase tracking-[0.25em] text-concrete">
                Construction <span className="text-ink-soft/70">/ Admin</span>
              </span>
            </span>
          </Link>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL + 'login' })}
            className="flex cursor-pointer items-center gap-1.5 font-mono text-xs uppercase tracking-[0.15em] text-ink hover:text-ochre-dark"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.8} />
            Sign out
          </motion.button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-6 px-5 overflow-x-auto">
          {tabs.map((t) => {
            const Icon = TAB_ICONS[t.to as keyof typeof TAB_ICONS]
            return (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  `relative flex items-center gap-1.5 whitespace-nowrap pb-3 font-mono text-xs uppercase tracking-[0.15em] transition-colors hover:text-ink ${
                    isActive ? 'text-ink' : 'text-concrete'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                    <span>{t.label}</span>
                    {t.badge !== undefined && t.badge > 0 && (
                      <motion.span
                        key={t.badge}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                        className="rounded-full bg-ochre px-1.5 py-0.5 font-sans text-[0.65rem] font-bold leading-none text-white"
                      >
                        {t.badge}
                      </motion.span>
                    )}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-indicator"
                        transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                        className="absolute inset-x-0 -bottom-px h-0.5 bg-ochre"
                      />
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} {...pageTransition}>
            <Outlet context={{ leads, loading, changeLeadStatus, deleteLead, loadLeads }} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
