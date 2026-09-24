import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/admin/', '/accounts', '/create'],
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
        allow: ['/', '/shop', '/shop/*', '/api/shop/ai-catalog', '/llms.txt', '/.well-known/llms.txt'],
        disallow: ['/admin/', '/api/admin/'],
      },
    ],
    sitemap: 'https://alubazarplzen.cz/sitemap.xml',
  };
}
