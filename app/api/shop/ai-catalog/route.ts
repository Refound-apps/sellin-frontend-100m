import { NextRequest, NextResponse } from 'next/server';
import { getOfferPricingInfo, getOfferSpecsList } from '@/components/shop/offerMeta';
import { backendFetch } from '@/lib/backend';
import { createClient } from '@/lib/supabase/server';
import { findShopByIdentity, shopInventoryEmails } from '@/lib/shop/resolveShop';
import { ShopOffer } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const host = (request.headers.get('host') || '').toLowerCase().split(':')[0].trim();
    const domainHeader =
      request.headers.get('x-shop-domain') ||
      searchParams.get('domain') ||
      searchParams.get('shop') ||
      '';

    const supabase = await createClient();
    const shop = await findShopByIdentity(supabase, {
      domain: domainHeader || null,
      slug: searchParams.get('slug'),
      host,
    });

    if (!shop) {
      return NextResponse.json({ success: false, error: 'Shop not found' }, { status: 404 });
    }

    const linkedEmails = shopInventoryEmails(shop);
    const shopName = shop.shop_name || 'E-shop';
    const address = [shop.address_line, shop.address_city].filter(Boolean).join(', ');
    const phone = shop.phone || '';
    const phoneHref = shop.phone_href || '';
    const customDomain = shop.custom_domain || host;

    const backendParams = new URLSearchParams();
    const query = searchParams.get('q') || searchParams.get('search') || '';
    if (query) backendParams.set('search', query);

    const type = searchParams.get('type');
    if (type) backendParams.set('type', type);

    const season = searchParams.get('season');
    if (season) backendParams.set('season', season);

    const width = searchParams.get('width');
    if (width) backendParams.set('width', width);

    const profile = searchParams.get('profile');
    if (profile) backendParams.set('profile', profile);

    const rim = searchParams.get('rim');
    if (rim) backendParams.set('rim', rim);

    const brand = searchParams.get('brand');
    if (brand) backendParams.set('brand', brand);

    const sort = searchParams.get('sort') || 'newest';
    backendParams.set('sort', sort);

    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    backendParams.set('limit', String(limit));

    const offset = parseInt(searchParams.get('offset') || '0', 10);
    backendParams.set('offset', String(offset));

    if (linkedEmails.length === 0) {
      return NextResponse.json({
        success: true,
        shop: { name: shopName, address, phone, phoneHref, domain: customDomain },
        total: 0,
        products: [],
      });
    }

    backendParams.set('emails', linkedEmails.join(','));

    const res = await backendFetch(`/api/shop/offers?${backendParams.toString()}`);

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'Chyba při načítání katalogu z databáze',
        },
        { status: 502 }
      );
    }

    const json = await res.json();
    const rawOffers: ShopOffer[] = json.data || [];
    const total = json.total ?? rawOffers.length;

    // Transform to structured AI-ready catalog format
    const origin = customDomain ? `https://${customDomain}` : request.nextUrl.origin;

    const items = rawOffers.map((offer) => {
      const specs = getOfferSpecsList(offer);
      const pricing = getOfferPricingInfo(offer);

      const sizeSpec = specs.find((s) => s.label === 'Rozměr')?.value || null;
      const seasonSpec = specs.find((s) => s.label === 'Sezóna')?.value || null;
      const brandSpec = specs.find((s) => s.label === 'Značka')?.value || null;
      const treadSpec = specs.find((s) => s.label === 'Vzorek')?.value || null;
      const pcdSpec = specs.find((s) => s.label === 'Rozteč')?.value || null;
      const etSpec = specs.find((s) => s.label.includes('ET'))?.value || null;
      const widthSpec = specs.find((s) => s.label.includes('Šířka'))?.value || null;
      const typeSpec = specs.find((s) => s.label === 'Typ')?.value || 'Pneumatiky / Disky';
      const rimVal = specs.find((s) => s.label === 'Průměr')?.value?.replace(/[^0-9]/g, '') || (sizeSpec ? sizeSpec.match(/R(\d+)/i)?.[1] || null : null);

      return {
        id: offer.id,
        title: offer.title,
        price_czk: offer.price,
        pricing_unit: pricing.isPerPiece ? 'per_piece' : 'per_set',
        price_label: pricing.priceLabel,
        category: typeSpec,
        season: seasonSpec,
        specs: {
          dimension: sizeSpec,
          width: widthSpec,
          rim: rimVal,
          tread_depth: treadSpec,
          pcd: pcdSpec,
          et: etSpec,
          brand: brandSpec,
        },
        in_stock: true,
        location: address,
        pickup_ready: true,
        shipping_available: true,
        shipping_price: pricing.shippingPrice,
        preview_image: offer.preview_image || null,
        web_url: `${origin}/produkt/${offer.id}`,
        direct_call: `tel:${phoneHref}`,
        created_at: offer.created_at,
      };
    });

    return NextResponse.json(
      {
        success: true,
        _ai_agent_info: {
          standard: 'LLM-Ready E-Commerce Catalog',
          shop_name: shopName,
          domain: customDomain,
          phone: phone,
          address: address,
          in_stock_guarantee: 'All returned items are physically available in store.',
          services: ['Osobní odběr', 'Přezutí na počkání', 'Vyvážení disků', 'Zaslání Českou poštou'],
          query_parameters: {
            q: 'Search string (e.g. 205/55 R16, Michelin, 5x112, Škoda)',
            season: 'zimni | letni | celorocni',
            type: 'pneu | disk',
            rim: '14, 15, 16, 17, 18, 19, 20, 21',
            brand: 'Manufacturer name (e.g. Continental, Barum, BBS)',
            sort: 'newest | price_asc | price_desc',
            limit: 'Max items per response (default 50)',
            offset: 'Pagination offset',
          },
        },
        total_results: total,
        returned_count: items.length,
        items,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=300',
        },
      }
    );
  } catch (err: unknown) {
    console.error('Error in /api/shop/ai-catalog:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Chyba serveru při generování AI katalogu.',
      },
      { status: 500 }
    );
  }
}
