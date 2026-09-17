'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Offer } from '@/lib/types';
import { getOffers } from '@/lib/api';
import OfferCard from './OfferCard';
import OfferModal from './OfferModal';

export default function OffersList() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const limit = 20;

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

  useEffect(() => {
    loadOffers();
  }, [page, searchQuery]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOffers(limit, page * limit, searchQuery);

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

  return (
    <div>
      {/* Top Header */}
      <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 text-xs font-bold text-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Správa inzerce
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
            Moje nabídka
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Přehled publikovaných inzerátů z Bazoše, Sbazaru a dalších portálů.
          </p>
        </div>

        <Link
          href="/create"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-slate-800 active:scale-95 transition-all self-start sm:self-auto"
        >
          <span>+</span>
          <span>Nový inzerát</span>
        </Link>
      </div>

      {/* Search Input Bar */}
      <form
        onSubmit={(e) => e.preventDefault()}
        className="mb-6"
      >
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

      {/* Results Count & Current Filter info */}
      <div className="mb-4 flex items-center justify-between text-xs sm:text-sm text-slate-500 font-medium">
        <span>
          {searchQuery
            ? `Výsledky pro „${searchQuery}“`
            : 'Nejnovější inzeráty'}
        </span>
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
      ) : loading && page === 0 ? (
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
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? 'Zkuste jiný dotaz, rozměr pneu nebo zkontrolujte překlepy.'
              : 'Až přidáte nový inzerát, zobrazí se zde v přehledu.'}
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
