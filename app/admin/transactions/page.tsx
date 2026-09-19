import type { Metadata } from 'next';
import TransactionsView from '@/components/TransactionsView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Transakce inzerátů (Offer Details)',
  description: 'Přehled a log transakcí nahrávání a stavů inzerátů na inzertní tržiště (Bazoš, Sbazar, Facebook)',
};

export default function AdminTransactionsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <TransactionsView />
    </main>
  );
}
