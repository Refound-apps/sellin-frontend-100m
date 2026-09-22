'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ShopConfigData, ShopConfigSummary, User } from '@/lib/types';
import { getUserShop, saveUserShop } from '@/lib/api';

export default function ShopManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Shop management state
  const [shop, setShop] = useState<ShopConfigData | null>(null);
  const [allShops, setAllShops] = useState<ShopConfigSummary[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [availableCredentials, setAvailableCredentials] = useState<User[]>([]);
  const [credSearch, setCredSearch] = useState('');
  const [credFilter, setCredFilter] = useState<'all' | 'selected' | 'unselected'>('all');

  // Form fields
  const [isActive, setIsActive] = useState(true);
  const [shopName, setShopName] = useState('');
  const [tagline, setTagline] = useState('');
  const [slug, setSlug] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ico, setIco] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [region, setRegion] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [shippingPriceTires, setShippingPriceTires] = useState('600 Kč');
  const [shippingPriceRims, setShippingPriceRims] = useState('500 Kč');
  const [mapLink, setMapLink] = useState('');
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [caravanUrl, setCaravanUrl] = useState('');
  const [templateId, setTemplateId] = useState('pneu-classic');
  const [linkedEmails, setLinkedEmails] = useState<string[]>([]);

  const populateFormWithShop = (s: ShopConfigData | null, creds: User[]) => {
    if (s) {
      setShop(s);
      setIsActive(s.is_active);
      setShopName(s.shop_name || '');
      setTagline(s.tagline || '');
      setSlug(s.slug || '');
      setCustomDomain(s.custom_domain || '');
      setPhone(s.phone || '');
      setEmail(s.email || '');
      setOwnerName(s.owner_name || '');
      setIco(s.ico || '');
      setAddressLine(s.address_line || '');
      setAddressCity(s.address_city || '');
      setRegion(s.region || '');
      setOpeningHours(s.opening_hours || '');
      setShippingPriceTires(s.shipping_price_tires || '600 Kč');
      setShippingPriceRims(s.shipping_price_rims || '500 Kč');
      setMapLink(s.map_link || '');
      setGoogleMapsLink(s.google_maps_link || '');
      setCaravanUrl(s.caravan_url || '');
      setTemplateId(s.template_id || 'pneu-classic');
      setLinkedEmails(s.linked_credential_emails || []);
    } else {
      setShop(null);
      setIsActive(true);
      setShopName('Nový E-shop');
      setTagline('Prověřené pneumatiky a disky');
      setSlug('muj-eshop');
      setCustomDomain('');
      setPhone('');
      setEmail('');
      setOwnerName('');
      setIco('');
      setAddressLine('');
      setAddressCity('');
      setRegion('');
      setOpeningHours('Po–Pá: 8:00 – 17:00');
      setShippingPriceTires('600 Kč');
      setShippingPriceRims('500 Kč');
      setMapLink('');
      setGoogleMapsLink('');
      setCaravanUrl('');
      setTemplateId('pneu-classic');
      setLinkedEmails(creds.slice(0, 5).map((c) => c.email).filter(Boolean));
    }
  };

  const loadData = async (shopIdToLoad?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserShop(shopIdToLoad);
      const creds = data.availableCredentials || [];
      setAvailableCredentials(creds);
      setAllShops(data.allShops || []);
      setIsAdmin(Boolean(data.isAdmin));

      populateFormWithShop(data.shop, creds);
    } catch (err: unknown) {
      console.error('Error loading shop manager data:', err);
      setError('Nepodařilo se načíst konfiguraci e-shopu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectShop = (newShopId: string) => {
    if (!newShopId) return;
    loadData(newShopId);
  };

  const handleCreateNewShop = () => {
    populateFormWithShop(null, availableCredentials);
  };

  const handleToggleEmail = (emailToToggle: string) => {
    const clean = emailToToggle.toLowerCase().trim();
    setLinkedEmails((prev) =>
      prev.includes(clean) ? prev.filter((e) => e !== clean) : [...prev, clean]
    );
  };

  const filteredCredentials = useMemo(() => {
    let result = availableCredentials;
    if (credSearch.trim()) {
      const q = credSearch.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.email?.toLowerCase().includes(q) ||
          c.bazos_name?.toLowerCase().includes(q) ||
          c.telephone1?.includes(q) ||
          c.sbazar_email?.toLowerCase().includes(q)
      );
    }
    if (credFilter === 'selected') {
      result = result.filter((c) => linkedEmails.includes(c.email.toLowerCase().trim()));
    } else if (credFilter === 'unselected') {
      result = result.filter((c) => !linkedEmails.includes(c.email.toLowerCase().trim()));
    }
    return result;
  }, [availableCredentials, credSearch, credFilter, linkedEmails]);

  const handleSelectFilteredEmails = () => {
    const emailsToAdd = filteredCredentials.map((c) => c.email.toLowerCase().trim()).filter(Boolean);
    setLinkedEmails((prev) => Array.from(new Set([...prev, ...emailsToAdd])));
  };

  const handleDeselectFilteredEmails = () => {
    const emailsToRemove = new Set(filteredCredentials.map((c) => c.email.toLowerCase().trim()));
    setLinkedEmails((prev) => prev.filter((e) => !emailsToRemove.has(e)));
  };

  const handleCustomDomainChange = (val: string) => {
    const clean = val
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '')
      .trim();
    setCustomDomain(clean);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!shopName.trim()) {
      alert('Prosím zadejte název e-shopu.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);

      const cleanCustomDomain = customDomain
        .replace(/^https?:\/\//i, '')
        .replace(/\/.*$/, '')
        .trim();

      const payload: Partial<ShopConfigData> = {
        id: shop?.id, // Sent so backend knows to update existing shop
        is_active: isActive,
        shop_name: shopName.trim(),
        tagline: tagline.trim() || null,
        slug: slug.trim() || undefined,
        custom_domain: cleanCustomDomain || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        owner_name: ownerName.trim() || null,
        ico: ico.trim() || null,
        address_line: addressLine.trim() || null,
        address_city: addressCity.trim() || null,
        region: region.trim() || null,
        opening_hours: openingHours.trim() || null,
        shipping_price_tires: shippingPriceTires.trim() || null,
        shipping_price_rims: shippingPriceRims.trim() || null,
        map_link: mapLink.trim() || null,
        google_maps_link: googleMapsLink.trim() || null,
        caravan_url: caravanUrl.trim() || null,
        template_id: templateId,
        linked_credential_emails: linkedEmails,
      };

      const updated = await saveUserShop(payload);
      setShop(updated);
      setCustomDomain(updated.custom_domain || '');
      setSlug(updated.slug || '');
      setSaveSuccess(true);

      // Refresh allShops list in state
      setAllShops((prev) => {
        const idx = prev.findIndex((s) => s.id === updated.id);
        const item: ShopConfigSummary = {
          id: updated.id,
          shop_name: updated.shop_name,
          slug: updated.slug,
          custom_domain: updated.custom_domain,
          owner_email: updated.owner_email,
          is_active: updated.is_active,
        };
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = item;
          return next;
        }
        return [...prev, item];
      });

      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Uložení konfigurace selhalo.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Načítám konfiguraci e-shopu...</p>
        </div>
      </div>
    );
  }

  const cleanDomainForLink = customDomain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
  const liveDomain = cleanDomainForLink
    ? `https://${cleanDomainForLink}`
    : `/shop?shop=${slug || 'preview'}`;
  const localPreviewUrl = cleanDomainForLink
    ? `/shop?custom_domain=${cleanDomainForLink}`
    : `/shop?shop=${slug || 'preview'}`;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Storefront Engine · Multi-Tenant</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Správa & Generátor E-shopu
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Vygenerujte si vlastní značkový e-shop z vaší nabídky inzerátů a napojte ho na vlastní doménu.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={liveDomain}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-98 transition-all"
          >
            <span>Otevřít doménu</span>
            <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-98 disabled:opacity-50 transition-all"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Ukládám...</span>
              </>
            ) : (
              <span>Uložit změny</span>
            )}
          </button>
        </div>
      </div>

      {/* Multi-Shop Selector (for Admin & Multi-Storefront Sellers) */}
      {(allShops.length > 0 || isAdmin) && (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Aktivní e-shop:
            </span>
            <select
              value={shop?.id || ''}
              onChange={(e) => handleSelectShop(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-900 shadow-2xs outline-none focus:ring-2 focus:ring-slate-900"
            >
              {allShops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shop_name} ({s.custom_domain ? s.custom_domain : `${s.slug}.sellin.cz`})
                  {!s.is_active ? ' [Pozastaven]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={localPreviewUrl}
              target="_blank"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs transition-all"
            >
              Náhled v aplikaci ↗
            </Link>
            {isAdmin && (
              <button
                type="button"
                onClick={handleCreateNewShop}
                className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 shadow-2xs transition-all"
              >
                + Vytvořit nový e-shop
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-2.5">
          <svg className="h-5 w-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <strong className="font-bold">Chyba při ukládání:</strong>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center gap-2.5 shadow-2xs">
          <svg className="h-5 w-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">
            Konfigurace e-shopu byla úspěšně uložena a propisuje se do storefrontu na doméně {customDomain || `${slug}.sellin.cz`}.
          </span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* 1. STAV E-SHOPU & RYCHLÝ PŘEHLED */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Stav e-shopu</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Aktivní e-shop je dostupný pro návštěvníky a zobrazuje vaše skladové inzeráty.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {isActive ? 'E-shop je aktivní' : 'E-shop je pozastaven'}
              </span>

              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-all ${
                  isActive
                    ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {isActive ? 'Pozastavit e-shop' : 'Aktivovat e-shop'}
              </button>
            </div>
          </div>
        </section>

        {/* 2. VLASTNÍ DOMÉNA A SUBDOMÉNA */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Vlastní doména & Adresa e-shopu</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Propojte e-shop se svou vlastní doménou (např. <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">alubazarplzen.cz</code>), nebo použijte systémovou subdoménu Sellin.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Vlastní doména prodejce
              </label>
              <div className="mt-1 flex rounded-xl shadow-2xs ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-slate-900">
                <span className="inline-flex items-center rounded-l-xl bg-slate-50 px-3 text-xs text-slate-500 border-r border-slate-200">
                  https://
                </span>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => handleCustomDomainChange(e.target.value)}
                  placeholder="alubazarplzen.cz"
                  className="w-full rounded-r-xl border-0 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Zadejte doménu bez https:// (např. <span className="font-mono text-slate-600">alubazarplzen.cz</span> nebo <span className="font-mono text-slate-600">www.alubazarplzen.cz</span>)
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Systémová subdoména (slug)
              </label>
              <div className="mt-1 flex rounded-xl shadow-2xs ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-slate-900">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="alubazar-plzen"
                  className="w-full rounded-l-xl border-0 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
                <span className="inline-flex items-center rounded-r-xl bg-slate-50 px-3 text-xs text-slate-500 border-l border-slate-200">
                  .sellin.cz
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Záložní adresa i bez nastavení vlastní domény
              </p>
            </div>
          </div>

          {/* Domain Status Box */}
          {cleanDomainForLink && (
            <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 sm:flex-row sm:items-center sm:justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>E-shop je namapován na doménu:</span>
                <span className="font-mono font-bold text-emerald-950">https://{cleanDomainForLink}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`https://${cleanDomainForLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-emerald-600 px-3 py-1 font-semibold text-white shadow-2xs hover:bg-emerald-700 transition-all"
                >
                  Otevřít doménu ↗
                </Link>
                <Link
                  href={`/shop?custom_domain=${cleanDomainForLink}`}
                  target="_blank"
                  className="rounded-lg border border-emerald-300 bg-white px-3 py-1 font-semibold text-emerald-800 shadow-2xs hover:bg-emerald-50 transition-all"
                >
                  Testovat zobrazení ↗
                </Link>
              </div>
            </div>
          )}

          {/* DNS Instructions Box */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-slate-700 space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-blue-900">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Jak nastavit DNS u registrátora domény (Vercel hosting):</span>
            </div>
            <p className="text-slate-600">
              U svého registrátora domény (např. Wedos, Forpsi, Subreg, Active24) přidejte tyto záznamy:
            </p>
            <div className="space-y-1.5 rounded-lg bg-white p-3 font-mono text-[11px] border border-blue-200 text-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1.5 border-b border-slate-100">
                <span><strong>Typ:</strong> A (pro hlavní doménu)</span>
                <span><strong>Hostitel:</strong> @</span>
                <span><strong>Hodnota (IP):</strong> <strong className="text-blue-700">216.198.79.1</strong> (nebo 76.76.21.21)</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1.5">
                <span><strong>Typ:</strong> CNAME (pro www nebo subdoménu)</span>
                <span><strong>Hostitel:</strong> www</span>
                <span><strong>Cíl:</strong> <strong className="text-blue-700">cname.vercel-dns.com</strong></span>
              </div>
            </div>
            <div className="flex items-start gap-1.5 text-[11px] text-slate-500">
              <span>ℹ️</span>
              <span>
                Doména musí být také přiřazena v projektu na Vercelu (Settings → Domains). SSL certifikát (HTTPS) vygeneruje Vercel automaticky po ověření DNS záznamů.
              </span>
            </div>
          </div>
        </section>

        {/* 3. VÝBĚR NAPOJENÝCH ÚČTŮ (MULTI-TENANT INVENTÁŘ) */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Napojené účty a inzeráty ({linkedEmails.length} vybráno)
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Inzeráty z vybraných účtů se budou automaticky promítat do nabídky vašeho e-shopu.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSelectFilteredEmails}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
              >
                Vybrat zobrazené
              </button>
              <button
                type="button"
                onClick={handleDeselectFilteredEmails}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
              >
                Odznačit zobrazené
              </button>
            </div>
          </div>

          {/* Search & Quick Filters for Accounts */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={credSearch}
              onChange={(e) => setCredSearch(e.target.value)}
              placeholder="Filtrovat účty (např. duplux, pneu, @seznam.cz)..."
              className="w-full sm:w-80 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-900"
            />
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setCredFilter('all')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                  credFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Vše ({availableCredentials.length})
              </button>
              <button
                type="button"
                onClick={() => setCredFilter('selected')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                  credFilter === 'selected'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Vybrané ({linkedEmails.length})
              </button>
              <button
                type="button"
                onClick={() => setCredFilter('unselected')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                  credFilter === 'unselected'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Nevybrané ({availableCredentials.length - linkedEmails.length})
              </button>
            </div>
          </div>

          {availableCredentials.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
              Nebyly nalezeny žádné další napojené účty. E-shop bude čerpat inzeráty podle vašeho přihlašovacího e-mailu.
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 max-h-80 overflow-y-auto p-1">
              {filteredCredentials.map((cred) => {
                const credEmail = (cred.email || '').toLowerCase().trim();
                const isSelected = linkedEmails.includes(credEmail);
                return (
                  <div
                    key={cred.id || cred.email}
                    onClick={() => handleToggleEmail(credEmail)}
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900">{cred.email}</p>
                      <div className="mt-0.5 flex flex-wrap gap-1 text-[11px] text-slate-500">
                        {cred.bazos_name && <span>{cred.bazos_name}</span>}
                        {cred.telephone1 && <span>· {cred.telephone1}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 4. ZÁKLADNÍ ÚDAJE & KONTAKTY PRODEJCE */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Identita a kontakty prodejce</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Tyto údaje se zobrazují v hlavičce, patičce, kontaktní stránce a v detailu každé nabídky.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Název e-shopu</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Duplux Pneu"
                className="mt-1 w-full rounded-xl border-0 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Slogan / Podtitul</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Pneu a disky Plzeň"
                className="mt-1 w-full rounded-xl border-0 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Kontaktní telefon pro zákazníky</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="602 390 038"
                className="mt-1 w-full rounded-xl border-0 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Kontaktní e-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="duplux@seznam.cz"
                className="mt-1 w-full rounded-xl border-0 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Jméno provozovatele</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="František Vašek"
                className="mt-1 w-full rounded-xl border-0 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">IČO</label>
              <input
                type="text"
                value={ico}
                onChange={(e) => setIco(e.target.value)}
                placeholder="03401545"
                className="mt-1 w-full rounded-xl border-0 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Adresa provozovny (řádek 1)</label>
              <input
                type="text"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="Plzeň Jih"
                className="mt-1 w-full rounded-xl border-0 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Město / okres</label>
              <input
                type="text"
                value={addressCity}
                onChange={(e) => setAddressCity(e.target.value)}
                placeholder="okres Plzeň-jih"
                className="mt-1 w-full rounded-xl border-0 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">Otevírací doba</label>
              <input
                type="text"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="Po–Pá: 8:00 – 17:00, So: dle telefonické domluvy"
                className="mt-1 w-full rounded-xl border-0 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Cena dopravy pneumatik (Česká pošta)</label>
              <input
                type="text"
                value={shippingPriceTires}
                onChange={(e) => setShippingPriceTires(e.target.value)}
                placeholder="600 Kč"
                className="mt-1 w-full rounded-xl border-0 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Cena dopravy disků (Česká pošta)</label>
              <input
                type="text"
                value={shippingPriceRims}
                onChange={(e) => setShippingPriceRims(e.target.value)}
                placeholder="500 Kč"
                className="mt-1 w-full rounded-xl border-0 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Odkaz na Google Mapy</label>
              <input
                type="url"
                value={googleMapsLink}
                onChange={(e) => setGoogleMapsLink(e.target.value)}
                placeholder="https://maps.google.com/..."
                className="mt-1 w-full rounded-xl border-0 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Doplňkový web / služba (volitelné)</label>
              <input
                type="url"
                value={caravanUrl}
                onChange={(e) => setCaravanUrl(e.target.value)}
                placeholder="https://pujckaravanplzen.cz/"
                className="mt-1 w-full rounded-xl border-0 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
        </section>

        {/* 5. VÝBĚR ŠABLONY VZHLEDU */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Šablona vzhledu storefrontu</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Vyberte vizuální styl a funkční komponenty e-shopu podle charakteru vašeho zboží.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Template 1: Pneu Classic */}
            <div
              onClick={() => setTemplateId('pneu-classic')}
              className={`rounded-2xl border-2 p-4 cursor-pointer transition-all ${
                templateId === 'pneu-classic'
                  ? 'border-emerald-600 bg-emerald-50/20 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Aktivní šablona
                </span>
                <span className="text-xs font-bold text-slate-900">v1.2</span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900">Pneu & Disky Pro</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Vyladěná šablona s interaktivním filtrem rozměrů (šířka, profil, ráfek), pneuservisními službami a rychlým telefonickým kontaktem.
              </p>
              <div className="mt-4 flex flex-wrap gap-1 text-[10px] text-slate-600">
                <span className="rounded bg-slate-100 px-1.5 py-0.5">Kalkulátor rozměrů</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5">Služby servisu</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5">Osobní odběr</span>
              </div>
            </div>

            {/* Template 2: Minimal Auto (Coming Soon) */}
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-4 opacity-70">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                  Připravujeme
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-700">Minimalistický katalog dílů</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Čistá mřížka produktů se zaměřením na náhradní díly, OEM čísla a rychlé filtrování podle značky a modelu vozu.
              </p>
              <div className="mt-4 flex flex-wrap gap-1 text-[10px] text-slate-500">
                <span className="rounded bg-white px-1.5 py-0.5 border border-slate-200">OEM vyhledávání</span>
                <span className="rounded bg-white px-1.5 py-0.5 border border-slate-200">Kategorie dílů</span>
              </div>
            </div>

            {/* Template 3: Auto-Moto Showroom (Coming Soon) */}
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-4 opacity-70">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                  Připravujeme
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-700">Auto & Moto Showroom</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Prezentace celých vozidel a motocyklů s technickými specifikacemi, rokem výroby a stavem tachometru.
              </p>
              <div className="mt-4 flex flex-wrap gap-1 text-[10px] text-slate-500">
                <span className="rounded bg-white px-1.5 py-0.5 border border-slate-200">Parametry vozu</span>
                <span className="rounded bg-white px-1.5 py-0.5 border border-slate-200">VIN kontrola</span>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM SAVE BUTTON */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link
            href={liveDomain}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-98"
          >
            Zobrazit e-shop ↗
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-slate-900 px-7 py-3 text-sm font-bold text-white shadow-xs hover:bg-slate-800 active:scale-98 disabled:opacity-50 transition-all"
          >
            {saving ? 'Ukládám nastavení...' : 'Uložit konfiguraci e-shopu'}
          </button>
        </div>
      </form>
    </div>
  );
}
