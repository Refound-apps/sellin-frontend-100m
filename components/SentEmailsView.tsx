'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { formatDateTime } from './TransactionsView';
import TestEmailForm from './TestEmailForm';
import DailyReportPanel from './DailyReportPanel';

type SentEmail = {
  id: string;
  message_id?: string | null;
  to: string[];
  from: string;
  created_at: string;
  subject: string;
  bcc?: string[] | null;
  cc?: string[] | null;
  reply_to?: string[] | string | null;
  last_event?: string | null;
  scheduled_at?: string | null;
};

type EmailDetail = SentEmail & {
  html?: string | null;
  text?: string | null;
};

const PAGE_SIZE = 50;

const EVENT_STYLE: Record<string, string> = {
  delivered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  sent: 'bg-sky-50 text-sky-800 border-sky-200',
  opened: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  clicked: 'bg-violet-50 text-violet-800 border-violet-200',
  bounced: 'bg-rose-50 text-rose-800 border-rose-200',
  complained: 'bg-rose-50 text-rose-800 border-rose-200',
  delivery_delayed: 'bg-amber-50 text-amber-800 border-amber-200',
  scheduled: 'bg-slate-100 text-slate-700 border-slate-200',
};

function eventClass(event: string | null | undefined) {
  if (!event) return 'bg-slate-100 text-slate-600 border-slate-200';
  return EVENT_STYLE[event] || 'bg-slate-100 text-slate-700 border-slate-200';
}

function formatRecipients(value: string[] | string | null | undefined) {
  if (!value) return '—';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  return String(value);
}

export default function SentEmailsView() {
  const [tab, setTab] = useState<'list' | 'test' | 'daily'>('daily');
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, EmailDetail>>({});
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { append?: boolean; after?: string }) => {
    const append = Boolean(opts?.append);
    try {
      setError(null);
      if (append) setLoadingMore(true);
      else setLoading(true);

      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (opts?.after) params.set('after', opts.after);

      const res = await fetch(`/api/admin/emails?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      const next = (json.data || []) as SentEmail[];
      setEmails((prev) => (append ? [...prev, ...next] : next));
      setHasMore(Boolean(json.has_more));
    } catch (err: any) {
      setError(err?.message || 'Nepodařilo se načíst e-maily.');
      if (!append) setEmails([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loadDetail = async (id: string) => {
    if (details[id]) return;
    setDetailLoadingId(id);
    setDetailError(null);
    try {
      const res = await fetch(`/api/admin/emails/${encodeURIComponent(id)}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setDetails((prev) => ({ ...prev, [id]: json.data as EmailDetail }));
    } catch (err: any) {
      setDetailError(err?.message || 'Nepodařilo se načíst detail.');
    } finally {
      setDetailLoadingId(null);
    }
  };

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetailError(null);
      return;
    }
    setExpandedId(id);
    await loadDetail(id);
  };

  const eventOptions = Array.from(
    new Set(emails.map((e) => e.last_event).filter(Boolean) as string[])
  ).sort();

  const q = search.trim().toLowerCase();
  const filtered = emails.filter((email) => {
    if (eventFilter !== 'all' && email.last_event !== eventFilter) return false;
    if (!q) return true;
    const haystack = [
      email.subject,
      email.from,
      formatRecipients(email.to),
      formatRecipients(email.cc),
      formatRecipients(email.bcc),
      email.id,
      email.last_event || '',
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">E-maily (Resend)</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Denní reporty prodejcům, test odeslání a seznam e-mailů z Resend.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setTab('daily')}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              tab === 'daily' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Denní report
          </button>
          <button
            type="button"
            onClick={() => setTab('list')}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              tab === 'list' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Odeslané
          </button>
          <button
            type="button"
            onClick={() => setTab('test')}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              tab === 'test' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Test odeslání
          </button>
        </div>
      </div>

      {tab === 'daily' ? (
        <DailyReportPanel defaultSeller="duplux@seznam.cz" defaultRecipient="obchod@sellin.cz" />
      ) : tab === 'test' ? (
        <div className="max-w-xl">
          <TestEmailForm
            onSent={() => {
              void load();
            }}
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hledat předmět, příjemce, from…"
              className="min-w-[220px] flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none ring-slate-950/10 placeholder:text-slate-400 focus:border-slate-400 focus:ring-4"
            />
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800"
            >
              <option value="all">Všechny stavy</option>
              {eventOptions.map((event) => (
                <option key={event} value={event}>
                  {event}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Obnovit
            </button>
            <span className="text-[11px] text-slate-500">
              Zobrazeno {filtered.length}
              {q || eventFilter !== 'all' ? ` z ${emails.length}` : ''}
              {hasMore ? ' · další stránky k dispozici' : ''}
            </span>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
            {loading && emails.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">Načítám e-maily z Resend…</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                {emails.length === 0 ? 'Zatím žádné odeslané e-maily.' : 'Žádné e-maily pro zvolený filtr.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Datum</th>
                      <th className="px-4 py-3">Příjemce</th>
                      <th className="px-4 py-3">Předmět</th>
                      <th className="px-4 py-3">From</th>
                      <th className="px-4 py-3">Stav</th>
                      <th className="px-4 py-3">ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((email) => {
                      const open = expandedId === email.id;
                      const detail = details[email.id];
                      const created = formatDateTime(email.created_at);
                      return (
                        <Fragment key={email.id}>
                          <tr
                            className="cursor-pointer hover:bg-slate-50/70"
                            onClick={() => void toggleExpand(email.id)}
                          >
                            <td className="whitespace-nowrap px-4 py-3">
                              <div className="font-medium text-slate-900">{created.short}</div>
                              <div className="text-[10px] text-slate-400">{created.relative}</div>
                            </td>
                            <td className="max-w-[220px] px-4 py-3 font-medium text-slate-900">
                              <span className="line-clamp-2">{formatRecipients(email.to)}</span>
                            </td>
                            <td className="max-w-[280px] px-4 py-3 text-slate-800">
                              <span className="line-clamp-2 font-semibold">{email.subject || '—'}</span>
                            </td>
                            <td className="max-w-[180px] truncate px-4 py-3 text-slate-500">
                              {email.from || '—'}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${eventClass(
                                  email.last_event
                                )}`}
                              >
                                {email.last_event || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-[10px] text-slate-400">
                              {email.id.slice(0, 8)}…
                            </td>
                          </tr>
                          {open && (
                            <tr className="bg-slate-50/60">
                              <td colSpan={6} className="px-4 py-4">
                                {detailLoadingId === email.id && !detail ? (
                                  <p className="text-sm text-slate-400">Načítám detail…</p>
                                ) : detailError && !detail ? (
                                  <p className="text-sm text-rose-700">{detailError}</p>
                                ) : detail ? (
                                  <div className="space-y-3">
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                      <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                          Resend ID
                                        </p>
                                        <p className="mt-0.5 break-all font-mono text-[11px] text-slate-700">
                                          {detail.id}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                          Message ID
                                        </p>
                                        <p className="mt-0.5 break-all font-mono text-[11px] text-slate-700">
                                          {detail.message_id || '—'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                          Reply-To
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-slate-700">
                                          {formatRecipients(
                                            Array.isArray(detail.reply_to)
                                              ? detail.reply_to
                                              : detail.reply_to
                                                ? [detail.reply_to]
                                                : null
                                          )}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                          CC / BCC
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-slate-700">
                                          CC: {formatRecipients(detail.cc)} · BCC:{' '}
                                          {formatRecipients(detail.bcc)}
                                        </p>
                                      </div>
                                    </div>

                                    {detail.text ? (
                                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                          Text
                                        </p>
                                        <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-[12px] leading-relaxed text-slate-800">
                                          {detail.text}
                                        </pre>
                                      </div>
                                    ) : detail.html ? (
                                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                          HTML (zdroj)
                                        </p>
                                        <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed text-slate-700">
                                          {detail.html}
                                        </pre>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-slate-400">Bez těla zprávy.</p>
                                    )}
                                  </div>
                                ) : null}
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
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <button
                type="button"
                disabled={loadingMore || emails.length === 0}
                onClick={() => {
                  const lastId = emails[emails.length - 1]?.id;
                  if (lastId) void load({ append: true, after: lastId });
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40"
              >
                {loadingMore ? 'Načítám…' : 'Načíst další'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
