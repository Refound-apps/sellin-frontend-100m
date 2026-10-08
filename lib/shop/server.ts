import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { backendFetch } from '@/lib/backend';
import type { ShopConfigData, ShopOffer } from '@/lib/types';
import { findShopByIdentity, shopInventoryEmails } from '@/lib/shop/resolveShop';

const HIDDEN_SHOP_STATES = new Set(['app_archive', 'ok_deleted', 'app_delete']);

export async function resolveShopFromRequest(opts?: {
  domain?: string | null;
  slug?: string | null;
}): Promise<ShopConfigData | null> {
  const headersList = await headers();
  const headerDomain = headersList.get('x-shop-domain') || '';
  const host = (headersList.get('x-forwarded-host') || headersList.get('host') || '')
    .toLowerCase()
    .split(':')[0]
    .trim();

  const supabase = await createClient();
  return findShopByIdentity(supabase, {
    domain: opts?.domain || headerDomain || null,
    slug: opts?.slug || null,
    host,
  });
}

export async function fetchShopOffersPage(opts: {
  emails: string[];
  limit?: number;
  offset?: number;
}): Promise<{ offers: ShopOffer[]; total: number }> {
  if (!opts.emails || opts.emails.length === 0) {
    return { offers: [], total: 0 };
  }

  const limit = opts.limit ?? 100;
  const offset = opts.offset ?? 0;
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    sort: 'newest',
    emails: opts.emails.join(','),
  });

  const res = await backendFetch(`/api/shop/offers?${params.toString()}`);
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
  if (!emails.length) return [];
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
  const res = await backendFetch(`/api/offers/${id}`);
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

/** Load offer only if it belongs to the resolved shop's inventory emails. */
export async function fetchShopOfferForShop(
  id: number,
  shop: ShopConfigData | null
): Promise<ShopOffer | null> {
  const offer = await fetchShopOfferById(id);
  if (!offer || !shop) return null;
  const allowed = new Set(shopInventoryEmails(shop));
  const owner = (offer.bb_email || '').toLowerCase().trim();
  if (!owner || !allowed.has(owner)) return null;
  return offer;
}

export async function fetchShopOfferImages(id: number): Promise<string[]> {
  try {
    const res = await backendFetch(`/api/shop/offers/${id}/images`);
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || []) as string[];
  } catch {
    return [];
  }
}
