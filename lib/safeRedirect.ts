/**
 * Only allow same-origin relative paths (open-redirect safe).
 * Rejects protocol-relative (//evil.com), absolute URLs, and junk.
 */
export function safeRedirectPath(
  raw: string | null | undefined,
  fallback: string = '/'
): string {
  if (!raw) return fallback;
  const path = raw.trim();
  if (!path.startsWith('/')) return fallback;
  if (path.startsWith('//')) return fallback;
  if (path.includes('://')) return fallback;
  if (/[\r\n\\]/.test(path)) return fallback;
  // Keep path + query/hash only with safe chars
  if (!/^\/[a-zA-Z0-9/_\-.?=&%~+#]*$/.test(path)) return fallback;
  return path;
}
