import { Offer, OfferDetail, ShopInfo, ShopOffer, User, ApiResponse, TransactionsApiResponse } from './types';

export const SHOP_SBAZAR_EMAIL = 'duplux@seznam.cz';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3300';

let credentialsCache: Record<string, { phone: string; name: string }> | null = null;

export async function getCredentialsMap(): Promise<Record<string, { phone: string; name: string }>> {
  if (credentialsCache) return credentialsCache;
  try {
    const response = await fetch(`${API_BASE_URL}/api/credentials`, { cache: 'no-store' });
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
    const endpoints =
      typeof window !== 'undefined'
        ? [`/api/offers${queryString}`, `${API_BASE_URL}/api/offers${queryString}`]
        : [`${API_BASE_URL}/api/offers${queryString}`, `http://localhost:3300/api/offers${queryString}`];

    let lastError: unknown = null;
    let data: ApiResponse<Offer[]> | null = null;

    for (const url of endpoints) {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (response.ok) {
          data = await response.json();
          break;
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (!data || !data.data) {
      throw lastError || new Error('Failed to fetch offers');
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
    const response = await fetch(`${API_BASE_URL}/api/offers/${id}`, { cache: 'no-store' });
    
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
    const response = await fetch(`${API_BASE_URL}/api/offers/${bbOfferId}/details`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch offer details');
    }
    
    const data: ApiResponse<OfferDetail[]> = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching offer details:', error);
    return [];
  }
}

export async function getShopInfo(sbazarEmail: string = SHOP_SBAZAR_EMAIL): Promise<ShopInfo> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/shop?sbazar_email=${encodeURIComponent(sbazarEmail)}`,
      { cache: 'no-store' }
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
};

export async function getShopOffers(
  limit: number = 24,
  offset: number = 0,
  search?: string,
  sbazarEmail: string = SHOP_SBAZAR_EMAIL,
  filters: ShopOfferFilters = {}
): Promise<ShopOffer[]> {
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

    const response = await fetch(`${API_BASE_URL}/api/shop/offers?${params.toString()}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch shop offers');
    }

    const data: ApiResponse<ShopOffer[]> = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching shop offers:', error);
    throw error;
  }
}

export async function getShopOfferImages(id: number): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/shop/offers/${id}/images`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch offer images');
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
    const response = await fetch(`${API_BASE_URL}/api/credentials`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    const data: ApiResponse<Record<string, unknown>[]> = await response.json();
    return data.data.map((row) => ({
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

export async function updateOfferById(id: number, updates: { title?: string, description?: string, price?: number }): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/offers/${id}`, {
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

  const endpoints =
    typeof window !== 'undefined'
      ? [`/api/transactions${queryString}`, `${API_BASE_URL}/api/transactions${queryString}`]
      : [`${API_BASE_URL}/api/transactions${queryString}`, `http://localhost:3300/api/transactions${queryString}`];

  let lastError: unknown = null;
  for (const url of endpoints) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (response.ok) {
        const json = await response.json();
        if (json && json.success) {
          return json;
        }
      }
    } catch (err) {
      lastError = err;
    }
  }

  console.error('Error fetching transactions from endpoints:', endpoints, lastError);
  throw lastError || new Error('Failed to fetch transactions');
}
