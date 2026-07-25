import { Link } from 'react-router-dom'
import { Logo } from '@carry/shared'
import { CONTACT } from '../lib/data'

export default function Footer() {
  return (
    <footer id="contact" className="bg-ink text-bone border-t border-bone/10">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.2fr_0.8fr_1fr_1fr]">
          {/* Column 1: Brand details */}
          <div>
            <div className="text-bone">
              <Logo tone="bone" />
            </div>
            <p className="mt-5 max-w-xs text-xs leading-relaxed text-bone/60">
              Property sale, resale, and end-to-end turnkey construction services. Built on trust, structural precision, and architectural layouting.
            </p>
            <p className="mt-4 font-mono text-[0.65rem] text-bone/45 leading-relaxed">
              {CONTACT.address}
            </p>
          </div>

          {/* Column 2: Explore links */}
          <div>
            <h4 className="kicker mb-4 text-ochre">Explore</h4>
            <ul className="space-y-2.5 text-xs text-bone/70">
              <li><Link to="/properties" className="hover:text-ochre">Buy a home</Link></li>
              <li><Link to="/properties?listingType=Resale" className="hover:text-ochre">Resale &amp; advisory</Link></li>
              <li><Link to="/construction" className="hover:text-ochre">Construction</Link></li>
              <li><Link to="/about" className="hover:text-ochre">About us</Link></li>
              <li><Link to="/blog" className="hover:text-ochre">Blog &amp; Guides</Link></li>
            </ul>
          </div>

          {/* Column 3: Contact info */}
          <div>
            <h4 className="kicker mb-4 text-ochre">Get in touch</h4>
            <ul className="space-y-2.5 text-xs text-bone/70">
              <li>
                <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`} className="hover:text-ochre font-semibold">
                  {CONTACT.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT.email}`} className="hover:text-ochre truncate block max-w-full">
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a href={`https://wa.me/${CONTACT.whatsapp}`} className="hover:text-ochre">
                  WhatsApp chat
                </a>
              </li>
              <li className="text-bone/45 font-mono text-[0.65rem] uppercase tracking-wider mt-3">
                Mon–Sat, 10am–7pm IST
              </li>
            </ul>
          </div>

          {/* Column 4: Social handles */}
          <div>
            <h4 className="kicker mb-4 text-ochre">Follow us</h4>
            <ul className="space-y-2.5 text-xs text-bone/70">
              <li>
                <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-ochre">
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar info */}
        <div className="mt-14 flex flex-col justify-between gap-4 border-t border-bone/10 pt-6 text-[0.65rem] text-bone/45 sm:flex-row font-mono">
          <span>© {new Date().getFullYear()} Carry Construction. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-bone">Privacy Policy</Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-bone">Terms of Use</Link>
          </div>
          <span className="text-bone/30">Designed &amp; built in Delhi by Suryansh Singh 🇮🇳</span>
        </div>
      </div>
    </footer>
  )
}
