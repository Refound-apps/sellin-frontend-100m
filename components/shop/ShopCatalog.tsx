'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShopOffer } from '@/lib/types';
import { getOfferById, getShopOffers, SHOP_SBAZAR_EMAIL, ShopOfferFilters } from '@/lib/api';
import ShopOfferCard from './ShopOfferCard';
import ShopOfferModal from './ShopOfferModal';
import ShopHeader from './ShopHeader';
import ShopFooter from './ShopFooter';
import ShopHero from './ShopHero';
import ShopFeatures from './ShopFeatures';
import ShopServices from './ShopServices';
import ShopFaq from './ShopFaq';
import ShopInquiry from './ShopInquiry';
import { TIRE_PROFILES, TIRE_RIMS, TIRE_WIDTHS } from './offerMeta';

export default function ShopCatalog() {
  const [offers, setOffers] = useState<ShopOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<ShopOffer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<ShopOfferFilters>({});
  const limit = 24;

  const searchParams = useSearchParams();

  // Deep-linking: open offer modal when ?offer=ID or ?id=ID is in URL
  useEffect(() => {
    const rawId = searchParams.get('offer') || searchParams.get('id');
    if (!rawId) return;
    const targetId = parseInt(rawId, 10);
    if (!targetId || isNaN(targetId)) return;

    if (selectedOffer && selectedOffer.id === targetId) return;

    // Check if offer is already in loaded offers
    const existing = offers.find((o) => o.id === targetId);
    if (existing) {
      setSelectedOffer(existing);
      return;
    }

    // Otherwise fetch by ID directly
    getOfferById(targetId)
      .then((loaded) => {
        if (loaded) {
          setSelectedOffer(loaded as ShopOffer);
        }
      })
      .catch((err) => {
        console.error('Failed to load offer from URL param:', err);
      });
  }, [searchParams, offers, selectedOffer]);

  const handleCloseModal = useCallback(() => {
    setSelectedOffer(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('offer') || url.searchParams.has('id')) {
        url.searchParams.delete('offer');
        url.searchParams.delete('id');
        window.history.replaceState(
          null,
          '',
          url.pathname + (url.search ? `?${url.searchParams.toString()}` : '') + url.hash
        );
      }
    }
  }, []);

  useEffect(() => {
    loadOffers();
  }, [page, searchQuery, filters]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getShopOffers(limit, page * limit, searchQuery, SHOP_SBAZAR_EMAIL, filters);

      if (page === 0) {
        setOffers(data);
      } else {
        setOffers((prev) => [...prev, ...data]);
      }

      setHasMore(data.length === limit);
    } catch (err) {
      setError('Nabídky se teď nepodařilo načíst. Zkuste to prosím znovu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setHasMore(true);
    setSearchQuery(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setPage(0);
    setHasMore(true);
    setSearchQuery('');
    setFilters({});
  };

  const updateFilter = (key: keyof ShopOfferFilters, value: string) => {
    setPage(0);
    setHasMore(true);
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleQuickFilter = (filterType: 'type' | 'season' | 'rim', value: string) => {
    setPage(0);
    setHasMore(true);
    setFilters((prev) => ({
      ...prev,
      [filterType]: value || undefined,
    }));
  };

  const hasActiveFilters = Boolean(
    searchQuery || filters.type || filters.season || filters.width || filters.profile || filters.rim
  );

  const selectClass =
    'rounded-xl bg-white px-3 py-2.5 text-base sm:text-sm text-[hsl(222_47%_11%)] shadow-2xs outline-none ring-1 ring-[hsl(214_32%_91%)] focus:ring-2 focus:ring-[hsl(142_71%_45%)]';

  return (
    <div className="min-h-screen bg-white">
      {/* Shared Shop Header */}
      <ShopHeader />

      {/* Hero Section with Minimalist Background */}
      <ShopHero
        onQuickFilter={handleQuickFilter}
        activeRim={filters.rim}
        activeSeason={filters.season}
        activeType={filters.type}
      />

      {/* Catalog & Filter Section */}
      <section
        id="nabidka"
        className="bg-gradient-to-b from-white via-[hsl(210_40%_98%)] via-[200px] sm:via-[260px] to-[hsl(210_40%_98%)] py-10 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto mb-8 sm:mb-10 max-w-2xl text-center">
            <span className="inline-block rounded-md bg-white border border-[hsl(214_32%_91%)] px-3 py-1 text-xs font-semibold text-[hsl(142_71%_35%)]">
              Skladová dostupnost
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-[hsl(222_47%_11%)]">
              Aktuální nabídka kol a pneu
            </h2>
            <p className="mt-2 sm:mt-3 text-xs sm:text-base text-[hsl(215_16%_47%)]">
              Všechny položky jsou fyzicky skladem v lokalitě Plzeň Jih s možností osobní prohlídky.
            </p>
          </div>

          {/* Search and Filters Bar */}
          <form onSubmit={handleSearch} className="mx-auto mb-8 sm:mb-10 max-w-4xl">
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Hledat značku, rozměr (např. 205/55 R16), disk…"
                  className="w-full rounded-xl border-0 bg-white px-4 py-3 text-base sm:text-sm text-[hsl(222_47%_11%)] shadow-xs outline-none ring-1 ring-[hsl(214_32%_91%)] placeholder:text-[hsl(215_16%_47%)] focus:ring-2 focus:ring-[hsl(142_71%_45%)]"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial rounded-xl bg-[hsl(142_71%_45%)] px-6 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[hsl(142_71%_35%)] active:scale-95"
                >
                  Hledat
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="flex-1 sm:flex-initial rounded-xl border border-[hsl(214_32%_91%)] bg-white px-4 py-3 text-sm font-medium text-[hsl(222_47%_11%)] shadow-2xs hover:bg-[hsl(210_40%_96%)] active:scale-95"
                  >
                    Vymazat filtry
                  </button>
                )}
              </div>
            </div>

            {/* Filter Dropdowns - 2 columns on mobile with 5th spanning 2 cols */}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              <select
                value={filters.type || ''}
                onChange={(e) => updateFilter('type', e.target.value)}
                className={selectClass}
              >
                <option value="">Typ: vše</option>
                <option value="pneu">Pneumatiky</option>
                <option value="disk">ALU disky</option>
              </select>
              <select
                value={filters.season || ''}
                onChange={(e) => updateFilter('season', e.target.value)}
                className={selectClass}
              >
                <option value="">Sezóna: vše</option>
                <option value="zimni">Zimní</option>
                <option value="letni">Letní</option>
                <option value="celorocni">Celoroční</option>
              </select>
              <select
                value={filters.width || ''}
                onChange={(e) => updateFilter('width', e.target.value)}
                className={selectClass}
              >
                <option value="">Šířka (vše)</option>
                {TIRE_WIDTHS.map((width) => (
                  <option key={width} value={width}>{width} mm</option>
                ))}
              </select>
              <select
                value={filters.profile || ''}
                onChange={(e) => updateFilter('profile', e.target.value)}
                className={selectClass}
              >
                <option value="">Profil (vše)</option>
                {TIRE_PROFILES.map((profile) => (
                  <option key={profile} value={profile}>{profile}</option>
                ))}
              </select>
              <select
                value={filters.rim || ''}
                onChange={(e) => updateFilter('rim', e.target.value)}
                className={`${selectClass} col-span-2 sm:col-span-1`}
              >
                <option value="">Průměr (vše)</option>
                {TIRE_RIMS.map((rim) => (
                  <option key={rim} value={rim}>R{rim}</option>
                ))}
              </select>
            </div>
          </form>

          {/* Offers Grid */}
          {loading && page === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[hsl(215_16%_47%)]">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[hsl(214_32%_91%)] border-t-[hsl(142_71%_45%)]" />
              <p className="mt-4 text-sm font-medium">Načítám skladové zásoby…</p>
            </div>
          ) : error && page === 0 ? (
            <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-xs">
              <p className="font-semibold text-red-700">{error}</p>
              <button
                onClick={() => loadOffers()}
                className="mt-4 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Zkusit znovu
              </button>
            </div>
          ) : offers.length === 0 ? (
            <div className="rounded-2xl border border-[hsl(214_32%_91%)] bg-white p-12 text-center shadow-xs">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(210_40%_96%)] text-[hsl(215_16%_47%)]">
                🔍
              </div>
              <h3 className="text-lg font-bold text-[hsl(222_47%_11%)]">
                Pro zadaný filtr jsme nic nenašli
              </h3>
              <p className="mt-2 text-sm text-[hsl(215_16%_47%)]">
                Zkuste zrušit některé filtry, nebo nám rovnou zavolejte a prověříme zásoby v dílně.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="rounded-xl border border-[hsl(214_32%_91%)] bg-white px-4 py-2 text-sm font-medium text-[hsl(222_47%_11%)] hover:bg-[hsl(210_40%_96%)]"
                >
                  Zrušit filtry
                </button>
                <a
                  href="#poptavka"
                  className="rounded-xl bg-[hsl(142_71%_45%)] px-4 py-2 text-sm font-semibold text-white hover:bg-[hsl(142_71%_35%)]"
                >
                  Poptat rozměr
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="shop-offer-grid">
                {offers.map((offer) => (
                  <ShopOfferCard
                    key={offer.id}
                    offer={offer}
                    onClick={() => setSelectedOffer(offer)}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="mt-8 sm:mt-12 text-center">
                  {loading ? (
                    <p className="text-sm text-[hsl(215_16%_47%)]">Načítám další položky…</p>
                  ) : (
                    <button
                      onClick={() => setPage((prev) => prev + 1)}
                      className="w-full sm:w-auto rounded-xl border border-[hsl(214_32%_91%)] bg-white px-7 py-3 text-sm font-semibold text-[hsl(222_47%_11%)] shadow-2xs hover:bg-[hsl(210_40%_96%)] transition-colors active:scale-98"
                    >
                      Načíst další nabídky ({offers.length} zobrazeno)
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Unified How It Works & Guarantees Section */}
      <ShopFeatures />

      {/* Pneuservis Services Section */}
      <ShopServices />

      {/* Missing Dimension Inquiry Section */}
      <ShopInquiry />

      {/* FAQ Section */}
      <ShopFaq />

      {/* Shared Shop Footer */}
      <ShopFooter />

      {/* Detail Modal */}
      {selectedOffer && (
        <ShopOfferModal offer={selectedOffer} onClose={handleCloseModal} />
      )}
    </div>
  );
}
