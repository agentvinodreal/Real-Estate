/**
 * Cloudinary URL builder for Field Ops images, ported from
 * `Data collection/packages/shared/src/cloudinary.ts`.
 *
 * Field Ops images live in a DIFFERENT Cloudinary cloud (`piwpzbke`) from the
 * website's own uploads (`pvrehhhs`, read from VITE_CLOUDINARY_CLOUD_NAME by
 * shared/src/cloudinary.ts). Both clouds are in play in this panel, so this
 * reads its own env var — never the website's — to make cross-wiring impossible.
 *
 * All images are stored as bare public IDs in the DB; URLs are constructed at
 * read time, so changing quality/size settings requires no migration.
 */
const CLOUD = (import.meta as any).env?.VITE_FIELDOPS_CLOUDINARY_CLOUD_NAME || 'piwpzbke'

const base = () => `https://res.cloudinary.com/${CLOUD}/image/upload`

export const img = {
  /** Tiny thumbnail for list views and table rows (fast on 3G). */
  thumb: (publicId: string) => `${base()}/w_200,h_200,c_fill,q_70,f_auto/${publicId}`,

  /** Card image for property/project cards. */
  card: (publicId: string) => `${base()}/w_800,q_auto,f_auto/${publicId}`,

  /** Full-size image for the detail view. */
  full: (publicId: string) => `${base()}/q_auto,f_auto/${publicId}`,

  /** Forces the browser to download at original quality. */
  download: (publicId: string, filename: string) =>
    `${base()}/fl_attachment:${encodeURIComponent(filename)},q_100/${publicId}`,
}
