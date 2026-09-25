import { NextRequest, NextResponse } from 'next/server';
import { getOfferPricingInfo, getOfferSpecsList } from '@/components/shop/offerMeta';
import { ShopOffer } from '@/lib/types';

const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3300';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const host = request.headers.get('host') || '';
    const domainHeader = request.headers.get('x-shop-domain') || searchParams.get('domain') || searchParams.get('shop') || '';

    // Forward relevant filtering params to backend
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

    // Resolve tenant config
    let domainParam = domainHeader;
    if (!domainParam && !host.includes('localhost') && !host.includes('vercel.app')) {
      domainParam = host.replace(/^www\./, '');
    }

    let linkedEmails: string[] = [];
    let shopName = 'Duplux Pneu / Alubazar Plzeň';
    let address = 'Úslavská 32, Plzeň';
    let phone = '602 390 038';
    let phoneHref = '+420602390038';
    let customDomain = 'alubazarplzen.cz';

    try {
      const resolveUrl = new URL(`${request.nextUrl.origin}/api/shop/resolve`);
      if (domainParam) resolveUrl.searchParams.set('domain', domainParam);
      const resolveRes = await fetch(resolveUrl.toString(), { cache: 'no-store' });
      if (resolveRes.ok) {
        const json = await resolveRes.json();
        if (json.data) {
          const cfg = json.data;
          linkedEmails = cfg.linked_credential_emails || [];
          shopName = cfg.shop_name || shopName;
          address = `${cfg.address_line || 'Úslavská 32'}, ${cfg.address_city || 'Plzeň'}`;
          phone = cfg.phone || phone;
          phoneHref = cfg.phone_href || phoneHref;
          customDomain = cfg.custom_domain || host;
        }
      }
    } catch {
      // fallback to defaults
    }

    if (linkedEmails.length > 0) {
      backendParams.set('emails', linkedEmails.join(','));
    }

    const backendUrl = `${BACKEND_URL}/api/shop/offers?${backendParams.toString()}`;
    const res = await fetch(backendUrl, { cache: 'no-store' });

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
        web_url: `${origin}/shop?offer=${offer.id}`,
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
