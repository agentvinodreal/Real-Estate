import { api, WRITE_TIMEOUT_MS } from '@carry/shared'
import type { CloudinarySignature } from '@carry/shared'

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

  // 3. Upload to Cloudinary
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    { method: 'POST', body: form }
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Cloudinary upload failed: ${res.status} — ${body}`)
  }

  const data = await res.json()
  return data.public_id as string
}
