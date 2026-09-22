'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShopConfigData } from '@/lib/types';
import { resolveShopConfig } from '@/lib/api';
import {
  SHOP_NAME as DEFAULT_NAME,
  SHOP_TAGLINE as DEFAULT_TAGLINE,
  SHOP_PHONE as DEFAULT_PHONE,
  SHOP_PHONE_HREF as DEFAULT_PHONE_HREF,
  SHOP_EMAIL as DEFAULT_EMAIL,
  SHOP_ADDRESS_LINE as DEFAULT_ADDRESS_LINE,
  SHOP_ADDRESS_CITY as DEFAULT_ADDRESS_CITY,
  SHOP_REGION as DEFAULT_REGION,
  SHOP_HOURS as DEFAULT_HOURS,
  SHOP_OWNER as DEFAULT_OWNER,
  SHOP_ICO as DEFAULT_ICO,
  SHOP_CARAVAN_URL as DEFAULT_CARAVAN_URL,
  SHOP_SHIPPING_PRICE as DEFAULT_SHIPPING_PRICE,
  SHOP_SHIPPING_PRICE_TIRES as DEFAULT_SHIPPING_TIRES,
  SHOP_SHIPPING_PRICE_RIMS as DEFAULT_SHIPPING_RIMS,
  SHOP_MAP_LINK as DEFAULT_MAP_LINK,
  SHOP_GOOGLE_MAPS_LINK as DEFAULT_GOOGLE_MAPS_LINK,
} from './shopConfig';

export const FALLBACK_SHOP: ShopConfigData = {
  id: 'c335f44d-50a7-4898-ab7a-062ef1718756',
  user_id: null,
  owner_email: 'duplux@seznam.cz',
  slug: 'alubazar-plzen',
  custom_domain: 'alubazarplzen.cz',
  is_active: true,
  linked_credential_emails: [
    'diskyplzen@seznam.cz',
    'diskyapneu@seznam.cz',
    'diskyapneuplzen2@seznam.cz',
    'duplux2@seznam.cz',
    'duplux3@seznam.cz',
    'duplux@centrum.cz',
    'duplux@seznam.cz',
    'kusovkyfranta@seznam.cz',
    'kusovypneu@seznam.cz',
    'pneu1122@seznam.cz',
    'pneuadiskyplzen@seznam.cz',
    'pneumatikyplzen@seznam.cz',
    'pneuplzen5@seznam.cz',
    'vasekplzen2211@seznam.cz',
  ],
  shop_name: DEFAULT_NAME,
  tagline: DEFAULT_TAGLINE,
  phone: DEFAULT_PHONE,
  phone_href: DEFAULT_PHONE_HREF,
  email: DEFAULT_EMAIL,
  owner_name: DEFAULT_OWNER,
  ico: DEFAULT_ICO,
  address_line: DEFAULT_ADDRESS_LINE,
  address_city: DEFAULT_ADDRESS_CITY,
  region: DEFAULT_REGION,
  opening_hours: DEFAULT_HOURS,
  shipping_price: DEFAULT_SHIPPING_PRICE,
  shipping_price_tires: DEFAULT_SHIPPING_TIRES,
  shipping_price_rims: DEFAULT_SHIPPING_RIMS,
  map_link: DEFAULT_MAP_LINK,
  google_maps_link: DEFAULT_GOOGLE_MAPS_LINK,
  caravan_url: DEFAULT_CARAVAN_URL,
  template_id: 'pneu-classic',
  primary_color: '#0f172a',
  logo_url: null,
};

interface ShopContextType {
  shop: ShopConfigData;
  loading: boolean;
  shopName: string;
  tagline: string;
  phone: string;
  phoneHref: string;
  email: string;
  ownerName: string;
  ico: string;
  addressLine: string;
  addressCity: string;
  region: string;
  hours: string;
  caravanUrl: string;
  shippingPrice: string;
  shippingPriceTires: string;
  shippingPriceRims: string;
  mapLink: string;
  googleMapsLink: string;
  linkedEmails: string[];
  templateId: string;
}

const ShopContext = createContext<ShopContextType>({
  shop: FALLBACK_SHOP,
  loading: false,
  shopName: FALLBACK_SHOP.shop_name,
  tagline: FALLBACK_SHOP.tagline || '',
  phone: FALLBACK_SHOP.phone || '',
  phoneHref: FALLBACK_SHOP.phone_href || '',
  email: FALLBACK_SHOP.email || '',
  ownerName: FALLBACK_SHOP.owner_name || '',
  ico: FALLBACK_SHOP.ico || '',
  addressLine: FALLBACK_SHOP.address_line || '',
  addressCity: FALLBACK_SHOP.address_city || '',
  region: FALLBACK_SHOP.region || '',
  hours: FALLBACK_SHOP.opening_hours || '',
  caravanUrl: FALLBACK_SHOP.caravan_url || '',
  shippingPrice: FALLBACK_SHOP.shipping_price || '',
  shippingPriceTires: FALLBACK_SHOP.shipping_price_tires || '',
  shippingPriceRims: FALLBACK_SHOP.shipping_price_rims || '',
  mapLink: FALLBACK_SHOP.map_link || '',
  googleMapsLink: FALLBACK_SHOP.google_maps_link || '',
  linkedEmails: FALLBACK_SHOP.linked_credential_emails,
  templateId: FALLBACK_SHOP.template_id,
});

export function ShopProvider({
  children,
  initialShop,
}: {
  children: React.ReactNode;
  initialShop?: ShopConfigData | null;
}) {
  const [shop, setShop] = useState<ShopConfigData>(initialShop || FALLBACK_SHOP);
  const [loading, setLoading] = useState<boolean>(!initialShop);
  const searchParams = useSearchParams();

  // Extract ONLY shop-identity query parameters (shop, slug, domain)
  // so unrelated query changes (like ?offer=ID or filters) never cause shop reload
  const shopQueryKey = useMemo(() => {
    return (
      searchParams.get('shop') ||
      searchParams.get('slug') ||
      searchParams.get('domain') ||
      ''
    ).trim().toLowerCase();
  }, [searchParams]);

  const loadedShopRef = useRef<string | null>(null);

  useEffect(() => {
    // If this shop query key has already been resolved or loaded, do not re-fetch
    if (loadedShopRef.current === shopQueryKey) {
      return;
    }
    loadedShopRef.current = shopQueryKey;

    let isMounted = true;
    async function loadShop() {
      try {
        const resolved = await resolveShopConfig(shopQueryKey || undefined);
        if (isMounted && resolved) {
          setShop((prev) => {
            if (prev && resolved && prev.id === resolved.id && prev.updated_at === resolved.updated_at) {
              return prev;
            }
            return resolved;
          });
        }
      } catch (err) {
        console.error('Failed to load shop in provider:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadShop();

    return () => {
      isMounted = false;
    };
  }, [shopQueryKey]);

  // Memoize linkedEmails with a serialized string key so reference identity remains strictly stable
  const linkedEmailsKey = useMemo(() => {
    const list =
      shop?.linked_credential_emails && shop.linked_credential_emails.length > 0
        ? shop.linked_credential_emails
        : FALLBACK_SHOP.linked_credential_emails;
    return list.slice().sort().join(',');
  }, [shop?.linked_credential_emails]);

  const stableLinkedEmails = useMemo(() => {
    return shop?.linked_credential_emails && shop.linked_credential_emails.length > 0
      ? shop.linked_credential_emails
      : FALLBACK_SHOP.linked_credential_emails;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedEmailsKey]);

  const value = useMemo<ShopContextType>(() => {
    const s = shop || FALLBACK_SHOP;
    return {
      shop: s,
      loading,
      shopName: s.shop_name || DEFAULT_NAME,
      tagline: s.tagline || DEFAULT_TAGLINE,
      phone: s.phone || DEFAULT_PHONE,
      phoneHref: s.phone_href || (s.phone ? `+420${s.phone.replace(/\s+/g, '')}` : DEFAULT_PHONE_HREF),
      email: s.email || DEFAULT_EMAIL,
      ownerName: s.owner_name || DEFAULT_OWNER,
      ico: s.ico || DEFAULT_ICO,
      addressLine: s.address_line || DEFAULT_ADDRESS_LINE,
      addressCity: s.address_city || DEFAULT_ADDRESS_CITY,
      region: s.region || DEFAULT_REGION,
      hours: s.opening_hours || DEFAULT_HOURS,
      caravanUrl: s.caravan_url || DEFAULT_CARAVAN_URL,
      shippingPrice: s.shipping_price || DEFAULT_SHIPPING_PRICE,
      shippingPriceTires: s.shipping_price_tires || DEFAULT_SHIPPING_TIRES,
      shippingPriceRims: s.shipping_price_rims || DEFAULT_SHIPPING_RIMS,
      mapLink: s.map_link || DEFAULT_MAP_LINK,
      googleMapsLink: s.google_maps_link || DEFAULT_GOOGLE_MAPS_LINK,
      linkedEmails: stableLinkedEmails,
      templateId: s.template_id || 'pneu-classic',
    };
  }, [shop, loading, stableLinkedEmails]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}
