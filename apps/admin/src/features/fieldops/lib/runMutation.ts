/**
 * Runs a write against the Field Ops API and reports failure to the user.
 *
 * Every list action here follows "await the request, then optimistically update
 * local state". Without this wrapper a rejected request skips the state update
 * *and* shows nothing, so the click looks like it simply did nothing — which is
 * how a publish silently failing on the website's required `areaSqft` column
 * went unnoticed.
 *
 * Alerting rather than rendering a banner is deliberate: these actions fire from
 * both the card grid and the detail modal, and an alert stays visible over the
 * modal. It also matches how the neighbouring actions in this codebase report
 * failures.
 *
 * @returns true when the write succeeded — gate the state update on it.
 */
export async function runMutation(fallbackMessage: string, fn: () => Promise<unknown>): Promise<boolean> {
  try {
    await fn()
    return true
  } catch (err: any) {
    alert(err?.message || fallbackMessage)
    return false
  }
}
