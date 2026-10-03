'use client';

import { useShop } from './ShopContext';
import { ShopOffer } from '@/lib/types';
import { getShopBaseUrl, getShopHomeMetadata } from '@/lib/shop/seo';
import { getOfferPricingInfo, getOfferSpecsList } from './offerMeta';

interface ShopSchemaProps {
  offers?: ShopOffer[];
}

export default function ShopSchema({ offers = [] }: ShopSchemaProps) {
  const {
    shopName,
    tagline,
    phone,
    email,
    addressLine,
    addressCity,
    shop,
  } = useShop();

  const domain = getShopBaseUrl(shop);
  const homeMeta = getShopHomeMetadata(shop);

  // 1. LocalBusiness / AutoPartsStore Schema
  const storeSchema = {
    '@context': 'https://schema.org',
    '@type': 'AutoPartsStore',
    '@id': `${domain}/#store`,
    name: shopName || 'Pneu & ALU Bazar',
    alternateName: ['Pneu Plzeň', 'ALU disky Plzeň', 'Pneuservis Plzeň'],
    description:
      homeMeta.description ||
      tagline ||
      'Specializovaný prodej prověřených pneumatik, ALU disků a kompletních sad kol se zárukou a možností přezutí.',
    url: `${domain}/`,
    telephone: phone || undefined,
    email: email || undefined,
    image: shop.logo_url || undefined,
    priceRange: '$$',
    currenciesAccepted: 'CZK',
    paymentAccepted: 'Hotově, Převodem, Dobírka',
    areaServed: {
      '@type': 'AdministrativeArea',
      name: addressCity || 'Plzeň',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: addressLine || 'Úslavská 32',
      addressLocality: addressCity || 'Plzeň',
      addressRegion: addressCity ? undefined : 'Plzeňský kraj',
      addressCountry: 'CZ',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '10:00',
        closes: '15:00',
      },
    ],
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 14,
      returnMethod: 'https://schema.org/ReturnInStore',
      returnFees: 'https://schema.org/FreeReturn',
    },
    makesOffer: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Přezutí a montáž pneumatik',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Vyvážení a kontrola házivosti kol',
        },
      },
    ],
  };

  // 2. WebSite + SearchAction (helps Google sitelinks search box)
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${domain}/#website`,
    name: shopName,
    url: `${domain}/`,
    inLanguage: 'cs-CZ',
    publisher: { '@id': `${domain}/#store` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${domain}/?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  // 3. BreadcrumbList Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Domů',
        item: `${domain}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Katalog pneu a disků',
        item: `${domain}/#nabidka`,
      },
    ],
  };

  // 3. ItemList Schema for top offers (enables AI shopping agents & Google to index inventory)
  const topOffers = offers.slice(0, 30);
  const itemListSchema =
    topOffers.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `Skladová nabídka kol a pneu - ${shopName}`,
          numberOfItems: offers.length,
          itemListElement: topOffers.map((offer, index) => {
            const pricing = getOfferPricingInfo(offer);
            const specs = getOfferSpecsList(offer);
            const sizeSpec = specs.find((s) => s.label === 'Rozměr')?.value;
            const seasonSpec = specs.find((s) => s.label === 'Sezóna')?.value;
            const brandSpec = specs.find((s) => s.label === 'Značka')?.value;
            const treadSpec = specs.find((s) => s.label === 'Vzorek')?.value;

            return {
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'Product',
                '@id': `${domain}/produkt/${offer.id}`,
                url: `${domain}/produkt/${offer.id}`,
                name: offer.title,
                description: offer.description || offer.title,
                image: offer.preview_image ? [offer.preview_image] : undefined,
                sku: `SHOP-${offer.id}`,
                category: 'Automotive > Tires & Wheels',
                brand: brandSpec
                  ? {
                      '@type': 'Brand',
                      name: brandSpec,
                    }
                  : undefined,
                offers: {
                  '@type': 'Offer',
                  price: offer.price,
                  priceCurrency: 'CZK',
                  priceSpecification: {
                    '@type': 'UnitPriceSpecification',
                    price: offer.price,
                    priceCurrency: 'CZK',
                    unitText: pricing.isPerPiece ? 'CENA_ZA_KUS' : 'CENA_ZA_SADU',
                  },
                  availability: 'https://schema.org/InStock',
                  itemCondition: 'https://schema.org/UsedCondition',
                  seller: {
                    '@type': 'AutoPartsStore',
                    name: shopName,
                    telephone: phone,
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
                additionalProperty: [
                  sizeSpec ? { '@type': 'PropertyValue', name: 'Rozměr', value: sizeSpec } : null,
                  seasonSpec ? { '@type': 'PropertyValue', name: 'Sezóna', value: seasonSpec } : null,
                  treadSpec ? { '@type': 'PropertyValue', name: 'Vzorek', value: treadSpec } : null,
                ].filter(Boolean),
              },
            };
          }),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}
    </>
  );
}
