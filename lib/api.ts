import { Offer, OfferDetail, ShopInfo, ShopOffer, User, ApiResponse, TransactionsApiResponse } from './types';

export const SHOP_SBAZAR_EMAIL = 'duplux@seznam.cz';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3300';

let credentialsCache: Record<string, { phone: string; name: string }> | null = null;

export function getEndpoints(pathWithQuery: string): string[] {
  const cleanPath = pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`;
  if (typeof window !== 'undefined') {
    // In client browser: ALWAYS call current origin relative path first!
    // This avoids CORS, Mixed Content (http vs https), and port issues on Vercel
    return [cleanPath, `${API_BASE_URL}${cleanPath}`];
  }
  // On server: use API_BASE_URL (or internal localhost:3300)
  return [`${API_BASE_URL}${cleanPath}`, `http://localhost:3300${cleanPath}`];
}

export async function apiFetch(pathWithQuery: string, init?: RequestInit): Promise<Response> {
  const endpoints = getEndpoints(pathWithQuery);
  let lastError: unknown = null;
  let lastResponse: Response | null = null;

  for (const url of endpoints) {
    try {
      const response = await fetch(url, { ...init, cache: 'no-store' });
      if (response.ok) {
        return response;
      }
      lastResponse = response;
      const contentType = response.headers.get('content-type') || '';
      // If it's a backend JSON response (even 4xx/5xx), return it directly
      if (contentType.includes('application/json')) {
        return response;
      }
      lastError = new Error(`Request to ${url} returned status ${response.status}`);
    } catch (err) {
      lastError = err;
    }
  }

  if (lastResponse) {
    return lastResponse;
  }
  throw lastError || new Error(`Failed to fetch ${pathWithQuery}`);
}

export async function getCredentialsMap(): Promise<Record<string, { phone: string; name: string }>> {
  if (credentialsCache) return credentialsCache;
  try {
    const response = await apiFetch('/api/credentials');
    if (!response.ok) return {};
    const data: ApiResponse<any[]> = await response.json();
    const map: Record<string, { phone: string; name: string }> = {};
    for (const cred of data.data || []) {
      if (cred.email) {
        map[cred.email.toLowerCase().trim()] = {
          phone: cred.telephone1 || '',
          name: cred.bazos_name || '',
        };
      }
    }
    credentialsCache = map;
    return map;
  } catch (error) {
    console.error('Error fetching credentials map:', error);
    return {};
  }
}

export async function getOffers(
  limit: number = 50,
  offset: number = 0,
  search?: string,
  emails?: string[]
): Promise<Offer[]> {
  try {
    const query = new URLSearchParams();
    query.set('limit', String(limit));
    query.set('offset', String(offset));
    if (search && search.trim()) {
      query.set('search', search.trim());
    }
    if (emails && emails.length > 0) {
      const clean = emails.map((e) => e.toLowerCase().trim()).filter(Boolean);
      if (clean.length > 0) {
        query.set('emails', clean.join(','));
      }
    }

    const queryString = `?${query.toString()}`;
    const response = await apiFetch(`/api/offers${queryString}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch offers (status ${response.status})`);
    }

    const data: ApiResponse<Offer[]> = await response.json();
    if (!data || !data.data) {
      throw new Error('Failed to fetch offers');
    }

    const credsMap: Record<string, { phone: string; name: string }> = await getCredentialsMap().catch(() => ({}));
    return data.data.map((offer) => {
      const emailKey = offer.bb_email?.toLowerCase().trim();
      const cred = emailKey ? credsMap[emailKey] : null;
      return {
        ...offer,
        seller_phone: offer.seller_phone || cred?.phone || null,
        seller_name: offer.seller_name || cred?.name || null,
      };
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    throw error;
  }
}

export async function getOfferById(id: number): Promise<Offer | null> {
  try {
    const credsMap: Record<string, { phone: string; name: string }> = await getCredentialsMap().catch(() => ({}));
    const response = await apiFetch(`/api/offers/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch offer');
    }
    
    const data: ApiResponse<Offer> = await response.json();
    const offer = data.data;
    if (!offer) return null;
    const emailKey = offer.bb_email?.toLowerCase().trim();
    const cred = emailKey ? credsMap[emailKey] : null;
    return {
      ...offer,
      id: offer.id ?? (offer as any)["auto id"],
      seller_phone: offer.seller_phone || cred?.phone || null,
      seller_name: offer.seller_name || cred?.name || null,
    };
  } catch (error) {
    console.error('Error fetching offer:', error);
    throw error;
  }
}

export async function getOfferDetails(bbOfferId: string): Promise<OfferDetail[]> {
  try {
    const response = await apiFetch(`/api/offers/${encodeURIComponent(bbOfferId)}/details`);
    if (!response.ok) {
      throw new Error('Failed to fetch offer details');
    }
    
    const data: ApiResponse<OfferDetail[]> = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching offer details:', error);
    return [];
  }
}

export async function getShopInfo(sbazarEmail: string = SHOP_SBAZAR_EMAIL): Promise<ShopInfo> {
  try {
    const response = await apiFetch(
      `/api/shop?sbazar_email=${encodeURIComponent(sbazarEmail)}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch shop');
    }

    const data: ApiResponse<ShopInfo> = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching shop:', error);
    throw error;
  }
}

export type ShopOfferFilters = {
  type?: string;
  season?: string;
  width?: string;
  profile?: string;
  rim?: string;
  sort?: string;
};

export interface ShopOffersResponse {
  offers: ShopOffer[];
  total: number;
}

export async function getShopOffers(
  limit: number = 24,
  offset: number = 0,
  search?: string,
  sbazarEmail: string = SHOP_SBAZAR_EMAIL,
  filters: ShopOfferFilters = {}
): Promise<ShopOffersResponse> {
  try {
    const params = new URLSearchParams({
      sbazar_email: sbazarEmail,
      limit: String(limit),
      offset: String(offset),
    });
    if (search && search.trim()) params.set('search', search.trim());
    if (filters.type) params.set('type', filters.type);
    if (filters.season) params.set('season', filters.season);
    if (filters.width) params.set('width', filters.width);
    if (filters.profile) params.set('profile', filters.profile);
    if (filters.rim) params.set('rim', filters.rim);
    if (filters.sort) params.set('sort', filters.sort);

    const response = await apiFetch(`/api/shop/offers?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to fetch shop offers');
    }

    const data: ApiResponse<ShopOffer[]> = await response.json();
    const offers = data.data || [];
    const total = typeof data.total === 'number' ? data.total : offers.length;
    return { offers, total };
  } catch (error) {
    console.error('Error fetching shop offers:', error);
    throw error;
  }
}

export async function getShopOfferImages(id: number): Promise<string[]> {
  try {
    const response = await apiFetch(`/api/shop/offers/${id}/images`);

    if (!response.ok) {
      return [];
    }

    const data: ApiResponse<string[]> = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching shop offer images:', error);
    return [];
  }
}

export async function getUsers(): Promise<User[]> {
  try {
    const response = await apiFetch('/api/credentials');

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    const data: ApiResponse<Record<string, unknown>[]> = await response.json();
    return (data.data || []).map((row) => ({
      id: Number(row.id),
      email: String(row.email ?? ''),
      telephone1: (row.telephone1 as string | null) ?? null,
      telephone2: (row.telephone2 as string | null) ?? null,
      bazos_email: (row.bazos_email as string | null) ?? null,
      sbazar_email: (row.sbazar_email as string | null) ?? null,
      facebook_email: (row.facebook_email as string | null) ?? null,
      bazos_name: (row.bazos_name as string | null) ?? null,
      location: (row.location as string | null) ?? null,
      zipcode: (row.zipcode as number | string | null) ?? null,
      zipcode_sk: (row.zipcode_sk as string | null) ?? null,
      status_cz: (row.status_cz as string | null) ?? null,
      status_sk: (row.status_sk as string | null) ?? null,
      sbazar_profile: (row.sbazar_profile as string | null) ?? null,
      tier: (row.tier as string | null) ?? null,
      bazos_rewrite: (row.bazos_rewrite as boolean | null) ?? null,
      bazos_top_max: (row.bazos_top_max as number | null) ?? null,
      bazos_bkod: (row.bazos_bkod as string | null) ?? null,
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

export async function updateOfferById(
  id: number,
  updates: {
    title?: string;
    description?: string;
    price?: number;
    autorenew_freq?: string;
    state?: string;
    images?: string[];
    preview_image?: string | null;
    image2?: string | null;
    image3?: string | null;
    image4?: string | null;
    image5?: string | null;
    image6?: string | null;
    image7?: string | null;
    image8?: string | null;
    image9?: string | null;
  }
): Promise<void> {
  try {
    const response = await apiFetch(`/api/offers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update offer');
    }
  } catch (error) {
    console.error('Error updating offer:', error);
    throw error;
  }
}

export async function getTransactions(params: {
  limit?: number;
  offset?: number;
  search?: string;
  marketplace?: string;
  condition?: string;
  autorenew?: string;
}): Promise<TransactionsApiResponse> {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset !== undefined) query.set('offset', String(params.offset));
  if (params.search && params.search.trim()) query.set('search', params.search.trim());
  if (params.marketplace && params.marketplace !== 'all') query.set('marketplace', params.marketplace);
  if (params.condition && params.condition !== 'all') query.set('condition', params.condition);
  if (params.autorenew && params.autorenew !== 'all') query.set('autorenew', params.autorenew);

  const queryString = query.toString() ? `?${query.toString()}` : '';

  try {
    const response = await apiFetch(`/api/transactions${queryString}`);
    if (response.ok) {
      const json: TransactionsApiResponse = await response.json();
      if (json && json.success) {
        return json;
      }
    }
    throw new Error('Failed to fetch transactions');
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

export async function uploadImageToR2(fileOrBase64: string, filename?: string): Promise<string> {
  const response = await apiFetch('/api/upload/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: fileOrBase64, filename }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Nepodařilo se nahrát obrázek');
  }
  const data = await response.json();
  return data.url;
}

export async function uploadImagesToR2(images: { data: string; filename?: string }[]): Promise<string[]> {
  const response = await apiFetch('/api/upload/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Nepodařilo se nahrát obrázky');
  }
  const data = await response.json();
  return data.urls || (data.url ? [data.url] : []);
}

