import type { Metadata } from 'next';
import {
  getOfferPricingInfo,
  getOfferSpecsList,
  isWheelOffer,
} from '@/components/shop/offerMeta';
import type { ShopConfigData, ShopOffer } from '@/lib/types';

export type ShopSeoSource = Pick<
  ShopConfigData,
  | 'shop_name'
  | 'tagline'
  | 'slug'
  | 'custom_domain'
  | 'address_city'
  | 'address_line'
  | 'phone'
  | 'email'
  | 'logo_url'
>;

export type ShopStaticPageKey =
  | 'home'
  | 'kontakt'
  | 'jak-nakoupit'
  | 'doprava-a-platba'
  | 'reklamace'
  | 'obchodni-podminky';

export type FeedProduct = {
  id: number;
  title: string;
  description: string;
  price: number;
  currency: 'CZK';
  url: string;
  image: string | null;
  brand: string | null;
  category: string;
  productType: string;
  condition: 'used';
  availability: 'in stock';
  sku: string;
  shippingPrice: number;
  dimension: string | null;
  season: string | null;
  treadDepth: string | null;
  pcd: string | null;
  et: string | null;
  rim: string | null;
  isWheel: boolean;
  pricingUnit: 'per_piece' | 'per_set';
};

/**
 * Canonical public origin for the shop.
 * Custom domains use www. (matches typical Vercel apex→www redirect).
 */
export function getShopBaseUrl(shop: ShopSeoSource): string {
  const domain = (shop.custom_domain || '').trim().toLowerCase().replace(/^www\./, '');
  if (domain) return `https://www.${domain}`;
  const slug = (shop.slug || 'shop').trim().toLowerCase() || 'shop';
  return `https://${slug}.prodejomat.cz`;
}

/** In-app path (works on sellin.cz/shop and on tenant domains). */
export function getProductPath(offerId: number | string): string {
  return `/shop/produkt/${offerId}`;
}

/** Public canonical product URL on the shop domain (clean /produkt/{id}). */
export function getProductUrl(shop: ShopSeoSource, offerId: number | string): string {
  return `${getShopBaseUrl(shop)}/produkt/${offerId}`;
}

export function getShopPublicUrls(shop: ShopSeoSource) {
  const baseUrl = getShopBaseUrl(shop);
  return {
    baseUrl,
    homeUrl: `${baseUrl}/`,
    catalogUrl: `${baseUrl}/`,
    sitemapUrl: `${baseUrl}/sitemap.xml`,
    robotsUrl: `${baseUrl}/robots.txt`,
    googleFeedUrl: `${baseUrl}/api/shop/feeds/google.xml`,
    zboziFeedUrl: `${baseUrl}/api/shop/feeds/zbozi.xml`,
    heurekaFeedUrl: `${baseUrl}/api/shop/feeds/heureka.xml`,
    productUrl: (offerId: number | string) => getProductUrl(shop, offerId),
  };
}

function shopCity(shop: ShopSeoSource) {
  return (shop.address_city || 'Plzeň').trim() || 'Plzeň';
}

function shopName(shop: ShopSeoSource) {
  return (shop.shop_name || 'E-shop').trim() || 'E-shop';
}

export function getShopHomeMetadata(shop: ShopSeoSource) {
  const city = shopCity(shop);
  const name = shopName(shop);
  const tagline = shop.tagline || 'Prověřené pneumatiky a ALU disky';
  return {
    title: `Pneu a ALU disky ${city} | ${name}`,
    description: `${tagline}. Zimní i letní pneu, ALU disky a sady kol skladem v ${city}. Osobní odběr, přezutí na počkání a zaslání po celé ČR. Prověřené kusy se zárukou.`,
  };
}

export function getShopStaticPageSeo(
  shop: ShopSeoSource,
  page: ShopStaticPageKey
): { title: string; description: string; path: string } {
  const city = shopCity(shop);
  const name = shopName(shop);
  const home = getShopHomeMetadata(shop);

  const pages: Record<ShopStaticPageKey, { title: string; description: string; path: string }> = {
    home: {
      title: home.title,
      description: home.description,
      path: '/',
    },
    kontakt: {
      title: `Kontakt a provozovna ${city} | ${name}`,
      description: `Kontaktujte ${name} – provozovna ${shop.address_line || 'Úslavská 32'}, ${city}. Telefon ${shop.phone || ''}. Osobní odběr pneu a disků, pneuservis a zaslání po ČR.`.replace(
        /\s+/g,
        ' '
      ).trim(),
      path: '/kontakt',
    },
    'jak-nakoupit': {
      title: `Jak vybrat a koupit pneu | ${name}`,
      description: `Jak vybrat správný rozměr pneumatik a ALU disků, jak rezervovat sadu online a vyzvednout v ${city}. Jednoduchý návod od ${name}.`,
      path: '/jak-nakoupit',
    },
    'doprava-a-platba': {
      title: `Doprava a platba | ${name}`,
      description: `Osobní odběr v ${city} zdarma, zaslání Českou poštou po ČR, platba hotově, převodem nebo dobírkou. Podmínky dopravy u ${name}.`,
      path: '/doprava-a-platba',
    },
    reklamace: {
      title: `Reklamace a záruka | ${name}`,
      description: `Garance a reklamace pneumatik a disků u ${name}. Jak uplatnit reklamaci, lhůty a podmínky vrácení zboží.`,
      path: '/reklamace',
    },
    'obchodni-podminky': {
      title: `Obchodní podmínky | ${name}`,
      description: `Obchodní podmínky e-shopu ${name} – prodej pneumatik a ALU disků, rezervace, doprava a ochrana spotřebitele.`,
      path: '/obchodni-podminky',
    },
  };

  return pages[page];
}

export function getOfferSeoTitle(offer: ShopOffer, shop: ShopSeoSource): string {
  const name = shopName(shop);
  const city = shopCity(shop);
  const raw = (offer.title || 'Nabídka').replace(/\s+/g, ' ').trim();
  // Keep title readable for SERP (~60–70 chars ideal)
  const suffix = ` | ${name} ${city}`;
  const maxMain = Math.max(28, 70 - suffix.length);
  const main = raw.length > maxMain ? `${raw.slice(0, maxMain - 1).trim()}…` : raw;
  return `${main}${suffix}`;
}

export function getOfferSeoDescription(offer: ShopOffer, max = 160): string {
  const specs = getOfferSpecsList(offer);
  const bits = specs
    .filter((s) => ['Rozměr', 'Sezóna', 'Značka', 'Vzorek', 'Rozteč', 'Typ'].includes(s.label))
    .map((s) => s.value);
  const price =
    typeof offer.price === 'number' && offer.price > 0
      ? `${new Intl.NumberFormat('cs-CZ').format(offer.price)} Kč`
      : '';
  const fromDesc = (offer.description || '').replace(/\s+/g, ' ').trim();
  const parts = [
    offer.title,
    bits.length ? bits.join(', ') : null,
    price ? `Cena ${price}` : null,
    'Skladem, osobní odběr nebo zásilka po ČR',
    fromDesc || null,
  ].filter(Boolean);
  const text = parts.join('. ').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
}

export function buildShopPageMetadata(
  shop: ShopSeoSource,
  opts: {
    title: string;
    description: string;
    path?: string;
    images?: string[];
    noIndex?: boolean;
  }
): Metadata {
  const baseUrl = getShopBaseUrl(shop);
  const path = opts.path || '/';
  const canonical = path === '/' ? `${baseUrl}/` : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const images =
    opts.images && opts.images.length > 0
      ? opts.images
      : shop.logo_url
        ? [shop.logo_url]
        : undefined;

  return {
    metadataBase: new URL(baseUrl),
    title: opts.title,
    description: opts.description,
    applicationName: shopName(shop),
    authors: [{ name: shopName(shop) }],
    creator: shopName(shop),
    publisher: shopName(shop),
    category: 'Auto-moto',
    alternates: { canonical },
    robots: opts.noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: canonical,
      siteName: shopName(shop),
      locale: 'cs_CZ',
      type: 'website',
      images: images?.map((url) => ({ url })),
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title: opts.title,
      description: opts.description,
      images,
    },
    icons: {
      icon: [{ url: '/shop-favicon.svg', type: 'image/svg+xml' }],
      apple: [{ url: '/apple-icon', type: 'image/png' }],
    },
    other: {
      'geo.region': 'CZ',
      'geo.placename': shopCity(shop),
    },
  };
}

function parseShippingCzk(raw: string): number {
  const match = raw.replace(/\s/g, '').match(/(\d{2,5})/);
  return match ? parseInt(match[1], 10) : 500;
}

export function offerToFeedProduct(offer: ShopOffer, shop: ShopSeoSource): FeedProduct {
  const specs = getOfferSpecsList(offer);
  const pricing = getOfferPricingInfo(offer);
  const isWheel = isWheelOffer(offer);
  const brand = specs.find((s) => s.label === 'Značka')?.value || null;
  const dimension = specs.find((s) => s.label === 'Rozměr')?.value || null;
  const season = specs.find((s) => s.label === 'Sezóna')?.value || null;
  const treadDepth = specs.find((s) => s.label === 'Vzorek')?.value || null;
  const pcd = specs.find((s) => s.label === 'Rozteč')?.value || null;
  const et = specs.find((s) => s.label.includes('ET'))?.value || null;
  const rim = specs.find((s) => s.label === 'Průměr')?.value || null;
  const typeSpec = specs.find((s) => s.label === 'Typ')?.value || (isWheel ? 'Disky' : 'Pneumatiky');

  const description =
    (offer.description || '').replace(/\s+/g, ' ').trim() ||
    getOfferSeoDescription(offer, 500);

  return {
    id: offer.id,
    title: offer.title,
    description,
    price: Number(offer.price) || 0,
    currency: 'CZK',
    url: getProductUrl(shop, offer.id),
    image: offer.preview_image || null,
    brand,
    category: isWheel ? 'Auto-moto | Disky' : 'Auto-moto | Pneumatiky',
    productType: typeSpec,
    condition: 'used',
    availability: 'in stock',
    sku: `SHOP-${offer.id}`,
    shippingPrice: parseShippingCzk(pricing.shippingPrice),
    dimension,
    season,
    treadDepth,
    pcd,
    et,
    rim,
    isWheel,
    pricingUnit: pricing.isPerPiece ? 'per_piece' : 'per_set',
  };
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildGoogleMerchantXml(shop: ShopSeoSource, products: FeedProduct[]): string {
  const urls = getShopPublicUrls(shop);
  const items = products
    .filter((p) => p.price > 0 && p.title)
    .map((p) => {
      const extra = [
        p.dimension ? `Rozměr: ${p.dimension}` : null,
        p.season ? `Sezóna: ${p.season}` : null,
        p.pcd ? `Rozteč: ${p.pcd}` : null,
        p.pricingUnit === 'per_piece' ? 'Cena za 1 kus' : 'Cena za sadu',
      ]
        .filter(Boolean)
        .join(' | ');

      return `  <item>
    <g:id>${escapeXml(p.sku)}</g:id>
    <g:title>${escapeXml(p.title.slice(0, 150))}</g:title>
    <g:description>${escapeXml((extra ? `${p.description} ${extra}` : p.description).slice(0, 5000))}</g:description>
    <g:link>${escapeXml(p.url)}</g:link>
    ${p.image ? `<g:image_link>${escapeXml(p.image)}</g:image_link>` : ''}
    <g:availability>${p.availability}</g:availability>
    <g:condition>${p.condition}</g:condition>
    <g:price>${p.price.toFixed(2)} ${p.currency}</g:price>
    ${p.brand ? `<g:brand>${escapeXml(p.brand)}</g:brand>` : '<g:brand>Generic</g:brand>'}
    <g:identifier_exists>false</g:identifier_exists>
    <g:product_type>${escapeXml(p.category)}</g:product_type>
    <g:google_product_category>888</g:google_product_category>
    <g:shipping>
      <g:country>CZ</g:country>
      <g:service>Ceska posta</g:service>
      <g:price>${p.shippingPrice.toFixed(2)} CZK</g:price>
    </g:shipping>
  </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(shop.shop_name || 'E-shop')}</title>
    <link>${escapeXml(urls.baseUrl)}</link>
    <description>${escapeXml(shop.tagline || 'Produktový feed')}</description>
${items}
  </channel>
</rss>`;
}

export function buildZboziXml(shop: ShopSeoSource, products: FeedProduct[]): string {
  const items = products
    .filter((p) => p.price > 0 && p.title)
    .map((p) => {
      const params = [
        p.dimension ? `    <PARAM><PARAM_NAME>Rozmer</PARAM_NAME><VAL>${escapeXml(p.dimension)}</VAL></PARAM>` : '',
        p.season ? `    <PARAM><PARAM_NAME>Sezona</PARAM_NAME><VAL>${escapeXml(p.season)}</VAL></PARAM>` : '',
        p.pcd ? `    <PARAM><PARAM_NAME>Roztec</PARAM_NAME><VAL>${escapeXml(p.pcd)}</VAL></PARAM>` : '',
        p.treadDepth ? `    <PARAM><PARAM_NAME>Vzorek</PARAM_NAME><VAL>${escapeXml(p.treadDepth)}</VAL></PARAM>` : '',
      ]
        .filter(Boolean)
        .join('\n');

      return `  <SHOPITEM>
    <ITEM_ID>${escapeXml(p.sku)}</ITEM_ID>
    <PRODUCTNAME>${escapeXml(p.title)}</PRODUCTNAME>
    <DESCRIPTION>${escapeXml(p.description.slice(0, 5000))}</DESCRIPTION>
    <URL>${escapeXml(p.url)}</URL>
    ${p.image ? `<IMGURL>${escapeXml(p.image)}</IMGURL>` : ''}
    <PRICE_VAT>${p.price}</PRICE_VAT>
    <CATEGORYTEXT>${escapeXml(p.category)}</CATEGORYTEXT>
    ${p.brand ? `<MANUFACTURER>${escapeXml(p.brand)}</MANUFACTURER>` : ''}
    <DELIVERY_DATE>0</DELIVERY_DATE>
    <DELIVERY>
      <DELIVERY_ID>CESKA_POSTA</DELIVERY_ID>
      <DELIVERY_PRICE>${p.shippingPrice}</DELIVERY_PRICE>
    </DELIVERY>
${params}
  </SHOPITEM>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<SHOP>
${items}
</SHOP>`;
}

export function buildHeurekaXml(shop: ShopSeoSource, products: FeedProduct[]): string {
  const items = products
    .filter((p) => p.price > 0 && p.title)
    .map((p) => {
      const params = [
        p.dimension ? `    <PARAM><PARAM_NAME>Rozměr</PARAM_NAME><VAL>${escapeXml(p.dimension)}</VAL></PARAM>` : '',
        p.season ? `    <PARAM><PARAM_NAME>Sezóna</PARAM_NAME><VAL>${escapeXml(p.season)}</VAL></PARAM>` : '',
        p.pcd ? `    <PARAM><PARAM_NAME>Rozteč</PARAM_NAME><VAL>${escapeXml(p.pcd)}</VAL></PARAM>` : '',
        p.treadDepth ? `    <PARAM><PARAM_NAME>Vzorek</PARAM_NAME><VAL>${escapeXml(p.treadDepth)}</VAL></PARAM>` : '',
      ]
        .filter(Boolean)
        .join('\n');

      return `  <SHOPITEM>
    <ITEM_ID>${escapeXml(p.sku)}</ITEM_ID>
    <PRODUCTNAME>${escapeXml(p.title)}</PRODUCTNAME>
    <DESCRIPTION>${escapeXml(p.description.slice(0, 5000))}</DESCRIPTION>
    <URL>${escapeXml(p.url)}</URL>
    ${p.image ? `<IMGURL>${escapeXml(p.image)}</IMGURL>` : ''}
    <PRICE_VAT>${p.price}</PRICE_VAT>
    <CATEGORYTEXT>${escapeXml(p.isWheel ? 'Auto-moto | Pneumatiky a kola | Disky' : 'Auto-moto | Pneumatiky a kola | Pneumatiky')}</CATEGORYTEXT>
    ${p.brand ? `<MANUFACTURER>${escapeXml(p.brand)}</MANUFACTURER>` : ''}
    <DELIVERY_DATE>0</DELIVERY_DATE>
    <DELIVERY>
      <DELIVERY_ID>CESKA_POSTA</DELIVERY_ID>
      <DELIVERY_PRICE>${p.shippingPrice}</DELIVERY_PRICE>
      <DELIVERY_PRICE_COD>${p.shippingPrice}</DELIVERY_PRICE_COD>
    </DELIVERY>
    <ITEMGROUP_ID>${escapeXml(p.sku)}</ITEMGROUP_ID>
${params}
  </SHOPITEM>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<SHOP>
${items}
</SHOP>`;
}
