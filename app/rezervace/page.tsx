import type { Metadata } from 'next';
import ReservationsView from '@/components/ReservationsView';
import { buildProdejomatMetadata } from '@/lib/prodejomat/seo';

export const metadata: Metadata = buildProdejomatMetadata({
  path: '/rezervace',
  title: 'Rezervace',
  description: 'Seznam rezervací produktů z e-shopu — dohledání a odbavení.',
  noIndex: true,
});

export default function RezervacePage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ReservationsView />
    </main>
  );
}
