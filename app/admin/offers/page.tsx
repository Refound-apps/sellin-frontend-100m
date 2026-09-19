import { Suspense } from 'react';
import type { Metadata } from 'next';
import OffersList from '@/components/OffersList';

export const metadata: Metadata = {
  title: 'Nabídka (všechny inzeráty)',
  description: 'Centrální přehled všech inzerátů od všech prodejců na inzertních portálech',
};

export default function AdminOffersPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="py-20 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
            <p className="mt-3 text-xs font-semibold text-slate-500">Načítám všechny inzeráty…</p>
          </div>
        }
      >
        <OffersList mode="admin" />
      </Suspense>
    </main>
  );
}
