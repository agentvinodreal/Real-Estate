import { Logo } from '@carry/shared'
import { CONTACT } from '../lib/data'

export default function Footer() {
  return (
    <footer id="contact" className="bg-ink text-bone">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="text-bone">
              <Logo tone="bone" />
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-bone/60">
              Property sale, resale, and turnkey construction — from the first
              drawing to the final handover. Built in {CONTACT.city}.
            </p>
          </div>

          <div>
            <h4 className="kicker mb-4 text-ochre">Explore</h4>
            <ul className="space-y-2.5 text-sm text-bone/70">
              <li><a href="#listings" className="hover:text-ochre">Buy a home</a></li>
              <li><a href="#services" className="hover:text-ochre">Resale &amp; advisory</a></li>
              <li><a href="#process" className="hover:text-ochre">Construction</a></li>
              <li><a href="#stats" className="hover:text-ochre">About us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="kicker mb-4 text-ochre">Get in touch</h4>
            <ul className="space-y-2.5 text-sm text-bone/70">
              <li><a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`} className="hover:text-ochre">{CONTACT.phone}</a></li>
              <li><a href={`mailto:${CONTACT.email}`} className="hover:text-ochre">{CONTACT.email}</a></li>
              <li>
                <a href={`https://wa.me/${CONTACT.whatsapp}`} className="hover:text-ochre">
                  WhatsApp us
                </a>
              </li>
              <li>{CONTACT.city}</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col justify-between gap-3 border-t border-bone/15 pt-6 text-xs text-bone/45 sm:flex-row">
          <span>© {new Date().getFullYear()} Carry Construction. All rights reserved.</span>
          <span className="font-mono tracking-wider">RERA · Privacy · Terms</span>
        </div>
      </div>
    </footer>
  )
}
