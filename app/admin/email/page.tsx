import type { Metadata } from 'next';
import SentEmailsView from '@/components/SentEmailsView';

export const metadata: Metadata = {
  title: 'E-maily (Resend)',
  description: 'Monitoring odeslaných e-mailů přes Resend a test odeslání',
};

export default function AdminEmailPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SentEmailsView />
    </main>
  );
}
