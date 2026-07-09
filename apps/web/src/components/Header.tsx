import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@carry/shared'
import { CONTACT } from '../lib/data'

const NAV: { label: string; to: string }[] = [
  { label: 'Buy', to: '/properties' },
  { label: 'Resale', to: '/properties?listingType=Resale' },
  { label: 'Construction', to: '/construction' },
  { label: 'About', to: '/#stats' },
  { label: 'Contact', to: '/#contact' },
]

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-bone/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link to="/" className="text-ink">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="font-mono text-xs uppercase tracking-[0.18em] text-ink-soft transition-colors hover:text-ochre-dark"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <a
            href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
            className="inline-flex items-center gap-2 bg-ink px-5 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-bone transition-colors hover:bg-ochre-dark"
          >
            Call us
          </a>
        </div>

        {/* mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center md:hidden"
          aria-label="Toggle menu"
        >
          <span className="relative block h-3 w-6">
            <span className={`absolute left-0 top-0 h-0.5 w-6 bg-ink transition ${open ? 'translate-y-1.5 rotate-45' : ''}`} />
            <span className={`absolute bottom-0 left-0 h-0.5 w-6 bg-ink transition ${open ? '-translate-y-1 -rotate-45' : ''}`} />
          </span>
        </button>
      </div>

      {open && (
        <nav className="border-t border-ink/10 bg-bone px-5 pb-6 pt-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block border-b border-ink/5 py-3 font-mono text-xs uppercase tracking-[0.18em] text-ink-soft"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
            className="mt-4 inline-flex bg-ink px-5 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-bone"
          >
            Call {CONTACT.phone}
          </a>
        </nav>
      )}
    </header>
  )
}
