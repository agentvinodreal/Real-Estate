/**
 * Pushes published properties/projects to the public website
 * (Carry Construction Real-Estate), which runs on its own database.
 *
 * The website's Clerk instance differs from ours, so a Clerk token can't
 * authenticate this hop — it uses a shared secret in `x-sync-secret` matched
 * against SYNC_SECRET on the receiving side.
 *
 * Fire-and-forget by design: if the website is down, publishing here must still
 * succeed. Failures are logged and can be backfilled on that side with
 * `npm run import:published` against an export from `export-published.ts`.
 */
import type { FastifyBaseLogger } from 'fastify'

type SyncPayload = {
  properties?: Record<string, any>[]
  projects?: Record<string, any>[]
}

const TIMEOUT_MS = 8000

/**
 * Sends the item to the website. Never throws — callers should not have to
 * guard their response path with a try/catch.
 */
export async function syncToWebsite(payload: SyncPayload, log: FastifyBaseLogger) {
  const url = process.env.WEBSITE_SYNC_URL
  const secret = process.env.WEBSITE_SYNC_SECRET

  if (!url || !secret) {
    log.warn('WEBSITE_SYNC_URL / WEBSITE_SYNC_SECRET not set — skipping website sync')
    return
  }

  const ids = [...(payload.properties ?? []), ...(payload.projects ?? [])].map((i) => i.id)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-sync-secret': secret },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      log.error({ status: res.status, body, ids }, 'website sync rejected')
      return
    }

    // The receiver answers 207 when only part of the batch applied — and `res.ok`
    // is true for every 2xx, 207 included. Without this check a batch that failed
    // outright still logged "synced to website", which is how a schema rejection
    // on the far side stayed invisible. Trust the body, not the status class.
    const result = (await res.json().catch(() => null)) as
      | { ok?: boolean; syncedCount?: number; failed?: { id: string; error: string }[] }
      | null

    if (result?.ok === false) {
      log.error(
        { status: res.status, syncedCount: result.syncedCount, failed: result.failed, ids },
        'website sync rejected some items',
      )
      return
    }

    log.info({ ids }, 'synced to website')
  } catch (err) {
    // Network error or timeout — the publish itself already succeeded here.
    log.error({ err, ids }, 'website sync failed')
  }
}

/**
 * Fire the sync without making the caller await it, so admin requests stay
 * responsive even when the website is slow.
 */
export function syncToWebsiteInBackground(payload: SyncPayload, log: FastifyBaseLogger) {
  void syncToWebsite(payload, log)
}
