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

function blank(v: unknown): boolean {
  return v == null || String(v).trim() === '';
}

/** Fields that must not be wiped when the client sends empty (redacted) values. */
export const PRESERVE_IF_EMPTY_SECRET_FIELDS = [
  'bazos_password',
  'sbazar_password',
  'facebook_password',
  'sbazar_cookie_ds',
  'bazos_bkod',
  'bazos_sk_bkod',
  'facebook_cuser',
  'facebook_xs',
] as const;

export function redactCredentialSecrets<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = { ...row };
  for (const key of SECRET_FIELDS) {
    if (key in out) {
      const val = out[key];
      out[`has_${key}`] = !blank(val);
      delete out[key];
    }
  }
  out.cookies = {
    has_bazos_bkod: Boolean(out.has_bazos_bkod),
    has_bazos_sk_bkod: Boolean(out.has_bazos_sk_bkod),
    has_sbazar_cookie: Boolean(out.has_sbazar_cookie_ds),
    has_facebook_cookies: Boolean(out.has_facebook_cuser) && Boolean(out.has_facebook_xs),
    has_proxy: !blank(row.proxy_ip),
    has_proxy_sbazar: !blank(row.proxy_ip_sbazar),
  };
  return out as T;
}
