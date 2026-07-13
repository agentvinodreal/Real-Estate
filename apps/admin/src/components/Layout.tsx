import { useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useClerk, useUser } from '@clerk/clerk-react'
import { Logo } from '@carry/shared'

const TABS = [
  { to: '/', label: 'Leads', end: true },
  { to: '/properties', label: 'Properties', end: false },
  { to: '/projects', label: 'Projects', end: false },
  { to: '/blog', label: 'Blog', end: false },
  { to: '/testimonials', label: 'Reviews', end: false },
]

export default function Layout() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoaded && !isSignedIn) navigate('/login')
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
          onClick={() => signOut({ redirectUrl: '/admin/login' })}
          className="font-mono text-xs uppercase tracking-[0.15em] text-ink hover:text-ochre-dark"
        >
          Sign out
        </button>
      </div>
    )
  }

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
            onClick={() => signOut({ redirectUrl: '/admin/login' })}
            className="font-mono text-xs uppercase tracking-[0.15em] text-ink hover:text-ochre-dark"
          >
            Sign out
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-6 px-5">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `border-b-2 pb-3 font-mono text-xs uppercase tracking-[0.15em] ${
                  isActive ? 'border-ochre text-ink' : 'border-transparent text-concrete hover:text-ink'
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  )
}
