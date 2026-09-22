'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShopOffer } from '@/lib/types';
import { getOfferById, getShopOffers, SHOP_SBAZAR_EMAIL, ShopOfferFilters } from '@/lib/api';
import { useShop } from './ShopContext';
import ShopOfferCard from './ShopOfferCard';
import ShopOfferModal from './ShopOfferModal';
import ShopHeader from './ShopHeader';
import ShopFooter from './ShopFooter';
import ShopHero from './ShopHero';
import ShopFeatures from './ShopFeatures';
import ShopServices from './ShopServices';
import ShopFaq from './ShopFaq';
import ShopInquiry from './ShopInquiry';
import { CAR_WHEEL_BRANDS, TIRE_BRANDS, TIRE_PROFILES, TIRE_RIMS, TIRE_WIDTHS } from './offerMeta';
import { scrollToShopSection } from './shopScroll';

export default function ShopCatalog() {
  const [offers, setOffers] = useState<ShopOffer[]>([]);
  const [totalOffers, setTotalOffers] = useState<number | null>(null);
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

  // Initialize filters and search input from URL search parameters on mount/navigation
  useEffect(() => {
    const sortParam = searchParams.get('sort');
    const typeParam = searchParams.get('type');
    const seasonParam = searchParams.get('season');
    const rimParam = searchParams.get('rim');
    const brandParam = searchParams.get('brand');
    const searchParam = searchParams.get('search') || searchParams.get('q');

    const nextFilters: ShopOfferFilters = {};
    if (sortParam) nextFilters.sort = sortParam;
    if (typeParam) nextFilters.type = typeParam;
    if (seasonParam) nextFilters.season = seasonParam;
    if (rimParam) nextFilters.rim = rimParam;
    if (brandParam) nextFilters.brand = brandParam;

    if (Object.keys(nextFilters).length > 0) {
      setFilters((prev) => ({ ...prev, ...nextFilters }));
    }
    if (searchParam) {
      setSearchInput(searchParam);
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

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

  const handleOpenModal = useCallback((offer: ShopOffer) => {
    setSelectedOffer(offer);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('offer', String(offer.id));
      window.history.pushState(
        null,
        '',
        url.pathname + `?${url.searchParams.toString()}` + url.hash
      );
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedOffer(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('offer') || url.searchParams.has('id')) {
        url.searchParams.delete('offer');
        url.searchParams.delete('id');
        const remainingQuery = url.searchParams.toString();
        window.history.replaceState(
          null,
          '',
          url.pathname + (remainingQuery ? `?${remainingQuery}` : '') + url.hash
        );
      }
    }
  }, []);

  const initialHashHandledRef = useRef(false);

  // If page was loaded with a hash (e.g. #sluzby), wait until initial offers finish loading
  // and are rendered in the DOM before scrolling, so layout height is accurate.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (initialHashHandledRef.current) return;

    const hash = window.location.hash.replace('#', '');
    if (!hash) {
      initialHashHandledRef.current = true;
      return;
    }

    if (!loading) {
      initialHashHandledRef.current = true;
      const timer = setTimeout(() => {
        scrollToShopSection(hash, { updateHistory: false });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Handle hash changes (e.g. browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        scrollToShopSection(hash, { updateHistory: false });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Intercept any in-page shop anchor clicks to guarantee reliable, smooth scroll
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const anchor = (e.target as HTMLElement)?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href) return;

      const hashMatch = href.match(/^(?:\/shop)?#([a-zA-Z0-9_-]+)$/);
      if (hashMatch) {
        const sectionId = hashMatch[1];
        const el = document.getElementById(sectionId);
        if (el) {
          e.preventDefault();
          scrollToShopSection(sectionId);
        }
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const { linkedEmails, shop } = useShop();

  useEffect(() => {
    loadOffers();
  }, [page, searchQuery, filters, linkedEmails]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const emailsToQuery = linkedEmails && linkedEmails.length > 0 ? linkedEmails : (shop?.owner_email || SHOP_SBAZAR_EMAIL);
      const { offers: data, total } = await getShopOffers(limit, page * limit, searchQuery, emailsToQuery, filters);

      if (page === 0) {
        setOffers(data);
        setTotalOffers(total);
      } else {
        setOffers((prev) => [...prev, ...data]);
        setTotalOffers(total);
      }

      setHasMore(data.length === limit && (page + 1) * limit < total);
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
    searchQuery ||
    filters.type ||
    filters.brand ||
    filters.season ||
    filters.width ||
    filters.profile ||
    filters.rim ||
    (filters.sort && filters.sort !== 'newest')
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
        className="scroll-mt-20 sm:scroll-mt-24 bg-gradient-to-b from-white via-[hsl(210_40%_98%)] via-[200px] sm:via-[260px] to-[hsl(210_40%_98%)] py-10 sm:py-20"
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

            {/* Filter Dropdowns - 2 cols mobile, 3 cols tablet, 6 cols desktop */}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
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
                value={filters.brand || ''}
                onChange={(e) => updateFilter('brand', e.target.value)}
                className={selectClass}
              >
                <option value="">Značka: vše</option>
                <optgroup label="Značky pneu">
                  {TIRE_BRANDS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Auta a disky">
                  {CAR_WHEEL_BRANDS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </optgroup>
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
                className={selectClass}
              >
                <option value="">Průměr (vše)</option>
                {TIRE_RIMS.map((rim) => (
                  <option key={rim} value={rim}>R{rim}</option>
                ))}
              </select>
            </div>
          </form>

          {/* Catalog Controls: Total Count & Sorting */}
          <div className="mx-auto mb-6 max-w-7xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[hsl(214_32%_91%)] pb-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[hsl(142_71%_45%)] shrink-0" />
              <p className="text-sm font-bold text-[hsl(222_47%_11%)]">
                {totalOffers !== null ? (
                  <>
                    Celkem nalezeno{' '}
                    <span className="inline-block rounded-md bg-[hsl(142_71%_45%/0.12)] px-2 py-0.5 text-xs sm:text-sm font-extrabold text-[hsl(142_71%_35%)]">
                      {totalOffers}
                    </span>{' '}
                    {totalOffers === 1
                      ? 'nabídka'
                      : totalOffers >= 2 && totalOffers <= 4
                      ? 'nabídky'
                      : 'nabídek'}
                  </>
                ) : (
                  'Načítám nabídky…'
                )}
              </p>
              {totalOffers !== null && offers.length > 0 && offers.length < totalOffers && (
                <span className="text-xs text-[hsl(215_16%_47%)] font-medium">
                  (zobrazeno {offers.length})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <label htmlFor="catalog-sort" className="text-xs font-semibold text-[hsl(215_16%_47%)] whitespace-nowrap">
                Řazení:
              </label>
              <select
                id="catalog-sort"
                value={filters.sort || 'newest'}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="rounded-xl border border-[hsl(214_32%_91%)] bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-[hsl(222_47%_11%)] shadow-2xs outline-none ring-1 ring-[hsl(214_32%_91%)] focus:ring-2 focus:ring-[hsl(142_71%_45%)] cursor-pointer"
              >
                <option value="newest">Nejnovější</option>
                <option value="price_asc">Nejlevnější (od nejnižší ceny)</option>
                <option value="price_desc">Nejdražší (od nejvyšší ceny)</option>
              </select>
            </div>
          </div>

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
                    onClick={() => handleOpenModal(offer)}
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
                      Načíst další nabídky ({offers.length} z {totalOffers ?? offers.length} zobrazeno)
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
