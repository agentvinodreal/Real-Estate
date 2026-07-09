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
}

export default function Seo({ title, description = DEFAULT_DESC, path = '', jsonLd }: SeoProps) {
  const fullTitle = title ? `${title} — Carry Construction` : 'Carry Construction — Build. Buy. Belong.'
  const url = `${SITE}${path}`

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content="summary_large_image" />
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
    </>
  )
}
