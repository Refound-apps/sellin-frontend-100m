'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getOfferById, getTransactions } from '@/lib/api';
import { Offer, OfferDetail } from '@/lib/types';
import OfferModal from './OfferModal';

type ConditionFilter = 'all' | 'errors' | 'ok_created' | 'ok_deleted' | 'ok_updated' | 'ok_topped';
type MarketplaceFilter = 'all' | 'bazos' | 'bazos_sk' | 'sbazar' | 'facebook';
type AutorenewFilter = 'all' | 'enabled' | 'disabled';
type ViewMode = 'table' | 'cards';

interface StatsState {
  total: number;
  success: number;
  errors: number;
  autorenewActive: number;
}

/** Formátuje datum a relativní čas v přirozené češtině */
export function formatDateTime(isoString: string | null | undefined): {
  formatted: string;
  relative: string;
  short: string;
} {
  if (!isoString) {
    return { formatted: '—', relative: '—', short: '—' };
  }

  const d = new Date(isoString);
  if (isNaN(d.getTime())) {
    return { formatted: String(isoString), relative: String(isoString), short: String(isoString) };
  }

  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  const formatted = `${day}. ${month}. ${year} ${hours}:${minutes}:${seconds}`;
  const short = `${day}. ${month}. ${year} ${hours}:${minutes}`;

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  let relative = '';
  if (diffMs < 0) {
    // V budoucnu (např. next_date_renew)
    const futureDays = Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
    if (futureDays === 1) {
      relative = `zítra v ${hours}:${minutes}`;
    } else {
      relative = `za ${futureDays} dní (${day}. ${month}.)`;
    }
  } else if (diffMins < 2) {
    relative = 'Před chvílí';
  } else if (diffMins < 60) {
    relative = `před ${diffMins} min`;
  } else if (isToday) {
    relative = `dnes v ${hours}:${minutes}`;
  } else if (isYesterday) {
    relative = `včera v ${hours}:${minutes}`;
  } else if (diffHours < 24 * 7) {
    const days = Math.floor(diffHours / 24);
    relative = `před ${days} dny (${day}. ${month}.)`;
  } else {
    relative = `${day}. ${month}. ${year}`;
  }

  return { formatted, relative, short };
}

/** Informace o stavu synchronizace */
export function getConditionInfo(condition: string | null | undefined): {
  label: string;
  badgeClass: string;
  dotClass: string;
  isError: boolean;
  icon: string;
  description: string;
} {
  const c = (condition || '').toLowerCase().trim();

  if (c === 'ok_created') {
    return {
      label: 'Vloženo OK',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
      dotClass: 'bg-emerald-500',
      isError: false,
      icon: '✓',
      description: 'Inzerát byl úspěšně nahrán a aktivován na portálu.',
    };
  }
  if (c === 'ok_updated') {
    return {
      label: 'Aktualizováno',
      badgeClass: 'bg-sky-50 text-sky-800 border-sky-200/90',
      dotClass: 'bg-sky-500',
      isError: false,
      icon: '↻',
      description: 'Změny v inzerátu byly úspěšně synchronizovány.',
    };
  }
  if (c === 'ok_topped') {
    return {
      label: 'Topováno',
      badgeClass: 'bg-purple-50 text-purple-800 border-purple-200/90',
      dotClass: 'bg-purple-500',
      isError: false,
      icon: '⚡',
      description: 'Inzerát byl úspěšně posunut na přední pozice (TOP).',
    };
  }
  if (c === 'ok_deleted') {
    return {
      label: 'Smazáno',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/90',
      dotClass: 'bg-slate-400',
      isError: false,
      icon: '🗑',
      description: 'Inzerát byl úspěšně stažen z inzertního portálu.',
    };
  }
  if (c.includes('error') || c.includes('fail') || c.includes('blocked')) {
    return {
      label: 'Chyba nahrání',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200/90',
      dotClass: 'bg-rose-500',
      isError: true,
      icon: '⚠️',
      description: condition || 'Při synchronizaci inzerátu došlo k chybě.',
    };
  }

  return {
    label: condition || 'Neznámý stav',
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
    isError: false,
    icon: '•',
    description: condition || 'Stav nebyl specifikován.',
  };
}

/** Informace o tržišti */
export function getMarketplaceInfo(marketplace: string | null | undefined): {
  name: string;
  badgeClass: string;
  tagColor: string;
  icon: string;
} {
  const m = (marketplace || '').toLowerCase().trim();

  if (m.includes('sk')) {
    return {
      name: 'Bazoš.sk',
      badgeClass: 'bg-amber-500/10 text-amber-900 border-amber-300/80',
      tagColor: '#F59E0B',
      icon: '🇸🇰',
    };
  }
  if (m.includes('bazo')) {
    return {
      name: 'Bazoš.cz',
      badgeClass: 'bg-amber-500/10 text-amber-900 border-amber-300/80',
      tagColor: '#F59E0B',
      icon: '🏷️',
    };
  }
  if (m.includes('sbazar')) {
    return {
      name: 'Sbazar.cz',
      badgeClass: 'bg-rose-500/10 text-rose-900 border-rose-300/80',
      tagColor: '#DC2626',
      icon: '🔴',
    };
  }
  if (m.includes('facebook') || m.includes('fb')) {
    return {
      name: 'Facebook',
      badgeClass: 'bg-blue-500/10 text-blue-900 border-blue-300/80',
      tagColor: '#1877F2',
      icon: '🌐',
    };
  }

  return {
    name: marketplace || 'Inzertní portál',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    tagColor: '#64748B',
    icon: '📦',
  };
}

export default function TransactionsView() {
  const router = useRouter();
  const supabase = createClient();

  // Role verification
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Data & loading
  const [transactions, setTransactions] = useState<OfferDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [stats, setStats] = useState<StatsState>({
    total: 0,
    success: 0,
    errors: 0,
    autorenewActive: 0,
  });

  // Filters & pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [marketplaceFilter, setMarketplaceFilter] = useState<MarketplaceFilter>('all');
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter>('all');
  const [autorenewFilter, setAutorenewFilter] = useState<AutorenewFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Modals & UI helpers
  const [selectedTx, setSelectedTx] = useState<OfferDetail | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [loadingOfferId, setLoadingOfferId] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 1. Check user role
  useEffect(() => {
    async function checkRole() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login?redirect=/transactions');
          return;
        }

        const { data: credential } = await supabase
          .from('credential_pg')
          .select('role')
          .or(`user_id.eq.${user.id},email.ilike.${user.email}`)
          .limit(1)
          .maybeSingle();

        const role = credential?.role ?? 'seller';
        setIsAdmin(role === 'admin');
      } catch (err) {
        console.error('Error verifying admin role:', err);
        setIsAdmin(false);
      } finally {
        setAuthChecking(false);
      }
    }

    checkRole();
  }, [supabase, router]);

  // 2. Fetch transactions from API
  const fetchTransactions = useCallback(async () => {
    if (isAdmin !== true) return;

    try {
      setLoading(true);
      setError(null);

      const offset = (page - 1) * pageSize;
      const res = await getTransactions({
        limit: pageSize,
        offset,
        search: searchQuery,
        marketplace: marketplaceFilter,
        condition: conditionFilter,
        autorenew: autorenewFilter,
      });

      if (res.success) {
        setTransactions(res.data);
        setTotalCount(res.total);
        if (res.stats) {
          setStats(res.stats);
        }
        setLastUpdated(new Date());
      } else {
        throw new Error('Chyba při načítání transakcí ze serveru.');
      }
    } catch (err: unknown) {
      console.error('Error fetching transactions:', err);
      setError('Nepodařilo se načíst transakce ze serveru. Zkontrolujte připojení k backendu.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, page, pageSize, searchQuery, marketplaceFilter, conditionFilter, autorenewFilter]);

  useEffect(() => {
    if (isAdmin === true) {
      fetchTransactions();
    }
  }, [isAdmin, fetchTransactions]);

  // 3. Auto-refresh interval (15 seconds)
  useEffect(() => {
    if (!autoRefresh || isAdmin !== true) return;
    const interval = setInterval(() => {
      fetchTransactions();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, isAdmin, fetchTransactions]);

  // Open Offer Modal
  const handleOpenOffer = async (tx: OfferDetail) => {
    if (!tx.offer_id) {
      alert('Tento inzerát nemá přiřazené ID nabídky v systému.');
      return;
    }
    try {
      setLoadingOfferId(tx.offer_id);
      const offer = await getOfferById(tx.offer_id);
      if (offer) {
        setSelectedOffer(offer);
      } else {
        alert(`Inzerát #${tx.offer_id} nebyl v databázi nalezen.`);
      }
    } catch (err) {
      console.error('Error loading offer:', err);
      alert('Nepodařilo se načíst detail inzerátu.');
    } finally {
      setLoadingOfferId(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalCount / pageSize));
  }, [totalCount, pageSize]);

  // Loading state
  if (authChecking) {
    return (
      <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center shadow-2xs">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
        <p className="mt-3 text-xs font-semibold text-slate-500">Ověřuji administrátorská oprávnění…</p>
      </div>
    );
  }

  // Access denied
  if (isAdmin === false) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-8 sm:p-12 text-center shadow-2xs max-w-xl mx-auto my-8">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-2xs">
          🔒
        </div>
        <h2 className="text-xl font-black text-rose-950">Přístup odepřen</h2>
        <p className="mt-2 text-xs sm:text-sm font-medium text-rose-800">
          Tato sekce transakcí a synchronizace inzerce je dostupná výhradně pro administrátorský účet.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-all"
        >
          Zpět na přehled
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 text-xs font-bold text-slate-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              Pouze administrátor
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Živá synchronizace
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
            Transakce inzerátů
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl">
            Audit a historie synchronizací na inzertní tržiště (Bazoš, Sbazar, Facebook), stavy nahrávání a plánované auto-obnovy řazené od nejnovějších.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Live auto-refresh toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all shadow-2xs ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
            }`}
            title={autoRefresh ? 'Živá obnova každých 15s je zapnutá' : 'Zapnout živou obnovu'}
          >
            <span className={`h-2 w-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            {autoRefresh ? 'Živá obnova (15s)' : 'Zapnout auto-obnovu'}
          </button>

          {/* Manual refresh button */}
          <button
            type="button"
            onClick={fetchTransactions}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all disabled:opacity-50"
          >
            <svg
              className={`h-3.5 w-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Obnovit
          </button>
        </div>
      </div>

      {/* 2. Top KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Celkem transakcí */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Celkem transakcí</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 text-sm">
              📊
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
            {stats.total.toLocaleString('cs-CZ')}
          </p>
          <span className="mt-1 inline-block text-[11px] font-medium text-slate-400">
            zaznamenaných v databázi
          </span>
        </div>

        {/* Úspěšné nahrání */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Úspěšně vloženo</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-sm">
              ✓
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-emerald-700">
            {stats.success.toLocaleString('cs-CZ')}
          </p>
          <span className="mt-1 inline-block text-[11px] font-bold text-emerald-600">
            {stats.total > 0 ? `${Math.round((stats.success / stats.total) * 100)} % úspěšnost` : '—'}
          </span>
        </div>

        {/* Chyby a blokace */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Chyby a blokace</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-700 border border-rose-200/60 text-sm">
              ⚠️
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-rose-700">
            {stats.errors.toLocaleString('cs-CZ')}
          </p>
          <span className="mt-1 inline-block text-[11px] font-bold text-rose-600">
            vyžaduje pozornost
          </span>
        </div>

        {/* Aktivní auto-obnova */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Aktivní auto-obnova</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60 text-sm">
              ⚡
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-blue-700">
            {stats.autorenewActive.toLocaleString('cs-CZ')}
          </p>
          <span className="mt-1 inline-block text-[11px] font-medium text-slate-500">
            inzerátů s plánovaným TOP
          </span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <svg
              className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Hledat podle názvu inzerátu, odkazu na Bazoš, e-mailu prodejce nebo ID..."
              className="w-full rounded-2xl border border-slate-200/90 bg-white py-3 pl-11 pr-10 text-xs sm:text-sm font-medium text-slate-950 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title="Vymazat hledání"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            className="rounded-xl bg-slate-950 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-slate-800 active:scale-95 transition-all"
          >
            Vyhledat
          </button>
        </form>

        {/* Filter dropdowns & View switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Tržiště */}
            <select
              value={marketplaceFilter}
              onChange={(e) => {
                setMarketplaceFilter(e.target.value as MarketplaceFilter);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200/90 bg-white px-3 py-2 font-bold text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 shadow-2xs"
            >
              <option value="all">Všechna tržiště</option>
              <option value="bazos">Bazoš.cz</option>
              <option value="bazos_sk">Bazoš.sk</option>
              <option value="sbazar">Sbazar.cz</option>
              <option value="facebook">Facebook Marketplace</option>
            </select>

            {/* Stav */}
            <select
              value={conditionFilter}
              onChange={(e) => {
                setConditionFilter(e.target.value as ConditionFilter);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200/90 bg-white px-3 py-2 font-bold text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 shadow-2xs"
            >
              <option value="all">Všechny stavy</option>
              <option value="ok_created">Pouze Vloženo (ok_created)</option>
              <option value="ok_updated">Pouze Aktualizováno (ok_updated)</option>
              <option value="ok_topped">Pouze Topováno (ok_topped)</option>
              <option value="ok_deleted">Pouze Smazáno (ok_deleted)</option>
              <option value="errors">Pouze Chyby a blokace</option>
            </select>

            {/* Auto-obnova */}
            <select
              value={autorenewFilter}
              onChange={(e) => {
                setAutorenewFilter(e.target.value as AutorenewFilter);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200/90 bg-white px-3 py-2 font-bold text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 shadow-2xs"
            >
              <option value="all">Všechny obnovy</option>
              <option value="enabled">S aktivní auto-obnovou</option>
              <option value="disabled">Bez auto-obnovy</option>
            </select>

            {/* Počet na stranu */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-xl border border-slate-200/90 bg-white px-3 py-2 font-bold text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 shadow-2xs"
            >
              <option value="25">25 na stranu</option>
              <option value="50">50 na stranu</option>
              <option value="100">100 na stranu</option>
            </select>
          </div>

          {/* View mode toggle (Table / Cards) */}
          <div className="flex items-center rounded-xl border border-slate-200/90 bg-slate-50 p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-950 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>Tabulka</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-950 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Karty</span>
            </button>
          </div>
        </div>

        {/* Active filter badges */}
        {(searchQuery || conditionFilter !== 'all' || marketplaceFilter !== 'all' || autorenewFilter !== 'all') && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
            <span className="font-bold text-slate-400 mr-1">Filtrováno:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200/80 px-2.5 py-1 font-semibold text-slate-800">
                Hledat: &quot;{searchQuery}&quot;
                <button type="button" onClick={handleClearSearch} className="hover:text-slate-950 ml-0.5">
                  ×
                </button>
              </span>
            )}
            {marketplaceFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200/80 px-2.5 py-1 font-semibold text-slate-800">
                Tržiště: {marketplaceFilter}
                <button type="button" onClick={() => setMarketplaceFilter('all')} className="hover:text-slate-950 ml-0.5">
                  ×
                </button>
              </span>
            )}
            {conditionFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200/80 px-2.5 py-1 font-semibold text-slate-800">
                Stav: {conditionFilter}
                <button type="button" onClick={() => setConditionFilter('all')} className="hover:text-slate-950 ml-0.5">
                  ×
                </button>
              </span>
            )}
            {autorenewFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200/80 px-2.5 py-1 font-semibold text-slate-800">
                Obnova: {autorenewFilter === 'enabled' ? 'S obnovou' : 'Bez obnovy'}
                <button type="button" onClick={() => setAutorenewFilter('all')} className="hover:text-slate-950 ml-0.5">
                  ×
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearchQuery('');
                setMarketplaceFilter('all');
                setConditionFilter('all');
                setAutorenewFilter('all');
                setPage(1);
              }}
              className="ml-auto text-xs font-bold text-slate-700 hover:text-slate-950 hover:underline"
            >
              Resetovat všechny filtry
            </button>
          </div>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs sm:text-sm text-rose-800 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span className="font-semibold">{error}</span>
            </div>
            <button
              type="button"
              onClick={fetchTransactions}
              className="rounded-xl bg-rose-700 px-3 py-1 text-xs font-bold text-white hover:bg-rose-800 shadow-xs"
            >
              Zkusit znovu
            </button>
          </div>
        </div>
      )}

      {/* 4. Transactions List (Table or Cards view) */}
      {loading && transactions.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-16 text-center shadow-2xs">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
          <p className="mt-3 text-xs font-semibold text-slate-500">Načítám transakce z centrální databáze…</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-14 text-center shadow-2xs">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
            📋
          </div>
          <h3 className="text-base font-bold text-slate-950">Nenalezeny žádné transakce</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Pro zadané vyhledávací kritérium nebo aktivní filtry nebyl nalezen žádný záznam synchronizace.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearchQuery('');
              setMarketplaceFilter('all');
              setConditionFilter('all');
              setAutorenewFilter('all');
              setPage(1);
            }}
            className="mt-4 rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            Zrušit filtry
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50/80">
                <tr>
                  <th scope="col" className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 min-w-[300px]">
                    Inzerát & Nabídka
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 min-w-[200px]">
                    Tržiště & Účet
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 min-w-[150px]">
                    Stav synchronizace
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 min-w-[210px]">
                    Publikováno & Obnova
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-700 min-w-[170px]">
                    Akce
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const mInfo = getMarketplaceInfo(tx.bb_marketplace_id);
                  const sInfo = getConditionInfo(tx.condition);
                  const pubDate = formatDateTime(tx.date || tx.last_date_renewed);
                  const nextDate = formatDateTime(tx.next_date_renew);
                  const isLiveUrl = tx.link?.startsWith('http://') || tx.link?.startsWith('https://');

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-50/70 transition-colors group ${
                        sInfo.isError ? 'bg-rose-50/25' : ''
                      }`}
                    >
                      {/* 1. Inzerát & Nabídka */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          {/* Photo thumbnail */}
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center">
                            {tx.offer_image ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={tx.offer_image}
                                alt={tx.offer_title || 'Foto inzerátu'}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  // Fallback na ikonu při chybě načtení
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : null}
                            <span className="text-lg opacity-40 select-none pointer-events-none">
                              🚗
                            </span>
                          </div>

                          {/* Titles and badges */}
                          <div className="min-w-0 flex-1">
                            {tx.offer_id ? (
                              <button
                                type="button"
                                onClick={() => handleOpenOffer(tx)}
                                className="text-left font-bold text-sm text-slate-950 hover:text-emerald-700 transition-colors line-clamp-1 group-hover:text-emerald-800"
                                title={`Otevřít nabídku: ${tx.offer_title || `#${tx.offer_id}`}`}
                              >
                                {tx.offer_title || `Inzerát #${tx.offer_id}`}
                              </button>
                            ) : (
                              <span className="font-bold text-sm text-slate-950 line-clamp-1">
                                {tx.offer_title || `Záznam #${tx.id}`}
                              </span>
                            )}

                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                              {tx.offer_price !== null && tx.offer_price !== undefined && (
                                <span className="font-black text-emerald-700">
                                  {tx.offer_price.toLocaleString('cs-CZ')} Kč
                                </span>
                              )}
                              <span className="font-mono text-[11px] text-slate-400">
                                ID #{tx.id}
                              </span>
                              {tx.offer_id && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenOffer(tx)}
                                  className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                                  title="Otevřít detail nabídky v Sellin"
                                >
                                  Nabídka #{tx.offer_id}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Tržiště & Účet */}
                      <td className="px-5 py-4">
                        <div>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${mInfo.badgeClass}`}
                          >
                            <span>{mInfo.icon}</span>
                            <span>{mInfo.name}</span>
                          </span>

                          <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-600 font-medium">
                            <span className="truncate max-w-[180px]" title={tx.bb_email || 'Bez e-mailu'}>
                              {tx.bb_email || '—'}
                            </span>
                            {tx.bb_email && (
                              <button
                                type="button"
                                onClick={() => handleCopy(tx.bb_email!, `email-${tx.id}`)}
                                className="text-slate-400 hover:text-slate-700 p-0.5"
                                title="Zkopírovat e-mail"
                              >
                                {copiedField === `email-${tx.id}` ? '✓' : '📋'}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. Stav synchronizace */}
                      <td className="px-5 py-4">
                        <div>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold shadow-2xs ${sInfo.badgeClass}`}
                          >
                            <span className={`h-2 w-2 rounded-full ${sInfo.dotClass}`} />
                            <span>{sInfo.label}</span>
                          </span>

                          <div className="mt-1 text-[11px] font-mono text-slate-400">
                            {tx.condition || '—'}
                          </div>
                        </div>
                      </td>

                      {/* 4. Publikováno & Obnova */}
                      <td className="px-5 py-4">
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {pubDate.relative}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            {pubDate.short}
                          </div>

                          {/* Auto-obnova detail */}
                          {tx.autorenew_freq && tx.autorenew_freq !== 'Neobnovovat' ? (
                            <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-sky-800">
                              <span>⚡</span>
                              <span className="truncate max-w-[160px]" title={tx.autorenew_freq}>
                                {tx.autorenew_freq}
                              </span>
                            </div>
                          ) : (
                            <div className="mt-1 text-[11px] text-slate-400">
                              Bez auto-obnovy
                            </div>
                          )}

                          {tx.next_date_renew && (
                            <div className="text-[10px] text-slate-500 font-medium">
                              Příští: {nextDate.relative}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 5. Akce */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Live portal link button */}
                          {isLiveUrl ? (
                            <a
                              href={tx.link!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-950 shadow-2xs transition-all"
                              title="Přejít na inzerát na portálu"
                            >
                              <span>Otevřít</span>
                              <svg className="h-3 w-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          ) : null}

                          {/* Detail transakce button */}
                          <button
                            type="button"
                            onClick={() => setSelectedTx(tx)}
                            className="inline-flex items-center gap-1 rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 shadow-2xs transition-all active:scale-95"
                          >
                            Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {transactions.map((tx) => {
            const mInfo = getMarketplaceInfo(tx.bb_marketplace_id);
            const sInfo = getConditionInfo(tx.condition);
            const pubDate = formatDateTime(tx.date || tx.last_date_renewed);
            const isLiveUrl = tx.link?.startsWith('http://') || tx.link?.startsWith('https://');

            return (
              <div
                key={tx.id}
                className={`rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${
                  sInfo.isError ? 'border-rose-200' : ''
                }`}
              >
                <div>
                  {/* Card top badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${mInfo.badgeClass}`}>
                      <span>{mInfo.icon}</span>
                      <span>{mInfo.name}</span>
                    </span>

                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${sInfo.badgeClass}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${sInfo.dotClass}`} />
                      <span>{sInfo.label}</span>
                    </span>
                  </div>

                  {/* Thumbnail and Title */}
                  <div className="flex items-start gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center">
                      {tx.offer_image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={tx.offer_image}
                          alt={tx.offer_title || 'Foto inzerátu'}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : null}
                      <span className="text-xl opacity-40 select-none">🚗</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      {tx.offer_id ? (
                        <button
                          type="button"
                          onClick={() => handleOpenOffer(tx)}
                          className="text-left font-bold text-sm text-slate-950 hover:text-emerald-700 transition-colors line-clamp-2"
                        >
                          {tx.offer_title || `Inzerát #${tx.offer_id}`}
                        </button>
                      ) : (
                        <span className="font-bold text-sm text-slate-950 line-clamp-2">
                          {tx.offer_title || `Transakce #${tx.id}`}
                        </span>
                      )}

                      {tx.offer_price !== null && tx.offer_price !== undefined && (
                        <p className="mt-1 text-sm font-black text-emerald-700">
                          {tx.offer_price.toLocaleString('cs-CZ')} Kč
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Account & Dates */}
                  <div className="mt-4 rounded-2xl bg-slate-50/80 border border-slate-100 p-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 font-medium">Účet prodejce:</span>
                      <span className="font-bold truncate max-w-[170px]" title={tx.bb_email || ''}>
                        {tx.bb_email || '—'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 font-medium">Synchronizováno:</span>
                      <span className="font-bold text-slate-900">{pubDate.relative}</span>
                    </div>

                    {tx.autorenew_freq && tx.autorenew_freq !== 'Neobnovovat' && (
                      <div className="flex items-center justify-between text-sky-800">
                        <span className="text-slate-400 font-medium">Auto-obnova:</span>
                        <span className="font-bold">⚡ {tx.autorenew_freq}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-slate-400">
                    ID #{tx.id}
                  </span>

                  <div className="flex items-center gap-2">
                    {isLiveUrl && (
                      <a
                        href={tx.link!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-950 shadow-2xs"
                      >
                        Inzerát ↗
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedTx(tx)}
                      className="rounded-xl bg-slate-950 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 shadow-2xs active:scale-95 transition-all"
                    >
                      Detail
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Pagination Bar */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-slate-600">
        <div>
          Zobrazeno{' '}
          <span className="font-black text-slate-950">
            {totalCount === 0 ? 0 : (page - 1) * pageSize + 1}
          </span>{' '}
          až{' '}
          <span className="font-black text-slate-950">
            {Math.min(page * pageSize, totalCount)}
          </span>{' '}
          z{' '}
          <span className="font-black text-slate-950">
            {totalCount.toLocaleString('cs-CZ')}
          </span>{' '}
          transakcí
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            ← Předchozí
          </button>

          <span className="px-2 font-medium text-xs">
            Strana <span className="font-bold text-slate-950">{page}</span> z {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            Další →
          </button>
        </div>
      </div>

      {/* 6. Offer Modal (opens when clicking on parent offer) */}
      {selectedOffer && (
        <OfferModal
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
        />
      )}

      {/* 7. Modern Transaction Inspector Modal */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200/90 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-bold text-slate-700">
                    Transakce #{selectedTx.id}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-xs font-bold ${
                      getMarketplaceInfo(selectedTx.bb_marketplace_id).badgeClass
                    }`}
                  >
                    <span>{getMarketplaceInfo(selectedTx.bb_marketplace_id).icon}</span>
                    <span>{getMarketplaceInfo(selectedTx.bb_marketplace_id).name}</span>
                  </span>
                </div>
                <h3 className="mt-2 text-xl font-black text-slate-950">
                  Detail synchronizace inzerátu
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            {/* Status Summary Banner */}
            {(() => {
              const status = getConditionInfo(selectedTx.condition);
              return (
                <div
                  className={`rounded-2xl border p-4 flex items-center justify-between ${
                    status.isError
                      ? 'bg-rose-50 border-rose-200 text-rose-950'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{status.icon}</span>
                    <div>
                      <h4 className="font-black text-sm">{status.label}</h4>
                      <p className="text-xs font-medium opacity-85 mt-0.5">
                        {status.description}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-white/80 border border-slate-200/50 shadow-2xs">
                    {selectedTx.condition || '—'}
                  </span>
                </div>
              );
            })()}

            {/* Associated Offer Section */}
            {selectedTx.offer_title && (
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                    {selectedTx.offer_image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={selectedTx.offer_image}
                        alt={selectedTx.offer_title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">🚗</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Přiřazený inzerát v systému
                    </span>
                    <h4 className="text-sm font-bold text-slate-950">
                      {selectedTx.offer_title}
                    </h4>
                    {selectedTx.offer_price !== null && selectedTx.offer_price !== undefined && (
                      <p className="text-xs font-black text-emerald-700">
                        {selectedTx.offer_price.toLocaleString('cs-CZ')} Kč
                      </p>
                    )}
                  </div>
                </div>

                {selectedTx.offer_id && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTx(null);
                      handleOpenOffer(selectedTx);
                    }}
                    className="shrink-0 rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs active:scale-95"
                  >
                    Otevřít nabídku →
                  </button>
                )}
              </div>
            )}

            {/* Key Information Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Poslední synchronizace */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 space-y-1 shadow-2xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Čas synchronizace
                </span>
                <p className="font-mono font-bold text-slate-900 text-sm">
                  {formatDateTime(selectedTx.date || selectedTx.last_date_renewed).formatted}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {formatDateTime(selectedTx.date || selectedTx.last_date_renewed).relative}
                </p>
              </div>

              {/* Příští auto-obnova */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 space-y-1 shadow-2xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Plánovaná příští obnova
                </span>
                <p className="font-mono font-bold text-slate-900 text-sm">
                  {formatDateTime(selectedTx.next_date_renew).formatted}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {formatDateTime(selectedTx.next_date_renew).relative}
                </p>
              </div>

              {/* Účet a frekvence */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 space-y-1 shadow-2xs sm:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    Účet prodejce
                  </span>
                  {selectedTx.bb_email && (
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedTx.bb_email!, 'modal-email')}
                      className="text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      {copiedField === 'modal-email' ? '✓ Zkopírováno' : 'Kopírovat'}
                    </button>
                  )}
                </div>
                <p className="font-bold text-slate-900 text-sm">
                  {selectedTx.bb_email || '—'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Frekvence obnovy: <span className="font-bold text-slate-700">{selectedTx.autorenew_freq || 'Neobnovovat'}</span>
                </p>
              </div>
            </div>

            {/* Direct Link */}
            {selectedTx.link && (
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    Odkaz na publikovaný inzerát
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedTx.link!, 'modal-link')}
                      className="text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      {copiedField === 'modal-link' ? '✓ Zkopírováno' : 'Kopírovat URL'}
                    </button>
                    <a
                      href={selectedTx.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-slate-950 hover:underline"
                    >
                      Otevřít ↗
                    </a>
                  </div>
                </div>
                <p className="font-mono text-xs text-blue-700 break-all bg-white p-2.5 rounded-xl border border-slate-200/80">
                  {selectedTx.link}
                </p>
              </div>
            )}

            {/* Raw Metadata Drawer */}
            <details className="group rounded-2xl border border-slate-200/90 bg-slate-50/50 p-3.5 text-xs">
              <summary className="cursor-pointer font-bold text-slate-700 hover:text-slate-950 flex items-center justify-between">
                <span>Zobrazit technická ID a surová data (JSON)</span>
                <span className="transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="mt-3 space-y-2 pt-2 border-t border-slate-200/70">
                <div className="flex items-center justify-between text-slate-500">
                  <span>bb_offer_id:</span>
                  <code className="bg-white px-2 py-0.5 rounded border text-[11px] font-mono text-slate-800 select-all">
                    {selectedTx.bb_offer_id || '—'}
                  </code>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>offer_id:</span>
                  <code className="bg-white px-2 py-0.5 rounded border text-[11px] font-mono text-slate-800">
                    {selectedTx.offer_id ?? '—'}
                  </code>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-500">Kompletní objekt:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(JSON.stringify(selectedTx, null, 2), 'modal-json')}
                      className="text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      {copiedField === 'modal-json' ? '✓ Zkopírováno' : 'Kopírovat JSON'}
                    </button>
                  </div>
                  <pre className="max-h-48 overflow-auto rounded-xl bg-slate-950 p-3 font-mono text-[11px] text-slate-200">
                    {JSON.stringify(selectedTx, null, 2)}
                  </pre>
                </div>
              </div>
            </details>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="rounded-xl border border-slate-200/90 bg-white px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
