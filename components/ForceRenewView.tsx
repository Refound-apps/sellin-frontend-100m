'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { getUsers } from '@/lib/api';
import type { User } from '@/lib/types';
import { formatDateTime } from './TransactionsView';

type Marketplace = 'Bazoš' | 'Bazoš.sk';

type PreviewItem = {
  auto_id: number;
  bb_email_od: string | null;
  next_date_renew: string | null;
  last_date_renewed: string | null;
  condition: string | null;
  link: string | null;
  bb_offer_id: string | null;
  autotop: boolean;
  autorenew_freq: string | null;
};

export default function ForceRenewView() {
  const [users, setUsers] = useState<User[]>([]);
  const [marketplace, setMarketplace] = useState<Marketplace>('Bazoš');
  const [email, setEmail] = useState('');
  const [max, setMax] = useState(10);
  const [previewMax, setPreviewMax] = useState(50);
  const [tillTodayOnly, setTillTodayOnly] = useState(true);

  const [items, setItems] = useState<PreviewItem[]>([]);
  const [tillTodayCount, setTillTodayCount] = useState(0);
  const [vouchersCount, setVouchersCount] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [forcing, setForcing] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  const emailSuggestions = useMemo(() => {
    const q = email.trim().toLowerCase();
    const list = users.map((u) => u.email).filter(Boolean);
    if (!q) return list.slice(0, 12);
    return list.filter((e) => e.toLowerCase().includes(q)).slice(0, 12);
  }, [users, email]);

  async function loadPreview(filter?: {
    email?: string;
    marketplace?: Marketplace;
    previewMax?: number;
    tillTodayOnly?: boolean;
  }) {
    const activeEmail = filter?.email ?? email;
    const activeMarketplace = filter?.marketplace ?? marketplace;
    const activeMax = filter?.previewMax ?? previewMax;
    const activeTillToday = filter?.tillTodayOnly ?? tillTodayOnly;

    setLoadingPreview(true);

    try {
      const params = new URLSearchParams({
        marketplace: activeMarketplace,
        max: String(activeMax),
        offset: '0',
      });
      if (activeEmail.trim()) params.set('email', activeEmail.trim());
      if (activeTillToday) params.set('tillToday', '1');

      const res = await fetch(`/api/admin/force-renew?${params.toString()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setItems(data.items || []);
      setTillTodayCount(data.tillTodayCount || 0);
      setVouchersCount(data.vouchersCount || 0);
    } catch (err: any) {
      setItems([]);
      setMessage({ ok: false, text: err?.message || 'Načtení náhledu selhalo.' });
    } finally {
      setLoadingPreview(false);
    }
  }

  // Auto-load hned po otevření + při změně filtrů (email s debounce)
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoadingPreview(true);
      try {
        const params = new URLSearchParams({
          marketplace,
          max: String(previewMax),
          offset: '0',
        });
        if (email.trim()) params.set('email', email.trim());
        if (tillTodayOnly) params.set('tillToday', '1');

        const res = await fetch(`/api/admin/force-renew?${params.toString()}`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.success) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        setItems(data.items || []);
        setTillTodayCount(data.tillTodayCount || 0);
        setVouchersCount(data.vouchersCount || 0);
      } catch (err: any) {
        if (cancelled) return;
        setItems([]);
        setMessage({ ok: false, text: err?.message || 'Načtení náhledu selhalo.' });
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    }, email ? 400 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [marketplace, previewMax, tillTodayOnly, email]);

  async function runForceRenew(e: FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setMessage({ ok: false, text: 'Zadej platný e-mail účtu.' });
      return;
    }
    if (max < 1) {
      setMessage({ ok: false, text: 'Max počet musí být alespoň 1.' });
      return;
    }

    const confirmed = window.confirm(
      `FORCE RENEW ${marketplace}\n\nE-mail: ${cleanEmail}\nMax inzerátů: ${max}\n\nOpravdu spustit? Obnova běží na backendu s pauzami mezi inzeráty.`
    );
    if (!confirmed) return;

    setForcing(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/force-renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          max,
          marketplace,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setMessage({
        ok: true,
        text: data.message || `Force renew zahájen (${data.count || 0} inzerátů).`,
      });
      await loadPreview();
    } catch (err: any) {
      setMessage({ ok: false, text: err?.message || 'Force renew selhal.' });
    } finally {
      setForcing(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-black tracking-tight text-slate-950">Force renew inzerátů</h1>
        <p className="mt-2 text-sm text-slate-600">
          Stejná logika jako v Budibase: načte kandidáty z <code>offer_detail_pg</code> + offer +
          credentials, přiřadí vouchery a pošle batch na{' '}
          <code>/renewofferbazosforce</code> (bez kontroly data obnovy).
        </p>
      </div>

      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Preview / till today */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-rose-700">
              {marketplace}: renew till today: {tillTodayCount}
            </span>
            {vouchersCount > 0 && (
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                Vouchery: {vouchersCount}
              </span>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void loadPreview();
            }}
            className="space-y-3"
          >
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Marketplace
              </label>
              <select
                value={marketplace}
                onChange={(e) => setMarketplace(e.target.value as Marketplace)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-950/10"
              >
                <option value="Bazoš">Bazoš.cz</option>
                <option value="Bazoš.sk">Bazoš.sk</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                E-mail (volitelné filtrování)
              </label>
              <input
                list="force-renew-emails"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="diskyapneu@seznam.cz"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-950/10"
              />
              <datalist id="force-renew-emails">
                {emailSuggestions.map((e) => (
                  <option key={e} value={e} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  max (náhled)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={previewMax}
                  onChange={(e) => setPreviewMax(Number(e.target.value) || 50)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-950/10"
                />
              </div>
              <div className="flex flex-col justify-end pb-1">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={tillTodayOnly}
                    onChange={(e) => setTillTodayOnly(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Renew till today
                </label>
                <p className="mt-1 text-[11px] leading-snug text-slate-400">
                  next_date_renew v okně −31000 min … teď, bez „Neobnovovat“
                </p>
              </div>
            </div>

            {loadingPreview && (
              <p className="text-xs font-medium text-slate-500">Načítám seznam…</p>
            )}
          </form>

          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-100">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Auto ID</th>
                  <th className="px-3 py-2 font-semibold">E-mail</th>
                  <th className="px-3 py-2 font-semibold">Next renew</th>
                  <th className="px-3 py-2 font-semibold">Stav</th>
                  <th className="px-3 py-2 font-semibold">Link</th>
                </tr>
              </thead>
              <tbody>
                {loadingPreview && items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                      Načítám…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                      Žádné záznamy pro aktuální filtr.
                    </td>
                  </tr>
                ) : (
                  items.map((row) => (
                    <tr key={row.auto_id} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-mono text-xs text-slate-700">{row.auto_id}</td>
                      <td className="px-3 py-2 text-slate-700">{row.bb_email_od}</td>
                      <td className="px-3 py-2 text-slate-600">
                        {row.next_date_renew ? formatDateTime(row.next_date_renew).short : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700">
                          {row.condition || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {row.link ? (
                          <a
                            href={row.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-teal-700 hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {items.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">Zobrazeno {items.length} záznamů.</p>
          )}
        </section>

        {/* Force renew form */}
        <section className="rounded-2xl border border-rose-200 bg-white p-5 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900">
            FORCE RENEW {marketplace === 'Bazoš.sk' ? 'Bazos.sk' : 'Bazos.cz'} — With caution!
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Obnoví inzeráty bez ohledu na <code>next_date_renew</code>. Používej opatrně.
          </p>

          <form onSubmit={runForceRenew} className="mt-5 space-y-4">
            <button
              type="submit"
              disabled={forcing}
              className="rounded-full border-2 border-rose-500 bg-white px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
            >
              {forcing ? 'Spouštím…' : `Force renew ${marketplace === 'Bazoš.sk' ? 'Bazos SK' : 'Bazos'}`}
            </button>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                max number of offers
              </label>
              <input
                type="number"
                min={1}
                max={500}
                required
                value={max}
                onChange={(e) => setMax(Number(e.target.value) || 1)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/10"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">email</label>
              <input
                list="force-renew-emails"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ucet@domena.cz"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/10"
              />
            </div>
          </form>

          <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
            <p className="font-semibold text-slate-800">Co se stane po kliknutí:</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>SQL ekvivalent Budibase query <code>RENEW - BAZOS</code> (exclude deleted/error_create)</li>
              <li>Načtení unused voucherů + credentials pro e-mail</li>
              <li>
                POST na backend <code>{marketplace === 'Bazoš.sk' ? '/renewofferbazosskforce' : '/renewofferbazosforce'}</code>
              </li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
