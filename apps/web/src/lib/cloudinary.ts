const CLOUD_NAME = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME ?? 'pvrehhhs'

/**
 * Inject `f_auto,q_auto` into a Cloudinary delivery URL so browsers always
 * receive a renderable, optimized format. iPhone uploads arrive as `.heic`,
 * which no browser can render in an <img> tag; `f_auto` transcodes to
 * webp/jpeg on delivery.
 *
 * Accepts either a full secure_url or a bare public_id, and is a no-op for
 * empty / non-Cloudinary values.
 */
export function cldAuto(src: string | null | undefined, extra = ''): string {
  if (!src) return ''
  const transform = ['f_auto', 'q_auto', extra].filter(Boolean).join(',')

  if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
    if (/\/upload\/[^/]*f_auto/.test(src)) return src
    return src.replace('/upload/', `/upload/${transform}/`)
  }

  if (!src.startsWith('http')) {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transform}/${src}`
  }

  return src
}
