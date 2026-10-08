'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { User } from '@/lib/types';
import { getAdminUsers } from '@/lib/api';
import { formatPhoneNumber } from './offerStatus';
import { formatDateTime } from './TransactionsView';
import AdminUserEditModal from './AdminUserEditModal';

type StatusFilter = 'all' | 'ok' | 'not-working' | 'unknown' | 'has-errors';
type PlatformFilter = 'all' | 'bazos' | 'sbazar' | 'facebook';

type AccountGroup = {
  key: string;
  main: User;
  subs: User[];
  lastActivityMs: number;
  errorCount: number;
};

function statusInfo(status: string | null) {
  if (status === 'OK') {
    return {
      label: 'OK',
      dot: 'bg-emerald-500',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
    };
  }
  if (status && status.toLowerCase().includes('not working')) {
    return {
      label: 'Not working',
      dot: 'bg-rose-500',
      badge: 'bg-rose-50 text-rose-800 border-rose-200/90',
    };
  }
  return {
    label: status || '—',
    dot: 'bg-slate-400',
    badge: 'bg-slate-50 text-slate-700 border-slate-200/90',
  };
}

function matchesSearch(user: User, query: string) {
  const cleanPhone = (user.telephone1 || '').replace(/\s+/g, '');
  const cleanPhone2 = (user.telephone2 || '').replace(/\s+/g, '');
  const haystack = [
    user.email,
    user.telephone1,
    cleanPhone,
    user.telephone2,
    cleanPhone2,
    user.bazos_name,
    user.bazos_email,
    user.sbazar_email,
    user.facebook_email,
    user.location,
    user.zipcode,
    user.zipcode_sk,
    user.proxy_ip,
    user.bazos_bkod,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

function groupKeyFor(user: User): string {
  const sb = (user.sbazar_email || '').toLowerCase().trim();
  if (sb) return `sbazar:${sb}`;
  return `email:${(user.email || '').toLowerCase().trim()}`;
}

function pickMain(members: User[]): User {
  const bySbazar = members.find(
    (m) =>
      m.sbazar_email &&
      m.email &&
      m.email.toLowerCase().trim() === m.sbazar_email.toLowerCase().trim()
  );
  if (bySbazar) return bySbazar;
  const withAuth = members.find((m) => m.user_id);
  if (withAuth) return withAuth;
  return [...members].sort((a, b) => a.id - b.id)[0];
}

function buildGroups(users: User[]): AccountGroup[] {
  const map = new Map<string, User[]>();
  for (const u of users) {
    const key = groupKeyFor(u);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(u);
  }

  const groups: AccountGroup[] = [];
  for (const [key, members] of map) {
    const main = pickMain(members);
    const subs = members
      .filter((m) => m.id !== main.id)
      .sort((a, b) => (a.bazos_name || a.email).localeCompare(b.bazos_name || b.email, 'cs'));
    const lastActivityMs = Math.max(
      0,
      ...members.map((m) => (m.last_sign_in_at ? new Date(m.last_sign_in_at).getTime() : 0))
    );
    const errorCount = members.reduce((sum, m) => sum + (m.error_count || 0), 0);
    groups.push({ key, main, subs, lastActivityMs, errorCount });
  }

  groups.sort((a, b) => {
    if (b.lastActivityMs !== a.lastActivityMs) return b.lastActivityMs - a.lastActivityMs;
    if (b.errorCount !== a.errorCount) return b.errorCount - a.errorCount;
    return a.main.email.localeCompare(b.main.email, 'cs');
  });

  return groups;
}

function CookieChips({ user }: { user: User }) {
  const c = user.cookies || {
    has_bazos_bkod: Boolean(user.bazos_bkod?.trim()),
    has_bazos_sk_bkod: Boolean(user.bazos_sk_bkod?.trim()),
    has_sbazar_cookie: Boolean(user.sbazar_cookie_ds?.trim()),
    has_facebook_cookies: Boolean(user.facebook_cuser?.trim() && user.facebook_xs?.trim()),
    has_proxy: Boolean(user.proxy_ip?.trim()),
    has_proxy_sbazar: Boolean(user.proxy_ip_sbazar?.trim()),
  };

  const chip = (ok: boolean, label: string) => (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${
        ok
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-slate-200 bg-slate-50 text-slate-400'
      }`}
      title={ok ? `${label}: OK` : `${label}: chybí`}
    >
      {label}
    </span>
  );

  return (
    <div className="flex flex-wrap gap-1">
      {chip(c.has_bazos_bkod, 'CZ')}
      {chip(c.has_bazos_sk_bkod, 'SK')}
      {chip(c.has_sbazar_cookie, 'Sbazar')}
      {chip(c.has_proxy, 'Proxy')}
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
          statusInfo(user.status_cz).badge
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${statusInfo(user.status_cz).dot}`} />
        {statusInfo(user.status_cz).label}
      </span>
    </div>
  );
}

function AccountRow({
  user,
  isSub,
  hasSubs,
  subCount,
  expanded,
  onToggle,
  onOpen,
}: {
  user: User;
  isSub?: boolean;
  hasSubs?: boolean;
  subCount?: number;
  expanded?: boolean;
  onToggle?: () => void;
  onOpen: (u: User) => void;
}) {
  return (
    <tr
      onClick={() => onOpen(user)}
      className={`cursor-pointer transition-colors hover:bg-slate-50/80 ${
        isSub ? 'bg-slate-50/40' : ''
      }`}
    >
      <td className="px-4 py-3 sm:px-5">
        <div className={`flex items-start gap-2 ${isSub ? 'pl-6' : ''}`}>
          {!isSub && hasSubs ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle?.();
              }}
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label={expanded ? 'Sbalit subúčty' : 'Rozbalit subúčty'}
            >
              <svg
                className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <span className={`mt-0.5 h-6 w-6 shrink-0 ${isSub ? 'ml-3 border-l border-slate-200' : ''}`} />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-bold text-slate-950">
                {user.bazos_name || user.email}
              </span>
              {isSub && (
                <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                  subúčet
                </span>
              )}
              {!isSub && hasSubs && subCount ? (
                <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                  +{subCount} sub
                </span>
              ) : null}
            </div>
            <div className="truncate text-xs text-slate-500">{user.email}</div>
            {user.telephone1 && (
              <div className="mt-0.5 text-[11px] text-slate-400">
                {formatPhoneNumber(user.telephone1)}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 sm:px-5">
        <CookieChips user={user} />
      </td>
      <td className="px-4 py-3 text-center sm:px-5">
        {(user.error_count || 0) > 0 ? (
          <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-black text-rose-800">
            {user.error_count}
          </span>
        ) : (
          <span className="text-xs text-slate-400">0</span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600 sm:px-5">
        {user.last_sign_in_at ? (
          <div>
            <div className="font-semibold text-slate-800">
              {formatDateTime(user.last_sign_in_at).relative}
            </div>
            <div className="text-[10px] text-slate-400">
              {formatDateTime(user.last_sign_in_at).short}
            </div>
          </div>
        ) : (
          <span className="italic text-slate-400">bez přihlášení</span>
        )}
      </td>
      <td className="px-4 py-3 text-right sm:px-5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(user);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-50"
        >
          Detail
        </button>
      </td>
    </tr>
  );
}

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    void loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      setError('Nepodařilo se načíst uživatele. Zkuste to prosím znovu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (searchQuery && !matchesSearch(user, searchQuery)) return false;
      if (statusFilter === 'ok' && user.status_cz !== 'OK') return false;
      if (
        statusFilter === 'not-working' &&
        (!user.status_cz || !user.status_cz.toLowerCase().includes('not working'))
      ) {
        return false;
      }
      if (statusFilter === 'unknown' && user.status_cz) return false;
      if (statusFilter === 'has-errors' && !(user.error_count && user.error_count > 0)) return false;
      if (platformFilter === 'bazos' && !user.bazos_email) return false;
      if (platformFilter === 'sbazar' && !user.sbazar_email) return false;
      if (platformFilter === 'facebook' && !user.facebook_email) return false;
      return true;
    });
  }, [users, searchQuery, statusFilter, platformFilter]);

  const groups = useMemo(() => {
    // If searching, include full groups when any member matches
    if (!searchQuery && statusFilter === 'all' && platformFilter === 'all') {
      return buildGroups(users);
    }
    const matchedIds = new Set(filteredUsers.map((u) => u.id));
    const related = users.filter((u) => {
      if (matchedIds.has(u.id)) return true;
      // keep siblings of matched accounts for expand context
      const key = groupKeyFor(u);
      return filteredUsers.some((f) => groupKeyFor(f) === key);
    });
    return buildGroups(related).filter((g) =>
      [g.main, ...g.subs].some((m) => matchedIds.has(m.id))
    );
  }, [users, filteredUsers, searchQuery, statusFilter, platformFilter]);

  useEffect(() => {
    // Auto-expand groups when searching
    if (searchQuery) {
      setExpanded(new Set(groups.map((g) => g.key)));
    }
  }, [searchQuery, groups]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      groups: buildGroups(users).length,
      ok: users.filter((user) => user.status_cz === 'OK').length,
      errors: users.reduce((s, u) => s + (u.error_count || 0), 0),
      withLogin: users.filter((u) => u.last_sign_in_at).length,
    };
  }, [users]);

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Správa systému · Účty & cookies
          </span>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Uživatelé a prodejci
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Seřazeno podle posledního přihlášení. Subúčty (sdílený Sbazar) rozbalíš u hlavního účtu.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <Link
            href="/admin/errors"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-800 hover:bg-rose-100 sm:text-sm"
          >
            Scraping errors
          </Link>
          <Link
            href="/accounts"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 sm:text-sm"
          >
            Napojení účtů
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Účty</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {stats.total}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">{stats.groups} skupin</p>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Status OK</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-emerald-700 sm:text-3xl">
            {stats.ok}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Job errory</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-rose-700 sm:text-3xl">
            {stats.errors}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">posledních 14 dní</p>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">S loginem</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {stats.withLogin}
          </p>
        </div>
        <div className="col-span-2 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs lg:col-span-1 sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Obnovit</p>
          <button
            type="button"
            onClick={() => void loadUsers()}
            className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100"
          >
            Načíst znovu
          </button>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearchQuery(searchInput.trim().toLowerCase());
          }}
        >
          <div className="relative">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Hledat e-mail, telefon, bkod, proxy…"
              className="w-full rounded-2xl border border-slate-200/90 bg-white py-3 pl-4 pr-28 text-sm text-slate-900 shadow-2xs outline-none focus:border-slate-400"
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setSearchQuery('');
                  }}
                  className="rounded-xl px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Reset
                </button>
              )}
              <button
                type="submit"
                className="rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-bold text-white"
              >
                Hledat
              </button>
            </div>
          </div>
        </form>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'Vše'],
              ['ok', 'Cookie OK'],
              ['not-working', 'Not working'],
              ['has-errors', 'S errory'],
              ['unknown', 'Bez statusu'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatusFilter(id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                statusFilter === id
                  ? 'border-slate-900 bg-slate-950 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
          <span className="mx-1 h-6 w-px bg-slate-200" />
          {(
            [
              ['all', 'Všechny platformy'],
              ['bazos', 'Bazoš'],
              ['sbazar', 'Sbazar'],
              ['facebook', 'Facebook'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPlatformFilter(id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                platformFilter === id
                  ? 'border-slate-900 bg-slate-950 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200/90 bg-white py-16 text-center text-sm text-slate-400 shadow-2xs">
          Načítám uživatele…
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-8 text-center shadow-2xs">
          <p className="text-sm font-bold text-rose-800">{error}</p>
          <button
            onClick={() => void loadUsers()}
            className="mt-4 rounded-xl bg-rose-700 px-5 py-2 text-xs font-bold text-white"
          >
            Zkusit znovu
          </button>
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center shadow-2xs">
          <h3 className="text-base font-bold text-slate-950">Žádní uživatelé</h3>
          <p className="mt-1 text-xs text-slate-500">Pro zvolené filtry nic nenalezeno.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs sm:rounded-3xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 sm:px-5">
                    Účet / subúčty
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 sm:px-5">
                    Cookie stav
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-slate-700 sm:px-5">
                    Errory
                  </th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 sm:px-5">
                    Poslední login
                  </th>
                  <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-700 sm:px-5">
                    Akce
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groups.map((group) => {
                  const open = expanded.has(group.key);
                  return (
                    <Fragment key={group.key}>
                      <AccountRow
                        user={{
                          ...group.main,
                          error_count: group.main.error_count || 0,
                          // Show newest login in the group (sub may own the auth session)
                          last_sign_in_at:
                            group.lastActivityMs > 0
                              ? new Date(group.lastActivityMs).toISOString()
                              : group.main.last_sign_in_at,
                        }}
                        hasSubs={group.subs.length > 0}
                        subCount={group.subs.length}
                        expanded={open}
                        onToggle={() => toggle(group.key)}
                        onOpen={setSelectedUser}
                      />
                      {open &&
                        group.subs.map((sub) => (
                          <AccountRow
                            key={sub.id}
                            user={sub}
                            isSub
                            onOpen={setSelectedUser}
                          />
                        ))}
                      {!open && group.subs.length > 0 && (
                        <tr className="bg-slate-50/30">
                          <td colSpan={5} className="px-4 py-2 sm:px-5">
                            <button
                              type="button"
                              onClick={() => toggle(group.key)}
                              className="pl-10 text-left text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                            >
                              ▸ {group.subs.length} subúčtů · errory celkem {group.errorCount}
                            </button>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedUser && (
        <AdminUserEditModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSaved={(updated) => {
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
            setSelectedUser((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
          }}
        />
      )}
    </div>
  );
}
