import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Reveal from '../components/motion/Reveal'
import { EASE_OUT_EXPO } from '../lib/motion'

type FaqItem = {
  question: string
  answer: string
}

const FAQS: FaqItem[] = [
  {
    question: 'What areas does Carry Construction serve?',
    answer:
      'We serve all major cities across Bihar — including Patna, Gaya, Muzaffarpur, Bhagalpur, Darbhanga, Ara, and Hajipur. In Patna, we cover premium localities like Boring Road, Kankarbagh, Rajendra Nagar, Bailey Road, Patliputra Colony, and Danapur. Whether you are buying, selling, or building, our team operates state-wide across Bihar.',
  },
  {
    question: 'Is Bihar a good place to invest in real estate?',
    answer:
      "Yes — Bihar is one of India's fastest growing states by GDP and infrastructure spending. Patna, the state capital, is seeing a surge in residential demand driven by metro connectivity, AIIMS expansion, and IT park development. Property prices remain relatively affordable compared to metros, offering strong appreciation potential. Cities like Gaya, Muzaffarpur, and Bhagalpur are also emerging real estate destinations.",
  },
  {
    question: 'What is the difference between a new property and a resale property?',
    answer:
      'New properties are freshly constructed or under construction units sold directly by the builder. Resale properties are previously owned homes being sold by existing owners. We handle both — our advisory team helps you evaluate which option suits your budget, timeline, and requirements.',
  },
  {
    question: 'Do you offer turnkey construction services?',
    answer:
      'Yes. Turnkey construction means we manage the entire project — from architectural design and structural engineering to interior finishing and handover. You hand us a plot and receive a move-in-ready home. We handle all contractors, materials, approvals, and timelines.',
  },
  {
    question: 'Are you RERA registered?',
    answer:
      'Yes, Carry Construction is RERA registered. Our registration details are displayed on every listing and in our footer. RERA compliance ensures complete transparency in pricing, timelines, and deliverables as mandated by the Real Estate (Regulation and Development) Act, 2016.',
  },
  {
    question: 'How do I schedule a site visit?',
    answer:
      'You can schedule a site visit directly through WhatsApp, phone call, or our Contact page. Our team typically confirms visits within a few hours and accommodates flexible timing including weekends.',
  },
  {
    question: 'Can I get home loan assistance through Carry Construction?',
    answer:
      'We work with several leading banks and NBFCs and can connect you with trusted loan advisors who will guide you through the home loan process — from eligibility checks to documentation. This service is complimentary for our clients.',
  },
  {
    question: 'What documents do I need to buy a property through you?',
    answer:
      'For buying, you typically need identity proof (Aadhaar, PAN), address proof, income documents for loan processing, and bank statements. Our team guides you through the full documentation checklist specific to the property type and transaction.',
  },
  {
    question: 'How long does a typical construction project take?',
    answer:
      'Timeline depends on the scope. A standard 3BHK residential construction typically takes 12–18 months from foundation to handover. We provide a detailed project timeline at the start and share regular updates throughout. Our construction process section explains each stage in detail.',
  },
   {
    question: 'Do you provide interior design services?',
    answer:
      'Yes, we offer interior design services as part of our turnkey construction packages. Our in-house designers work with you to create functional and aesthetic interiors that match your lifestyle and preferences.',
   },
]

function FaqItem({
  item,
  isOpen,
  onToggle,
  index,
}: {
  item: FaqItem
  isOpen: boolean
  onToggle: () => void
  index: number
}) {
  return (
    <Reveal delay={index * 0.05}>
      <div className="border-b border-ink/10">
        <button
          onClick={onToggle}
          aria-expanded={isOpen}
          className="flex w-full items-start justify-between gap-6 py-5 text-left cursor-pointer group"
        >
          <span className="font-display text-base font-normal text-ink group-hover:text-teal transition-colors sm:text-lg">
            {item.question}
          </span>
          <motion.span
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
            className="mt-1 shrink-0 text-xl leading-none text-ochre"
          >
            +
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="answer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
              className="overflow-hidden"
            >
              <p className="pb-5 pr-8 text-sm leading-relaxed text-ink-soft">
                {item.answer}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  )
}

// Schema.org FAQPage JSON-LD structured data for SEO rich results
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: f.answer,
    },
  })),
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? null : i))

  return (
    <section id="faq" className="mx-auto max-w-7xl px-5 py-12 sm:py-20 sm:px-8">
      {/* FAQ Schema.org structured data — enables Google rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        {/* Left: Heading */}
        <Reveal className="lg:sticky lg:top-28 lg:h-fit">
          <span className="kicker">Got questions?</span>
          <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Frequently asked questions.
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-soft">
            Everything you need to know before buying, selling, or building with Carry
            Construction. Can't find your answer?{' '}
            <a
              href="/contact"
              className="text-teal underline underline-offset-2 hover:text-teal-dark"
            >
              Reach out directly.
            </a>
          </p>
        </Reveal>

        {/* Right: Accordion */}
        <div>
          {FAQS.map((item, i) => (
            <FaqItem
              key={i}
              item={item}
              index={i}
              isOpen={openIndex === i}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
