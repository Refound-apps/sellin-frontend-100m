import type { Metadata } from 'next';
import AccountsView from '@/components/AccountsView';

export const metadata: Metadata = {
  title: 'Napojení účtů a prodejních kanálů | Prodejomat.cz',
  description:
    'Integrace a synchronizace prodejních kanálů – Bazoš, Sbazar, vlastní e-shop, Shoptet, Shopify, sociální sítě a cenové srovnávače.',
};

export default function AccountsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AccountsView />
    </main>
  );
}
