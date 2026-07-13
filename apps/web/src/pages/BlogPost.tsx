import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Seo from '../components/Seo'
import Photo from '../components/Photo'
import InquiryForm from '../components/InquiryForm'
import { api, type BlogPost } from '@carry/shared'

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'notfound'>('loading')

  useEffect(() => {
    if (!slug) return
    setState('loading')
    api
      .getBlogPost(slug)
      .then((res) => {
        setPost(res)
        setState('ready')
      })
      .catch(() => setState('notfound'))
  }, [slug])

  if (state === 'loading') {
    return (
      <div className="animate-pulse">
        {/* Breadcrumb + meta skeleton */}
        <div className="mx-auto max-w-7xl px-5 pt-6 sm:px-8">
          <div className="shimmer bg-ink/5 h-4 w-20 rounded-sm mb-4" />
          <div className="shimmer bg-ink/10 h-10 w-2/3 sm:h-12 rounded-sm" />
          <div className="shimmer bg-ink/5 mt-3 h-4 w-32 rounded-sm" />
        </div>

        {/* Cover Image skeleton */}
        <div className="mx-auto max-w-7xl px-5 sm:px-8 mt-6">
          <div className="shimmer blueprint aspect-[16/7] w-full" />
        </div>

        {/* Body content skeleton */}
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            <div className="shimmer bg-ink/10 h-7 w-48 rounded-sm" />
            <div className="space-y-2">
              <div className="shimmer bg-ink/5 h-4 w-full rounded-sm" />
              <div className="shimmer bg-ink/5 h-4 w-full rounded-sm" />
              <div className="shimmer bg-ink/5 h-4 w-3/4 rounded-sm" />
            </div>
            <div className="shimmer bg-ink/5 h-4 w-full rounded-sm mt-4" />
            <div className="shimmer bg-ink/5 h-4 w-5/6 rounded-sm" />
          </div>

          <div>
            <div className="shimmer bg-ink/5 h-[320px] w-full border border-ink/10 rounded-sm" />
          </div>
        </div>
      </div>
    )
  }

  if (state === 'notfound' || !post) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-24 text-center sm:px-8">
        <h1 className="font-display text-3xl font-semibold text-ink">Article not found</h1>
        <Link to="/blog" className="mt-4 inline-block font-mono text-xs uppercase tracking-[0.15em] text-ochre-dark">
          ← Back to blog
        </Link>
      </div>
    )
  }

  const p = post
  const wordCount = p.body.split(/\s+/).length
  const readTime = Math.max(1, Math.ceil(wordCount / 200))
  const formattedDate = new Date(p.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.title,
    description: p.excerpt ?? '',
    image: p.coverImage ?? 'https://www.carryconstruction.com/og-default.jpg',
    author: { '@type': 'Organization', name: 'Carry Construction' },
    publisher: {
      '@type': 'Organization',
      name: 'Carry Construction',
      logo: { '@type': 'ImageObject', url: 'https://www.carryconstruction.com/logo.png' }
    },
    datePublished: p.createdAt,
    dateModified: p.createdAt
  }

  return (
    <div>
      <Seo
        title={p.metaTitle || p.title}
        description={p.metaDescription || p.excerpt || p.title}
        path={`/blog/${p.slug}`}
        image={p.coverImage || undefined}
        jsonLd={jsonLd}
      />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-5 pt-6 sm:px-8">
        <Link to="/blog" className="font-mono text-xs uppercase tracking-[0.15em] text-concrete hover:text-ochre-dark">
          ← Back to blog
        </Link>
      </div>

      {/* Meta + Title */}
      <div className="mx-auto max-w-7xl px-5 pb-8 pt-4 sm:px-8">
        <div className="flex items-center gap-3 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-concrete mb-3">
          <span>{formattedDate}</span>
          <span>•</span>
          <span className="text-ochre-dark">{readTime} min read</span>
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl leading-tight max-w-4xl">
          {p.title}
        </h1>
      </div>

      {/* Cover Image */}
      {p.coverImage && (
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Photo
            src={p.coverImage}
            seed={p.slug}
            label={p.title}
            className="aspect-[16/7] w-full bg-ink"
            objectFit="cover"
          />
        </div>
      )}

      {/* Body Grid */}
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.6fr_1fr]">
        <article className="prose">
          <div dangerouslySetInnerHTML={{ __html: p.body }} />
        </article>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <InquiryForm sourcePage={`/blog/${p.slug}`} heading="Interested in building or buying?" />
        </aside>
      </div>
    </div>
  )
}
