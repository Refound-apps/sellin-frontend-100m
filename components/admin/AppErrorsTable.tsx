'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AppErrorLog } from '@/lib/types';
import { getAdminAppErrors, patchAppError, purgeResolvedAppErrors } from '@/lib/api';
import { formatDateTime } from '../TransactionsView';

export default function AppErrorsTable({
  initialItems,
  onCountsChange,
}: {
  initialItems?: AppErrorLog[];
  onCountsChange?: (unresolved: number) => void;
}) {
  const [items, setItems] = useState<AppErrorLog[]>(initialItems || []);
  const [loading, setLoading] = useState(!initialItems);
  const [error, setError] = useState<string | null>(null);

  const [source, setSource] = useState<'all' | 'frontend' | 'backend'>('all');
  const [resolvedFilter, setResolvedFilter] = useState<'unresolved' | 'resolved' | 'all'>('unresolved');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [summary, setSummary] = useState({
    unresolved: 0,
    unresolvedFrontend: 0,
    unresolvedBackend: 0,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminAppErrors({
        source: source === 'all' ? undefined : source,
        resolved: resolvedFilter,
        q: search.trim() || undefined,
        limit: 150,
      });
      setItems(res.data);
      setSummary(res.summary);
      onCountsChange?.(res.summary.unresolved);
    } catch (err: any) {
      setError(err?.message || 'Načtení chyb aplikace selhalo.');
    } finally {
      setLoading(false);
    }
  }, [source, resolvedFilter, search, onCountsChange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleResolved = async (item: AppErrorLog) => {
    setBusyId(item.id);
    try {
      const nextResolved = !item.resolved;
      await patchAppError(item.id, nextResolved);
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, resolved: nextResolved, resolved_at: nextResolved ? new Date().toISOString() : null }
            : i
        )
      );
      setSummary((prev) => ({
        ...prev,
        unresolved: Math.max(0, prev.unresolved + (nextResolved ? -1 : 1)),
      }));
    } catch (err: any) {
      alert(err?.message || 'Nepodařilo se změnit stav.');
    } finally {
      setBusyId(null);
    }
  };

  const handlePurgeResolved = async () => {
    if (!confirm('Opravdu chcete nenávratně smazat všechny vyřešené chyby z databáze?')) return;
    try {
      setLoading(true);
      await purgeResolvedAppErrors();
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Promazání selhalo.');
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Controls Bar */}
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Source filters */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            {(
              [
                ['all', 'Všechny zdroje'],
                ['frontend', `Frontend (${summary.unresolvedFrontend})`],
                ['backend', `Backend (${summary.unresolvedBackend})`],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setSource(val)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  source === val
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Status filters */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            {(
              [
                ['unresolved', `Nevyřešené (${summary.unresolved})`],
                ['resolved', 'Vyřešené'],
                ['all', 'Vše'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setResolvedFilter(val)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  resolvedFilter === val
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hledat (zpráva, URL, email)…"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-400 sm:w-60"
          />
          <button
            type="button"
            onClick={() => loadData()}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Obnovit
          </button>
          {resolvedFilter !== 'unresolved' && (
            <button
              type="button"
              onClick={handlePurgeResolved}
              className="shrink-0 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100"
              title="Smazat všechny vyřešené záznamy"
            >
              Promazat vyřešené
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">Načítám chyby aplikace…</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">
          {resolvedFilter === 'unresolved'
            ? 'Žádné nevyřešené chyby aplikace! Vše běží v pořádku 🎉'
            : 'Žádné zaznamenané chyby odpovídající filtru.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="w-10 px-4 py-3 text-center">Stav</th>
                <th className="px-4 py-3">Čas</th>
                <th className="px-4 py-3">Zdroj</th>
                <th className="px-4 py-3">Status / Typ</th>
                <th className="px-4 py-3">Zpráva chyby</th>
                <th className="px-4 py-3">Cesta / Akce</th>
                <th className="px-4 py-3">Uživatel</th>
                <th className="w-20 px-4 py-3 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const isExpanded = expandedId === item.id;
                const isResolved = item.resolved;
                const dateInfo = formatDateTime(item.created_at);

                return (
                  <tr
                    key={item.id}
                    className={`transition hover:bg-slate-50/70 ${
                      isResolved ? 'opacity-60 bg-slate-50/30' : ''
                    }`}
                  >
                    {/* Checkbox / resolve toggle */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => handleToggleResolved(item)}
                        title={isResolved ? 'Označit jako nevyřešené' : 'Označit jako vyřešené'}
                        className={`inline-flex h-5 w-5 items-center justify-center rounded border transition ${
                          isResolved
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-slate-300 hover:border-emerald-500 text-transparent hover:text-emerald-500'
                        }`}
                      >
                        ✓
                      </button>
                    </td>

                    {/* Date */}
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      <span className="font-medium text-slate-700">{dateInfo.short}</span>
                    </td>

                    {/* Source */}
                    <td className="whitespace-nowrap px-4 py-3">
                      {item.source === 'frontend' ? (
                        <span className="inline-flex rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700 border border-sky-200">
                          Frontend (Klient)
                        </span>
                      ) : item.source === 'backend' ? (
                        <span className="inline-flex rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 border border-purple-200">
                          Backend (Server)
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                          {item.source}
                        </span>
                      )}
                    </td>

                    {/* Status Code / Type */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        {item.status_code && (
                          <span
                            className={`inline-block w-fit rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              item.status_code === 413 || item.status_code >= 500
                                ? 'bg-rose-100 text-rose-800'
                                : item.status_code >= 400
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            HTTP {item.status_code}
                          </span>
                        )}
                        {item.error_type && (
                          <span className="text-[11px] font-mono text-slate-500 truncate max-w-[160px]" title={item.error_type}>
                            {item.error_type}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Message */}
                    <td className="max-w-md px-4 py-3">
                      <p className="font-medium text-slate-900 break-words" title={item.message}>
                        {item.message}
                      </p>
                    </td>

                    {/* Path */}
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-slate-600">
                      {item.path || '—'}
                    </td>

                    {/* User */}
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {item.user_email ? (
                        <span className="font-semibold text-slate-800">{item.user_email}</span>
                      ) : (
                        <span className="text-slate-400">Anonymní</span>
                      )}
                    </td>

                    {/* Expand Detail */}
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {item.metadata && Object.keys(item.metadata).length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className={`rounded px-2 py-1 text-[11px] font-semibold transition ${
                            isExpanded
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isExpanded ? 'Skrýt' : 'Detail'}
                        </button>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Expanded detail box */}
          {expandedId !== null && (
            <div className="border-t border-slate-200 bg-slate-900 p-4 text-xs font-mono text-slate-200">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="font-bold text-amber-400">
                  Metadata & Kontext chyby #{expandedId}
                </span>
                <button
                  type="button"
                  onClick={() => setExpandedId(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕ Zavřít
                </button>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap max-h-72">
                {JSON.stringify(
                  items.find((i) => i.id === expandedId)?.metadata || {},
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
