import type { Metadata } from 'next';
import AccountsView from '@/components/AccountsView';

export const metadata: Metadata = {
  title: 'Napojení účtů | Sellin.cz',
  description: 'Správa napojených inzertních a prodejních účtů (Bazoš, Sbazar, Facebook, E-shop)',
};

export default function AccountsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AccountsView />
    </main>
  );
}
