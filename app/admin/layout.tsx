import type { Metadata } from 'next';
import { buildProdejomatMetadata } from '@/lib/prodejomat/seo';

export const metadata: Metadata = {
  ...buildProdejomatMetadata({
    path: '/admin',
    title: 'Administrace',
    description: 'Centrální administrátorské rozhraní systému Prodejomat.cz',
    noIndex: true,
  }),
  title: {
    template: '%s | Administrace Prodejomat.cz',
    default: 'Administrace | Prodejomat.cz',
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="relative min-h-0 flex-1 lg:pl-60">{children}</div>;
}
