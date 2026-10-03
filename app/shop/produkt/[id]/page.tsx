import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ShopProductDetail from '@/components/shop/ShopProductDetail';
import {
  getOfferSeoDescription,
  getProductUrl,
  getShopBaseUrl,
  getShopHomeMetadata,
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
    };
  }

  const homeMeta = getShopHomeMetadata(shop);
  const description = getOfferSeoDescription(offer);
  const url = getProductUrl(shop, offer.id);
  const images = offer.preview_image ? [offer.preview_image] : [];

  return {
    title: `${offer.title} | ${shop.shop_name}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${offer.title} | ${shop.shop_name}`,
      description,
      url,
      siteName: shop.shop_name,
      locale: 'cs_CZ',
      type: 'website',
      images: images.map((src) => ({ url: src })),
    },
    twitter: {
      card: 'summary_large_image',
      title: offer.title,
      description,
      images,
    },
    other: {
      'og:price:amount': String(offer.price),
      'og:price:currency': 'CZK',
      'product:brand': homeMeta.title,
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
