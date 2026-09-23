import type { Metadata } from 'next';
import AdminShopsManager from '@/components/AdminShopsManager';

export const metadata: Metadata = {
  title: 'Správa e-shopů uživatelů',
  description: 'Centrální správa všech klientských e-shopů, propojování vlastních domén a přiřazování účtů prodejců.',
};

export default function AdminEshopPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminShopsManager />
    </main>
  );
}
