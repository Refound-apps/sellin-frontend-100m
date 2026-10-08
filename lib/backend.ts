/**
 * Base URL of the Node scraper backend (Express).
 * Local: http://localhost:3300
 * Prod (Budibase legacy): https://api.sellin.cz/prod/api
 */
export function getBackendBaseUrl(): string {
  const raw =
    process.env.SCRAPER_API_URL ||
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3300';
  return raw.replace(/\/$/, '');
}

/** Headers for server→backend calls (INTERNAL_API_SECRET). */
export function getInternalApiHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  const secret = process.env.INTERNAL_API_SECRET;
  if (secret) {
    headers.set('Authorization', `Bearer ${secret}`);
  }
  return headers;
}

function isLocalBase(base: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(base);
}

/**
 * Public nginx prefix that is stripped before Express.
 * Express routes live at /api/... and /testsellin — so prod calls must be:
 *   https://api.sellin.cz/prod/api + /api/offers/create
 *   → after strip Express sees /api/offers/create
 */
export function getPublicApiPrefix(): string {
  const base = getBackendBaseUrl();
  if (isLocalBase(base)) return base;
  if (/\/prod\/api$/i.test(base)) return base;
  if (/\/api$/i.test(base)) return base;
  if (/\/prod$/i.test(base)) return `${base}/api`;
  return `${base}/prod/api`;
}

/**
 * Absolute URL for scraper actions like /renewofferbazosforce.
 * Production nginx historically exposes them under /prod/api/* (same as Budibase).
 * Local Express mounts them at the root (without /api).
 */
export function getScraperActionUrl(endpoint: string): string {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const prefix = getPublicApiPrefix();

  if (isLocalBase(prefix)) {
    return `${prefix}${path}`;
  }

  // Non-/api scraper actions sit next to /api on the same nginx prefix
  return `${prefix}${path}`;
}

/** Resolve absolute backend URL for /api/* and scraper paths. */
export function backendUrl(pathWithQuery: string): string {
  const raw = pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`;
  const qIndex = raw.indexOf('?');
  const path = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
  const search = qIndex >= 0 ? raw.slice(qIndex) : '';
  const prefix = getPublicApiPrefix();

  // /testsellin is mounted at Express root (not under /api)
  if (path === '/testsellin') {
    return `${prefix}${path}${search}`;
  }

  if (path.startsWith('/api/') || path.startsWith('/cron/')) {
    // Local: http://localhost:3300/api/offers/create
    // Prod:  https://api.sellin.cz/prod/api/api/offers/create  (nginx strips /prod/api)
    return `${prefix}${path}${search}`;
  }

  return `${getScraperActionUrl(path)}${search}`;
}

/** Authenticated fetch to Express backend (server-side only). */
export async function backendFetch(pathWithQuery: string, init?: RequestInit): Promise<Response> {
  const headers = getInternalApiHeaders(init?.headers);
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const url = backendUrl(pathWithQuery);
  const res = await fetch(url, {
    ...init,
    headers,
    cache: 'no-store',
  });

  // Common misconfig: base ends with /prod (not /prod/api) → Express 404 "Cannot POST /offers/create"
  // Retry once with forced /api segment after prefix.
  if (!res.ok && res.status === 404 && pathWithQuery.includes('/api/') && !isLocalBase(url)) {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const fixed = url.replace(/\/prod\/api\/(?!api\/)/i, '/prod/api/api/');
      if (fixed !== url) {
        return fetch(fixed, {
          ...init,
          headers,
          cache: 'no-store',
        });
      }
    }
  }

  return res;
}
