import type { Metadata } from 'next';
import ProxiesView from '@/components/ProxiesView';

export const metadata: Metadata = {
  title: 'Proxy IP (Bright Data)',
  description: 'Správa Bright Data proxy IP a přiřazení k Bazoš / Sbazar účtům',
};

export default function AdminProxiesPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ProxiesView />
    </main>
  );
}
