import { api } from '@carry/shared'
import {
  getPendingUploads, markUploadComplete, incrementUploadAttempts, deleteUpload,
  getPendingRecords, deletePendingRecord, isRecordPending, getUploadByLocalId,
} from './uploadQueue'
import { uploadFileToCloudinary } from './cloudinaryUpload'

const MAX_ATTEMPTS = 5
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE ?? 'http://localhost:4001/api/v1'

/**
 * True when a failure means "we never got through" rather than "the server
 * looked at this and refused it".
 *
 * The attempt budget exists to stop retrying something genuinely broken — a
 * malformed payload, a revoked token. Spending it on a weak signal instead
 * retires a perfectly good photo: five failed cycles on 2G and every automatic
 * sync skips it forever, including after the agent reaches wifi. So only a real
 * server rejection counts against the budget.
 *
 * No status  → fetch threw, the request never landed.
 * 408        → our own AbortController fired.
 * 5xx        → the server could not answer; not the payload's fault.
 */
function isTransportFailure(err: unknown): boolean {
  const status = (err as { status?: number } | undefined)?.status
  if (typeof status !== 'number') return true
  return status === 408 || status >= 500
}

// ── Diagnostics ───────────────────────────────────────────────────────────────
// Photo failures are otherwise completely silent: the queue swallows every
// error, so a stuck upload looks identical to one still in progress. Keeping the
// last one lets the Profile screen say what actually went wrong instead of
// leaving it to be guessed at from source.
let lastUploadError: { message: string; at: number } | null = null

export function getLastUploadError(): { message: string; at: number } | null {
  return lastUploadError
}

export function clearLastUploadError(): void {
  lastUploadError = null
}

function recordUploadError(err: unknown): void {
  const message = err instanceof Error ? err.message : String(err)
  lastUploadError = { message, at: Date.now() }
}

// ── Flush photo uploads ───────────────────────────────────────────────────────

export async function flushPendingUploads(token: string): Promise<void> {
  const pending = getPendingUploads()

  for (const upload of pending) {
    if (upload.attempts >= MAX_ATTEMPTS) continue
    // Skip uploads whose parent record hasn't been submitted yet — those are
    // handled in flushPendingRecords (no server-side record exists to PATCH).
    if (isRecordPending(upload.recordId)) continue

    try {
      const publicId = await uploadFileToCloudinary(
        upload.fileUri, upload.fileName, upload.folder, token
      )
      // Patch the real DB record to update the publicId
      await api.patch(
        `/uploads/patch-queued`,
        {
          model:     upload.model,
          recordId:  upload.recordId,
          fieldName: upload.fieldName,
          publicId,
        },
        token
      )
      markUploadComplete(upload.localId, publicId)
      clearLastUploadError()
    } catch (err) {
      recordUploadError(err)
      // Only a genuine server rejection costs an attempt — see isTransportFailure.
      if (!isTransportFailure(err)) incrementUploadAttempts(upload.id)
    }
  }
}

// ── Flush pending records ─────────────────────────────────────────────────────

export async function flushPendingRecords(token: string): Promise<void> {
  const pendingUploads = getPendingUploads()
  const pendingRecords = getPendingRecords()

  // Step 1: Upload photo files for still-offline (not-yet-submitted) records first —
  // no server-side record exists yet, so just upload + mark complete; the record's
  // own POST payload below carries the resolved publicId (no PATCH needed here).
  for (const upload of pendingUploads) {
    if (!isRecordPending(upload.recordId)) continue
    if (upload.publicId || upload.attempts >= MAX_ATTEMPTS) continue

    try {
      const publicId = await uploadFileToCloudinary(
        upload.fileUri, upload.fileName, upload.folder, token
      )
      markUploadComplete(upload.localId, publicId)
      clearLastUploadError()
    } catch (err) {
      recordUploadError(err)
      // Only a genuine server rejection costs an attempt — see isTransportFailure.
      if (!isTransportFailure(err)) incrementUploadAttempts(upload.id)
    }
  }

  // Step 2: Submit records whose photos are all uploaded
  for (const record of pendingRecords) {
    try {
      const payload = { ...record.payload }
      let allReady = true

      // Resolve __queued__: localIds → real Cloudinary publicIds. Looked up
      // individually (not via getPendingUploads()) because that query
      // filters to public_id IS NULL — an upload just completed in Step 1
      // above would already be excluded from it.
      const resolveId = (localId: string): string | null => {
        const cleanId = String(localId).replace('__queued__:', '')
        const u = getUploadByLocalId(cleanId)
        return u?.publicId ?? null
      }

      if (record.type === 'property') {
        const images: string[] = []
        for (const id of (payload.images as string[] ?? [])) {
          const resolved = resolveId(id)
          if (!resolved) { allReady = false; break }
          images.push(resolved)
        }
        if (!allReady) continue
        payload.images = images

        if (payload.floorPlanUrl && String(payload.floorPlanUrl).startsWith('__queued__:')) {
          const resolved = resolveId(String(payload.floorPlanUrl))
          if (!resolved) continue
          payload.floorPlanUrl = resolved
        }
      }

      if (record.type === 'labour' && payload.profilePhotoUrl) {
        if (String(payload.profilePhotoUrl).startsWith('__queued__:')) {
          const resolved = resolveId(String(payload.profilePhotoUrl))
          if (!resolved) continue
          payload.profilePhotoUrl = resolved
        }
      }

      if (record.type === 'shop') {
        const images: string[] = []
        for (const id of (payload.images as string[] ?? [])) {
          const resolved = resolveId(id)
          if (!resolved) { allReady = false; break }
          images.push(resolved)
        }
        if (!allReady) continue
        payload.images = images
      }

      const endpoint = record.type === 'property' ? '/properties'
                     : record.type === 'shop'     ? '/shops'
                     : '/labour'

      const saved = await api.post<Record<string, unknown>>(
        `${BASE_URL}${endpoint}`, payload, token
      )

      // A 200 here can be the server's idempotent duplicate response — the first
      // POST timed out client-side but had already committed, photo-less. The
      // server backfills a missing photo from this retry, but if it came back
      // still missing (older API, or the field was rejected), keep the upload
      // rows queued so flushPendingUploads can PATCH them onto the now-existing
      // record. Dropping them here is what used to lose the photo for good.
      const photoLanded =
        record.type === 'labour'
          ? !!saved?.profilePhotoUrl
          : Array.isArray(saved?.images) && (saved.images as unknown[]).length > 0

      if (photoLanded) {
        const localIds = [
          ...(record.payload.images as string[] ?? []),
          record.payload.floorPlanUrl as string,
          record.payload.profilePhotoUrl as string,
        ].filter(Boolean)

        for (const localId of localIds) {
          if (String(localId).startsWith('__queued__:')) {
            deleteUpload(String(localId).replace('__queued__:', ''))
          }
        }
      }

      // Always drop the pending record — it exists server-side now. Once it is
      // no longer pending, isRecordPending() flips false and flushPendingUploads
      // takes over any uploads left above via PATCH /uploads/patch-queued.
      deletePendingRecord(record.id)
    } catch {
      // Will retry next sync cycle
    }
  }
}

// ── Full sync (used by both foreground + background runner) ───────────────────

export async function runFullSync(token: string): Promise<void> {
  await flushPendingUploads(token)
  await flushPendingRecords(token)
}
