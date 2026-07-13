import { useEffect, useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { api, type Testimonial } from '@carry/shared'
import { TESTIMONIALS as FALLBACK } from '../lib/data'
import Photo from '../components/Photo'
import Reveal from '../components/motion/Reveal'
import { EASE_OUT_EXPO } from '../lib/motion'

function InitialsAvatar({ name, className = '' }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const colors = ['bg-steel', 'bg-teal', 'bg-ink', 'bg-concrete']
  const colorIndex = name.charCodeAt(0) % colors.length
  const bgColor = colors[colorIndex]

  return (
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${bgColor} ${className}`}>
      <span className="font-mono text-xs font-semibold text-bone">{initials}</span>
    </div>
  )
}

const inputClass =
  'w-full border border-ink/20 bg-bone px-3 py-2.5 text-sm text-ink placeholder:text-concrete focus:border-teal focus:outline-none'

export default function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)

  // Review Form States
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [quote, setQuote] = useState('')
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  useEffect(() => {
    api
      .listTestimonials()
      .then((res) => {
        const data = res.data.map((t) => ({
          id: t.id,
          name: t.name,
          location: t.location,
          rating: t.rating || 5,
          quote: t.quote,
          avatarUrl: t.avatarUrl
        }))
        setItems(data.length > 0 ? data : FALLBACK.map((t, idx) => ({ id: String(idx), ...t, rating: 5, avatarUrl: null })))
      })
      .catch(() => {
        setItems(FALLBACK.map((t, idx) => ({ id: String(idx), ...t, rating: 5, avatarUrl: null })))
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleFormSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitStatus('sending')
    try {
      const newReview = await api.submitTestimonial({
        name,
        location: location || null,
        rating,
        quote,
        avatarUrl: null
      })
      setSubmitStatus('done')
      // Prepend the new review to the local state list so it displays immediately
      setItems((prev) => [
        {
          id: newReview.id,
          name: newReview.name,
          location: newReview.location,
          rating: newReview.rating,
          quote: newReview.quote,
          avatarUrl: newReview.avatarUrl,
        },
        ...prev,
      ])
      // Reset form fields
      setName('')
      setLocation('')
      setQuote('')
      setRating(5)
    } catch (err) {
      console.error(err)
      setSubmitStatus('error')
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:py-20 sm:px-8">
      <Reveal className="max-w-2xl">
        <span className="kicker">In their words</span>
        <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
          Trusted by 600+ families.
        </h2>
      </Reveal>

      {loading ? (
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex h-full flex-col border-t-2 border-teal/20 pt-6 animate-pulse">
              <div className="shimmer bg-ink/5 h-4 w-full rounded-sm mb-2" />
              <div className="shimmer bg-ink/5 h-4 w-5/6 rounded-sm mb-2" />
              <div className="shimmer bg-ink/5 h-4 w-2/3 rounded-sm" />
              <div className="mt-6 flex items-center gap-3">
                <div className="shimmer bg-ink/5 h-11 w-11 rounded-full" />
                <div className="flex-1">
                  <div className="shimmer bg-ink/5 h-4 w-24 rounded-sm mb-1" />
                  <div className="shimmer bg-ink/5 h-3.5 w-16 rounded-sm" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {items.map((t, i) => (
            <Reveal key={t.id || t.name} delay={i * 0.1}>
              <motion.figure
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                className="flex h-full flex-col border-t-2 border-teal pt-6"
              >
                {/* Star rating */}
                <div className="flex gap-0.5 mb-4 text-xs">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <span key={idx} className={idx < t.rating ? 'text-ochre' : 'text-concrete'}>
                      ★
                    </span>
                  ))}
                </div>

                <blockquote className="flex-1 font-display text-lg leading-relaxed text-ink">
                  “{t.quote}”
                </blockquote>

                <figcaption className="mt-6 flex items-center gap-3">
                  {t.avatarUrl ? (
                    <Photo seed={t.name} label={t.name} className="h-11 w-11 shrink-0" rounded src={t.avatarUrl} />
                  ) : (
                    <InitialsAvatar name={t.name} />
                  )}
                  <div>
                    <div className="font-semibold text-ink">{t.name}</div>
                    <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-concrete">
                      {t.location}
                    </div>
                  </div>
                </figcaption>
              </motion.figure>
            </Reveal>
          ))}
        </div>
      )}

      {/* Review Submission Area */}
      <div className="mt-16 border-t border-ink/10 pt-12 flex flex-col items-center">
        {!showForm ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowForm(true)}
            className="bg-ink px-6 py-3 font-mono text-xs uppercase tracking-[0.15em] text-bone hover:bg-ochre-dark transition-colors cursor-pointer"
          >
            Write a Review
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="w-full max-w-lg border border-ink/15 bg-bone-dim p-6 sm:p-8"
          >
            {submitStatus === 'done' ? (
              <div className="text-center py-6">
                <span className="text-4xl">✨</span>
                <h3 className="mt-4 font-display text-xl font-semibold text-ink">Thank you for your review!</h3>
                <p className="mt-2 text-sm text-ink-soft">
                  Your feedback has been successfully submitted and added to our list.
                </p>
                <button
                  onClick={() => {
                    setShowForm(false)
                    setSubmitStatus('idle')
                  }}
                  className="mt-6 border border-ink/20 bg-bone px-5 py-2 font-mono text-xs uppercase tracking-wider text-ink hover:border-ochre hover:text-ochre transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-xl font-semibold text-ink">Share your experience</h3>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-xs font-mono uppercase text-concrete hover:text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block font-mono text-[0.65rem] uppercase tracking-wider text-concrete mb-1.5">Rating</label>
                    <div className="flex gap-1 text-2xl">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className={`transition-colors cursor-pointer ${
                            (hoverRating || rating) >= star ? 'text-ochre' : 'text-concrete'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="review-name" className="block font-mono text-[0.65rem] uppercase tracking-wider text-concrete mb-1.5">Name</label>
                    <input
                      id="review-name"
                      required
                      type="text"
                      className={inputClass}
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="review-location" className="block font-mono text-[0.65rem] uppercase tracking-wider text-concrete mb-1.5">Location (Optional)</label>
                    <input
                      id="review-location"
                      type="text"
                      className={inputClass}
                      placeholder="e.g. Pune"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="review-quote" className="block font-mono text-[0.65rem] uppercase tracking-wider text-concrete mb-1.5">Your Review</label>
                    <textarea
                      id="review-quote"
                      required
                      minLength={5}
                      rows={4}
                      className={`${inputClass} resize-none`}
                      placeholder="Tell us what you liked about our service..."
                      value={quote}
                      onChange={(e) => setQuote(e.target.value)}
                    />
                  </div>
                </div>

                {submitStatus === 'error' && (
                  <p className="mt-4 text-xs text-ochre-dark font-mono">
                    Something went wrong. Please check your network and try again.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitStatus === 'sending'}
                  className="mt-6 w-full bg-teal py-3 font-mono text-xs uppercase tracking-[0.15em] text-bone transition-colors hover:bg-teal-dark disabled:opacity-60 cursor-pointer"
                >
                  {submitStatus === 'sending' ? 'Submitting…' : 'Submit Review'}
                </button>
              </form>
            )}
          </motion.div>
        )}
      </div>
    </section>
  )
}
