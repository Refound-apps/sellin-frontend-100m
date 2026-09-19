import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Administrace Sellin.cz',
    default: 'Administrace | Sellin.cz',
  },
  description: 'Centrální administrátorské rozhraní systému Sellin.cz',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="relative flex-1">{children}</div>;
}
