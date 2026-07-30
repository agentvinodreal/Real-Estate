const DEFAULT_TIMEOUT_MS = 15_000  // 15 seconds — critical for field agents on slow networks
// Writes get a far longer ceiling than reads. Aborting a POST does not cancel it
// server-side: on a weak link the row commits while the client records a failure
// and queues a retry, which the server then answers as a duplicate. A read can be
// retried for free; a half-observed write cannot.
const WRITE_TIMEOUT_MS = 60_000

class ApiError extends Error {
  constructor(public message: string, public status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string; timeout?: number } = {}
): Promise<T> {
  const { token, timeout = DEFAULT_TIMEOUT_MS, ...init } = options

  const controller = new AbortController()
  const timerId = setTimeout(() => controller.abort(), timeout)

  // NOTE: `process.env.X` must stay a plain member access — Expo's babel plugin
  // statically inlines that form at build time, but silently skips the optional
  // -chained `process.env?.X`. With `?.` this fell through to the localhost
  // fallback in every native build, so the phone called itself instead of the API.
  const base =
    (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_API_BASE) ||
    (import.meta as any).env?.VITE_API_BASE ||
    'http://localhost:4001/api/v1'

  const headers: Record<string, string> = {
    // Only set Content-Type when sending a body — Fastify rejects bodyless
    // DELETE/GET requests that carry Content-Type: application/json with 400.
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> ?? {}),
  }

  try {
    const url = path.startsWith('http://') || path.startsWith('https://') ? path : `${base}${path}`
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers,
    })

    clearTimeout(timerId)

    if (!res.ok) {
      const body = (await res.json().catch(() => ({ error: res.statusText }))) as any
      throw new ApiError(body.error ?? 'Request failed', res.status)
    }

    return res.json() as Promise<T>
  } catch (err) {
    clearTimeout(timerId)
    if ((err as Error).name === 'AbortError') {
      throw new ApiError('Request timed out — check your connection', 408)
    }
    throw err
  }
}

export const api = {
  get: <T>(path: string, token?: string) =>
    request<T>(path, { method: 'GET', token }),

  post: <T>(path: string, body: unknown, token: string) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), token, timeout: WRITE_TIMEOUT_MS }),

  patch: <T>(path: string, body: unknown, token: string) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), token, timeout: WRITE_TIMEOUT_MS }),

  delete: <T>(path: string, token: string) =>
    request<T>(path, { method: 'DELETE', token, timeout: WRITE_TIMEOUT_MS }),
}

export { ApiError }
