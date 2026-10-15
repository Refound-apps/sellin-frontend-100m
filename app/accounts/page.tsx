import { Suspense } from 'react';
import type { Metadata } from 'next';
import AccountsView from '@/components/AccountsView';
import { buildProdejomatMetadata } from '@/lib/prodejomat/seo';

export const metadata: Metadata = buildProdejomatMetadata({
  path: '/accounts',
  title: 'Napojení účtů a prodejních kanálů',
  description:
    'Integrace a synchronizace prodejních kanálů – Bazoš, Sbazar, vlastní e-shop, Shoptet, Shopify, sociální sítě a cenové srovnávače.',
  noIndex: true,
});

export default function AccountsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="py-20 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
            <p className="mt-3 text-xs font-semibold text-slate-500">Načítám kanály…</p>
          </div>
        }
      >
        <AccountsView />
      </Suspense>
    </main>
  );
}
