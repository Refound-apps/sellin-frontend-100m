import type { Metadata } from 'next';
import { Suspense } from 'react';
import ShopCatalog from '@/components/shop/ShopCatalog';
import { getShopHomeMetadata, getShopBaseUrl } from '@/lib/shop/seo';
import { resolveShopFromRequest } from '@/lib/shop/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const shop = await resolveShopFromRequest();
  const meta = getShopHomeMetadata(shop);
  const baseUrl = getShopBaseUrl(shop);

  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `${baseUrl}/` },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: baseUrl,
      siteName: shop.shop_name,
      locale: 'cs_CZ',
      type: 'website',
    },
  };
}

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopCatalog />
    </Suspense>
  );
}
