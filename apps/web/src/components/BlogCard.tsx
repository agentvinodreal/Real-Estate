import { Link } from 'react-router-dom'
import Photo from './Photo'
import type { BlogPost } from '@carry/shared'

type Props = {
  post: BlogPost
}

export default function BlogCard({ post }: Props) {
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  return (
    <Link to={`/blog/${post.slug}`} className="group flex flex-col">
      <div className="relative overflow-hidden aspect-[4/3] w-full bg-ink">
        <Photo
          src={post.coverImage || undefined}
          seed={post.slug}
          label={post.title}
          className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </div>

      <div className="mt-4 flex flex-col flex-1">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-ochre-dark">
          {formattedDate}
        </span>
        <h3 className="mt-2 font-display text-xl font-semibold text-ink group-hover:text-ochre-dark leading-snug">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-2 text-sm text-concrete line-clamp-2 leading-relaxed flex-1">
            {post.excerpt}
          </p>
        )}
        <span className="mt-4 font-mono text-xs uppercase tracking-[0.15em] text-ink transition-colors group-hover:text-ochre-dark">
          Read more →
        </span>
      </div>
    </Link>
  )
}
