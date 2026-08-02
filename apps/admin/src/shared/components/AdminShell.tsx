import type { ComponentType, ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useClerk, useUser } from '@clerk/clerk-react'
import { AnimatePresence, motion } from 'motion/react'
import { LogOut } from 'lucide-react'
import { Logo } from '@carry/shared'
import { EASE_OUT_EXPO, pageTransition } from '../lib/motion'
import WorkspaceSwitcher from './WorkspaceSwitcher'

export type Tab = {
  to: string
  label: string
  Icon: ComponentType<{ className?: string; strokeWidth?: number }>
  end?: boolean
  badge?: number
}

/**
 * Chrome shared by both workspaces: the admin guard, the header with the
 * Website/Field Ops switcher, the tab row, and the animated <Outlet>.
 *
 * The guard is deliberately single: both APIs require `role === 'admin'` on the
 * same Clerk user, so there is nothing per-workspace to check.
 *
 * `outletContext` is passed straight through — only the website workspace uses
 * it (Leads and Orders read it via useOutletContext).
 */
export default function AdminShell({
  tabs,
  eyebrow,
  outletContext,
}: {
  tabs: Tab[]
  eyebrow: ReactNode
  outletContext?: unknown
}) {
  const location = useLocation()
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bone">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-concrete animate-pulse">Checking access…</p>
      </div>
    )
  }

  // Redirecting to /login is the caller's job — it needs the router's navigate.
  if (!isSignedIn) return null

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

  return (
    <div className="min-h-screen bg-bone">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-bone-dim/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link to={tabs[0]?.to ?? '/'} className="flex items-center gap-3 text-ink transition-opacity hover:opacity-70">
            <Logo showWordmark={false} />
            <span className="flex flex-col leading-tight">
              <span className="font-display text-xl font-semibold text-ink">Carry</span>
              <span className="font-mono text-[0.55rem] font-medium uppercase tracking-[0.25em] text-concrete">
                {eyebrow}
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-5">
            <WorkspaceSwitcher />
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL + 'login' })}
              className="flex cursor-pointer items-center gap-1.5 font-mono text-xs uppercase tracking-[0.15em] text-ink hover:text-ochre-dark"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.8} />
              Sign out
            </motion.button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-5">
          {tabs.map((t) => (
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
                  <t.Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
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
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} {...pageTransition}>
            <Outlet context={outletContext} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
