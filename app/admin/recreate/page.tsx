import type { Metadata } from 'next';
import RecreateView from '@/components/RecreateView';

export const metadata: Metadata = {
  title: 'Recreate nabídek',
  description: 'Manuální recreate nabídek na Bazoš / Sbazar podle e-mailu, offsetu a limitu.',
};

export default function AdminRecreatePage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <RecreateView />
    </main>
  );
}
