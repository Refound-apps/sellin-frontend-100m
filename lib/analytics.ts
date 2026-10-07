type TrackProps = Record<string, string | number | boolean | null | undefined>;

/**
 * Lightweight conversion tracking for GTM funnels.
 * Works with window.dataLayer (GTM) when present; always logs in development.
 */
export function trackEvent(event: string, props: TrackProps = {}) {
  const payload = {
    event,
    ...props,
    ts: Date.now(),
  };

  try {
    if (typeof window !== 'undefined') {
      const w = window as Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push(payload);
      if (typeof w.gtag === 'function') {
        w.gtag('event', event, props);
      }
    }
  } catch {
    /* ignore */
  }

  if (process.env.NODE_ENV === 'development') {
    console.info('[track]', event, props);
  }
}
