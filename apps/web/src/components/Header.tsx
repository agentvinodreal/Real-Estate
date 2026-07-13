import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { Logo } from '@carry/shared'
import { Sun, Moon, ShoppingCart } from 'lucide-react'
import { CONTACT } from '../lib/data'
import { useCart } from '../context/CartContext'

const NAV: { label: string; to: string }[] = [
  { label: 'Buy', to: '/properties' },
  { label: 'Construction', to: '/construction' },
  { label: 'Marketplace', to: '/marketplace' },
  { label: 'About', to: '/about' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contact', to: '/contact' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { toggleCart, cartCount } = useCart()

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light'
    }
    return 'light'
  })

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <header
      className={`sticky top-0 z-50 border-b border-teal-dark/30 bg-teal/95 text-bone backdrop-blur transition-shadow duration-300 ${
        scrolled ? 'shadow-[0_4px_20px_-8px_rgba(10,41,42,0.5)]' : 'shadow-none'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link to="/" className="text-bone">
          <Logo tone="bone" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="font-mono text-xs uppercase tracking-[0.18em] text-bone/85 transition-colors hover:text-ochre"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <button
            onClick={toggleCart}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-bone/25 text-bone/80 transition-colors hover:border-ochre hover:text-ochre cursor-pointer"
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-ochre font-mono text-[0.62rem] font-bold text-teal-dark">
                {cartCount}
              </span>
            )}
          </button>
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-bone/25 text-bone/80 transition-colors hover:border-ochre hover:text-ochre cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="font-mono text-xs uppercase tracking-[0.18em] text-bone/80 transition-colors hover:text-ochre">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
          <a
            href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
            className="inline-flex items-center gap-2 bg-ochre px-5 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-teal-dark transition-colors hover:bg-ochre-dark hover:text-bone"
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
            <span className={`absolute left-0 top-0 h-0.5 w-6 bg-bone transition ${open ? 'translate-y-1.5 rotate-45' : ''}`} />
            <span className={`absolute bottom-0 left-0 h-0.5 w-6 bg-bone transition ${open ? '-translate-y-1 -rotate-45' : ''}`} />
          </span>
        </button>
      </div>

      {open && (
        <nav className="border-t border-bone/10 bg-teal-dark px-5 pb-6 pt-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block border-b border-bone/5 py-3 font-mono text-xs uppercase tracking-[0.18em] text-bone/80"
            >
              {item.label}
            </Link>
          ))}
          <div className="flex items-center justify-between border-b border-bone/5 py-3">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-bone/80">Cart ({cartCount})</span>
            <button
              onClick={() => {
                setOpen(false)
                toggleCart()
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-bone/20 text-bone/85"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center justify-between border-b border-bone/5 py-3">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-bone/80">Theme</span>
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-bone/20 text-bone/85"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex items-center justify-between border-b border-bone/5 py-3">
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  onClick={() => setOpen(false)}
                  className="font-mono text-xs uppercase tracking-[0.18em] text-bone/80"
                >
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
          <a
            href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
            className="mt-4 inline-flex bg-ochre px-5 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-teal-dark transition-colors hover:bg-ochre-dark hover:text-bone"
          >
            Call {CONTACT.phone}
          </a>
        </nav>
      )}
    </header>
  )
}
