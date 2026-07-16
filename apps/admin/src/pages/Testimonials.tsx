import { useEffect, useState } from 'react'
import { adminApi } from '../lib/adminApi'
import type { Testimonial } from '@carry/shared'

export default function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    adminApi
      .listTestimonialsAdmin()
      .then(setItems)
      .catch((err) => {
        console.error('Failed to load testimonials:', err)
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function remove(item: Testimonial) {
    if (!confirm(`Are you sure you want to delete the review by "${item.name}"? This cannot be undone.`)) return
    try {
      await adminApi.deleteTestimonial(item.id)
      setItems((xs) => xs.filter((x) => x.id !== item.id))
    } catch (err) {
      alert(`Failed to delete testimonial: ${err instanceof Error ? err.message : String(err)}`)
      console.error(err)
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Reviews</h1>
          <p className="mt-1 text-sm text-concrete">{items.length} total customer testimonials</p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <p className="font-mono text-sm text-concrete animate-pulse">Loading Reviews…</p>
        </div>
      ) : items.length === 0 ? (
        <p className="border border-dashed border-ink/20 p-10 text-center text-ink-soft bg-bone-dim/30">
          No reviews found. Reviews submitted by users on the website will appear here.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <div
              key={t.id}
              className="group flex flex-col justify-between border border-ink/10 bg-bone p-5 hover:border-ink/20 shadow-sm transition-all"
            >
              <div>
                {/* Header: Rating & Date */}
                <div className="flex items-center justify-between gap-3 border-b border-ink/5 pb-3 mb-4">
                  {/* Star rating */}
                  <div className="flex gap-0.5 text-xs">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <span key={idx} className={idx < t.rating ? 'text-ochre' : 'text-concrete'}>
                        ★
                      </span>
                    ))}
                  </div>
                  {t.createdAt && (
                    <span className="font-mono text-[0.65rem] text-concrete">
                      {new Date(t.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>

                {/* Review Text */}
                <blockquote className="font-sans text-sm leading-relaxed text-ink italic mb-6">
                  “{t.quote}”
                </blockquote>
              </div>

              {/* Footer: User Details & Action */}
              <div className="border-t border-ink/5 pt-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-sm text-ink leading-tight">{t.name}</div>
                  {t.location && (
                    <div className="font-mono text-[0.65rem] uppercase tracking-wider text-concrete mt-0.5">
                      {t.location}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => remove(t)}
                  className="font-mono text-xs uppercase tracking-[0.12em] text-ochre-dark hover:text-ink transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
