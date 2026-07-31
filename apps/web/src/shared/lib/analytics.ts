// GA4 event helpers. The gtag.js snippet lives in index.html; everything here
// degrades to a no-op when it hasn't loaded (ad blockers, local dev).

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  window.gtag?.('event', name, { page_path: window.location.pathname, ...params })
}

/** Where on the page a CTA sits — set `data-cta="hero"` to label it explicitly. */
function ctaLocation(el: HTMLElement): string {
  const tagged = el.closest<HTMLElement>('[data-cta]')?.dataset.cta
  if (tagged) return tagged
  if (el.closest('header')) return 'header'
  if (el.closest('footer')) return 'footer'
  return 'body'
}

/**
 * One delegated listener instead of an onClick on all 19 WhatsApp/call links —
 * new CTAs are tracked automatically without being wired up.
 */
export function initOutboundTracking(): () => void {
  function onClick(e: MouseEvent) {
    const link = (e.target as HTMLElement | null)?.closest?.('a')
    if (!link) return

    const href = link.getAttribute('href') || ''
    const shared = { link_url: href, cta_location: ctaLocation(link) }

    if (href.startsWith('https://wa.me/')) trackEvent('whatsapp_click', shared)
    else if (href.startsWith('tel:')) trackEvent('call_click', shared)
    else if (href.startsWith('mailto:')) trackEvent('email_click', shared)
  }

  document.addEventListener('click', onClick)
  return () => document.removeEventListener('click', onClick)
}
