import type { MetadataRoute } from 'next';
import { getShopBaseUrl } from '@/lib/shop/seo';
import { resolveShopFromRequest } from '@/lib/shop/server';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  let baseUrl = 'https://www.alubazarplzen.cz';
  try {
    const shop = await resolveShopFromRequest();
    baseUrl = getShopBaseUrl(shop);
  } catch {
    // keep fallback
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
