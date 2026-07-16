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
