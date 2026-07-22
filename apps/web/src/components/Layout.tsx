import { useEffect, useState, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { Phone, MessageCircle } from 'lucide-react'
import Header from './Header'
import Footer from './Footer'
import CranePullController from './CranePullController'
import CartDrawer from './CartDrawer'
import ProfileDrawer from './ProfileDrawer'
import { CONTACT } from '../lib/data'

/** Scroll to top on navigation, or to a #hash target if present. */
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function Layout() {
  const { pathname } = useLocation()
  const [visible, setVisible] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY
      if (y > lastY.current && y > 80) {
        setVisible(false)
      } else {
        setVisible(true)
      }
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-bone pb-[60px] md:pb-0">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-ochre focus:text-ink focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-wider focus:border focus:border-ink/10"
      >
        Skip to content
      </a>
      <ScrollManager />
      <Header onProfileClick={() => setProfileOpen(true)} />
      <CranePullController />
      <CartDrawer />
      <ProfileDrawer isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

      <main id="main-content" className="flex-1 overflow-hidden">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>

      <Footer />

      {/* Floating WhatsApp Button — visible on all screen sizes */}
      <a
        href={`https://wa.me/${CONTACT.whatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="floating-whatsapp-btn group fixed z-[90] bottom-20 right-5 md:bottom-8 md:right-8"
      >
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping" />
        {/* Button */}
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg shadow-[#25D366]/40 transition-transform duration-200 group-hover:scale-110">
          {/* WhatsApp SVG icon */}
          <svg viewBox="0 0 32 32" className="h-7 w-7 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.003 2.667C8.636 2.667 2.667 8.636 2.667 16c0 2.37.644 4.59 1.764 6.504L2.667 29.333l7.035-1.738A13.27 13.27 0 0016.003 29.333c7.364 0 13.33-5.97 13.33-13.333 0-7.364-5.966-13.333-13.33-13.333zm0 24.267a11.156 11.156 0 01-5.69-1.553l-.408-.243-4.175 1.031 1.064-3.98-.266-.41A11.11 11.11 0 014.89 16C4.89 9.867 9.867 4.89 16.003 4.89c6.133 0 11.11 4.977 11.11 11.11 0 6.136-4.977 11.11-11.11 11.11zm6.09-8.323c-.334-.167-1.975-.976-2.282-1.087-.307-.112-.531-.167-.754.167-.222.334-.863 1.087-1.058 1.31-.194.222-.39.25-.724.083-.334-.167-1.41-.52-2.686-1.66-.993-.888-1.663-1.985-1.858-2.32-.194-.334-.021-.515.146-.682.15-.149.334-.39.5-.585.167-.194.222-.334.334-.557.111-.222.056-.417-.028-.585-.083-.167-.754-1.82-1.034-2.49-.272-.653-.549-.565-.754-.575l-.641-.01c-.222 0-.585.083-.89.417-.307.334-1.17 1.143-1.17 2.79 0 1.646 1.197 3.236 1.364 3.458.167.222 2.356 3.597 5.708 5.044.797.344 1.42.55 1.905.703.8.254 1.53.219 2.107.133.643-.096 1.975-.808 2.254-1.59.278-.78.278-1.448.194-1.59-.083-.14-.306-.222-.64-.39z" />
          </svg>
        </span>
        {/* Tooltip */}
        <span className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-sm bg-ink px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-bone opacity-0 transition-opacity duration-200 group-hover:opacity-100 shadow-md">
          Chat on WhatsApp
        </span>
      </a>

      {/* Sticky mobile call / WhatsApp bar */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 md:hidden bg-ink transition-transform duration-300 pb-[env(safe-area-inset-bottom,0px)] ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <a
          href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
          className="bg-ink py-4 text-center font-mono text-xs uppercase tracking-[0.15em] text-bone flex items-center justify-center gap-2 hover:bg-ink-soft transition-colors"
        >
          <Phone className="h-3.5 w-3.5" />
          Call
        </a>
        <a
          href={`https://wa.me/${CONTACT.whatsapp}`}
          className="bg-ochre py-4 text-center font-mono text-xs uppercase tracking-[0.15em] text-ink flex items-center justify-center gap-2 hover:bg-ochre-dark transition-colors"
        >
          <MessageCircle className="h-3.5 w-3.5 fill-current" />
          WhatsApp
        </a>
      </div>
    </div>
  )
}
