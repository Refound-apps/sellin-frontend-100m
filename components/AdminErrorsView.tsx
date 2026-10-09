'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getAdminErrors, getAdminErrorScreenshots, patchScraperJob, runNowAllRetryingScraperJobs } from '@/lib/api';
import type { ErrorScreenshot } from '@/lib/api';
import type { CronJobLog, ScraperJob, AppErrorLog } from '@/lib/types';
import { formatDateTime } from './TransactionsView';
import AppErrorsTable from './admin/AppErrorsTable';

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
    appErrorsUnresolved?: number;
    windowDays: number;
  };
  errorGroups: ErrorGroup[];
  appErrors?: AppErrorLog[];
  failedJobs: ScraperJob[];
  retryingJobs: ScraperJob[];
  stuckJobs: ScraperJob[];
  cronErrors: CronJobLog[];
  missingCookies: MissingCookieRow[];
};

type TabKey = 'app_errors' | 'failed' | 'retrying' | 'stuck' | 'cron' | 'cookies' | 'screenshots';

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

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function platformFromName(name: string): string {
  if (/bazos/i.test(name)) return 'Bazoš';
  if (/sbazar/i.test(name)) return 'Sbazar';
  if (/(^|[-_])fb|facebook|fbicko/i.test(name)) return 'Facebook';
  return 'Jiné';
}

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
  onRunNow,
  onCancel,
  emptyLabel,
}: {
  jobs: ScraperJob[];
  busyId: number | null;
  onRunNow: (id: number) => void;
  onCancel?: (id: number) => void;
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
            <th className="px-4 py-3">run_after</th>
            <th className="px-4 py-3">Akce</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {jobs.map((job) => {
            const open = expandedId === job.id;
            const canRun =
              job.status === 'pending' ||
              job.status === 'running' ||
              job.status === 'failed' ||
              job.status === 'cancelled';
            const canCancel = job.status === 'pending' || job.status === 'running';
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
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {formatDateTime(job.run_after || job.finished_at || job.started_at || job.created_at).short}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {canRun && (
                        <button
                          type="button"
                          disabled={busyId === job.id}
                          onClick={() => onRunNow(job.id)}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-40"
                        >
                          {busyId === job.id ? '…' : 'Spustit teď'}
                        </button>
                      )}
                      {canCancel && onCancel && (
                        <button
                          type="button"
                          disabled={busyId === job.id}
                          onClick={() => onCancel(job.id)}
                          className="rounded-lg border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40"
                        >
                          Zrušit
                        </button>
                      )}
                    </div>
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

function ScreenshotsGallery({
  items,
  total,
  loading,
  platform,
  query,
  onPlatform,
  onQuery,
  onRefresh,
}: {
  items: ErrorScreenshot[];
  total: number;
  loading: boolean;
  platform: string;
  query: string;
  onPlatform: (p: string) => void;
  onQuery: (q: string) => void;
  onRefresh: () => void;
}) {
  const [preview, setPreview] = useState<ErrorScreenshot | null>(null);

  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreview(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [preview]);

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ['', 'Vše'],
              ['bazos', 'Bazoš'],
              ['sbazar', 'Sbazar'],
              ['facebook', 'Facebook'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value || 'all'}
              type="button"
              onClick={() => onPlatform(value)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                platform === value
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
          <span className="text-[11px] text-slate-400">
            {loading ? 'Načítám…' : `${items.length} / ${total}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Filtrovat název…"
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-400 sm:w-52"
          />
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
          >
            Obnovit
          </button>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">Načítám screenshoty z VPS…</div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">Žádné error screenshoty.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((shot) => (
            <button
              key={`${shot.name}-${shot.mtime}`}
              type="button"
              onClick={() => setPreview(shot)}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left transition hover:border-slate-400 hover:shadow-sm"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={shot.url}
                  alt={shot.name}
                  loading="lazy"
                  className="h-full w-full object-cover object-top transition group-hover:scale-[1.02]"
                />
              </div>
              <div className="space-y-1 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    {platformFromName(shot.name)}
                  </span>
                  <span className="text-[10px] text-slate-400">{formatBytes(shot.size)}</span>
                </div>
                <p className="truncate text-[11px] font-semibold text-slate-800" title={shot.name}>
                  {shot.name}
                </p>
                <p className="text-[10px] text-slate-400">{formatDateTime(shot.mtime).short}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
          onClick={() => setPreview(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{preview.name}</p>
                <p className="text-xs text-slate-500">
                  {platformFromName(preview.name)} · {formatDateTime(preview.mtime).short} ·{' '}
                  {formatBytes(preview.size)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Otevřít
                </a>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white"
                >
                  Zavřít
                </button>
              </div>
            </div>
            <div className="overflow-auto bg-slate-100 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview.url} alt={preview.name} className="mx-auto max-w-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminErrorsView() {
  const [data, setData] = useState<ErrorsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [tab, setTab] = useState<TabKey>('app_errors');

  const [shots, setShots] = useState<ErrorScreenshot[]>([]);
  const [shotsTotal, setShotsTotal] = useState(0);
  const [shotsLoading, setShotsLoading] = useState(false);
  const [shotsPlatform, setShotsPlatform] = useState('');
  const [shotsQuery, setShotsQuery] = useState('');
  const [shotsError, setShotsError] = useState<string | null>(null);
  const [appErrorsRefreshKey, setAppErrorsRefreshKey] = useState(0);

  const handleAppErrorsCountChange = useCallback((unresolved: number) => {
    setData((prev) => {
      if (!prev || prev.summary.appErrorsUnresolved === unresolved) return prev;
      return {
        ...prev,
        summary: {
          ...prev.summary,
          appErrorsUnresolved: unresolved,
        },
      };
    });
  }, []);

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

  const loadShots = useCallback(async () => {
    try {
      setShotsError(null);
      setShotsLoading(true);
      const res = await getAdminErrorScreenshots({
        limit: 120,
        platform: shotsPlatform || undefined,
        q: shotsQuery.trim() || undefined,
      });
      setShots(res.data);
      setShotsTotal(res.total);
    } catch (err: any) {
      setShotsError(err?.message || 'Načtení screenshotů selhalo');
    } finally {
      setShotsLoading(false);
    }
  }, [shotsPlatform, shotsQuery]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 15_000);
    return () => clearInterval(t);
  }, [load]);

  // Přednačti počet screenshotů pro summary kartu
  useEffect(() => {
    void getAdminErrorScreenshots({ limit: 1 })
      .then((res) => setShotsTotal(res.total))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab !== 'screenshots') return;
    const handle = window.setTimeout(() => void loadShots(), shotsQuery ? 250 : 0);
    return () => window.clearTimeout(handle);
  }, [tab, loadShots, shotsQuery]);

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

  const onRunAllRetrying = async () => {
    const n = data?.retryingJobs?.length || data?.summary?.retryingWithError || 0;
    if (!n) return;
    if (!confirm(`Spustit teď všechny joby v retry loop (${n}+)? Nastaví run_after=now.`)) return;
    setBusyId(-1);
    try {
      const count = await runNowAllRetryingScraperJobs();
      setError(null);
      await load();
      if (count === 0) setError('Žádné joby k přesunutí (možná už běží).');
    } catch (err: any) {
      setError(err?.message || 'Bulk spuštění selhalo');
    } finally {
      setBusyId(null);
    }
  };

  const s = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Chyby a monitoring systému</h1>
          <p className="mt-1 text-sm text-slate-500">
            Přehled chyb aplikace (Frontend / Backend), scraperů, cron úloh, chybějících cookies a screenshotů.
            {s ? ` Okno scraper jobů: ${s.windowDays} dní.` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/automations"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Fronta jobů
          </Link>
          <a
            href="https://errors.sellin.cz"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            errors.sellin.cz
          </a>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void load();
              if (tab === 'screenshots') void loadShots();
              if (tab === 'app_errors') setAppErrorsRefreshKey((k) => k + 1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Obnovit
          </button>
        </div>
      </div>

      {(error || shotsError) && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error || shotsError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {(
          [
            ['app_errors', 'Chyby aplikace (FE/BE)', s?.appErrorsUnresolved ?? '—', 'app_errors'],
            ['failed', 'Failed scrapery', s?.failedJobs ?? '—', 'failed'],
            ['retrying', 'Retry s chybou', s?.retryingWithError ?? '—', 'retrying'],
            ['stuck', 'Stuck running', s?.stuckRunning ?? '—', 'stuck'],
            ['cron', 'Cron errors', s?.cronErrors ?? '—', 'cron'],
            ['cookies', 'Chybějící cookies', s?.missingCookies ?? '—', 'cookies'],
            ['screenshots', 'Error screenshots', shotsTotal || '—', 'screenshots'],
          ] as const
        ).map(([key, label, value, tabKey]) => {
          const isAppErrors = tabKey === 'app_errors';
          const hasUnresolved = isAppErrors && typeof value === 'number' && value > 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(tabKey)}
              className={`rounded-2xl border p-4 text-left shadow-2xs transition ${
                tab === tabKey
                  ? 'border-slate-900 bg-slate-950 text-white'
                  : hasUnresolved
                    ? 'border-rose-300 bg-rose-50/70 hover:border-rose-400'
                    : 'border-slate-200/80 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className={`text-xs font-medium ${
                  tab === tabKey
                    ? 'text-slate-300'
                    : hasUnresolved
                      ? 'text-rose-800 font-bold'
                      : 'text-slate-500'
                }`}>
                  {label}
                </p>
                {hasUnresolved && tab !== tabKey && (
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </div>
              <p className={`mt-1 text-xl font-bold tracking-tight ${
                hasUnresolved && tab !== tabKey ? 'text-rose-900' : ''
              }`}>
                {tabKey === 'screenshots'
                  ? shotsLoading && !shotsTotal
                    ? '…'
                    : value
                  : loading && !data
                    ? '…'
                    : value}
              </p>
            </button>
          );
        })}
      </div>

      {data && data.errorGroups.length > 0 && tab !== 'screenshots' && tab !== 'app_errors' && (
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-bold text-slate-900">Nejčastější chyby scraperů</h2>
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
        {tab !== 'screenshots' && tab !== 'app_errors' && (
          <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              {tab === 'failed' && 'Failed scraper joby'}
              {tab === 'retrying' && 'Pending/running s last_error (retry loop)'}
              {tab === 'stuck' && 'Stuck running (>30 min)'}
              {tab === 'cron' && 'Cron job errors'}
              {tab === 'cookies' && 'Účty s chybějícími cookies / Not working'}
            </h2>
            {(tab === 'retrying' || tab === 'stuck' || tab === 'failed') && (
              <button
                type="button"
                disabled={busyId === -1 || loading}
                onClick={() => void onRunAllRetrying()}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-40"
              >
                {busyId === -1 ? 'Spouštím…' : 'Spustit všechny retry teď'}
              </button>
            )}
          </div>
        )}

        {tab === 'app_errors' ? (
          <AppErrorsTable
            initialItems={data?.appErrors}
            onCountsChange={handleAppErrorsCountChange}
            refreshKey={appErrorsRefreshKey}
          />
        ) : tab === 'screenshots' ? (
          <ScreenshotsGallery
            items={shots}
            total={shotsTotal}
            loading={shotsLoading}
            platform={shotsPlatform}
            query={shotsQuery}
            onPlatform={setShotsPlatform}
            onQuery={setShotsQuery}
            onRefresh={() => void loadShots()}
          />
        ) : loading && !data ? (
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
                        {formatDateTime(log.finished_at || log.started_at).short}
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
            onRunNow={onRunNow}
            onCancel={onCancel}
            emptyLabel="Žádné záznamy."
          />
        )}
      </section>
    </div>
  );
}
