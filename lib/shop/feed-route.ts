import { NextRequest, NextResponse } from 'next/server';
import type { ShopConfigData } from '@/lib/types';
import {
  buildGoogleMerchantXml,
  buildHeurekaXml,
  buildZboziXml,
  offerToFeedProduct,
  type FeedProduct,
} from '@/lib/shop/seo';
import { fetchAllShopOffers, resolveShopFromRequest } from '@/lib/shop/server';
import { shopInventoryEmails } from '@/lib/shop/resolveShop';

export type FeedKind = 'google' | 'zbozi' | 'heureka';

async function resolveShopForFeed(request: NextRequest): Promise<ShopConfigData | null> {
  const { searchParams } = new URL(request.url);
  const domain =
    request.headers.get('x-shop-domain') ||
    searchParams.get('domain') ||
    searchParams.get('shop') ||
    null;
  const slug = searchParams.get('slug');
  return resolveShopFromRequest({ domain, slug });
}

function buildXml(kind: FeedKind, shop: ShopConfigData, products: FeedProduct[]): string {
  if (kind === 'google') return buildGoogleMerchantXml(shop, products);
  if (kind === 'zbozi') return buildZboziXml(shop, products);
  return buildHeurekaXml(shop, products);
}

export async function handleShopFeedRequest(request: NextRequest, kind: FeedKind) {
  try {
    const shop = await resolveShopForFeed(request);
    if (!shop) {
      return NextResponse.json({ success: false, error: 'Shop not found' }, { status: 404 });
    }
    const offers = await fetchAllShopOffers(shopInventoryEmails(shop), 5000);
    const products = offers.map((offer) => offerToFeedProduct(offer, shop));
    const xml = buildXml(kind, shop, products);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error(`Error generating ${kind} feed:`, err);
    return NextResponse.json(
      { success: false, error: 'Nepodařilo se vygenerovat produktový feed.' },
      { status: 500 }
    );
  }
}
