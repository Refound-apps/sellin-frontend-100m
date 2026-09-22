'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Offer, User } from '@/lib/types';
import { getOffers, getUsers } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import OfferCard from './OfferCard';
import OfferModal from './OfferModal';
import SellerAccountSwitcher from './SellerAccountSwitcher';
import { formatPhoneNumber } from './offerStatus';

interface OffersListProps {
  mode?: 'user' | 'admin';
}

export default function OffersList({ mode = 'user' }: OffersListProps) {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const urlAccountParam = searchParams?.get('account') || searchParams?.get('seller') || null;

  // Offers state
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const limit = 20;

  // User & credentials state
  const [userLoading, setUserLoading] = useState(mode === 'user');
  const [myEmail, setMyEmail] = useState<string | null>(null);
  const [myEmails, setMyEmails] = useState<string[]>([]);
  const [userEmails, setUserEmails] = useState<string[] | null>(mode === 'admin' ? [] : null);
  const [isAdminUser, setIsAdminUser] = useState(false);

  // Admin Account Impersonation state (when admin views a specific seller account on seller page)
  const [selectedSeller, setSelectedSeller] = useState<User | null>(null);
  const [selectedCustomEmail, setSelectedCustomEmail] = useState<string | null>(null);

  // 1. In 'user' mode, fetch logged in user, role, and my credentials
  useEffect(() => {
    if (mode === 'admin') {
      setUserLoading(false);
      setUserEmails([]);
      return;
    }

    let isCancelled = false;

    async function loadUserAndCredentials() {
      try {
        setUserLoading(true);
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (isCancelled) return;

        if (!authUser) {
          setUserEmails([]);
          setMyEmail(null);
          setMyEmails([]);
          return;
        }

        const email = authUser.email ?? null;
        setMyEmail(email);

        // Fetch credentials matching user_id or email
        const { data: credentials } = await supabase
          .from('credential_pg')
          .select('role, email, sbazar_email, bazos_email, facebook_email')
          .or(`user_id.eq.${authUser.id},email.ilike.${authUser.email}`);

        const myEmailsSet = new Set<string>();
        if (email) {
          myEmailsSet.add(email.toLowerCase().trim());
        }

        let isUserAdmin = false;
        if (credentials && credentials.length > 0) {
          for (const cred of credentials) {
            if (cred.role === 'admin') {
              isUserAdmin = true;
            }
            if (cred.email) myEmailsSet.add(cred.email.toLowerCase().trim());
            if (cred.sbazar_email) myEmailsSet.add(cred.sbazar_email.toLowerCase().trim());
            if (cred.bazos_email) myEmailsSet.add(cred.bazos_email.toLowerCase().trim());
            if (cred.facebook_email) myEmailsSet.add(cred.facebook_email.toLowerCase().trim());
          }
        }

        setIsAdminUser(isUserAdmin);
        const resolvedMyEmails = Array.from(myEmailsSet);
        setMyEmails(resolvedMyEmails);

        // If user is admin and URL contains ?account=..., resolve and select that seller account
        if (isUserAdmin && urlAccountParam) {
          try {
            const allUsers = await getUsers();
            const cleanTarget = urlAccountParam.toLowerCase().trim();
            const matched = allUsers.find(
              (u) =>
                u.email.toLowerCase().trim() === cleanTarget ||
                (u.sbazar_email && u.sbazar_email.toLowerCase().trim() === cleanTarget) ||
                (u.bazos_email && u.bazos_email.toLowerCase().trim() === cleanTarget)
            );

            if (matched) {
              setSelectedSeller(matched);
              setSelectedCustomEmail(null);
              const targetEmails = [
                matched.email,
                matched.sbazar_email,
                matched.bazos_email,
                matched.facebook_email,
              ]
                .filter((e): e is string => Boolean(e && e.trim()))
                .map((e) => e.toLowerCase().trim());
              setUserEmails(targetEmails);
              return;
            } else {
              setSelectedSeller(null);
              setSelectedCustomEmail(cleanTarget);
              setUserEmails([cleanTarget]);
              return;
            }
          } catch (e) {
            console.error('Failed to resolve account from URL:', e);
          }
        }

        setUserEmails(resolvedMyEmails);
      } catch (err) {
        console.error('Error resolving user emails:', err);
        setUserEmails(myEmail ? [myEmail.toLowerCase().trim()] : []);
      } finally {
        if (!isCancelled) {
          setUserLoading(false);
        }
      }
    }

    loadUserAndCredentials();

    return () => {
      isCancelled = true;
    };
  }, [mode, supabase, urlAccountParam]);

  // Handler for Admin Account Switcher
  const handleSelectAccount = useCallback(
    (user: User | null, customEmail?: string) => {
      setPage(0);

      if (user) {
        setSelectedSeller(user);
        setSelectedCustomEmail(null);
        const emails = [
          user.email,
          user.sbazar_email,
          user.bazos_email,
          user.facebook_email,
        ]
          .filter((e): e is string => Boolean(e && e.trim()))
          .map((e) => e.toLowerCase().trim());

        // Update URL query parameter
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.set('account', user.email);
          url.searchParams.delete('seller');
          window.history.replaceState({}, '', url.toString());
        }

        setUserEmails(emails);
      } else if (customEmail) {
        setSelectedSeller(null);
        setSelectedCustomEmail(customEmail);
        const emails = [customEmail.toLowerCase().trim()];

        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.set('account', customEmail);
          url.searchParams.delete('seller');
          window.history.replaceState({}, '', url.toString());
        }

        setUserEmails(emails);
      } else {
        // Reset to my own account
        setSelectedSeller(null);
        setSelectedCustomEmail(null);

        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('account');
          url.searchParams.delete('seller');
          window.history.replaceState({}, '', url.toString());
        }

        setUserEmails(myEmails);
      }
    },
    [myEmails]
  );

  const handleResetToMe = useCallback(() => {
    handleSelectAccount(null);
  }, [handleSelectAccount]);

  // 2. Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => {
      const nextQuery = searchInput.trim();
      if (nextQuery === searchQuery) return;
      setPage(0);
      setHasMore(true);
      setSearchQuery(nextQuery);
    }, 320);

    return () => clearTimeout(timeout);
  }, [searchInput, searchQuery]);

  // 3. Load offers when page, search query, or user emails change
  useEffect(() => {
    if (userLoading) return;

    loadOffers();
  }, [page, searchQuery, userLoading, userEmails]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      setError(null);

      // In user mode: if user has no emails, don't load everything
      const filterEmails =
        mode === 'user' && userEmails && userEmails.length > 0
          ? userEmails
          : undefined;

      // If user mode and userEmails resolved to empty, return empty list
      if (mode === 'user' && userEmails && userEmails.length === 0) {
        setOffers([]);
        setHasMore(false);
        setLoading(false);
        return;
      }

      const data = await getOffers(limit, page * limit, searchQuery, filterEmails);

      if (page === 0) {
        setOffers(data);
      } else {
        setOffers((prev) => [...prev, ...data]);
      }

      if (data.length < limit) {
        setHasMore(false);
      }
    } catch (err) {
      setError('Nepodařilo se načíst nabídky. Zkuste to prosím znovu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
  };

  const isFiltered = Boolean(
    mode === 'user' &&
      isAdminUser &&
      (selectedSeller ||
        (selectedCustomEmail && selectedCustomEmail.toLowerCase() !== myEmail?.toLowerCase()))
  );

  const activeAccountDisplay =
    selectedSeller?.bazos_name || selectedSeller?.email || selectedCustomEmail;

  return (
    <div>
      {/* Top Header */}
      <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {mode === 'admin' ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 text-xs font-bold text-indigo-800">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                Administrace · Všechny nabídky
              </span>
              <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                Nabídka (všechny inzeráty)
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Globální přehled všech publikovaných inzerátů od všech prodejců z Bazoše, Sbazaru a dalších portálů.
              </p>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Moje inzerce · Prodejce
              </span>
              <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                Moje nabídka
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Přehled vašich publikovaných inzerátů odpovídajících vašim prodejním účtům na inzertních webech.
              </p>
            </>
          )}
        </div>

        {/* Right Header Actions */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Admin Switcher for Seller Accounts */}
          {mode === 'user' && isAdminUser && (
            <SellerAccountSwitcher
              currentEmail={selectedSeller?.email || selectedCustomEmail || myEmail}
              myEmail={myEmail}
              onSelectAccount={handleSelectAccount}
            />
          )}

          <Link
            href="/create"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-[0_4px_14px_rgba(15,23,42,0.18),inset_0_1px_1px_rgba(255,255,255,0.18)] ring-1 ring-slate-950/80 hover:from-slate-800 hover:to-slate-900 active:scale-[0.98] transition-all"
          >
            <span>+</span>
            <span>Nový inzerát</span>
          </Link>
        </div>
      </div>

      {/* Search Input Bar with layered depth */}
      <form onSubmit={(e) => e.preventDefault()} className="mb-6">
        <div className="group relative rounded-2xl bg-white/95 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.07),0_2px_8px_rgba(15,23,42,0.03)] ring-1 ring-slate-200/80 transition-all focus-within:shadow-[0_16px_36px_-6px_rgba(15,23,42,0.12),0_4px_12px_rgba(15,23,42,0.05)] focus-within:ring-slate-900/20 backdrop-blur-xs overflow-hidden">
          {loading ? (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
              <svg className="h-5 w-5 animate-spin text-slate-700" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
          ) : (
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-950 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Hledat podle rozměru, značky, telefonu, popisu nebo e-mailu..."
            className="w-full rounded-2xl border-0 bg-transparent py-3.5 pl-12 pr-12 text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              aria-label="Vymazat hledání"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Subtilní spodní indikátor načítání */}
          {loading && (
            <div className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden bg-slate-100">
              <div className="h-full w-full bg-gradient-to-r from-emerald-500 via-slate-900 to-emerald-500 animate-progress-pulse" />
            </div>
          )}
        </div>
      </form>

      {/* Results Count & Filter info */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-slate-500 font-medium">
        <div className="flex items-center gap-2">
          <span>
            {searchQuery ? `Výsledky pro „${searchQuery}“` : 'Nejnovější inzeráty'}
          </span>
          {loading && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Načítám…
            </span>
          )}
          {isFiltered && activeAccountDisplay && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-800">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              Prodejce: {activeAccountDisplay}
            </span>
          )}
        </div>
        {!loading && (
          <span className="font-semibold text-slate-700">
            {offers.length} {offers.length === 1 ? 'nabídka' : offers.length < 5 ? 'nabídky' : 'nabídek'}
          </span>
        )}
      </div>

      {error && page === 0 ? (
        <div className="rounded-3xl bg-white/95 p-8 text-center border border-rose-200 shadow-[0_16px_36px_-12px_rgba(244,63,94,0.12),0_4px_16px_rgba(0,0,0,0.02)] ring-1 ring-black/[0.02]">
          <p className="font-semibold text-rose-700 text-sm">{error}</p>
          <button
            onClick={() => loadOffers()}
            className="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 active:scale-95 transition-all shadow-xs"
          >
            Zkusit znovu
          </button>
        </div>
      ) : (loading || userLoading) && page === 0 ? (
        <div className="admin-offer-grid">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="relative overflow-hidden h-[22.5rem] rounded-3xl bg-white/90 border border-slate-200/80 p-3 flex flex-col justify-between shadow-[0_8px_24px_-4px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.02]"
            >
              {/* Subtilní světelná shimmer vlna */}
              <div className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />

              <div className="relative h-48 sm:h-52 rounded-2xl bg-slate-100/90 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-100/50 to-slate-200/40" />
              </div>
              <div className="space-y-2 px-1 py-2.5">
                <div className="h-4 w-4/5 rounded-md bg-slate-200/70" />
                <div className="flex gap-1.5 pt-1">
                  <div className="h-5 w-16 rounded-lg bg-slate-100" />
                  <div className="h-5 w-14 rounded-lg bg-slate-100" />
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                <div className="h-6 w-20 rounded-md bg-slate-200/70" />
                <div className="h-6 w-16 rounded-xl bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-3xl bg-white/95 p-12 text-center border border-slate-200/80 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.06),0_2px_10px_rgba(15,23,42,0.02)] ring-1 ring-black/[0.02]">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            {searchQuery ? 'Nic jsme nenašli' : 'Zatím žádné nabídky'}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            {searchQuery
              ? 'Zkuste jiný dotaz, rozměr pneu nebo zkontrolujte překlepy.'
              : isFiltered && activeAccountDisplay
              ? `Pro účet ${activeAccountDisplay} nebyly v centrální databázi nalezeny žádné inzeráty.`
              : 'Zatím zde nejsou žádné inzeráty.'}
          </p>
        </div>
      ) : (
        <div className="admin-offer-grid">
          {offers.map((offer, index) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              priority={index < 4}
              onClick={() => setSelectedOffer(offer)}
            />
          ))}
        </div>
      )}

      {/* Selected Offer Detail & Edit Modal */}
      {selectedOffer && (
        <OfferModal
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
          onOfferUpdated={(updated) => {
            setSelectedOffer({ ...updated });
            setOffers((prev) =>
              prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
            );
          }}
        />
      )}

      {/* Pagination Load More Button */}
      {hasMore && offers.length > 0 && (
        <div className="mt-10 text-center">
          <button
            onClick={() => setPage((prev) => prev + 1)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white/95 px-8 py-3.5 text-xs sm:text-sm font-bold text-slate-900 shadow-[0_8px_20px_-4px_rgba(15,23,42,0.06),0_2px_6px_rgba(15,23,42,0.03)] hover:bg-white hover:border-slate-300 hover:shadow-[0_12px_28px_-6px_rgba(15,23,42,0.1)] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-wait ring-1 ring-black/[0.02]"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin text-slate-800" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>Načítám další inzeráty…</span>
              </>
            ) : (
              <span>Načíst další nabídky</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
