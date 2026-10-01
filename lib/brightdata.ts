const BRIGHT_DATA_API = 'https://api.brightdata.com';

export type BrightDataZone = {
  name: string;
  type: string;
  status?: string;
};

export type BrightDataIp = {
  ip: string;
  country: string | null;
};

export type BrightDataBalance = {
  balance: number;
  credit?: number;
  prepayment?: number;
  pending_costs?: number;
};

export type BrightDataStatus = {
  status: string;
  customer: string;
  can_make_requests: boolean;
  auth_fail_reason?: string;
  ip?: string;
};

export function getBrightDataConfig() {
  const apiKey = process.env.BRIGHT_DATA_API_KEY?.trim();
  const customer =
    process.env.BRIGHT_DATA_CUSTOMER_ID?.trim() ||
    process.env.BRIGHT_DATA_ACCOUNT_ID?.trim() ||
    '';
  const defaultZone = process.env.BRIGHT_DATA_DEFAULT_ZONE?.trim() || 'data_center';

  if (!apiKey) {
    throw new Error('Chybí BRIGHT_DATA_API_KEY v environment variables');
  }

  return { apiKey, customer, defaultZone };
}

async function brightDataFetch<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const { apiKey } = getBrightDataConfig();
  const url = path.startsWith('http') ? path : `${BRIGHT_DATA_API}${path}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  const text = await res.text();
  let data: unknown = text;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  } else {
    data = null;
  }

  if (!res.ok) {
    const message =
      typeof data === 'string'
        ? data
        : data && typeof data === 'object' && 'error' in data
          ? String((data as { error: unknown }).error)
          : `Bright Data API error ${res.status}`;
    throw new Error(message || `Bright Data API error ${res.status}`);
  }

  return data as T;
}

export async function getBrightDataStatus() {
  return brightDataFetch<BrightDataStatus>('/status');
}

export async function getBrightDataBalance() {
  return brightDataFetch<BrightDataBalance>('/customer/balance');
}

export async function listBrightDataZones() {
  try {
    return await brightDataFetch<BrightDataZone[]>('/zone/get_active_zones');
  } catch {
    return brightDataFetch<BrightDataZone[]>('/zone/get_all_zones');
  }
}

export async function getBrightDataZoneInfo(zone: string) {
  return brightDataFetch<Record<string, unknown>>(
    `/zone?zone=${encodeURIComponent(zone)}`
  );
}

function normalizeIpList(raw: unknown): BrightDataIp[] {
  if (!raw) return [];

  if (typeof raw === 'string') {
    return raw
      .split(/[\n,\s]+/)
      .map((ip) => ip.trim())
      .filter(Boolean)
      .map((ip) => ({ ip, country: null }));
  }

  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === 'string') return { ip: item.trim(), country: null };
        if (item && typeof item === 'object') {
          const row = item as Record<string, unknown>;
          const ip = String(row.ip || '').trim();
          if (!ip) return null;
          const country =
            typeof row.country === 'string'
              ? row.country
              : typeof row.maxmind === 'string'
                ? row.maxmind
                : null;
          return { ip, country };
        }
        return null;
      })
      .filter((x): x is BrightDataIp => Boolean(x?.ip));
  }

  if (typeof raw === 'object' && raw !== null && 'ips' in raw) {
    return normalizeIpList((raw as { ips: unknown }).ips);
  }

  return [];
}

/** Static Datacenter / ISP IPs allocated to a zone */
export async function getBrightDataZoneIps(zone: string): Promise<BrightDataIp[]> {
  try {
    const withCountries = await brightDataFetch<unknown>(
      `/zone/route_ips?zone=${encodeURIComponent(zone)}&list_countries=true`
    );
    const parsed = normalizeIpList(withCountries);
    if (parsed.length > 0) return parsed;
  } catch {
    // fall through
  }

  try {
    const detailed = await brightDataFetch<unknown>(
      `/zone/ips?zone=${encodeURIComponent(zone)}`
    );
    const parsed = normalizeIpList(detailed);
    if (parsed.length > 0) return parsed;
  } catch {
    // fall through
  }

  const plain = await brightDataFetch<unknown>(
    `/zone/route_ips?zone=${encodeURIComponent(zone)}`
  );
  return normalizeIpList(plain);
}

export async function addBrightDataZoneIps(params: {
  zone: string;
  count: number;
  country?: string;
  customer?: string;
}) {
  const { customer: envCustomer } = getBrightDataConfig();
  const customer = params.customer || envCustomer;
  if (!customer) {
    throw new Error('Chybí BRIGHT_DATA_CUSTOMER_ID pro alokaci IP');
  }

  const body: Record<string, string | number> = {
    customer,
    zone: params.zone,
    count: params.count,
  };
  if (params.country?.trim()) {
    body.country = params.country.trim().toLowerCase();
  }

  return brightDataFetch<{ ips?: string[]; new_ips?: string[] }>('/zone/ips', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function removeBrightDataZoneIps(params: {
  zone: string;
  ips: string[];
}) {
  const qs = new URLSearchParams({ zone: params.zone });
  for (const ip of params.ips) {
    qs.append('ip', ip);
  }

  // Bright Data accepts DELETE with body or ip query params depending on API version
  try {
    return await brightDataFetch<unknown>(`/zone/ips?${qs.toString()}`, {
      method: 'DELETE',
    });
  } catch {
    return brightDataFetch<unknown>('/zone/ips', {
      method: 'DELETE',
      body: JSON.stringify({ zone: params.zone, ips: params.ips }),
    });
  }
}
