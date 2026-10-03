import type { MetadataRoute } from 'next';
import { getProductUrl, getShopBaseUrl } from '@/lib/shop/seo';
import { fetchAllShopOffers, resolveShopFromRequest } from '@/lib/shop/server';

export const dynamic = 'force-dynamic';

/**
 * Single /sitemap.xml for the resolved tenant shop.
 * (generateSitemaps() breaks /sitemap.xml in Next 16 — only /sitemap/[id].xml exists)
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const shop = await resolveShopFromRequest();
  const baseUrl = getShopBaseUrl(shop);
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/kontakt`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/jak-nakoupit`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/doprava-a-platba`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/reklamace`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/obchodni-podminky`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/llms.txt`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.4,
    },
  ];

  let productPages: MetadataRoute.Sitemap = [];
  try {
    const offers = await fetchAllShopOffers(shop.linked_credential_emails || [], 45000);
    productPages = offers.map((offer) => ({
      url: getProductUrl(shop, offer.id),
      lastModified: offer.created_at ? new Date(offer.created_at) : now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));
  } catch (err) {
    console.error('sitemap: failed to load shop offers', err);
  }

  return [...staticPages, ...productPages];
}
