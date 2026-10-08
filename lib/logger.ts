/**
 * Frontend application error logger.
 * Sends error reports to /api/log-error so admins can inspect FE & BE failures in /admin/errors.
 */

export interface ClientErrorPayload {
  message: string;
  errorType?: string;
  statusCode?: number;
  path?: string;
  userEmail?: string;
  metadata?: Record<string, any>;
}

// In-memory debounce set: prevents logging identical error multiple times within 5s
const recentErrors = new Set<string>();

export async function logClientError(payload: ClientErrorPayload): Promise<void> {
  if (typeof window === 'undefined') return;

  const key = `${payload.message}|${payload.path || ''}|${payload.statusCode || ''}`;
  if (recentErrors.has(key)) return;

  recentErrors.add(key);
  setTimeout(() => recentErrors.delete(key), 5000);

  try {
    // Sanitize metadata to prevent sending giant base64 payloads
    const sanitizedMeta: Record<string, any> = {
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    if (payload.metadata && typeof payload.metadata === 'object') {
      for (const [k, v] of Object.entries(payload.metadata)) {
        if (typeof v === 'string' && v.length > 500) {
          sanitizedMeta[k] = v.startsWith('data:')
            ? `[data URI length ${v.length}]`
            : `${v.slice(0, 500)}…`;
        } else {
          sanitizedMeta[k] = v;
        }
      }
    }

    await fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'frontend',
        message: String(payload.message || 'Neznámá chyba klienta').slice(0, 5000),
        errorType: payload.errorType || 'ClientError',
        statusCode: payload.statusCode,
        path: payload.path || window.location.pathname,
        userEmail: payload.userEmail,
        metadata: sanitizedMeta,
      }),
      // keepalive ensures the request finishes even if the user navigates away or closes tab
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Logging should never throw
  }
}
