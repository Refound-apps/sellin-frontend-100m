import { Suspense } from 'react';
import OffersList from '@/components/OffersList';
import ProdejomatLanding from '@/components/prodejomat/ProdejomatLanding';
import ProdejomatSchema from '@/components/prodejomat/ProdejomatSchema';
import { getRequestHost, getRequestIsTenant } from '@/lib/prodejomat/host';
import { createClient } from '@/lib/supabase/server';

interface HomePageProps {
  searchParams?: Promise<{ landing?: string; preview?: string }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const isTenant = await getRequestIsTenant();
  const host = await getRequestHost();
  const resolvedParams = searchParams ? await searchParams : {};
  const forceLanding =
    resolvedParams?.landing === '1' ||
    resolvedParams?.landing === 'true' ||
    resolvedParams?.preview === 'landing';

  // Server-side zjištění přihlášeného uživatele
  let user: { email?: string; id?: string } | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser) {
      user = { email: authUser.email, id: authUser.id };
    }
  } catch (err) {
    console.error('Home: error retrieving session', err);
  }

  // Pokud uživatel není přihlášen nebo je explicitně vyžádán landing:
  if (!user || forceLanding) {
    return (
      <>
        {!isTenant && <ProdejomatSchema host={host} />}
        <ProdejomatLanding user={user} />
      </>
    );
  }

  // Přihlášený prodejce -> centrální správa nabídek / sklad
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
