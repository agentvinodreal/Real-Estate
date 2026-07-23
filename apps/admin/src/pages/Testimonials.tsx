import { useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Star } from 'lucide-react'
import { adminApi } from '../lib/adminApi'
import type { Testimonial } from '@carry/shared'
import { Card, CardGrid, EmptyState, LoadingState, PageHeader } from '../components/ui'

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
      <PageHeader title="Reviews" subtitle={`${items.length} total customer testimonials`} />

      {loading ? (
        <LoadingState label="Loading reviews…" />
      ) : items.length === 0 ? (
        <EmptyState>No reviews found. Reviews submitted by users on the website will appear here.</EmptyState>
      ) : (
        <CardGrid>
          <AnimatePresence mode="popLayout">
            {items.map((t) => (
              <Card key={t.id}>
                <div>
                  <div className="mb-4 flex items-center justify-between gap-3 border-b border-ink/5 pb-3">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} className={`h-3.5 w-3.5 ${idx < t.rating ? 'fill-ochre text-ochre' : 'text-concrete'}`} strokeWidth={1.5} />
                      ))}
                    </div>
                    {t.createdAt && (
                      <span className="font-mono text-[0.65rem] text-concrete">
                        {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>

                  <blockquote className="mb-6 font-sans text-sm italic leading-relaxed text-ink">“{t.quote}”</blockquote>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-ink/5 pt-4">
                  <div>
                    <div className="text-sm font-semibold leading-tight text-ink">{t.name}</div>
                    {t.location && <div className="mt-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-concrete">{t.location}</div>}
                  </div>

                  <button onClick={() => remove(t)} className="cursor-pointer font-mono text-xs uppercase tracking-[0.12em] text-ochre-dark transition-colors hover:text-ink">
                    Delete
                  </button>
                </div>
              </Card>
            ))}
          </AnimatePresence>
        </CardGrid>
      )}
    </div>
  )
}
