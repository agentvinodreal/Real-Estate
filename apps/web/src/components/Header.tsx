import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'
import { Logo } from '@carry/shared'
import { Sun, Moon, ShoppingCart, X, User } from 'lucide-react'
import { CONTACT } from '../lib/data'
import { useCart } from '../context/CartContext'
import { motion, AnimatePresence } from 'motion/react'

const NAV: { label: string; to: string }[] = [
  { label: 'Buy', to: '/properties' },
  { label: 'Construction', to: '/construction' },
  { label: 'Marketplace', to: '/marketplace' },
  { label: 'Home Designer', to: '/home-designer' },
  { label: 'About', to: '/about' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contact', to: '/contact' },
]

export default function Header({ onProfileClick }: { onProfileClick: () => void }) {
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

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

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
            <button
              onClick={onProfileClick}
              className="flex items-center gap-1.5 border border-bone/25 hover:border-ochre bg-transparent px-4 py-2 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-bone/90 hover:text-ochre transition-colors cursor-pointer"
            >
              <User className="h-3.5 w-3.5" />
              <span>Profile</span>
            </button>
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
          className="flex h-10 w-10 items-center justify-center md:hidden cursor-pointer"
          aria-label="Toggle menu"
        >
          <span className="relative block h-3 w-6">
            <span className={`absolute left-0 top-0 h-0.5 w-6 bg-bone transition ${open ? 'translate-y-1.5 rotate-45' : ''}`} />
            <span className={`absolute bottom-0 left-0 h-0.5 w-6 bg-bone transition ${open ? '-translate-y-1 -rotate-45' : ''}`} />
          </span>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-teal-dark/60 backdrop-blur-xs md:hidden"
            />
            {/* Drawer */}
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
              className="fixed inset-y-0 right-0 z-50 w-[290px] bg-teal-dark px-6 py-6 shadow-2xl flex flex-col md:hidden text-bone border-l border-bone/10"
            >
              {/* Drawer Header with Close Button */}
              <div className="flex items-center justify-between pb-6 border-b border-bone/10 mb-4">
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-ochre">Menu</span>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-bone/20 text-bone/80 hover:text-ochre hover:border-ochre transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto space-y-1">
                {NAV.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="block border-b border-bone/5 py-3 font-mono text-sm uppercase tracking-[0.18em] text-bone/85 hover:text-ochre transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Drawer Footer Actions */}
              <div className="border-t border-bone/10 pt-4 space-y-3.5">
                <div className="flex items-center justify-between text-bone/85">
                  <span className="font-mono text-xs uppercase tracking-[0.18em]">Cart</span>
                  <button
                    onClick={() => {
                      setOpen(false)
                      toggleCart()
                    }}
                    className="relative flex h-9 w-9 items-center justify-center rounded-full border border-bone/20 text-bone hover:text-ochre hover:border-ochre transition-colors cursor-pointer"
                    aria-label="Shopping Cart"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {cartCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-ochre font-mono text-[0.62rem] font-bold text-teal-dark">
                        {cartCount}
                      </span>
                    )}
                  </button>
                </div>
                
                <div className="flex items-center justify-between text-bone/85">
                  <span className="font-mono text-xs uppercase tracking-[0.18em]">Theme</span>
                  <button
                    onClick={toggleTheme}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-bone/20 text-bone hover:text-ochre hover:border-ochre transition-colors cursor-pointer"
                    aria-label="Toggle theme"
                  >
                    {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-bone/5 pt-3.5">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button
                        onClick={() => setOpen(false)}
                        className="font-mono text-xs uppercase tracking-[0.18em] text-bone/80 hover:text-ochre cursor-pointer"
                      >
                        Sign in
                      </button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <button
                      onClick={() => {
                        setOpen(false)
                        onProfileClick()
                      }}
                      className="flex items-center gap-1.5 border border-bone/20 hover:border-ochre bg-transparent px-3.5 py-2.5 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-bone/90 hover:text-ochre transition-colors cursor-pointer w-full justify-center"
                    >
                      <User className="h-3.5 w-3.5" />
                      <span>My Profile</span>
                    </button>
                  </SignedIn>
                </div>

                <a
                  href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
                  className="flex w-full items-center justify-center bg-ochre py-3 text-center font-mono text-xs uppercase tracking-[0.15em] text-teal-dark transition-colors hover:bg-ochre-dark hover:text-bone font-semibold"
                >
                  Call Us
                </a>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
