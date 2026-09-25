'use client';

import { FormEvent, useState } from 'react';

export default function TestEmailForm() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('Sellin – test Resend');
  const [message, setMessage] = useState(
    'Testovací e-mail ze Sellin. Pokud tohle vidíš, Resend funguje.'
  );
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, message }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setResult({
          ok: false,
          text: data.error || `HTTP ${response.status}`,
        });
        return;
      }

      setResult({
        ok: true,
        text: data.id ? `Odesláno. Resend ID: ${data.id}` : 'Odesláno.',
      });
    } catch (err: any) {
      setResult({
        ok: false,
        text: err?.message || 'Nepodařilo se odeslat požadavek.',
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-5">
      <div>
        <label htmlFor="test-email-to" className="mb-1.5 block text-sm font-medium text-slate-700">
          Příjemce
        </label>
        <input
          id="test-email-to"
          type="email"
          required
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="tvuj@email.cz"
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none ring-slate-950/10 placeholder:text-slate-400 focus:border-slate-400 focus:ring-4"
        />
      </div>

      <div>
        <label
          htmlFor="test-email-subject"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Předmět
        </label>
        <input
          id="test-email-subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none ring-slate-950/10 focus:border-slate-400 focus:ring-4"
        />
      </div>

      <div>
        <label
          htmlFor="test-email-message"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Zpráva
        </label>
        <textarea
          id="test-email-message"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none ring-slate-950/10 focus:border-slate-400 focus:ring-4"
        />
      </div>

      <button
        type="submit"
        disabled={sending || !to.trim()}
        className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending ? 'Odesílám…' : 'Odeslat testovací e-mail'}
      </button>

      {result && (
        <p
          className={`rounded-xl border px-3.5 py-3 text-sm ${
            result.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {result.text}
        </p>
      )}
    </form>
  );
}
