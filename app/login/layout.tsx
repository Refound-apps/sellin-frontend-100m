import type { Metadata } from 'next';
import { getRequestHost } from '@/lib/prodejomat/host';
import { buildProdejomatMetadata } from '@/lib/prodejomat/seo';

export async function generateMetadata(): Promise<Metadata> {
  const host = await getRequestHost();
  return buildProdejomatMetadata({
    host,
    path: '/login',
    title: 'Přihlášení a registrace',
    description:
      'Přihlaste se do Prodejomatu – správa inzerce na Bazoš, Sbazar, centrální sklad a vlastní e-shop pro prodejce.',
  });
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
