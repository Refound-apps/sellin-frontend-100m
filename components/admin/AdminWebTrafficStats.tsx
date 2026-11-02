'use client';

import { useState, useEffect, useCallback } from 'react';
import { getProdejomatVisitStats, ProdejomatVisitStats } from '@/lib/api';

function formatNumber(num: number): string {
  return new Intl.NumberFormat('cs-CZ').format(num);
}

export default function AdminWebTrafficStats({ compact = false }: { compact?: boolean }) {
  const [stats, setStats] = useState<ProdejomatVisitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProdejomatVisitStats();
      if (res.success && res.data) {
        setStats(res.data);
      } else {
        setError(res.error || 'Nepodařilo se načíst data.');
      }
    } catch {
      setError('Chyba při stahování statistik.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  if (compact) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs">
        <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-slate-200/80">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
              Návštěvnost webu
            </span>
          </div>
          <button
            type="button"
            onClick={() => void fetchStats()}
            title="Obnovit statistiku"
            disabled={loading}
            className="text-slate-400 hover:text-slate-700 disabled:opacity-50 transition-colors p-0.5"
          >
            <svg
              className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-1 text-center">
          <div>
            <div className="text-[10px] font-medium text-slate-400">Dnes</div>
            <div className="text-sm font-black tabular-nums text-slate-900">
              {loading && stats == null ? '—' : formatNumber(stats?.day ?? 0)}
            </div>
          </div>
          <div className="border-x border-slate-200/80">
            <div className="text-[10px] font-medium text-slate-400">7 dní</div>
            <div className="text-sm font-black tabular-nums text-slate-900">
              {loading && stats == null ? '—' : formatNumber(stats?.week ?? 0)}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium text-slate-400">Měsíc</div>
            <div className="text-sm font-black tabular-nums text-slate-900">
              {loading && stats == null ? '—' : formatNumber(stats?.month ?? 0)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const items = [
    {
      label: 'Dnes',
      hint: 'Dnešní návštěvy',
      value: stats?.day ?? 0,
      highlight: true,
      badge: 'Dnešek',
    },
    {
      label: 'Posledních 7 dní',
      hint: 'Týdenní návštěvnost',
      value: stats?.week ?? 0,
      highlight: false,
      badge: 'Týden',
    },
    {
      label: 'Tento měsíc',
      hint: 'Měsíční návštěvnost',
      value: stats?.month ?? 0,
      highlight: false,
      badge: 'Měsíc',
    },
  ];

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-emerald-50/30 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 text-white shadow-xs">
            <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black tracking-tight text-slate-950 sm:text-base">
                Návštěvnost webu prodejomat.cz
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Jednoduché počítadlo unikátních návštěv webu prodejomat.cz (dnes, týdenní, měsíční).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void fetchStats()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50 transition"
        >
          <svg
            className={`h-3.5 w-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>{loading ? 'Načítám…' : 'Obnovit'}</span>
        </button>
      </div>

      {error ? (
        <div className="px-4 py-4 text-xs text-rose-600 bg-rose-50/50 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void fetchStats()}
            className="font-bold underline hover:text-rose-700 ml-2"
          >
            Zkusit znovu
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {items.map((item) => (
            <div
              key={item.label}
              className={`p-4 sm:p-5 transition-colors ${
                item.highlight ? 'bg-emerald-500/[0.03]' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {item.label}
                </span>
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                  {item.badge}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-slate-950">
                  {loading && stats == null ? '…' : formatNumber(item.value)}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {item.value === 1 ? 'návštěva' : item.value >= 2 && item.value <= 4 ? 'návštěvy' : 'návštěv'}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">{item.hint}</p>
            </div>
          ))}
        </div>
      )}

      {stats?.history && stats.history.length > 1 && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 sm:px-6">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-medium">Poslední dny v databázi:</span>
            <div className="flex items-center gap-2 overflow-x-auto">
              {stats.history.slice(0, 7).map((h) => (
                <span
                  key={h.day}
                  className="inline-flex items-center gap-1 rounded bg-white px-1.5 py-0.5 border border-slate-200/80 text-[10px] font-semibold text-slate-600"
                >
                  <span className="text-slate-400">{h.day.slice(5)}:</span>
                  <span className="font-bold text-slate-900">{h.visits}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
