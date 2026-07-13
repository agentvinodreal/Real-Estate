import Seo from '../components/Seo'

export default function Terms() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
      <Seo
        title="Terms of Use — Carry Construction"
        description="Terms and conditions for utilizing the Carry Construction website."
        path="/terms"
      />

      <span className="kicker">Legal</span>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        Terms of Use
      </h1>
      <p className="mt-2 text-xs font-mono text-concrete">Last Updated: July 13, 2026</p>

      <div className="mt-10 space-y-8 font-sans text-sm text-ink-soft leading-relaxed">
        <section>
          <h2 className="font-display text-xl font-semibold text-ink mb-3">1. Use of the Site</h2>
          <p>
            By accessing carryconstruction.com, you agree to these terms, all applicable laws, and RERA disclosures. The content on this website is for informational purposes only and does not constitute a legal binding contract.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink mb-3">2. Listing Accuracy & Disclaimers</h2>
          <p>
            While we strive to ensure RERA validation and accurate listing specifications (carpet area, rates, amenities), listing information changes frequently. Users are requested to independently verify all layout details, certificates, and prices before signing any transactional builder agreements.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink mb-3">3. Intellectual Property</h2>
          <p>
            All architectural drawings, branding components, layout plans, and original photos are the property of Carry Construction and cannot be reproduced without explicit written consent.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink mb-3">4. Limitation of Liability</h2>
          <p>
            Carry Construction is not liable for structural changes, layout adjustments, or pricing differences made by partner developers after the listing was published.
          </p>
        </section>
      </div>
    </div>
  )
}
