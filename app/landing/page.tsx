import type { Metadata } from 'next';
import ProdejomatLanding from '@/components/prodejomat/ProdejomatLanding';
import ProdejomatSchema from '@/components/prodejomat/ProdejomatSchema';
import { getRequestHost } from '@/lib/prodejomat/host';
import { buildProdejomatMetadata } from '@/lib/prodejomat/seo';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const host = await getRequestHost();
  return buildProdejomatMetadata({
    host,
    path: '/landing',
    title: 'Automat na inzerci, centrální sklad a vlastní e-shop',
    description:
      'Prodejomat – jeden sklad pro Bazoš, Sbazar i vlastní e-shop. Automatická obnova inzerátů a synchronizace pro české prodejce.',
  });
}

export default async function LandingPage() {
  const host = await getRequestHost();

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
  } catch {
    // fallback
  }

  return (
    <>
      <ProdejomatSchema host={host} />
      <ProdejomatLanding user={user} role={role} />
    </>
  );
}
