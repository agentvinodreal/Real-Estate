import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Logo } from '@carry/shared'
import { adminApi, adminAuth } from '../lib/adminApi'

const TABS = [
  { to: '/', label: 'Leads', end: true },
  { to: '/properties', label: 'Properties', end: false },
  { to: '/projects', label: 'Projects', end: false },
]

export default function Layout() {
  const [state, setState] = useState<'checking' | 'ok'>('checking')
  const navigate = useNavigate()

  useEffect(() => {
    if (!adminAuth.get()) {
      navigate('/login')
      return
    }
    adminApi.verify().then((ok) => {
      if (ok) setState('ok')
      else {
        adminAuth.clear()
        navigate('/login')
      }
    })
  }, [navigate])

  function logout() {
    adminAuth.clear()
    navigate('/login')
  }

  if (state === 'checking') {
    return <p className="p-10 font-mono text-sm text-concrete">Checking access…</p>
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
          <button onClick={logout} className="font-mono text-xs uppercase tracking-[0.15em] text-ink hover:text-ochre-dark">
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
