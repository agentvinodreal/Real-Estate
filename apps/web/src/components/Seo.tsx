// React 19 hoists <title>/<meta>/<link> rendered anywhere into <head>.
// So this component just renders the tags for the current page.

const SITE = 'https://www.carryconstruction.com'
const DEFAULT_DESC =
  'Carry Construction — property sale, resale, and turnkey construction services from design to execution in Pune.'

type SeoProps = {
  title?: string
  description?: string
  path?: string
  jsonLd?: object
  image?: string
}

const getOgImageUrl = (img?: string) => {
  if (!img) return `${SITE}/og-default.jpg`
  if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) return img
  const cloudName = import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME ?? 'piwpzbke'
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_1200,h_630,c_fill,q_auto,f_auto/${img}`
}

export default function Seo({ title, description = DEFAULT_DESC, path = '', jsonLd, image }: SeoProps) {
  const fullTitle = title ? `${title} — Carry Construction` : 'Carry Construction — Build. Buy. Belong.'
  const url = `${SITE}${path}`
  const ogImg = getOgImageUrl(image)

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImg} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content={ogImg} />
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
    </>
  )
}
