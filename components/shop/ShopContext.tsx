'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShopConfigData } from '@/lib/types';
import { resolveShopConfig } from '@/lib/api';
import { shopInventoryEmails } from '@/lib/shop/resolveShop';

/** Neutral empty shop — never Duplux branding as global default. */
export const EMPTY_SHOP: ShopConfigData = {
  id: '',
  user_id: null,
  owner_email: '',
  slug: '',
  custom_domain: null,
  is_active: false,
  linked_credential_emails: [],
  shop_name: 'E-shop',
  tagline: null,
  phone: null,
  phone_href: null,
  email: null,
  owner_name: null,
  ico: null,
  address_line: null,
  address_city: null,
  region: null,
  opening_hours: null,
  shipping_price: null,
  shipping_price_tires: null,
  shipping_price_rims: null,
  map_link: null,
  google_maps_link: null,
  caravan_url: null,
  template_id: 'pneu-classic',
  primary_color: '#0f172a',
  logo_url: null,
};

/** @deprecated use EMPTY_SHOP — kept alias so old imports don't crash */
export const FALLBACK_SHOP = EMPTY_SHOP;

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
  shop: EMPTY_SHOP,
  loading: false,
  shopName: EMPTY_SHOP.shop_name,
  tagline: '',
  phone: '',
  phoneHref: '',
  email: '',
  ownerName: '',
  ico: '',
  addressLine: '',
  addressCity: '',
  region: '',
  hours: '',
  caravanUrl: '',
  shippingPrice: '',
  shippingPriceTires: '',
  shippingPriceRims: '',
  mapLink: '',
  googleMapsLink: '',
  linkedEmails: [],
  templateId: EMPTY_SHOP.template_id,
});

export function ShopProvider({
  children,
  initialShop,
}: {
  children: React.ReactNode;
  initialShop?: ShopConfigData | null;
}) {
  const [shop, setShop] = useState<ShopConfigData>(initialShop || EMPTY_SHOP);
  const [loading, setLoading] = useState<boolean>(!initialShop);
  const searchParams = useSearchParams();

  const shopQueryKey = useMemo(() => {
    return (
      searchParams.get('shop') ||
      searchParams.get('slug') ||
      searchParams.get('domain') ||
      ''
    )
      .trim()
      .toLowerCase();
  }, [searchParams]);

  const loadedShopRef = useRef<string | null>(null);

  useEffect(() => {
    if (loadedShopRef.current === shopQueryKey) {
      return;
    }
    loadedShopRef.current = shopQueryKey;

    let isMounted = true;
    async function loadShop() {
      try {
        // Without slug/domain, resolve uses host header (tenant) via API —
        // on main app host with no query → 404 / null (no Duplux steal).
        const resolved = await resolveShopConfig(shopQueryKey || undefined);
        if (isMounted && resolved) {
          setShop((prev) => {
            if (prev && resolved && prev.id === resolved.id && prev.updated_at === resolved.updated_at) {
              return prev;
            }
            return resolved;
          });
        } else if (isMounted && !resolved && !initialShop) {
          setShop(EMPTY_SHOP);
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
  }, [shopQueryKey, initialShop]);

  const linkedEmailsKey = useMemo(() => {
    return shopInventoryEmails(shop).slice().sort().join(',');
  }, [shop]);

  const stableLinkedEmails = useMemo(() => {
    return shopInventoryEmails(shop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedEmailsKey]);

  const value = useMemo<ShopContextType>(() => {
    const s = shop || EMPTY_SHOP;
    const cleanPhone = (s.phone || '').trim();
    const phoneHref = s.phone_href
      ? s.phone_href
      : cleanPhone
        ? cleanPhone.startsWith('+')
          ? cleanPhone.replace(/\s+/g, '')
          : `+420${cleanPhone.replace(/\s+/g, '')}`
        : '';

    return {
      shop: s,
      loading,
      shopName: s.shop_name || 'E-shop',
      tagline: s.tagline || '',
      phone: cleanPhone,
      phoneHref,
      email: s.email || '',
      ownerName: s.owner_name || '',
      ico: s.ico || '',
      addressLine: s.address_line || '',
      addressCity: s.address_city || '',
      region: s.region || s.address_city || s.address_line || '',
      hours: s.opening_hours || '',
      caravanUrl: s.caravan_url || '',
      shippingPrice: s.shipping_price || '',
      shippingPriceTires: s.shipping_price_tires || '',
      shippingPriceRims: s.shipping_price_rims || '',
      mapLink: s.map_link || '',
      googleMapsLink: s.google_maps_link || '',
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
