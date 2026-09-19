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

  const isImpersonating = Boolean(
    mode === 'user' &&
      isAdminUser &&
      (selectedSeller ||
        (selectedCustomEmail && selectedCustomEmail.toLowerCase() !== myEmail?.toLowerCase()))
  );

  const activeAccountDisplay =
    selectedSeller?.bazos_name || selectedSeller?.email || selectedCustomEmail;

  return (
    <div>
      {/* Impersonation Banner for Admins */}
      {isImpersonating && (
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 rounded-2xl bg-amber-500/10 border border-amber-300/90 p-4 text-amber-950 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white text-lg font-black shadow-xs">
              👁️
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                  Režim prohlížení účtu
                </span>
                <span className="rounded bg-amber-200/90 text-amber-900 px-1.5 py-0.2 text-[10px] font-bold">
                  Administrátor
                </span>
              </div>
              <p className="text-sm sm:text-base font-black text-slate-950 leading-tight">
                {activeAccountDisplay}
                {selectedSeller?.bazos_name && (
                  <span className="font-normal text-xs text-slate-600"> ({selectedSeller.email})</span>
                )}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                {selectedSeller?.telephone1 && (
                  <span className="font-semibold text-slate-800">
                    📞 {formatPhoneNumber(selectedSeller.telephone1)}
                  </span>
                )}
                <span>
                  • Spárované e-maily:{' '}
                  <span className="font-mono font-semibold text-slate-800">
                    {(userEmails || []).join(', ')}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end shrink-0">
            <button
              type="button"
              onClick={handleResetToMe}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs hover:bg-amber-50 active:scale-95 transition-all"
            >
              <span>✕</span>
              <span>Zpět na můj účet</span>
            </button>
          </div>
        </div>
      )}

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
                {isImpersonating
                  ? `Zobrazení prodejce: ${activeAccountDisplay}`
                  : 'Moje inzerce · Prodejce'}
              </span>
              <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                {isImpersonating ? `Nabídka: ${activeAccountDisplay}` : 'Moje nabídka'}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                {isImpersonating
                  ? `Přehled inzerátů publikovaných pod účtem ${activeAccountDisplay}.`
                  : 'Přehled vašich publikovaných inzerátů odpovídajících vašim prodejním účtům na inzertních webech.'}
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
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-slate-800 active:scale-95 transition-all"
          >
            <span>+</span>
            <span>Nový inzerát</span>
          </Link>
        </div>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={(e) => e.preventDefault()} className="mb-6">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
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
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Hledat podle rozměru, značky, telefonu, popisu nebo e-mailu..."
            className="w-full rounded-2xl border border-slate-200/90 bg-white py-3.5 pl-12 pr-12 text-sm font-medium text-slate-950 shadow-2xs outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              aria-label="Vymazat hledání"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Results Count & Filter info */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-slate-500 font-medium">
        <div className="flex items-center gap-2">
          <span>
            {searchQuery ? `Výsledky pro „${searchQuery}“` : 'Nejnovější inzeráty'}
          </span>
          {mode === 'user' && userEmails && userEmails.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              • spárováno s ({userEmails.join(', ')})
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
        <div className="rounded-3xl bg-white p-8 text-center border border-rose-200 shadow-2xs">
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
              className="h-[22.5rem] animate-pulse rounded-3xl bg-white border border-slate-200/90 p-3 flex flex-col justify-between"
            >
              <div className="h-48 sm:h-52 rounded-2xl bg-slate-100" />
              <div className="space-y-2 px-1 py-2.5">
                <div className="h-4 w-4/5 rounded-md bg-slate-100" />
                <div className="flex gap-1.5 pt-1">
                  <div className="h-5 w-16 rounded-lg bg-slate-100" />
                  <div className="h-5 w-14 rounded-lg bg-slate-100" />
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                <div className="h-6 w-20 rounded bg-slate-100" />
                <div className="h-6 w-16 rounded-xl bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-3xl bg-white p-12 text-center border border-slate-200/90 shadow-2xs">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
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
              : isImpersonating
              ? `Pro účet ${activeAccountDisplay} nebyly v centrální databázi nalezeny žádné inzeráty.`
              : mode === 'user' && myEmail
              ? `Pro váš administrátorský účet (${myEmail}) nejsou přímo spárovány žádné inzeráty.`
              : 'Až přidáte nový inzerát, zobrazí se zde v přehledu.'}
          </p>

          {/* Helper hint for admin on empty own account */}
          {mode === 'user' && isAdminUser && !isImpersonating && !searchQuery && (
            <div className="mt-6 inline-flex flex-col sm:flex-row items-center gap-2 rounded-2xl bg-indigo-50 border border-indigo-200/80 p-3.5 text-xs text-indigo-900 max-w-lg mx-auto">
              <span className="text-lg">💡</span>
              <div className="text-left">
                <span className="font-bold">Tip pro administrátora:</span> Chcete-li zobrazit nabídky konkrétního prodejce, použijte tlačítko{' '}
                <span className="font-bold text-indigo-950">„Filtrovat účet“</span> vpravo nahoře, nebo přejděte na{' '}
                <Link href="/admin/offers" className="font-bold underline hover:text-indigo-950">
                  všechny nabídky
                </Link>
                .
              </div>
            </div>
          )}
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
          {loading ? (
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
              <span>Načítám další inzeráty…</span>
            </div>
          ) : (
            <button
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all"
            >
              Načíst další nabídky
            </button>
          )}
        </div>
      )}
    </div>
  );
}
