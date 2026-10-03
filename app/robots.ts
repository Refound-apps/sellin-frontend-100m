import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { getProdejomatBaseUrl, getRequestHost, isTenantHost } from '@/lib/prodejomat/host';
import { getShopBaseUrl } from '@/lib/shop/seo';
import { resolveShopFromRequest } from '@/lib/shop/server';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const shopDomainHeader = headersList.get('x-shop-domain');
  const host = await getRequestHost();
  const tenant = isTenantHost(host, shopDomainHeader);

  if (tenant) {
    let baseUrl = 'https://www.alubazarplzen.cz';
    try {
      const shop = await resolveShopFromRequest();
      baseUrl = getShopBaseUrl(shop);
    } catch {
      // fallback
    }

    return {
      rules: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/admin/', '/api/admin/', '/accounts', '/create', '/login'],
        },
        {
          userAgent: [
            'GPTBot',
            'PerplexityBot',
            'ClaudeBot',
            'Google-Extended',
            'Applebot-Extended',
            'CCBot',
            'ChatGPT-User',
          ],
          allow: [
            '/',
            '/shop',
            '/shop/*',
            '/produkt/*',
            '/api/shop/ai-catalog',
            '/api/shop/feeds/',
            '/llms.txt',
            '/.well-known/llms.txt',
          ],
          disallow: ['/admin/', '/api/admin/'],
        },
      ],
      sitemap: `${baseUrl}/sitemap.xml`,
      host: baseUrl.replace(/^https?:\/\//, ''),
    };
  }

  const baseUrl = getProdejomatBaseUrl(host);

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/llms.txt', '/.well-known/llms.txt', '/manifest.webmanifest'],
        disallow: [
          '/admin/',
          '/api/',
          '/accounts',
          '/create',
          '/transactions',
          '/users',
          '/eshop',
          '/reset-password',
          '/rezervace',
        ],
      },
      {
        userAgent: [
          'GPTBot',
          'PerplexityBot',
          'ClaudeBot',
          'Google-Extended',
          'Applebot-Extended',
          'CCBot',
          'ChatGPT-User',
        ],
        allow: ['/', '/login', '/llms.txt', '/.well-known/llms.txt'],
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl.replace(/^https?:\/\//, ''),
  };
}
