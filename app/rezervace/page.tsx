import type { Metadata } from 'next';
import ReservationsView from '@/components/ReservationsView';

export const metadata: Metadata = {
  title: 'Rezervace | Prodejomat.cz',
  description: 'Seznam rezervací produktů z e-shopu — dohledání a odbavení.',
};

export default function RezervacePage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ReservationsView />
    </main>
  );
}
