import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import OffersList from '@/components/OffersList';
import ProdejomatLanding from '@/components/prodejomat/ProdejomatLanding';
import ProdejomatSchema from '@/components/prodejomat/ProdejomatSchema';
import { getRequestHost, getRequestIsTenant } from '@/lib/prodejomat/host';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  // Server-side zjištění přihlášeného uživatele a jeho role
  let user: { email?: string; id?: string } | null = null;
  let role: 'admin' | 'seller' = 'seller';

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      user = { email: authUser.email, id: authUser.id };

      const { data: credential } = await supabase
        .from('credential_pg')
        .select('role')
        .or(`user_id.eq.${authUser.id},email.ilike.${authUser.email}`)
        .limit(1)
        .maybeSingle();

      if (credential?.role === 'admin') {
        role = 'admin';
      }
    }
  } catch (err) {
    console.error('Home: error retrieving session', err);
  }

  // Administrátor jde automaticky rovnou do admin přehledu inzerátů
  if (user && role === 'admin' && !forceLanding) {
    redirect('/admin/offers');
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

  // Přihlášený prodejce -> jde rovnou do své appky (centrální správa nabídek / sklad)
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
