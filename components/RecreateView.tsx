'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { getUsers } from '@/lib/api';
import type { User } from '@/lib/types';
import { formatDateTime } from './TransactionsView';

type Marketplace = 'Bazoš' | 'Bazoš.sk' | 'Sbazar';

type PreviewItem = {
  auto_id: number;
  bb_id: string | null;
  bb_email: string | null;
  title: string | null;
  price: number | null;
  state: string | null;
  created_at: string | null;
  preview_image: string | null;
  zipcode: number | null;
  location: string | null;
};

export default function RecreateView() {
  const [users, setUsers] = useState<User[]>([]);
  const [marketplace, setMarketplace] = useState<Marketplace>('Bazoš');
  const [email, setEmail] = useState('');
  const [max, setMax] = useState(20);
  const [offset, setOffset] = useState(0);

  const [items, setItems] = useState<PreviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [running, setRunning] = useState(false);
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

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (!email.trim() || !email.includes('@')) {
        setItems([]);
        setTotal(0);
        return;
      }

      setLoadingPreview(true);
      try {
        const params = new URLSearchParams({
          email: email.trim(),
          max: String(max),
          offset: String(offset),
          marketplace,
        });
        const res = await fetch(`/api/admin/recreate?${params.toString()}`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.success) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        setItems(data.items || []);
        setTotal(data.total || 0);
      } catch (err: any) {
        if (cancelled) return;
        setItems([]);
        setTotal(0);
        setMessage({ ok: false, text: err?.message || 'Načtení náhledu selhalo.' });
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    }, email ? 400 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [email, max, offset, marketplace]);

  async function runRecreate(e: FormEvent) {
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
    if (offset < 0) {
      setMessage({ ok: false, text: 'Offset nemůže být záporný.' });
      return;
    }

    const confirmed = window.confirm(
      `RECREATE ${marketplace}\n\nE-mail: ${cleanEmail}\nOffset (přeskočit): ${offset}\nMax (recreatnout): ${max}\n\nV náhledu: ${items.length} nabídek / celkem ${total}.\n\nOpravdu spustit?`
    );
    if (!confirmed) return;

    setRunning(true);
    setMessage(null);

    try {
      const controller = new AbortController();
      const abortTimer = setTimeout(() => controller.abort(), 20000);

      let res: Response;
      try {
        res = await fetch('/api/admin/recreate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            max,
            offset,
            marketplace,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(abortTimer);
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setMessage({
        ok: true,
        text: data.message || `Recreate zahájen (${data.count || 0} nabídek).`,
      });
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setMessage({
          ok: true,
          text: 'Požadavek odeslán. Backend odpovídá pomalu — zkontroluj frontu scraper jobů.',
        });
      } else {
        setMessage({ ok: false, text: err?.message || 'Recreate selhal.' });
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-black tracking-tight text-slate-950">Recreate nabídek</h1>
        <p className="mt-2 text-sm text-slate-600">
          Stejná logika jako Budibase <code>RECREATE BAZOS</code>: načte{' '}
          <code>offer_pg</code> podle e-mailu (<code>state != app_archive</code>), seřadí od
          nejstarších, přeskočí <strong>offset</strong> a zařadí <strong>max</strong> nabídek do
          fronty recreate.
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

      <form
        onSubmit={runRecreate}
        className="max-w-xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Marketplace
          </label>
          <select
            value={marketplace}
            onChange={(e) => setMarketplace(e.target.value as Marketplace)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="Bazoš">Bazoš.cz</option>
            <option value="Bazoš.sk">Bazoš.sk</option>
            <option value="Sbazar">Sbazar</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            list="recreate-emails"
            placeholder="duplux@seznam.cz"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            required
          />
          <datalist id="recreate-emails">
            {emailSuggestions.map((e) => (
              <option key={e} value={e} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Offset (přeskočit)
            </label>
            <input
              type="number"
              min={0}
              value={offset}
              onChange={(e) => setOffset(Math.max(0, Number(e.target.value) || 0))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Max (recreatnout)
            </label>
            <input
              type="number"
              min={1}
              max={200}
              value={max}
              onChange={(e) =>
                setMax(Math.min(200, Math.max(1, Number(e.target.value) || 1)))
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Náhled: <strong>{loadingPreview ? '…' : items.length}</strong> nabídek
          {total > 0 && (
            <>
              {' '}
              · celkem bez archivu: <strong>{total}</strong>
            </>
          )}
          {email && (
            <>
              {' '}
              · SQL: <code>ORDER BY created_at ASC LIMIT {max} OFFSET {offset}</code>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={running || loadingPreview || items.length === 0}
          className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? 'Zařazuji do fronty…' : `Recreate ${marketplace} (${items.length})`}
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-bold text-slate-900">Náhled dávky</h2>
        </div>
        {loadingPreview ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Načítám…</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            {email ? 'Žádné nabídky pro tento filtr.' : 'Zadej e-mail pro náhled.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-bold">ID</th>
                  <th className="px-3 py-2 font-bold">Titulek</th>
                  <th className="px-3 py-2 font-bold">Cena</th>
                  <th className="px-3 py-2 font-bold">Lokace</th>
                  <th className="px-3 py-2 font-bold">Vytvořeno</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.bb_id || item.auto_id} className="hover:bg-slate-50/80">
                    <td className="px-3 py-2 font-mono text-xs text-slate-500">
                      {item.auto_id}
                    </td>
                    <td className="max-w-xs truncate px-3 py-2 font-medium text-slate-900">
                      {item.title || '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {item.price != null ? `${item.price} Kč` : '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {item.location || '—'}
                      {item.zipcode != null ? ` (${item.zipcode})` : ''}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {formatDateTime(item.created_at).short}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
