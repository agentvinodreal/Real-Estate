import { useEffect, useState } from 'react'
import Seo from '../components/Seo'
import BlogCard from '../components/BlogCard'
import { api, type BlogPost } from '@carry/shared'

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .listBlogPosts()
      .then((res) => setPosts(res.data))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <Seo
        title="Guides & Insights — Patna Real Estate Blog"
        description="Read comprehensive guides about home buying, RERA updates, property registration, and turnkey construction costs in Patna."
        path="/blog"
      />

      {/* Header */}
      <div className="border-b border-ink/10 bg-bone-dim">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:py-16 sm:px-8">
          <span className="kicker">Knowledge</span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Guides & insights.
          </h1>
          <p className="mt-3 max-w-xl text-ink-soft">
            Everything you need to know about buying real estate, legal RERA compliance, and planning turnkey construction builds in Patna.
          </p>
        </div>
      </div>

      {/* Grid listing */}
      <div className="mx-auto max-w-7xl px-5 py-10 sm:py-16 sm:px-8">
        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col animate-pulse">
                <div className="shimmer blueprint aspect-[4/3] w-full" />
                <div className="shimmer bg-ink/5 mt-4 h-3.5 w-16 rounded-sm" />
                <div className="shimmer bg-ink/10 mt-2 h-6 w-3/4 rounded-sm" />
                <div className="shimmer bg-ink/5 mt-2 h-4 w-full rounded-sm" />
                <div className="shimmer bg-ink/5 mt-1 h-4 w-2/3 rounded-sm" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="border border-dashed border-ink/20 py-20 text-center">
            <p className="font-display text-2xl text-ink">No articles published yet.</p>
            <p className="text-sm text-concrete mt-1">Our team is compiling resources, check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
