'use client';

import { useEffect, useRef } from 'react';
import { useShop } from './ShopContext';

/**
 * Counts one visit per browser session per shop (sessionStorage).
 * Fire-and-forget — never blocks UI.
 */
export default function ShopVisitTracker() {
  const { shop, loading } = useShop();
  const sentRef = useRef(false);

  useEffect(() => {
    if (loading || !shop?.id || sentRef.current) return;
    if (typeof window === 'undefined') return;

    const key = `shop_visit_session:${shop.id}`;
    try {
      if (sessionStorage.getItem(key)) {
        sentRef.current = true;
        return;
      }
      sessionStorage.setItem(key, '1');
    } catch {
      // private mode / blocked storage — still count once this mount
    }

    sentRef.current = true;
    void fetch('/api/shop/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop_id: shop.id }),
      keepalive: true,
    }).catch(() => {
      // ignore network errors
    });
  }, [shop?.id, loading]);

  return null;
}
