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
