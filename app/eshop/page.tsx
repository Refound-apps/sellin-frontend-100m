import type { Metadata } from 'next';
import ShopManager from '@/components/ShopManager';

export const metadata: Metadata = {
  title: 'Správa e-shopu | Sellin.cz',
  description: 'Správa a konfigurace vašeho klientského e-shopu, propojení vlastní domény a výběr napojených účtů.',
};

export default function EshopPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ShopManager />
    </main>
  );
}
