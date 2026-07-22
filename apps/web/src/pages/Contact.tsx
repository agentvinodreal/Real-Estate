import Seo from '../components/Seo'
import InquiryForm from '../components/InquiryForm'
import { Phone, MessageCircle, Mail, MapPin, Clock } from 'lucide-react'
import { CONTACT } from '../lib/data'

export default function Contact() {
  return (
    <div>
      <Seo
        title="Contact Us — Carry Construction Office & Enquiries"
        description="Get in touch with Carry Construction in Bihar. Contact us for property sale, resale, or custom design-and-build turnkey quotes."
        path="/contact"
      />

      {/* Header */}
      <div className="border-b border-ink/10 bg-bone-dim">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:py-16 sm:px-8">
          <span className="kicker">Get in touch</span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Let's talk about your project.
          </h1>
          <p className="mt-3 max-w-xl text-ink-soft">
            Whether you want to buy a home, list your resale property, or get an estimate for end-to-end turnkey construction in Patna — we are here to help.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="mx-auto max-w-7xl px-5 py-10 sm:py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          {/* Left Column - Info & Map */}
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">Contact Information</h2>
            
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {/* Phone */}
              <a
                href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
                className="group flex gap-4 border border-ink/10 bg-bone p-5 transition-colors hover:border-ochre"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-teal/5 text-teal group-hover:bg-ochre group-hover:text-ink transition-colors">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-mono text-[0.6rem] uppercase tracking-wider text-concrete">Call Us</h3>
                  <p className="mt-1 font-semibold text-ink text-sm sm:text-base">{CONTACT.phone}</p>
                </div>
              </a>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/${CONTACT.whatsapp}`}
                className="group flex gap-4 border border-ink/10 bg-bone p-5 transition-colors hover:border-ochre"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-teal/5 text-teal group-hover:bg-ochre group-hover:text-ink transition-colors">
                  <MessageCircle className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <h3 className="font-mono text-[0.6rem] uppercase tracking-wider text-concrete">WhatsApp</h3>
                  <p className="mt-1 font-semibold text-ink text-sm sm:text-base">Chat Now →</p>
                </div>
              </a>

              {/* Email */}
              <a
                href={`mailto:${CONTACT.email}`}
                className="group flex gap-4 border border-ink/10 bg-bone p-5 transition-colors hover:border-ochre"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-teal/5 text-teal group-hover:bg-ochre group-hover:text-ink transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-mono text-[0.6rem] uppercase tracking-wider text-concrete">Email</h3>
                  <p className="mt-1 font-semibold text-ink text-sm sm:text-base truncate max-w-[200px]">{CONTACT.email}</p>
                </div>
              </a>

              {/* Office hours */}
              <div className="flex gap-4 border border-ink/10 bg-bone p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-teal/5 text-teal">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-mono text-[0.6rem] uppercase tracking-wider text-concrete">Office Hours</h3>
                  <p className="mt-1 font-semibold text-ink text-sm sm:text-base">Mon–Sat, 10am–7pm</p>
                </div>
              </div>
            </div>

            {/* Office Address */}
            <div className="mt-8 flex gap-4 border border-ink/10 bg-bone p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-teal/5 text-teal">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-mono text-[0.6rem] uppercase tracking-wider text-concrete">Office Address</h3>
                <p className="mt-1 text-sm text-ink-soft leading-relaxed">
                  {CONTACT.address}
                </p>
              </div>
            </div>

            {/* Google Map Iframe */}
            <div className="mt-8 relative overflow-hidden border border-ink/10 aspect-[4/3] sm:aspect-[16/8] w-full">
              <iframe
                src="https://maps.google.com/maps?q=New%20Market,%20Katihar,%20Bihar%20854105&z=14&output=embed"
                className="w-full h-full border-none"
                allowFullScreen
                loading="lazy"
                title="Office Location Map"
              />
            </div>
          </div>

          {/* Right Column - Inquiry Form */}
          <div>
            <div className="lg:sticky lg:top-24">
              <InquiryForm sourcePage="/contact" heading="Send us a message" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
