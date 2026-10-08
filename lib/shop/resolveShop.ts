import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { ShopConfigData } from '@/lib/types';

type ShopRow = Database['public']['Tables']['shops']['Row'];

const MAIN_HOST_MARKERS = [
  'localhost',
  'sellin.cz',
  'prodejomat.cz',
  'vercel.app',
];

function isMainAppHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^www\./, '');
  if (!h) return true;
  if (h === 'localhost' || h === '127.0.0.1') return true;
  // Tenant subdomains: foo.sellin.cz / foo.localhost — NOT main
  if (h.endsWith('.localhost') || h.includes('.localhost.')) return false;
  const parts = h.split('.');
  if (parts.length >= 3 && (h.endsWith('.sellin.cz') || h.endsWith('.prodejomat.cz'))) {
    const sub = parts[0];
    return ['app', 'www', 'stage', 'dev', 'bazar'].includes(sub);
  }
  return MAIN_HOST_MARKERS.some((m) => h === m || h === `www.${m}` || h.endsWith(`.${m}`));
}

function tenantSlugFromHost(host: string): string | null {
  const h = host.toLowerCase().replace(/^www\./, '').replace(/:\d+$/, '');
  if (h.endsWith('.localhost')) {
    const sub = h.split('.localhost')[0];
    return sub && !MAIN_HOST_MARKERS.includes(sub) ? sub : null;
  }
  if (h.endsWith('.sellin.cz') || h.endsWith('.prodejomat.cz')) {
    const sub = h.split('.')[0];
    if (sub && !['app', 'www', 'stage', 'dev', 'bazar'].includes(sub)) return sub;
  }
  return null;
}

export function rowToShopConfig(row: Record<string, unknown> | ShopRow): ShopConfigData {
  return {
    id: String(row.id),
    user_id: (row.user_id as string | null) ?? null,
    owner_email: String(row.owner_email || ''),
    slug: String(row.slug || ''),
    custom_domain: (row.custom_domain as string | null) ?? null,
    is_active: Boolean(row.is_active),
    linked_credential_emails: (row.linked_credential_emails as string[]) || [],
    shop_name: String(row.shop_name || 'E-shop'),
    tagline: (row.tagline as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    phone_href: (row.phone_href as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    owner_name: (row.owner_name as string | null) ?? null,
    ico: (row.ico as string | null) ?? null,
    address_line: (row.address_line as string | null) ?? null,
    address_city: (row.address_city as string | null) ?? null,
    region: (row.region as string | null) ?? null,
    opening_hours: (row.opening_hours as string | null) ?? null,
    shipping_price: (row.shipping_price as string | null) ?? null,
    shipping_price_tires: (row.shipping_price_tires as string | null) ?? null,
    shipping_price_rims: (row.shipping_price_rims as string | null) ?? null,
    map_link: (row.map_link as string | null) ?? null,
    google_maps_link: (row.google_maps_link as string | null) ?? null,
    caravan_url: (row.caravan_url as string | null) ?? null,
    template_id: String(row.template_id || 'pneu-classic'),
    primary_color: (row.primary_color as string | null) ?? null,
    logo_url: (row.logo_url as string | null) ?? null,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

/** Public storefront payload — no auth user_id. */
export function toPublicShopDto(shop: ShopConfigData) {
  const { user_id: _uid, ...publicFields } = shop;
  return publicFields;
}

/** Emails used to load this shop's inventory (never a global Duplux list). */
export function shopInventoryEmails(shop: ShopConfigData | null | undefined): string[] {
  if (!shop) return [];
  const linked = (shop.linked_credential_emails || [])
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean);
  if (linked.length > 0) return linked;
  const owner = (shop.owner_email || '').toLowerCase().trim();
  return owner ? [owner] : [];
}

/**
 * Resolve exactly one shop by slug / custom domain / tenant subdomain.
 * No "first active shop" / Duplux fallback — returns null if not found.
 */
export async function findShopByIdentity(
  supabase: SupabaseClient<Database>,
  opts: {
    domain?: string | null;
    slug?: string | null;
    host?: string | null;
  }
): Promise<ShopConfigData | null> {
  const rawDomain = (opts.domain || opts.host || '').toLowerCase().trim().replace(/:\d+$/, '');
  const cleanDomain = rawDomain.replace(/^www\./, '');
  const explicitSlug = (opts.slug || '').toLowerCase().trim();
  const hostSlug = tenantSlugFromHost(cleanDomain);

  let query = supabase.from('shops').select('*').eq('is_active', true);

  if (explicitSlug) {
    query = query.eq('slug', explicitSlug);
  } else if (hostSlug) {
    query = query.or(`slug.ilike.${hostSlug},custom_domain.ilike.${hostSlug}`);
  } else if (cleanDomain && !isMainAppHost(cleanDomain)) {
    // Custom domain (e.g. alubazarplzen.cz)
    query = query.or(
      `custom_domain.ilike.${rawDomain},custom_domain.ilike.${cleanDomain},slug.ilike.${cleanDomain.split('.')[0]}`
    );
  } else {
    // Main app host without ?slug= / ?domain= → no shop
    return null;
  }

  const { data: shops, error } = await query.limit(1);
  if (error) {
    console.error('[findShopByIdentity]', error);
    return null;
  }
  if (!shops || shops.length === 0) return null;
  return rowToShopConfig(shops[0] as Record<string, unknown>);
}
