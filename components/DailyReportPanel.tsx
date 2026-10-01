'use client';

import { useEffect, useMemo, useState } from 'react';
import { getUsers } from '@/lib/api';
import type { User } from '@/lib/types';
import type { DailyUserReport } from '@/lib/dailyUserReport';

type Props = {
  defaultSeller?: string;
  defaultRecipient?: string;
};

export default function DailyReportPanel({
  defaultSeller = 'duplux@seznam.cz',
  defaultRecipient = 'obchod@sellin.cz',
}: Props) {
  const [seller, setSeller] = useState(defaultSeller);
  const [to, setTo] = useState(defaultRecipient);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [report, setReport] = useState<DailyUserReport | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingUsers(true);
        const data = await getUsers();
        if (cancelled) return;
        const sorted = [...data].sort((a, b) => {
          const pa = a.telephone1 || a.email;
          const pb = b.telephone1 || b.email;
          return pa.localeCompare(pb, 'cs');
        });
        setUsers(sorted);
        if (!sorted.some((u) => u.email.toLowerCase() === defaultSeller.toLowerCase()) && sorted[0]?.email) {
          setSeller(sorted[0].email);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Nepodařilo se načíst uživatele.');
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [defaultSeller]);

  const sellerOptions = useMemo(() => {
    return users.map((u) => {
      const phone = u.telephone1?.trim() || '—';
      const label = `${phone} · ${u.email}`;
      return { value: u.email, label };
    });
  }, [users]);

  const loadPreview = async (sellerEmail = seller) => {
    if (!sellerEmail.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/daily-report?seller=${encodeURIComponent(sellerEmail.trim())}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setReport(json.report);
      setSubject(json.subject);
      setHtml(json.html);
    } catch (err: any) {
      setReport(null);
      setHtml(null);
      setSubject(null);
      setError(err?.message || 'Nepodařilo se načíst report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loadingUsers) return;
    if (!seller.trim()) return;
    void loadPreview(seller);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingUsers, seller]);

  const sendReport = async () => {
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/daily-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller: seller.trim(),
          to: to.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setReport(json.report);
      setSubject(json.subject);
      setResult(
        json.id
          ? `Odesláno na ${json.to}. Resend ID: ${json.id}`
          : `Odesláno na ${json.to}.`
      );
    } catch (err: any) {
      setError(err?.message || 'Odeslání selhalo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Prodejce</label>
          <select
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            disabled={loadingUsers || sellerOptions.length === 0}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none ring-slate-950/10 focus:border-slate-400 focus:ring-4 disabled:opacity-50"
          >
            {loadingUsers && <option value="">Načítám účty…</option>}
            {!loadingUsers && sellerOptions.length === 0 && (
              <option value="">Žádní uživatelé</option>
            )}
            {sellerOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-slate-500">
            Přepínáním načteš náhled reportu pro daného prodejce (+ spárované subúčty).
          </p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Příjemce (prázdné = tvůj login)
          </label>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="obchod@sellin.cz"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none ring-slate-950/10 placeholder:text-slate-400 focus:border-slate-400 focus:ring-4"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void loadPreview()}
          disabled={loading || !seller.trim()}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40"
        >
          {loading ? 'Načítám…' : 'Obnovit náhled'}
        </button>
        <button
          type="button"
          onClick={() => void sendReport()}
          disabled={sending || !seller.trim()}
          className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
        >
          {sending ? 'Odesílám…' : 'Odeslat denní report'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}
      {result && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {result}
        </div>
      )}

      {report && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Cookie OK</p>
            <p className="mt-1 text-2xl font-black text-slate-950">
              {report.totals.cookiesOk}/{report.totals.accounts}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Bazoš obnovy</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{report.totals.bazosOk}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Sbazar obnovy</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{report.totals.sbazarOk}</p>
          </div>
        </div>
      )}

      {subject && (
        <p className="text-sm text-slate-600">
          Předmět: <span className="font-semibold text-slate-900">{subject}</span>
        </p>
      )}

      {html && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-2xs">
          <div className="border-b border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Náhled e-mailu
          </div>
          <iframe
            title="Náhled denního reportu"
            srcDoc={html}
            className="h-[640px] w-full bg-white"
          />
        </div>
      )}
    </div>
  );
}
