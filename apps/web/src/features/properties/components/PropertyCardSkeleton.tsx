export default function PropertyCardSkeleton() {
  return (
    <div className="flex flex-col animate-pulse">
      {/* Thumbnail area */}
      <div className="shimmer blueprint aspect-[4/3] w-full" />

      {/* Title & Price */}
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <div className="shimmer bg-ink/10 h-6 w-2/3 rounded-sm" />
        <div className="shimmer bg-ochre/15 h-5 w-1/4 rounded-sm" />
      </div>

      {/* Locality & City */}
      <div className="shimmer bg-ink/5 mt-2 h-4 w-1/2 rounded-sm" />

      {/* Specs row */}
      <div className="mt-4 flex gap-4 border-t border-ink/10 pt-4">
        <div className="shimmer bg-ink/5 h-3.5 w-16 rounded-sm" />
        <div className="shimmer bg-ink/5 h-3.5 w-12 rounded-sm" />
        <div className="shimmer bg-ink/5 h-3.5 w-20 rounded-sm" />
      </div>

      {/* RERA */}
      <div className="shimmer bg-ink/5 mt-2 h-3 w-28 rounded-sm" />
    </div>
  )
}
