'use client';

import { useMemo, useState } from 'react';
import { getShopPublicUrls } from '@/lib/shop/seo';

type ShopSeoFeedsPanelProps = {
  shopName?: string;
  slug?: string;
  customDomain?: string | null;
  tagline?: string | null;
  addressCity?: string | null;
  compact?: boolean;
};

type FeedRow = {
  label: string;
  hint: string;
  url: string;
};

export default function ShopSeoFeedsPanel({
  shopName = 'E-shop',
  slug = 'shop',
  customDomain = null,
  tagline = null,
  addressCity = null,
  compact = false,
}: ShopSeoFeedsPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const urls = useMemo(
    () =>
      getShopPublicUrls({
        shop_name: shopName,
        slug,
        custom_domain: customDomain,
        tagline,
        address_city: addressCity,
        address_line: null,
        phone: null,
        email: null,
        logo_url: null,
      }),
    [shopName, slug, customDomain, tagline, addressCity]
  );

  const rows: FeedRow[] = [
    {
      label: 'Sitemap (Google / Seznam)',
      hint: 'Search Console → Sitemaps',
      url: urls.sitemapUrl,
    },
    {
      label: 'Google Merchant feed',
      hint: 'Merchant Center → Produkty → Feedy',
      url: urls.googleFeedUrl,
    },
    {
      label: 'Zboží.cz feed',
      hint: 'Zboží admin → Import XML',
      url: urls.zboziFeedUrl,
    },
    {
      label: 'Heureka feed',
      hint: 'Heureka Napojení → XML feed',
      url: urls.heurekaFeedUrl,
    },
  ];

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={
        compact
          ? 'space-y-3'
          : 'rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3'
      }
    >
      <div>
        <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">
          SEO &amp; produktové feedy
        </h5>
        <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
          Veřejná adresa e-shopu a XML feedy pro Google, Seznam Zboží a Heureku. Po nasazení
          domény vložte URL do příslušné konzole. Položky odkazují na{' '}
          <span className="font-mono text-slate-700">/produkt/&#123;id&#125;</span>.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Veřejná URL e-shopu
        </div>
        <a
          href={urls.baseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 block truncate text-xs font-mono font-semibold text-emerald-700 hover:underline"
        >
          {urls.baseUrl}
        </a>
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900">{row.label}</div>
                <div className="text-[10px] text-slate-400">{row.hint}</div>
                <div className="mt-1 truncate font-mono text-[11px] text-slate-600">{row.url}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => copy(row.url)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                >
                  {copied === row.url ? '✓' : 'Copy'}
                </button>
                <a
                  href={row.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50"
                >
                  Otevřít
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
