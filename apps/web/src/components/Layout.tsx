import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
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
  return (
    <div className="flex min-h-screen flex-col bg-bone">
      <ScrollManager />
      <Header />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />

      {/* Sticky mobile call / WhatsApp bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 md:hidden">
        <a
          href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
          className="bg-ink py-3.5 text-center font-mono text-xs uppercase tracking-[0.15em] text-bone"
        >
          Call
        </a>
        <a
          href={`https://wa.me/${CONTACT.whatsapp}`}
          className="bg-ochre py-3.5 text-center font-mono text-xs uppercase tracking-[0.15em] text-ink"
        >
          WhatsApp
        </a>
      </div>
    </div>
  )
}
