import type { Metadata } from 'next';
import {
  buildShopPageMetadata,
  getShopStaticPageSeo,
  type ShopStaticPageKey,
} from '@/lib/shop/seo';
import { resolveShopFromRequest } from '@/lib/shop/server';

export async function generateShopStaticMetadata(
  page: ShopStaticPageKey
): Promise<Metadata> {
  const shop = await resolveShopFromRequest();
  const seo = getShopStaticPageSeo(shop, page);
  return buildShopPageMetadata(shop, {
    title: seo.title,
    description: seo.description,
    path: seo.path,
  });
}
