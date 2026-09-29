import type { Metadata } from 'next';
import ForceRenewView from '@/components/ForceRenewView';

export const metadata: Metadata = {
  title: 'Force renew inzerátů',
  description: 'Manuální force obnova inzerátů na Bazoš.cz / Bazoš.sk podle e-mailu a limitu.',
};

export default function AdminForceRenewPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ForceRenewView />
    </main>
  );
}
