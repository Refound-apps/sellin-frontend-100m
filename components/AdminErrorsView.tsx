'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getAdminErrors, patchScraperJob } from '@/lib/api';
import type { CronJobLog, ScraperJob } from '@/lib/types';
import { formatDateTime } from './TransactionsView';

type MissingCookieRow = {
  id: number;
  email: string;
  bazos_email: string | null;
  sbazar_email: string | null;
  status_cz: string | null;
  status_sk: string | null;
  issues: string[];
};

type ErrorGroup = {
  signature: string;
  sample: string;
  count: number;
  account_keys: string[];
};

type ErrorsPayload = {
  summary: {
    failedJobs: number;
    retryingWithError: number;
    stuckRunning: number;
    cronErrors: number;
    missingCookies: number;
    windowDays: number;
  };
  errorGroups: ErrorGroup[];
  failedJobs: ScraperJob[];
  retryingJobs: ScraperJob[];
  stuckJobs: ScraperJob[];
  cronErrors: CronJobLog[];
  missingCookies: MissingCookieRow[];
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
};

function jobTarget(job: ScraperJob): string {
  const p = job.payload || {};
  return (
    job.account_key ||
    p.offerDetail?.bb_email_od ||
    p.offerDetail?.link ||
    p.offer?.title ||
    p.credential?.email ||
    job.dedupe_key ||
    '—'
  );
}

function JobsTable({
  jobs,
  busyId,
  onRetry,
  emptyLabel,
}: {
  jobs: ScraperJob[];
  busyId: number | null;
  onRetry: (id: number) => void;
  emptyLabel: string;
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (jobs.length === 0) {
    return <div className="py-8 text-center text-sm text-slate-400">{emptyLabel}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Typ</th>
            <th className="px-4 py-3">Stav</th>
            <th className="px-4 py-3">Účet / cíl</th>
            <th className="px-4 py-3">Pokusy</th>
            <th className="px-4 py-3">Čas</th>
            <th className="px-4 py-3">Akce</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {jobs.map((job) => {
            const open = expandedId === job.id;
            return (
              <Fragment key={job.id}>
                <tr
                  className="cursor-pointer hover:bg-slate-50/70"
                  onClick={() => setExpandedId(open ? null : job.id)}
                >
                  <td className="px-4 py-3 font-mono text-slate-500">#{job.id}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {TYPE_LABEL[job.job_type] || job.job_type}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-800">
                      {job.status}
                    </span>
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-slate-700" title={jobTarget(job)}>
                    {jobTarget(job)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {job.attempts}/{job.max_attempts}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDateTime(job.finished_at || job.started_at || job.created_at)}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    {(job.status === 'failed' || job.status === 'cancelled') && (
                      <button
                        type="button"
                        disabled={busyId === job.id}
                        onClick={() => onRetry(job.id)}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                      >
                        Retry
                      </button>
                    )}
                  </td>
                </tr>
                {open && (
                  <tr className="bg-slate-50/50">
                    <td colSpan={7} className="px-4 py-3">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        last_error
                      </p>
                      <pre className="whitespace-pre-wrap break-words rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-[11px] text-rose-900">
                        {job.last_error || '—'}
                      </pre>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminErrorsView() {
  const [data, setData] = useState<ErrorsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [tab, setTab] = useState<'failed' | 'retrying' | 'stuck' | 'cron' | 'cookies'>('failed');

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await getAdminErrors();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Načtení chyb selhalo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 15_000);
    return () => clearInterval(t);
  }, [load]);

  const onRetry = async (id: number) => {
    setBusyId(id);
    try {
      await patchScraperJob(id, 'retry');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Retry selhal');
    } finally {
      setBusyId(null);
    }
  };

  const s = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Scraping errors</h1>
          <p className="mt-1 text-sm text-slate-500">
            Chyby workerů, nedokončené úlohy, cron selhání a chybějící cookies.
            {s ? ` Okno: ${s.windowDays} dní.` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/automations"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Fronta jobů
          </Link>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void load();
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Obnovit
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {(
          [
            ['failed', 'Failed joby', s?.failedJobs ?? '—', 'failed'],
            ['retrying', 'Retry s chybou', s?.retryingWithError ?? '—', 'retrying'],
            ['stuck', 'Stuck running', s?.stuckRunning ?? '—', 'stuck'],
            ['cron', 'Cron errors', s?.cronErrors ?? '—', 'cron'],
            ['cookies', 'Chybějící cookies', s?.missingCookies ?? '—', 'cookies'],
          ] as const
        ).map(([key, label, value, tabKey]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(tabKey)}
            className={`rounded-2xl border p-4 text-left shadow-2xs transition ${
              tab === tabKey
                ? 'border-slate-900 bg-slate-950 text-white'
                : 'border-slate-200/80 bg-white hover:border-slate-300'
            }`}
          >
            <p className={`text-xs font-medium ${tab === tabKey ? 'text-slate-300' : 'text-slate-500'}`}>
              {label}
            </p>
            <p className="mt-1 text-xl font-bold tracking-tight">{loading && !data ? '…' : value}</p>
          </button>
        ))}
      </div>

      {data && data.errorGroups.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-bold text-slate-900">Nejčastější chyby</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {data.errorGroups.slice(0, 8).map((g) => (
              <li key={g.signature} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-slate-800">{g.sample}</p>
                  <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                    ×{g.count}
                  </span>
                </div>
                {g.account_keys.length > 0 && (
                  <p className="mt-1 truncate text-[11px] text-slate-400">
                    {g.account_keys.slice(0, 4).join(' · ')}
                    {g.account_keys.length > 4 ? ` +${g.account_keys.length - 4}` : ''}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-bold text-slate-900">
            {tab === 'failed' && 'Failed scraper joby'}
            {tab === 'retrying' && 'Pending/running s last_error (retry loop)'}
            {tab === 'stuck' && 'Stuck running (>30 min)'}
            {tab === 'cron' && 'Cron job errors'}
            {tab === 'cookies' && 'Účty s chybějícími cookies / Not working'}
          </h2>
        </div>

        {loading && !data ? (
          <div className="py-12 text-center text-sm text-slate-400">Načítám…</div>
        ) : tab === 'cron' ? (
          !data?.cronErrors.length ? (
            <div className="py-8 text-center text-sm text-slate-400">Žádné cron errory.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Job</th>
                    <th className="px-4 py-3">Akce</th>
                    <th className="px-4 py-3">Zpráva</th>
                    <th className="px-4 py-3">Čas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.cronErrors.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-semibold text-slate-900">{log.job_name}</td>
                      <td className="px-4 py-3 text-slate-600">{log.action_type}</td>
                      <td className="max-w-md truncate px-4 py-3 text-rose-800" title={log.message || ''}>
                        {log.message || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDateTime(log.finished_at || log.started_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : tab === 'cookies' ? (
          !data?.missingCookies.length ? (
            <div className="py-8 text-center text-sm text-slate-400">Všechny sledované cookies vypadají OK.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Problémy</th>
                    <th className="px-4 py-3">status_cz</th>
                    <th className="px-4 py-3">status_sk</th>
                    <th className="px-4 py-3">Sbazar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data!.missingCookies.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-semibold text-slate-900">{c.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {c.issues.map((issue) => (
                            <span
                              key={issue}
                              className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900"
                            >
                              {issue}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{c.status_cz || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{c.status_sk || '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{c.sbazar_email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <JobsTable
            jobs={
              tab === 'failed'
                ? data?.failedJobs || []
                : tab === 'retrying'
                  ? data?.retryingJobs || []
                  : data?.stuckJobs || []
            }
            busyId={busyId}
            onRetry={onRetry}
            emptyLabel="Žádné záznamy."
          />
        )}
      </section>
    </div>
  );
}
