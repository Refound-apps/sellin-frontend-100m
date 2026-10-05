import type { Metadata } from 'next';
import AdminErrorsView from '@/components/AdminErrorsView';

export const metadata: Metadata = {
  title: 'Scraping errors',
  description: 'Přehled chyb scrapingu, VPS error screenshotů, nedokončených úloh a chybějících cookies.',
};

export default function AdminErrorsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminErrorsView />
    </main>
  );
}
