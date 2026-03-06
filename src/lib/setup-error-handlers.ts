import { logError } from './error-logger'

/**
 * Install global error handlers (window.onerror + unhandledrejection).
 * Call once in main.tsx before rendering.
 */
export function setupGlobalErrorHandlers(): void {
  window.onerror = (message, source, lineno, colno, error) => {
    logError({
      message: typeof message === 'string' ? message : 'Unknown error',
      stack: error?.stack ?? `${source}:${lineno}:${colno}`,
      source: 'global/onerror',
      severity: 'error',
      extra: { source: source ?? '', lineno, colno },
    })
  }

  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : 'Unhandled promise rejection'
    const stack = reason instanceof Error ? reason.stack : undefined

    logError({
      message,
      stack,
      source: 'global/unhandledrejection',
      severity: 'error',
    })
  }
}
