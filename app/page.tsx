import { Suspense } from 'react';
import OffersList from '@/components/OffersList';
import ProdejomatSchema from '@/components/prodejomat/ProdejomatSchema';
import { getRequestHost, getRequestIsTenant } from '@/lib/prodejomat/host';

export default async function Home() {
  const isTenant = await getRequestIsTenant();
  const host = await getRequestHost();

  return (
    <>
      {!isTenant && <ProdejomatSchema host={host} />}
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="py-20 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
              <p className="mt-3 text-xs font-semibold text-slate-500">Načítám nabídky…</p>
            </div>
          }
        >
          <OffersList />
        </Suspense>
      </main>
    </>
  );
}
