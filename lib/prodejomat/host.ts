import { headers } from 'next/headers';

const MAIN_DOMAINS = new Set([
  'sellin.cz',
  'www.sellin.cz',
  'app.sellin.cz',
  'bazar.sellin.cz',
  'stage.sellin.cz',
  'dev.sellin.cz',
  'prodejomat.cz',
  'www.prodejomat.cz',
  'app.prodejomat.cz',
  'bazar.prodejomat.cz',
  'stage.prodejomat.cz',
  'dev.prodejomat.cz',
  'localhost',
  '127.0.0.1',
]);

export function isTenantHost(host: string, shopDomainHeader?: string | null): boolean {
  if (shopDomainHeader) return true;
  if (!host) return false;
  const h = host.toLowerCase().split(':')[0].trim();
  if (h.includes('.localhost')) return true;
  if (h.endsWith('.sellin.cz')) {
    const subdomain = h.replace('.sellin.cz', '');
    return !['app', 'www', 'stage', 'dev', 'bazar'].includes(subdomain);
  }
  if (h.endsWith('.prodejomat.cz')) {
    const subdomain = h.replace('.prodejomat.cz', '');
    return !['app', 'www', 'stage', 'dev', 'bazar'].includes(subdomain);
  }
  return !MAIN_DOMAINS.has(h) && !h.endsWith('.vercel.app');
}

export async function getRequestHost(): Promise<string> {
  const headersList = await headers();
  const raw =
    headersList.get('x-forwarded-host') || headersList.get('host') || 'www.prodejomat.cz';
  return raw.toLowerCase().split(':')[0].trim();
}

export async function getRequestIsTenant(): Promise<boolean> {
  const headersList = await headers();
  const shopDomainHeader = headersList.get('x-shop-domain');
  const host = await getRequestHost();
  return isTenantHost(host, shopDomainHeader);
}

export function getProdejomatBaseUrl(host?: string | null): string {
  const h = (host || 'www.prodejomat.cz').toLowerCase().split(':')[0].trim().replace(/^www\./, '');
  if (h.includes('sellin.cz')) return 'https://www.sellin.cz';
  if (h.includes('localhost') || h.includes('vercel.app')) {
    return `http://${host || 'localhost:3000'}`;
  }
  return 'https://www.prodejomat.cz';
}
