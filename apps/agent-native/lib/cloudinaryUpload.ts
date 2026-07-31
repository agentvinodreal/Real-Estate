import { api, WRITE_TIMEOUT_MS } from '@carry/shared'
import type { CloudinarySignature } from '@carry/shared'

// Ceiling for the binary transfer itself — sized for a large photo on a bad
// connection, not for a healthy request. See the note at the fetch below.
const UPLOAD_TIMEOUT_MS = 5 * 60 * 1000

/**
 * uploadFileToCloudinary — uploads a local file URI to Cloudinary.
 * Works identically in React Native since FormData + fetch are available.
 */
export async function uploadFileToCloudinary(
  fileUri:   string,
  fileName:  string,
  folder:    string,
  token:     string,
): Promise<string> {
  // 1. Get a signed upload URL from our API.
  // Uses the write ceiling, not the default read one: on a weak link a 15s abort
  // here killed the upload before step 3 was ever reached, making the untimed
  // Cloudinary POST below unreachable on exactly the networks it exists for.
  const sig = await api.get<CloudinarySignature>(
    `/uploads/sign?folder=${encodeURIComponent(folder)}`,
    token,
    { timeout: WRITE_TIMEOUT_MS }
  )

  // 2. Build multipart form — React Native FormData handles file:// URIs natively
  const form = new FormData()
  form.append('file', {
    uri:  fileUri,
    type: 'image/jpeg',
    name: fileName,
  } as any)
  form.append('signature',  sig.signature)
  form.append('timestamp',  String(sig.timestamp))
  form.append('api_key',    sig.apiKey)
  form.append('folder',     sig.folder)

  // 3. Upload to Cloudinary.
  // Generous but FINITE. A field photo on 2G legitimately takes minutes, so this
  // must not be a normal request timeout — but leaving it unbounded meant a
  // stalled connection hung forever, and because the submit screen awaited this
  // call the spinner never stopped. A request that cannot finish in 5 minutes is
  // not going to; failing lets the retry queue do its job.
  const controller = new AbortController()
  const timerId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(
      `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
      { method: 'POST', body: form, signal: controller.signal }
    )
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new Error(`Cloudinary upload stalled — gave up after ${UPLOAD_TIMEOUT_MS / 1000}s`)
    }
    throw err
  } finally {
    clearTimeout(timerId)
  }

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Cloudinary upload failed: ${res.status} — ${body}`)
  }

  const data = await res.json()
  return data.public_id as string
}
