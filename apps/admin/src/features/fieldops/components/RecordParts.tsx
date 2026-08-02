import { Download, MapPin } from 'lucide-react'
import { Badge } from '../../../shared/components/ui'
import { img } from '../lib/img'
import type { ReviewStatus } from '../lib/types'

/** reviewStatus rendered in the panel's own tones rather than generic red/green. */
export function ReviewBadge({ status }: { status: ReviewStatus }) {
  const tone = status === 'reviewed' ? 'teal' : status === 'deleted' ? 'concrete' : 'ochre'
  return <Badge tone={tone}>{status}</Badge>
}

/**
 * Photo grid with per-image download links. Images are Cloudinary public IDs in
 * the Field Ops cloud; `img.download` forces an original-quality attachment.
 */
export function Gallery({ title, publicIds, filePrefix }: { title: string; publicIds: string[]; filePrefix: string }) {
  if (publicIds.length === 0) return null
  return (
    <div className="mt-6">
      <p className="mb-2 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete">
        {title} ({publicIds.length})
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-3">
        {publicIds.map((publicId, i) => (
          <div key={publicId} className="flex flex-col gap-1">
            <img
              src={img.card(publicId)}
              alt={`${filePrefix} ${i + 1}`}
              loading="lazy"
              className="h-20 w-full border border-ink/10 object-cover"
            />
            <a
              href={img.download(publicId, `${filePrefix}-photo-${i + 1}`)}
              download
              className="flex items-center gap-1 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-ochre-dark hover:text-ink"
            >
              <Download className="h-3 w-3" strokeWidth={1.8} />
              Download
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

/** GPS coordinates with a Maps link and an embedded preview. */
export function LocationBlock({ lat, lng }: { lat?: number | null; lng?: number | null }) {
  if (lat === undefined || lat === null || lng === undefined || lng === null) return null
  return (
    <div className="mt-6">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete">
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-ochre-dark hover:text-ink"
        >
          <MapPin className="h-3 w-3" strokeWidth={1.8} />
          Google Maps
        </a>
      </div>
      <iframe
        src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
        title="Location map"
        loading="lazy"
        className="h-52 w-full border border-ink/10"
      />
    </div>
  )
}

/** Label/value pair for the detail modals. Hidden when there is nothing to show. */
export function Detail({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div>
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-concrete">{label}</p>
      <p className={`mt-0.5 text-sm text-ink ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
