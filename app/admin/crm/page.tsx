import type { Metadata } from 'next';
import AdminCrmView from '@/components/admin/crm/AdminCrmView';

export const metadata: Metadata = {
  title: 'Sales CRM',
  description: 'Sales pipeline a CRM Prodejomatu — leady z Bazoše, Firem.cz a e-shopů.',
};

export default function AdminCrmPage() {
  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      <AdminCrmView />
    </main>
  );
}
