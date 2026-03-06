import { supabase } from './supabase'

export type ErrorSeverity = 'error' | 'warn' | 'fatal'

export interface ErrorLogPayload {
  message: string
  stack?: string
  source: string
  severity?: ErrorSeverity
  extra?: Record<string, unknown>
}

// Rate-limit map: fingerprint → last sent timestamp
const recentErrors = new Map<string, number>()
const RATE_LIMIT_MS = 10_000
const MAX_MAP_SIZE = 100

/**
 * Simple string hash for fingerprinting (message + source).
 * Deterministic, fast, not cryptographic.
 */
export function fingerprint(message: string, source: string): string {
  const str = `${source}::${message}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return hash.toString(36)
}

function isRateLimited(fp: string): boolean {
  const last = recentErrors.get(fp)
  if (last && Date.now() - last < RATE_LIMIT_MS) return true

  // Cap map size to prevent memory leak
  if (recentErrors.size >= MAX_MAP_SIZE) {
    const oldest = recentErrors.keys().next().value
    if (oldest !== undefined) recentErrors.delete(oldest)
  }

  recentErrors.set(fp, Date.now())
  return false
}

function isEnabled(): boolean {
  try {
    // DEV mode: disabled by default, opt-in via env var
    if (import.meta.env.DEV) {
      return import.meta.env.VITE_ENABLE_ERROR_LOGGING === 'true'
    }
    // Production: always enabled
    return true
  } catch {
    return true
  }
}

function getUserId(): string | null {
  try {
    // Avoid importing authStore to prevent circular deps
    // Read from Supabase session directly
    const raw = localStorage.getItem('sb-mizztmfzukofxiyrgall-auth-token')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.user?.id ?? null
  } catch {
    return null
  }
}

/**
 * Log an error to the error_logs table.
 * Fire-and-forget: returns synchronously, DB insert is async background.
 * Never throws — all internal errors are silently swallowed.
 */
export function logError(payload: ErrorLogPayload): void {
  try {
    if (!isEnabled()) return

    const fp = fingerprint(payload.message, payload.source)
    if (isRateLimited(fp)) return

    const row = {
      message: payload.message.slice(0, 2000),
      stack: payload.stack?.slice(0, 5000) ?? null,
      source: payload.source.slice(0, 100),
      severity: payload.severity ?? 'error',
      user_id: getUserId(),
      page_url: typeof window !== 'undefined' ? window.location.href : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : null,
      extra: payload.extra ?? {},
      fingerprint: fp,
    }

    // Fire-and-forget (PromiseLike has no .catch, use .then with rejection handler)
    supabase
      .from('error_logs')
      .insert(row)
      .then(() => {}, () => {})
  } catch {
    // Triple safety: never crash the app
  }
}

/**
 * Convenience wrapper for Supabase errors (from .from().select() etc).
 * Extracts message from the Supabase error object.
 */
export function logSupabaseError(
  error: { message: string; code?: string; details?: string },
  source: string,
  extra?: Record<string, unknown>,
): void {
  logError({
    message: error.message,
    stack: error.details ?? error.code ?? undefined,
    source,
    severity: 'error',
    extra: { ...extra, code: error.code },
  })
}

/**
 * Reset rate limit map (for testing).
 */
export function _resetRateLimit(): void {
  recentErrors.clear()
}
