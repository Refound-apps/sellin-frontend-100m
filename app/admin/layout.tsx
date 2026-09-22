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
  return <div className="relative flex-1">{children}</div>;
}
