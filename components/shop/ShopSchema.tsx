'use client';

import { useShop } from './ShopContext';
import { ShopOffer } from '@/lib/types';
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
    region,
    hours,
    shop,
    shippingPrice,
  } = useShop();

  const domain = shop.custom_domain
    ? `https://${shop.custom_domain}`
    : `https://${shop.slug || 'shop'}.prodejomat.cz`;

  // 1. LocalBusiness / AutoPartsStore Schema
  const storeSchema = {
    '@context': 'https://schema.org',
    '@type': 'AutoPartsStore',
    '@id': `${domain}/#store`,
    name: shopName || 'Pneu & ALU Bazar',
    description:
      tagline ||
      'Specializovaný prodej prověřených pneumatik, ALU disků a kompletních sad kol se zárukou a možností přezutí.',
    url: domain,
    telephone: phone || undefined,
    email: email || undefined,
    priceRange: '$$',
    currenciesAccepted: 'CZK',
    paymentAccepted: 'Hotově, Převodem, Dobírka',
    address: {
      '@type': 'PostalAddress',
      streetAddress: addressLine || 'Křimická 134',
      addressLocality: addressCity || 'Plzeň',
      addressRegion: region || 'Plzeňský kraj',
      addressCountry: 'CZ',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '17:00',
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

  // 2. BreadcrumbList Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Domů',
        item: domain,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Katalog pneu a disků',
        item: `${domain}/shop#nabidka`,
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
                '@id': `${domain}/shop?offer=${offer.id}`,
                name: offer.title,
                description: offer.description || offer.title,
                image: offer.preview_image ? [offer.preview_image] : undefined,
                sku: `TIRE-${offer.id}`,
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
