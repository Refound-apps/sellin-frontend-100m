'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Counts one visit per browser session for prodejomat.cz (sessionStorage).
 * Fire-and-forget — runs asynchronously, ignores admin and api routes.
 */
export default function ProdejomatVisitTracker() {
  const pathname = usePathname();
  const sentRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sentRef.current) return;

    // Do not count internal admin or api navigations
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return;
    }

    const key = 'prodejomat_visit_session';
    try {
      if (sessionStorage.getItem(key)) {
        sentRef.current = true;
        return;
      }
      sessionStorage.setItem(key, '1');
    } catch {
      // storage disabled / private browsing fallback
    }

    sentRef.current = true;
    void fetch('/api/prodejomat/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {
      // ignore network errors
    });
  }, [pathname]);

  return null;
}
