import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ShopProductDetail from '@/components/shop/ShopProductDetail';
import {
  buildShopPageMetadata,
  getOfferSeoDescription,
  getOfferSeoTitle,
  getProductUrl,
  getShopBaseUrl,
} from '@/lib/shop/seo';
import {
  fetchShopOfferById,
  fetchShopOfferImages,
  resolveShopFromRequest,
} from '@/lib/shop/server';
import { getOfferPricingInfo, getOfferSpecsList } from '@/components/shop/offerMeta';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (!id || Number.isNaN(id)) {
    return { title: 'Produkt nenalezen' };
  }

  const [shop, offer] = await Promise.all([
    resolveShopFromRequest(),
    fetchShopOfferById(id),
  ]);

  if (!offer) {
    return {
      title: `Produkt nenalezen | ${shop.shop_name}`,
      robots: { index: false, follow: false },
    };
  }

  const title = getOfferSeoTitle(offer, shop);
  const description = getOfferSeoDescription(offer);
  const images = offer.preview_image ? [offer.preview_image] : [];
  const brand = getOfferSpecsList(offer).find((s) => s.label === 'Značka')?.value;

  const meta = buildShopPageMetadata(shop, {
    title,
    description,
    path: `/produkt/${offer.id}`,
    images,
  });

  return {
    ...meta,
    // Absolute title — do not append "| Shop" twice via layout template
    title: { absolute: title },
    other: {
      ...(meta.other || {}),
      'og:price:amount': String(offer.price),
      'og:price:currency': 'CZK',
      'product:brand': brand || shop.shop_name || '',
      'product:availability': 'in stock',
      'product:condition': 'used',
    },
  };
}

export default async function ShopProductPage({ params }: PageProps) {
  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (!id || Number.isNaN(id)) notFound();

  const [shop, offer] = await Promise.all([
    resolveShopFromRequest(),
    fetchShopOfferById(id),
  ]);

  if (!offer) notFound();

  const images = await fetchShopOfferImages(offer.id);
  const gallery =
    images.length > 0 ? images : offer.preview_image ? [offer.preview_image] : [];

  const specs = getOfferSpecsList(offer);
  const pricing = getOfferPricingInfo(offer);
  const brand = specs.find((s) => s.label === 'Značka')?.value;
  const baseUrl = getShopBaseUrl(shop);
  const productUrl = getProductUrl(shop, offer.id);

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': productUrl,
    name: offer.title,
    description: offer.description || getOfferSeoDescription(offer, 500),
    image: gallery,
    sku: `SHOP-${offer.id}`,
    brand: brand
      ? {
          '@type': 'Brand',
          name: brand,
        }
      : undefined,
    category: 'Automotive > Tires & Wheels',
    offers: {
      '@type': 'Offer',
      url: productUrl,
      price: offer.price,
      priceCurrency: 'CZK',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/UsedCondition',
      seller: {
        '@type': 'AutoPartsStore',
        name: shop.shop_name,
        telephone: shop.phone || undefined,
        url: baseUrl,
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: pricing.shippingPrice.replace(/[^\d]/g, '') || '500',
          currency: 'CZK',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'CZ',
        },
      },
    },
    additionalProperty: specs.map((s) => ({
      '@type': 'PropertyValue',
      name: s.label,
      value: s.value,
    })),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Domů',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Nabídka',
        item: `${baseUrl}/#nabidka`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: offer.title,
        item: productUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ShopProductDetail offer={offer} initialImages={gallery} />
    </>
  );
}
