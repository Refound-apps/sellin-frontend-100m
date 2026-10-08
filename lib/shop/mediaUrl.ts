const DEFAULT_R2 = 'https://pub-d4238224a90a49f98bf05b686985171f.r2.dev';

function r2PublicBase(): string {
  return (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || DEFAULT_R2).replace(/\/+$/, '');
}

/**
 * Serve R2 assets via same-origin `/r2/...` rewrite.
 * Direct `*.r2.dev` URLs are often blocked by ad/privacy filters → empty catalog photos.
 */
export function toShopMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/r2/')) return trimmed;

  const base = r2PublicBase();
  if (trimmed.startsWith(`${base}/`)) {
    return `/r2/${trimmed.slice(base.length + 1)}`;
  }

  // Already on r2.dev (different pub host) → proxy path after host
  try {
    const u = new URL(trimmed);
    if (u.hostname.endsWith('.r2.dev')) {
      return `/r2${u.pathname}${u.search}`;
    }
  } catch {
    /* relative path */
  }

  if (
    trimmed.startsWith('/offers/') ||
    trimmed.startsWith('/prod-budi-app-assets/') ||
    trimmed.startsWith('offers/') ||
    trimmed.startsWith('prod-budi-app-assets/')
  ) {
    return `/r2/${trimmed.replace(/^\/+/, '')}`;
  }

  return trimmed;
}

type OfferImages = {
  preview_image?: string | null;
  image2?: string | null;
  image3?: string | null;
  image4?: string | null;
  image5?: string | null;
  image6?: string | null;
  image7?: string | null;
  image8?: string | null;
  image9?: string | null;
  images?: string[] | null;
};

/** Ordered unique gallery URLs for shop UI (proxied when possible). */
export function collectShopOfferImageUrls(offer: OfferImages): string[] {
  const raw: Array<string | null | undefined> = [
    ...(offer.images || []),
    offer.preview_image,
    offer.image2,
    offer.image3,
    offer.image4,
    offer.image5,
    offer.image6,
    offer.image7,
    offer.image8,
    offer.image9,
  ];
  const out: string[] = [];
  for (const item of raw) {
    const proxied = toShopMediaUrl(item);
    if (proxied && !out.includes(proxied)) out.push(proxied);
  }
  return out;
}
