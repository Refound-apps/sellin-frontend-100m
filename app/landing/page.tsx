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

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      user = { email: authUser.email, id: authUser.id };
    }
  } catch {
    // fallback
  }

  return (
    <>
      <ProdejomatSchema host={host} />
      <ProdejomatLanding user={user} />
    </>
  );
}
