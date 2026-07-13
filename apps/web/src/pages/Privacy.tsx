import Seo from '../components/Seo'

export default function Privacy() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
      <Seo
        title="Privacy Policy — Carry Construction"
        description="Privacy policy details regarding information collection and user data safety for Carry Construction."
        path="/privacy"
      />

      <span className="kicker">Legal</span>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-xs font-mono text-concrete">Last Updated: July 13, 2026</p>

      <div className="mt-10 space-y-8 font-sans text-sm text-ink-soft leading-relaxed">
        <section>
          <h2 className="font-display text-xl font-semibold text-ink mb-3">1. Information Collection</h2>
          <p>
            We collect personal data you provide directly to us through callback request forms, WhatsApp links, and enquiry widgets. This includes your name, phone number, email address, and specific messages about properties or projects you have interest in.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink mb-3">2. How We Use Information</h2>
          <p>
            We use the information collected to call you back, arrange site visits, provide construction quotes, and answer any general enquiries. We will never sell or rent your contact details to third-party marketing services.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink mb-3">3. Data Retention & Safety</h2>
          <p>
            Your lead data is stored securely in our neon postgres database and is accessible only to authorized administrators via authenticated channels. We retain personal details only as long as necessary to fulfill customer support and real estate advisory relationships.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-ink mb-3">4. Contact Information</h2>
          <p>
            If you have questions about this policy or request to delete your personal data from our systems, please email us directly at hello@carryconstruction.com.
          </p>
        </section>
      </div>
    </div>
  )
}
