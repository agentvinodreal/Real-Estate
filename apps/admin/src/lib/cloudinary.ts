const CLOUD_NAME = 'pvrehhhs'

/**
 * Inject `f_auto,q_auto` into a Cloudinary delivery URL so browsers always
 * receive a renderable, optimized format. This matters for iPhone uploads,
 * which arrive as `.heic` — a format no browser can render in an <img> tag.
 * With `f_auto`, Cloudinary transcodes to webp/jpeg on delivery.
 *
 * Accepts either a full secure_url (https://res.cloudinary.com/.../upload/...)
 * or a bare public_id, and is a no-op for non-Cloudinary / empty values.
 */
export function cldAuto(src: string | null | undefined, extra = ''): string {
  if (!src) return ''
  const transform = ['f_auto', 'q_auto', extra].filter(Boolean).join(',')

  // Full Cloudinary delivery URL — inject the transform after `/upload/`.
  if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
    // Don't double-apply if a format transform is already present.
    if (/\/upload\/[^/]*f_auto/.test(src)) return src
    return src.replace('/upload/', `/upload/${transform}/`)
  }

  // Bare public_id.
  if (!src.startsWith('http')) {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transform}/${src}`
  }

  // Some other absolute URL — leave it untouched.
  return src
}
