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

/**
 * Absolute URL for scraper actions like /renewofferbazosforce.
 * Production nginx historically exposes them under /prod/api/* (same as Budibase).
 * Local Express mounts them at the root (without /api).
 */
export function getScraperActionUrl(endpoint: string): string {
  const base = getBackendBaseUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const isLocal = /localhost|127\.0\.0\.1/i.test(base);
  if (isLocal) {
    return `${base}${path}`;
  }

  // Already points at .../prod/api or .../api
  if (/\/prod\/api$/i.test(base) || /\/api$/i.test(base)) {
    return `${base}${path}`;
  }

  // Points at .../prod → append /api
  if (/\/prod$/i.test(base)) {
    return `${base}/api${path}`;
  }

  // Bare host (e.g. https://api.sellin.cz) → Budibase default prefix
  return `${base}/prod/api${path}`;
}

/** Resolve absolute backend URL for /api/* and scraper paths. */
export function backendUrl(pathWithQuery: string): string {
  const raw = pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`;
  const qIndex = raw.indexOf('?');
  const path = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
  const search = qIndex >= 0 ? raw.slice(qIndex) : '';

  if (path === '/testsellin' || path.startsWith('/api/') || path.startsWith('/cron/')) {
    return `${getBackendBaseUrl()}${path}${search}`;
  }
  return `${getScraperActionUrl(path)}${search}`;
}

/** Authenticated fetch to Express backend (server-side only). */
export async function backendFetch(pathWithQuery: string, init?: RequestInit): Promise<Response> {
  const headers = getInternalApiHeaders(init?.headers);
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(backendUrl(pathWithQuery), {
    ...init,
    headers,
    cache: 'no-store',
  });
}
