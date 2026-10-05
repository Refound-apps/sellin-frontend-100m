import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { ShopConfigData, ShopOffer } from '@/lib/types';
import {
  SHOP_NAME,
  SHOP_TAGLINE,
  SHOP_PHONE,
  SHOP_PHONE_HREF,
  SHOP_EMAIL,
  SHOP_ADDRESS_LINE,
  SHOP_ADDRESS_CITY,
  SHOP_REGION,
  SHOP_HOURS,
  SHOP_OWNER,
  SHOP_ICO,
  SHOP_CARAVAN_URL,
  SHOP_SHIPPING_PRICE,
  SHOP_SHIPPING_PRICE_TIRES,
  SHOP_SHIPPING_PRICE_RIMS,
  SHOP_MAP_LINK,
  SHOP_GOOGLE_MAPS_LINK,
} from '@/components/shop/shopConfig';

const FALLBACK_SHOP: ShopConfigData = {
  id: 'c335f44d-50a7-4898-ab7a-062ef1718756',
  user_id: null,
  owner_email: 'duplux@seznam.cz',
  slug: 'alubazar-plzen',
  custom_domain: 'alubazarplzen.cz',
  is_active: true,
  linked_credential_emails: [],
  shop_name: SHOP_NAME,
  tagline: SHOP_TAGLINE,
  phone: SHOP_PHONE,
  phone_href: SHOP_PHONE_HREF,
  email: SHOP_EMAIL,
  owner_name: SHOP_OWNER,
  ico: SHOP_ICO,
  address_line: SHOP_ADDRESS_LINE,
  address_city: SHOP_ADDRESS_CITY,
  region: SHOP_REGION,
  opening_hours: SHOP_HOURS,
  shipping_price: SHOP_SHIPPING_PRICE,
  shipping_price_tires: SHOP_SHIPPING_PRICE_TIRES,
  shipping_price_rims: SHOP_SHIPPING_PRICE_RIMS,
  map_link: SHOP_MAP_LINK,
  google_maps_link: SHOP_GOOGLE_MAPS_LINK,
  caravan_url: SHOP_CARAVAN_URL,
  template_id: 'pneu-classic',
  primary_color: '#0f172a',
  logo_url: null,
};

const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3300';

const HIDDEN_SHOP_STATES = new Set(['app_archive', 'ok_deleted', 'app_delete']);

function rowToShop(row: Record<string, unknown>): ShopConfigData {
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

export async function resolveShopFromRequest(opts?: {
  domain?: string | null;
  slug?: string | null;
}): Promise<ShopConfigData> {
  const headersList = await headers();
  const headerDomain = headersList.get('x-shop-domain') || '';
  const host = (headersList.get('x-forwarded-host') || headersList.get('host') || '')
    .toLowerCase()
    .split(':')[0]
    .trim();

  const rawDomain = (opts?.domain || headerDomain || host || '').toLowerCase().trim();
  const cleanDomain = rawDomain.replace(/^www\./, '').replace(/:\d+$/, '');
  const targetSlug = (opts?.slug || '').toLowerCase().trim();

  const supabase = await createClient();
  let query = supabase.from('shops').select('*').eq('is_active', true);

  if (targetSlug) {
    query = query.eq('slug', targetSlug);
  } else if (
    cleanDomain &&
    !cleanDomain.includes('localhost') &&
    !cleanDomain.includes('sellin.cz') &&
    !cleanDomain.includes('prodejomat.cz') &&
    !cleanDomain.includes('vercel.app')
  ) {
    query = query.or(
      `custom_domain.ilike.${rawDomain},custom_domain.ilike.${cleanDomain},slug.ilike.${cleanDomain.split('.')[0]}`
    );
  } else if (cleanDomain.includes('.localhost') || cleanDomain.endsWith('.prodejomat.cz') || cleanDomain.endsWith('.sellin.cz')) {
    const sub = cleanDomain.split('.')[0];
    if (sub && !['www', 'app', 'stage', 'dev', 'bazar'].includes(sub)) {
      query = query.or(`slug.ilike.${sub},custom_domain.ilike.${sub}`);
    }
  }

  const { data: shops } = await query.limit(1);
  if (shops && shops.length > 0) {
    return rowToShop(shops[0] as Record<string, unknown>);
  }

  const { data: fallback } = await supabase
    .from('shops')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1);

  if (fallback && fallback.length > 0) {
    return rowToShop(fallback[0] as Record<string, unknown>);
  }

  return FALLBACK_SHOP;
}

export async function fetchShopOffersPage(opts: {
  emails: string[];
  limit?: number;
  offset?: number;
}): Promise<{ offers: ShopOffer[]; total: number }> {
  const limit = opts.limit ?? 100;
  const offset = opts.offset ?? 0;
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    sort: 'newest',
  });
  if (opts.emails.length > 0) {
    params.set('emails', opts.emails.join(','));
  }

  const res = await fetch(`${BACKEND_URL}/api/shop/offers?${params.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    return { offers: [], total: 0 };
  }
  const json = await res.json();
  const offers = ((json.data || []) as ShopOffer[]).filter(
    (o) => !o.state || !HIDDEN_SHOP_STATES.has(String(o.state))
  );
  return {
    offers,
    total: typeof json.total === 'number' ? json.total : offers.length,
  };
}

export async function fetchAllShopOffers(
  emails: string[],
  maxItems = 5000
): Promise<ShopOffer[]> {
  const pageSize = 200;
  const all: ShopOffer[] = [];
  let offset = 0;
  let total = Infinity;

  while (offset < total && all.length < maxItems) {
    const { offers, total: t } = await fetchShopOffersPage({
      emails,
      limit: Math.min(pageSize, maxItems - all.length),
      offset,
    });
    total = t;
    if (offers.length === 0) break;
    all.push(...offers);
    offset += offers.length;
    if (offers.length < pageSize) break;
  }

  return all;
}

export async function fetchShopOfferById(id: number): Promise<ShopOffer | null> {
  const res = await fetch(`${BACKEND_URL}/api/offers/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const json = await res.json();
  const offer = json.data as ShopOffer | undefined;
  if (!offer) return null;
  if (offer.state && HIDDEN_SHOP_STATES.has(String(offer.state))) return null;
  return {
    ...offer,
    id: offer.id ?? (offer as unknown as { 'auto id'?: number })['auto id'] ?? id,
  };
}

export async function fetchShopOfferImages(id: number): Promise<string[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/shop/offers/${id}/images`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || []) as string[];
  } catch {
    return [];
  }
}
