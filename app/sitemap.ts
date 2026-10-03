import type { MetadataRoute } from 'next';
import { getProductUrl, getShopBaseUrl } from '@/lib/shop/seo';
import { fetchShopOffersPage, resolveShopFromRequest } from '@/lib/shop/server';

export const dynamic = 'force-dynamic';

const PRODUCTS_PER_SITEMAP = 1000;

export async function generateSitemaps() {
  try {
    const shop = await resolveShopFromRequest();
    const { total } = await fetchShopOffersPage({
      emails: shop.linked_credential_emails || [],
      limit: 1,
      offset: 0,
    });
    // id 0 = static pages; id 1..n = product chunks
    const productChunks = Math.max(1, Math.ceil(total / PRODUCTS_PER_SITEMAP));
    return Array.from({ length: productChunks + 1 }, (_, id) => ({ id }));
  } catch {
    return [{ id: 0 }];
  }
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id);
  const shop = await resolveShopFromRequest();
  const baseUrl = getShopBaseUrl(shop);
  const now = new Date();

  if (!id || id === 0) {
    return [
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
  }

  const chunkIndex = id - 1;
  const offset = chunkIndex * PRODUCTS_PER_SITEMAP;
  const { offers } = await fetchShopOffersPage({
    emails: shop.linked_credential_emails || [],
    limit: PRODUCTS_PER_SITEMAP,
    offset,
  });

  return offers.map((offer) => ({
    url: getProductUrl(shop, offer.id),
    lastModified: offer.created_at ? new Date(offer.created_at) : now,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));
}
