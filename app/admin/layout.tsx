import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Administrace Prodejomat.cz',
    default: 'Administrace | Prodejomat.cz',
  },
  description: 'Centrální administrátorské rozhraní systému Prodejomat.cz',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="relative min-h-0 flex-1 lg:pl-60">{children}</div>;
}
