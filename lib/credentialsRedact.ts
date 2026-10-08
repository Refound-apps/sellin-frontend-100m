const SECRET_FIELDS = [
  'bazos_password',
  'sbazar_password',
  'facebook_password',
  'sbazar_cookie_ds',
  'bazos_bkod',
  'bazos_sk_bkod',
  'facebook_cuser',
  'facebook_xs',
  'facebook_cookies',
] as const;

export function redactCredentialSecrets<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = { ...row };
  for (const key of SECRET_FIELDS) {
    if (key in out) {
      const val = out[key];
      out[`has_${key}`] = val != null && String(val).trim() !== '';
      delete out[key];
    }
  }
  return out as T;
}
