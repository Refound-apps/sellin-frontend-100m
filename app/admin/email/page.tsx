import type { Metadata } from 'next';
import TestEmailForm from '@/components/TestEmailForm';

export const metadata: Metadata = {
  title: 'Test e-mailu (Resend)',
  description: 'Odeslání testovacího e-mailu přes Resend',
};

export default function AdminEmailPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-xl">
        <h1 className="text-2xl font-black tracking-tight text-slate-950">Test e-mailu</h1>
        <p className="mt-2 text-sm text-slate-600">
          Pošle jeden e-mail přes Resend z adresy <code>sellin@sellin.cz</code>.
        </p>
      </div>
      <TestEmailForm />
    </main>
  );
}
