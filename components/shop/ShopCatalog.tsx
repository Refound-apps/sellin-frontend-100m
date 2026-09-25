'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
import ShopSchema from './ShopSchema';
import MobileShopBar from './MobileShopBar';
import { CAR_WHEEL_BRANDS, TIRE_BRANDS, TIRE_PROFILES, TIRE_RIMS, TIRE_WIDTHS, WHEEL_PCD_OPTIONS } from './offerMeta';
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
  const [mobileFiltersExpanded, setMobileFiltersExpanded] = useState(false);
  const limit = 24;

  const searchParams = useSearchParams();

  // Extract filter-related URL parameters
  const urlSort = searchParams.get('sort') || '';
  const urlType = searchParams.get('type') || '';
  const urlSeason = searchParams.get('season') || '';
  const urlRim = searchParams.get('rim') || '';
  const urlBrand = searchParams.get('brand') || '';
  const urlPcd = searchParams.get('pcd') || '';
  const urlSearch = searchParams.get('search') || searchParams.get('q') || '';

  const filterUrlKey = `${urlSort}|${urlType}|${urlSeason}|${urlRim}|${urlBrand}|${urlPcd}|${urlSearch}`;
  const lastSyncedFilterUrlKeyRef = useRef<string | null>(null);

  // Sync URL search parameters to filter state ONLY when filter-related params actually change
  // This prevents URL changes from ?offer=... or hash from re-setting filters
  useEffect(() => {
    if (lastSyncedFilterUrlKeyRef.current === filterUrlKey) {
      return;
    }
    const isFirstRun = lastSyncedFilterUrlKeyRef.current === null;
    lastSyncedFilterUrlKeyRef.current = filterUrlKey;

    const nextFilters: ShopOfferFilters = {};
    if (urlSort) nextFilters.sort = urlSort;
    if (urlType) nextFilters.type = urlType;
    if (urlSeason) {
      nextFilters.season = urlSeason;
      if (!urlType) nextFilters.type = 'pneu';
    }
    if (urlRim) nextFilters.rim = urlRim;
    if (urlBrand) nextFilters.brand = urlBrand;
    if (urlPcd) {
      nextFilters.pcd = urlPcd;
      if (!urlType) nextFilters.type = 'disk';
    }

    if (Object.keys(nextFilters).length > 0 || !isFirstRun) {
      setFilters((prev) => {
        const isSame =
          (prev.sort || '') === (nextFilters.sort || '') &&
          (prev.type || '') === (nextFilters.type || '') &&
          (prev.season || '') === (nextFilters.season || '') &&
          (prev.rim || '') === (nextFilters.rim || '') &&
          (prev.brand || '') === (nextFilters.brand || '') &&
          (prev.pcd || '') === (nextFilters.pcd || '');
        return isSame ? prev : nextFilters;
      });
    }

    if (urlSearch) {
      setSearchInput((prev) => (prev === urlSearch ? prev : urlSearch));
      setSearchQuery((prev) => (prev === urlSearch ? prev : urlSearch));
    } else if (!isFirstRun) {
      setSearchInput((prev) => (prev === '' ? prev : ''));
      setSearchQuery((prev) => (prev === '' ? prev : ''));
    }
  }, [filterUrlKey, urlSort, urlType, urlSeason, urlRim, urlBrand, urlPcd, urlSearch]);

  // Deep-linking: open offer modal when ?offer=ID or ?id=ID is in URL
  const offerParamRaw = searchParams.get('offer') || searchParams.get('id');
  const selectedOfferRef = useRef<ShopOffer | null>(null);
  selectedOfferRef.current = selectedOffer;

  useEffect(() => {
    if (!offerParamRaw) {
      // If user clicked browser back button, close modal cleanly
      if (selectedOfferRef.current) {
        setSelectedOffer(null);
      }
      return;
    }
    const targetId = parseInt(offerParamRaw, 10);
    if (!targetId || isNaN(targetId)) return;

    if (selectedOfferRef.current && selectedOfferRef.current.id === targetId) return;

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
  }, [offerParamRaw, offers]);

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

  const { linkedEmails, shop, addressLine, addressCity } = useShop();

  const activeRequestIdRef = useRef(0);
  const filtersSerialized = useMemo(() => JSON.stringify(filters), [filters]);
  const linkedEmailsSerialized = useMemo(() => (linkedEmails || []).join(','), [linkedEmails]);

  const loadOffers = useCallback(
    async (targetPage: number = page, forceRefresh = false) => {
      const requestId = ++activeRequestIdRef.current;
      try {
        setLoading(true);
        setError(null);
        const emailsToQuery =
          linkedEmails && linkedEmails.length > 0
            ? linkedEmails
            : (shop?.owner_email || SHOP_SBAZAR_EMAIL);

        const { offers: data, total } = await getShopOffers(
          limit,
          targetPage * limit,
          searchQuery,
          emailsToQuery,
          filters,
          forceRefresh
        );

        // Discard result if newer request has already started
        if (requestId !== activeRequestIdRef.current) {
          return;
        }

        if (targetPage === 0) {
          setOffers(data);
          setTotalOffers(total);
        } else {
          setOffers((prev) => {
            const existingIds = new Set(prev.map((o) => o.id));
            const fresh = data.filter((o) => !existingIds.has(o.id));
            return [...prev, ...fresh];
          });
          setTotalOffers(total);
        }

        setHasMore(data.length === limit && (targetPage + 1) * limit < total);
      } catch (err) {
        if (requestId === activeRequestIdRef.current) {
          setError('Nabídky se teď nepodařilo načíst. Zkuste to prosím znovu.');
          console.error(err);
        }
      } finally {
        if (requestId === activeRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page, searchQuery, filtersSerialized, linkedEmailsSerialized, shop?.owner_email]
  );

  useEffect(() => {
    loadOffers(page);
  }, [page, searchQuery, filtersSerialized, linkedEmailsSerialized]);

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
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const toDelete = ['sort', 'type', 'season', 'rim', 'brand', 'search', 'q', 'width', 'profile', 'pcd'];
      toDelete.forEach((p) => url.searchParams.delete(p));
      const remaining = url.searchParams.toString();
      window.history.replaceState(null, '', url.pathname + (remaining ? `?${remaining}` : '') + url.hash);
    }
  };

  const updateFilter = (key: keyof ShopOfferFilters, value: string) => {
    setPage(0);
    setHasMore(true);
    setFilters((prev) => {
      const next = { ...prev, [key]: value || undefined };
      if (key === 'type' && value === 'disk') {
        delete next.season;
      } else if (key === 'type' && value === 'pneu') {
        delete next.pcd;
      } else if (key === 'pcd' && value) {
        // Pokud uživatel zvolí rozteč, jedná se o ALU disky
        next.type = 'disk';
        delete next.season;
      } else if (key === 'season' && value) {
        // Pokud uživatel zvolí sezónu (Letní pneu, Zimní pneu, Celoroční), jedná se VÝHRADNĚ o pneu!
        next.type = 'pneu';
        delete next.pcd;
      } else if (key === 'season' && !value) {
        if (prev.type === 'pneu') {
          delete next.type;
        }
      }
      return next;
    });
  };

  const handleQuickFilter = (filterType: 'type' | 'season' | 'rim', value: string) => {
    setPage(0);
    setHasMore(true);
    setFilters((prev) => {
      const next = { ...prev, [filterType]: value || undefined };
      if (filterType === 'type' && value === 'disk') {
        delete next.season;
      } else if (filterType === 'type' && value === 'pneu') {
        delete next.pcd;
      } else if (filterType === 'season' && value) {
        next.type = 'pneu';
        delete next.pcd;
      } else if (filterType === 'season' && !value) {
        if (prev.type === 'pneu') {
          delete next.type;
        }
      }
      return next;
    });
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    filters.type ||
    filters.brand ||
    filters.season ||
    filters.width ||
    filters.profile ||
    filters.rim ||
    filters.pcd ||
    (filters.sort && filters.sort !== 'newest')
  );

  const activeDropdownCount = useMemo(() => {
    let count = 0;
    if (filters.type) count++;
    if (filters.brand) count++;
    if (filters.season) count++;
    if (filters.width) count++;
    if (filters.profile) count++;
    if (filters.rim) count++;
    if (filters.pcd) count++;
    return count;
  }, [filters]);

  const selectClass =
    'rounded-xl bg-white px-3 py-2.5 text-base sm:text-sm text-[hsl(222_47%_11%)] shadow-2xs outline-none ring-1 ring-[hsl(214_32%_91%)] focus:ring-2 focus:ring-[hsl(142_71%_45%)]';

  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-0">
      {/* Schema.org Structured Data for AI Agents & Search Engines */}
      <ShopSchema offers={offers} />

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
        style={{ overflowAnchor: 'none' }}
        className="scroll-mt-16 sm:scroll-mt-20 bg-gradient-to-b from-white via-[hsl(210_40%_98%)] via-[200px] sm:via-[260px] to-[hsl(210_40%_98%)] py-8 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto mb-6 sm:mb-10 max-w-2xl text-center">
            <span className="inline-block rounded-md bg-white border border-[hsl(214_32%_91%)] px-3 py-1 text-xs font-semibold text-[hsl(142_71%_35%)]">
              Skladová dostupnost
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-[hsl(222_47%_11%)]">
              Aktuální nabídka kol a pneu
            </h2>
            <p className="mt-2 sm:mt-3 text-xs sm:text-base text-[hsl(215_16%_47%)]">
              Všechny položky jsou fyzicky skladem{addressLine ? ` v lokalitě ${addressLine}` : ' na naší provozovně'} s možností osobní prohlídky.
            </p>
          </div>

          {/* Search and Filters Bar with AI attributes */}
          <form
            onSubmit={handleSearch}
            data-ai-search-form="true"
            className="mx-auto mb-6 sm:mb-10 max-w-4xl"
          >
            <div className="flex flex-col gap-2 sm:flex-row">
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
                  className="flex-1 sm:flex-initial rounded-xl bg-[hsl(142_71%_45%)] px-6 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[hsl(142_71%_35%)] active:scale-95 touch-manipulation"
                >
                  Hledat
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="flex-1 sm:flex-initial rounded-xl border border-[hsl(214_32%_91%)] bg-white px-4 py-3 text-sm font-medium text-[hsl(222_47%_11%)] shadow-2xs hover:bg-[hsl(210_40%_96%)] active:scale-95 touch-manipulation"
                  >
                    Vymazat filtry
                  </button>
                )}
              </div>
            </div>

            {/* Quick Filter Horizontal Scroll Pill Bar (1-tap thumbs for mobile & desktop) */}
            <div className="mt-3 sm:mt-4 flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none touch-pan-x">
              <button
                type="button"
                onClick={handleClearSearch}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all touch-manipulation ${
                  !filters.season && !filters.type && !filters.rim && !filters.pcd
                    ? 'bg-slate-950 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                🔥 Všechny nabídky
              </button>

              <button
                type="button"
                onClick={() => updateFilter('season', filters.season === 'zimni' ? '' : 'zimni')}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all touch-manipulation flex items-center gap-1 ${
                  filters.season === 'zimni'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>❄</span>
                <span>Zimní pneu</span>
              </button>

              <button
                type="button"
                onClick={() => updateFilter('season', filters.season === 'letni' ? '' : 'letni')}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all touch-manipulation flex items-center gap-1 ${
                  filters.season === 'letni'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>☀</span>
                <span>Letní pneu</span>
              </button>

              <button
                type="button"
                onClick={() => updateFilter('season', filters.season === 'celorocni' ? '' : 'celorocni')}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all touch-manipulation flex items-center gap-1 ${
                  filters.season === 'celorocni'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>⭐</span>
                <span>Celoroční</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextVal = filters.type === 'disk' ? '' : 'disk';
                  updateFilter('type', nextVal);
                  if (!nextVal) updateFilter('pcd', '');
                }}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all touch-manipulation flex items-center gap-1 ${
                  filters.type === 'disk'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>🛞</span>
                <span>ALU disky</span>
              </button>

              {/* Rychlé filtry roztečí (PCD) pro disky */}
              {['5x112', '5x108', '5x114.3', '5x120', '5x100'].map((pcd) => (
                <button
                  key={pcd}
                  type="button"
                  onClick={() => updateFilter('pcd', filters.pcd === pcd ? '' : pcd)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all touch-manipulation ${
                    filters.pcd === pcd
                      ? 'bg-emerald-700 text-white shadow-2xs ring-2 ring-emerald-400'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  title={`Filtrovat rozteč kol ${pcd}`}
                >
                  {pcd}
                </button>
              ))}

              {['15', '16', '17', '18', '19', '20'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => updateFilter('rim', filters.rim === r ? '' : r)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all touch-manipulation ${
                    filters.rim === r
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  R{r}
                </button>
              ))}
            </div>

            {/* Mobile Toggle for Detailed Dimension Filters */}
            <div className="mt-2.5 flex items-center justify-between lg:hidden">
              <button
                type="button"
                onClick={() => setMobileFiltersExpanded((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs active:scale-95 transition-all touch-manipulation"
              >
                <svg className="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span>Podrobné rozměry</span>
                {activeDropdownCount > 0 && (
                  <span className="rounded-full bg-emerald-600 px-1.5 py-0.2 text-[10px] font-extrabold text-white">
                    {activeDropdownCount}
                  </span>
                )}
                <span className="text-slate-400 text-[10px]">{mobileFiltersExpanded ? '▲' : '▼'}</span>
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="text-xs font-semibold text-rose-600 hover:underline"
                >
                  Vymazat vše
                </button>
              )}
            </div>

            {/* Filter Dropdowns - Collapsible on Mobile, always visible on Desktop */}
            <div
              className={`mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 ${
                mobileFiltersExpanded ? 'grid' : 'hidden lg:grid'
              }`}
            >
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
                value={filters.pcd || ''}
                onChange={(e) => updateFilter('pcd', e.target.value)}
                className={selectClass}
              >
                <option value="">Rozteč (PCD): vše</option>
                {WHEEL_PCD_OPTIONS.map((pcd) => (
                  <option key={pcd.value} value={pcd.value}>
                    {pcd.label}
                  </option>
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

          {/* Subtle loading indicator line while fetching in background */}
          <div className="relative h-1 mb-4 overflow-hidden rounded-full">
            {loading && offers.length > 0 && (
              <div className="h-full w-full bg-[hsl(142_71%_45%)] animate-pulse rounded-full" />
            )}
          </div>

          {/* Offers Grid */}
          {loading && offers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[hsl(215_16%_47%)]">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[hsl(214_32%_91%)] border-t-[hsl(142_71%_45%)]" />
              <p className="mt-4 text-sm font-medium">Načítám skladové zásoby…</p>
            </div>
          ) : error && offers.length === 0 ? (
            <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-xs">
              <p className="font-semibold text-red-700">{error}</p>
              <button
                onClick={() => loadOffers(0, true)}
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
              <div
                className={`shop-offer-grid transition-opacity duration-200 ${
                  loading && page === 0 ? 'opacity-60 pointer-events-none' : 'opacity-100'
                }`}
              >
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
                <div className="mt-8 sm:mt-14 text-center">
                  {loading && page > 0 ? (
                    <div className="inline-flex items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 px-6 py-3.5 text-sm font-semibold text-emerald-800 shadow-sm animate-pulse">
                      <svg className="animate-spin h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Načítám další položky ze skladu…</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setPage((prev) => prev + 1)}
                      disabled={loading}
                      className="group inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-8 sm:px-12 py-4 text-sm sm:text-base font-extrabold text-white shadow-xl shadow-emerald-600/30 ring-2 ring-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200 cursor-pointer disabled:opacity-50 touch-manipulation"
                    >
                      <span>Načíst další nabídky ({offers.length} z {totalOffers ?? offers.length} zobrazeno)</span>
                      <svg
                        className="h-5 w-5 transition-transform duration-200 group-hover:translate-y-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
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

      {/* Persistent Mobile Bottom Action Bar (Thumb-friendly 1-tap call, inquiry, map) */}
      <MobileShopBar totalOffers={totalOffers} />
    </div>
  );
}
