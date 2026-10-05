'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import {
  cancelAllPendingScraperJobs,
  getScraperJobs,
  patchScraperJob,
} from '@/lib/api';
import type { ScraperJob, ScraperJobCounts, ScraperJobStatus } from '@/lib/types';
import { formatDateTime } from './TransactionsView';

const PAGE_SIZE = 150;

const STATUS_LABEL: Record<ScraperJobStatus, { label: string; className: string }> = {
  pending: { label: 'Čeká', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  running: { label: 'Běží', className: 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse' },
  done: { label: 'Hotovo', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  failed: { label: 'Chyba', className: 'bg-rose-50 text-rose-800 border-rose-200' },
  cancelled: { label: 'Zrušeno', className: 'bg-slate-50 text-slate-500 border-slate-200' },
};

const TYPE_LABEL: Record<string, string> = {
  renew_bazos: 'Renew Bazoš.cz',
  renew_bazos_sk: 'Renew Bazoš.sk',
  renew_sbazar: 'Renew Sbazar',
  cookie_bazos: 'Cookie Bazoš.cz',
  cookie_bazos_sk: 'Cookie Bazoš.sk',
  create_offer: 'Create offer',
  update_offer: 'Update offer',
  delete_offer: 'Delete offer',
  recreate_bazos: 'Recreate Bazoš.cz',
  recreate_bazos_sk: 'Recreate Bazoš.sk',
  recreate_sbazar: 'Recreate Sbazar',
  recreate_facebook: 'Recreate Facebook',
  archive_offer: 'Archive offer',
  generic: 'Generic',
};

function summarizePayload(job: ScraperJob): string {
  const p = job.payload || {};
  if (p.offerDetail?.link) return String(p.offerDetail.link);
  if (p.offerDetail?.bb_email_od) return String(p.offerDetail.bb_email_od);
  if (p.offer?.title) return String(p.offer.title);
  if (p.offer?._id) return String(p.offer._id);
  if (p.data?.offer?.title) return String(p.data.offer.title);
  if (p.credential?.email) return String(p.credential.email);
  if (p.offerId) return `offer ${p.offerId}`;
  return job.dedupe_key || '—';
}

export default function ScraperJobsQueuePanel() {
  const [jobs, setJobs] = useState<ScraperJob[]>([]);
  const [counts, setCounts] = useState<ScraperJobCounts>({
    pending: 0,
    running: 0,
    done: 0,
    failed: 0,
    cancelled: 0,
  });
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | ScraperJobStatus>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(
    async (opts?: { append?: boolean }) => {
      const append = Boolean(opts?.append);
      try {
        setError(null);
        if (append) setLoadingMore(true);
        const offset = append ? jobs.length : 0;
        const res = await getScraperJobs({
          status: statusFilter,
          job_type: typeFilter,
          limit: PAGE_SIZE,
          offset,
        });
        setJobs((prev) => (append ? [...prev, ...res.data] : res.data));
        setCounts(res.counts);
        setFilteredTotal(res.meta.filteredTotal);
        setHasMore(res.meta.hasMore);
      } catch (err: any) {
        setError(err?.message || 'Načtení fronty selhalo');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [statusFilter, typeFilter, jobs.length]
  );

  useEffect(() => {
    setLoading(true);
    setJobs([]);
    // reset list on filter change
    void (async () => {
      try {
        setError(null);
        const res = await getScraperJobs({
          status: statusFilter,
          job_type: typeFilter,
          limit: PAGE_SIZE,
          offset: 0,
        });
        setJobs(res.data);
        setCounts(res.counts);
        setFilteredTotal(res.meta.filteredTotal);
        setHasMore(res.meta.hasMore);
      } catch (err: any) {
        setError(err?.message || 'Načtení fronty selhalo');
      } finally {
        setLoading(false);
      }
    })();
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    const t = setInterval(() => {
      // soft refresh first page counts + replace if not paginated deep
      void (async () => {
        try {
          const res = await getScraperJobs({
            status: statusFilter,
            job_type: typeFilter,
            limit: Math.max(jobs.length, PAGE_SIZE),
            offset: 0,
          });
          setJobs(res.data);
          setCounts(res.counts);
          setFilteredTotal(res.meta.filteredTotal);
          setHasMore(res.meta.hasMore);
        } catch {
          /* ignore auto-refresh errors */
        }
      })();
    }, 10_000);
    return () => clearInterval(t);
  }, [statusFilter, typeFilter, jobs.length]);

  const onCancel = async (id: number) => {
    setBusyId(id);
    try {
      await patchScraperJob(id, 'cancel');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Zrušení selhalo');
    } finally {
      setBusyId(null);
    }
  };

  const onRunNow = async (id: number) => {
    setBusyId(id);
    try {
      await patchScraperJob(id, 'run_now');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Spuštění selhalo');
    } finally {
      setBusyId(null);
    }
  };

  const onCancelAllPending = async () => {
    if (!confirm(`Zrušit všech ${counts.pending} čekajících jobů?`)) return;
    setBusyId(-1);
    try {
      await cancelAllPendingScraperJobs();
      await load();
    } catch (err: any) {
      setError(err?.message || 'Bulk cancel selhal');
    } finally {
      setBusyId(null);
    }
  };

  const totalLast7 =
    counts.pending + counts.running + counts.done + counts.failed + counts.cancelled;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Fronta workerů (scraper_jobs)</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Create / update / delete / renew / recreate / cookie / archive. Auto-obnova každých 10 s.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              load();
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Obnovit
          </button>
          <button
            type="button"
            disabled={counts.pending === 0 || busyId === -1}
            onClick={onCancelAllPending}
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-40"
          >
            Zrušit všechny pending
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(
          [
            ['pending', 'Čeká', counts.pending],
            ['running', 'Běží', counts.running],
            ['done', 'Hotovo', counts.done],
            ['failed', 'Chyba', counts.failed],
            ['cancelled', 'Zrušeno', counts.cancelled],
          ] as const
        ).map(([key, label, value]) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
            className={`rounded-2xl border p-4 text-left shadow-2xs transition ${
              statusFilter === key
                ? 'border-slate-900 bg-slate-950 text-white'
                : 'border-slate-200/80 bg-white hover:border-slate-300'
            }`}
          >
            <p className={`text-xs font-medium ${statusFilter === key ? 'text-slate-300' : 'text-slate-500'}`}>
              {label}
            </p>
            <p className="mt-1 text-xl font-bold tracking-tight">{value}</p>
            <p className={`mt-1 text-[10px] ${statusFilter === key ? 'text-slate-400' : 'text-slate-400'}`}>
              posledních 7 dní
            </p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800"
        >
          <option value="all">Všechny typy</option>
          {Object.entries(TYPE_LABEL).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        {statusFilter !== 'all' && (
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Zrušit filtr stavu
          </button>
        )}
        <span className="text-[11px] text-slate-500">
          Zobrazeno {jobs.length} / {filteredTotal}
          {totalLast7 > 0 ? ` · souč 7 dní: ${totalLast7}` : ''}
        </span>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
        {loading && jobs.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">Načítám frontu…</div>
        ) : jobs.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">Žádné joby pro zvolený filtr.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Typ</th>
                  <th className="px-4 py-3">Stav</th>
                  <th className="px-4 py-3">Priorita</th>
                  <th className="px-4 py-3">Cíl</th>
                  <th className="px-4 py-3">Pokusy</th>
                  <th className="px-4 py-3">Run after</th>
                  <th className="px-4 py-3">Vytvořeno</th>
                  <th className="px-4 py-3">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => {
                  const st = STATUS_LABEL[job.status] || STATUS_LABEL.pending;
                  const open = expandedId === job.id;
                  return (
                    <Fragment key={job.id}>
                      <tr className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-mono text-slate-500">#{job.id}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {TYPE_LABEL[job.job_type] || job.job_type}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${st.className}`}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{job.priority ?? '—'}</td>
                        <td
                          className="max-w-[220px] truncate px-4 py-3 text-slate-600"
                          title={summarizePayload(job)}
                        >
                          {summarizePayload(job)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {job.attempts}/{job.max_attempts}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {formatDateTime(job.run_after).short}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {formatDateTime(job.created_at).short}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setExpandedId(open ? null : job.id)}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-white"
                            >
                              {open ? 'Skrýt' : 'Detail'}
                            </button>
                            {(job.status === 'pending' || job.status === 'running') && (
                              <>
                                <button
                                  type="button"
                                  disabled={busyId === job.id}
                                  onClick={() => onRunNow(job.id)}
                                  className="rounded-lg border border-emerald-200 px-2 py-1 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-40"
                                >
                                  Spustit teď
                                </button>
                                <button
                                  type="button"
                                  disabled={busyId === job.id}
                                  onClick={() => onCancel(job.id)}
                                  className="rounded-lg border border-rose-200 px-2 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40"
                                >
                                  Zrušit
                                </button>
                              </>
                            )}
                            {(job.status === 'failed' || job.status === 'cancelled') && (
                              <button
                                type="button"
                                disabled={busyId === job.id}
                                onClick={() => onRunNow(job.id)}
                                className="rounded-lg border border-emerald-200 px-2 py-1 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-40"
                              >
                                Retry
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {open && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={9} className="px-4 py-3">
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                  Časy / worker
                                </p>
                                <p className="mt-1 text-xs text-slate-700 break-all">
                                  start: {formatDateTime(job.started_at).short}
                                  <br />
                                  end: {formatDateTime(job.finished_at).short}
                                  <br />
                                  locked_by: {job.locked_by || '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                  Chyba / result
                                </p>
                                <p className="mt-1 text-xs text-rose-700 break-all">
                                  {job.last_error || '—'}
                                </p>
                                <pre className="mt-1 max-h-28 overflow-auto rounded-lg bg-white p-2 text-[10px] text-slate-600 border border-slate-200">
                                  {JSON.stringify(job.result ?? null, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                  Payload
                                </p>
                                <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-white p-2 text-[10px] text-slate-600 border border-slate-200">
                                  {JSON.stringify(job.payload, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {hasMore && (
          <div className="border-t border-slate-100 p-3 text-center">
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => load({ append: true })}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {loadingMore ? 'Načítám…' : `Načíst další (${jobs.length} / ${filteredTotal})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
