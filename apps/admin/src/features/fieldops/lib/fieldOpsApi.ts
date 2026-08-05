/**
 * HTTP client for the Field Ops API (a different service, database and Clerk
 * instance from the website API that `shared/lib/adminApi.ts` talks to).
 *
 * Ported from `field-ops/packages/shared/src/api.ts` so the pages moved
 * across from that panel keep their `api.get(path, token)` call sites unchanged.
 *
 * Auth: the Field Ops API verifies this app's website-instance Clerk token via
 * the CLERK_SECRET_KEY_WEBSITE fallback in its `lib/auth.ts`. Every endpoint
 * used here is `requireAdmin`.
 */

const DEFAULT_TIMEOUT_MS = 15_000

// Writes get a far longer ceiling than reads. Aborting a POST does not cancel it
// server-side: on a weak link the row commits while the client records a failure.
// A read can be retried for free; a half-observed write cannot.
export const WRITE_TIMEOUT_MS = 60_000

const BASE = (import.meta as any).env?.VITE_FIELD_OPS_API_BASE || 'http://localhost:4001/api/v1'

export class FieldOpsApiError extends Error {
  // Declared explicitly rather than as a constructor parameter property —
  // this project builds with `erasableSyntaxOnly`.
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'FieldOpsApiError'
    this.status = status
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string; timeout?: number } = {},
): Promise<T> {
  const { token, timeout = DEFAULT_TIMEOUT_MS, ...init } = options

  const controller = new AbortController()
  const timerId = setTimeout(() => controller.abort(), timeout)

  const headers: Record<string, string> = {
    // Only set Content-Type when sending a body — Fastify rejects bodyless
    // DELETE/GET requests that carry Content-Type: application/json with 400.
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> | undefined),
  }

  try {
    const res = await fetch(`${BASE}${path}`, { ...init, signal: controller.signal, headers })
    clearTimeout(timerId)

    if (!res.ok) {
      const body = (await res.json().catch(() => ({ error: res.statusText }))) as any
      // Fastify's own native errors (validation failures, malformed JSON) put the
      // real reason in `message` and leave `error` as the generic HTTP reason
      // phrase ("Bad Request") — prefer it when present. Mirrors the same fix in
      // field-ops/packages/shared/src/api.ts, which this file was ported from.
      throw new FieldOpsApiError(body.message ?? body.error ?? 'Request failed', res.status)
    }

    return res.json() as Promise<T>
  } catch (err) {
    clearTimeout(timerId)
    if ((err as Error).name === 'AbortError') {
      throw new FieldOpsApiError('Request timed out — check your connection', 408)
    }
    throw err
  }
}

export const fieldOpsApi = {
  get: <T>(path: string, token?: string, opts?: { timeout?: number }) =>
    request<T>(path, { method: 'GET', token, ...opts }),

  post: <T>(path: string, body: unknown, token: string) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), token, timeout: WRITE_TIMEOUT_MS }),

  patch: <T>(path: string, body: unknown, token: string) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), token, timeout: WRITE_TIMEOUT_MS }),

  delete: <T>(path: string, token: string) =>
    request<T>(path, { method: 'DELETE', token, timeout: WRITE_TIMEOUT_MS }),
}
