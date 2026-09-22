import type { Metadata } from 'next';
import AutomationsView from '@/components/AutomationsView';

export const metadata: Metadata = {
  title: 'Automatizace & Plánované úlohy (Cron)',
  description: 'Centrální správa automatizací a pravidelných cron jobů pro obnovu inzerátů na Bazoš, Sbazar a externí portály.',
};

export default function AutomationsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AutomationsView />
    </main>
  );
}
