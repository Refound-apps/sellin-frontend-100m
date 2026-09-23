'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ShopConfigData, ShopConfigSummary, User } from '@/lib/types';
import { getUserShop, saveUserShop } from '@/lib/api';

interface SellerAccountOption {
  email: string;
  name: string | null;
  phone: string | null;
}

export default function AdminShopsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Admin state
  const [allShops, setAllShops] = useState<ShopConfigSummary[]>([]);
  const [currentShopId, setCurrentShopId] = useState<string | null>(null);
  const [shop, setShop] = useState<ShopConfigData | null>(null);
  const [availableCredentials, setAvailableCredentials] = useState<User[]>([]);
  const [sellerAccounts, setSellerAccounts] = useState<SellerAccountOption[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Credential filter & search
  const [credSearch, setCredSearch] = useState('');
  const [credFilter, setCredFilter] = useState<'all' | 'selected' | 'unselected'>('all');

  // Form fields
  const [ownerEmail, setOwnerEmail] = useState('');
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

  const populateForm = (s: ShopConfigData | null) => {
    if (s) {
      setShop(s);
      setCurrentShopId(s.id);
      setIsCreatingNew(false);
      setOwnerEmail(s.owner_email || '');
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
      setCurrentShopId(null);
      setIsCreatingNew(true);
      setOwnerEmail('');
      setIsActive(true);
      setShopName('Nový klientský e-shop');
      setTagline('Prověřené pneumatiky a disky');
      setSlug('');
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
      setLinkedEmails([]);
    }
  };

  const loadData = async (shopIdToLoad?: string) => {
    try {
      setLoading(true);
      setError(null);
      const query = shopIdToLoad ? `?shop_id=${encodeURIComponent(shopIdToLoad)}` : '?admin=1';
      const data = await getUserShop(query);

      setAllShops(data.allShops || []);
      setAvailableCredentials(data.availableCredentials || []);
      if (data.sellerAccounts) {
        setSellerAccounts(data.sellerAccounts);
      }

      if (shopIdToLoad && data.shop) {
        populateForm(data.shop);
      } else if (data.shop) {
        populateForm(data.shop);
      } else if (data.allShops && data.allShops.length > 0) {
        // Load the first shop
        const firstData = await getUserShop(`?shop_id=${data.allShops[0].id}`);
        populateForm(firstData.shop);
      } else {
        populateForm(null);
      }
    } catch (err: unknown) {
      console.error('Error loading admin shop data:', err);
      setError('Nepodařilo se načíst data e-shopů.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sid = params.get('shop_id');
      if (sid) {
        loadData(sid);
        return;
      }
    }
    loadData();
  }, []);

  const handleSelectShop = (shopId: string) => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', `/admin/eshop?shop_id=${encodeURIComponent(shopId)}`);
    }
    loadData(shopId);
  };

  const handleCreateNew = () => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/admin/eshop?new=1');
    }
    populateForm(null);
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

    if (!ownerEmail.trim()) {
      alert('Prosím zadejte e-mail vlastníka (účet klienta).');
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

      const payload: Partial<ShopConfigData> & { is_new?: boolean } = {
        id: isCreatingNew ? undefined : shop?.id,
        is_new: isCreatingNew,
        owner_email: ownerEmail.trim().toLowerCase(),
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
      populateForm(updated);
      setSaveSuccess(true);

      if (typeof window !== 'undefined' && updated.id) {
        window.history.replaceState({}, '', `/admin/eshop?shop_id=${encodeURIComponent(updated.id)}`);
      }

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
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Načítám klientské e-shopy...</p>
        </div>
      </div>
    );
  }

  const cleanDomainForLink = customDomain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
  const liveDomain = cleanDomainForLink
    ? `https://${cleanDomainForLink}`
    : `/shop?shop=${slug || 'preview'}`;

  const isDuplux = ownerEmail.includes('duplux') || (shop?.owner_email || '').includes('duplux');

  return (
    <div className="space-y-6 pb-16">
      {/* Admin Top Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Administrace systému
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Klientské e-shopy
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Správa e-shopů uživatelů
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Centrální správa všech klientských e-shopů na míru, propojování vlastních domén a přiřazování účtů prodejců.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/eshop"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-98 transition-all"
            title="Přepnout na pohled prodejce pro otestování běžného rozhraní"
          >
            <span>Pohled prodejce (/eshop)</span>
            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>

          <button
            type="button"
            onClick={handleCreateNew}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs sm:text-sm font-bold text-amber-900 shadow-2xs hover:bg-amber-100 active:scale-98 transition-all"
          >
            <span className="text-amber-700 font-bold">+</span>
            <span>Nový e-shop pro klienta</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-slate-800 active:scale-98 disabled:opacity-50 transition-all"
          >
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Ukládám...</span>
              </>
            ) : (
              <span>Uložit změny</span>
            )}
          </button>
        </div>
      </div>

      {/* Grid of all shops in system */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            E-shopy v systému ({allShops.length})
          </h2>
          <span className="text-xs text-slate-400">
            Kliknutím na e-shop otevřete jeho detail a konfiguraci
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allShops.map((s) => {
            const isSelected = !isCreatingNew && (currentShopId === s.id || shop?.id === s.id);
            return (
              <div
                key={s.id}
                onClick={() => handleSelectShop(s.id)}
                className={`group relative rounded-2xl border p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-slate-900 bg-white shadow-md ring-2 ring-slate-900'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-bold text-slate-950 text-sm">
                        {s.shop_name}
                      </h3>
                      {isSelected && (
                        <span className="rounded-md bg-slate-900 text-white px-1.5 py-0.5 text-[9px] font-bold">
                          Vybráno
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate font-mono text-xs text-slate-500">
                      👤 {s.owner_email}
                    </p>
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      s.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${s.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {s.is_active ? 'Aktivní' : 'Pozastaven'}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                  <span className="font-mono text-[11px] text-slate-600 truncate">
                    {s.custom_domain ? `🌐 ${s.custom_domain}` : `${s.slug}.prodejomat.cz`}
                  </span>
                  {s.custom_domain && (
                    <Link
                      href={`https://${s.custom_domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-slate-400 hover:text-slate-900 p-1 rounded-md"
                      title="Otevřít živý e-shop v novém okně"
                    >
                      ↗
                    </Link>
                  )}
                </div>
              </div>
            );
          })}

          {/* New shop card trigger */}
          <div
            onClick={handleCreateNew}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 cursor-pointer text-center transition-all min-h-[105px] ${
              isCreatingNew
                ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500'
                : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-100/70'
            }`}
          >
            <span className="text-lg font-bold text-slate-400 group-hover:text-slate-600">+</span>
            <span className="text-xs font-bold text-slate-700 mt-1">
              {isCreatingNew ? 'Nyní vytváříte nový e-shop' : 'Vytvořit e-shop pro dalšího klienta'}
            </span>
            <span className="text-[11px] text-slate-400">
              Přidá nový e-shop na míru s vlastní doménou
            </span>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs sm:text-sm text-red-800 flex items-center gap-2">
          <span className="font-bold">Chyba:</span>
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs sm:text-sm text-emerald-800 flex items-center gap-2">
          <span>✓</span>
          <span>Konfigurace klientského e-shopu byla úspěšně uložena.</span>
        </div>
      )}

      {/* Editor Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Banner about active client shop */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Aktivní formulář
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                {isCreatingNew ? 'Tvorba nového e-shopu pro klienta' : `Editace: ${shopName || 'E-shop'}`}
              </h2>
              <p className="text-xs text-slate-500">
                Tento e-shop patří uživatelskému účtu níže a je vytvořen na míru pro něj.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={liveDomain}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                <span>Otevřít web e-shopu</span>
                <span className="text-slate-400">↗</span>
              </Link>

              {/* Status toggle */}
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {isActive ? 'Aktivní e-shop' : 'Pozastaven'}
              </button>
            </div>
          </div>

          {/* Client Owner Account */}
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-bold text-slate-900">
                Účet klienta / prodejce (vlastník e-shopu v Prodejomat.cz)
              </label>
              {isDuplux && (
                <span className="rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                  ✓ Klient Duplux Pneu (Alubazar Plzeň)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600">
              E-shop patří tomuto uživatelskému účtu. Inzeráty a skladové položky se do e-shopu načítají z tohoto účtu.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <div className="relative flex-1">
                <input
                  type="email"
                  required
                  list="admin-seller-accounts"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value.toLowerCase().trim())}
                  placeholder="např. duplux@seznam.cz"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 font-mono outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
                <datalist id="admin-seller-accounts">
                  {sellerAccounts.map((acc) => (
                    <option key={acc.email} value={acc.email}>
                      {acc.name ? `${acc.name} (${acc.email})` : acc.email}
                    </option>
                  ))}
                </datalist>
              </div>

              {ownerEmail !== 'duplux@seznam.cz' && (
                <button
                  type="button"
                  onClick={() => setOwnerEmail('duplux@seznam.cz')}
                  className="shrink-0 rounded-xl bg-white border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all"
                >
                  Přiřadit k duplux@seznam.cz
                </button>
              )}
            </div>
          </div>

          {/* Basic information & domain */}
          <div className="grid gap-3.5 sm:grid-cols-2 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Název e-shopu</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="např. Duplux Pneu"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Podtitul / Slogan</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="např. Prověřené pneumatiky a disky se zárukou"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Vlastní doména klienta
              </label>
              <div className="mt-1 flex rounded-xl border border-slate-200 focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
                <span className="inline-flex items-center rounded-l-xl bg-slate-50 px-2.5 text-xs text-slate-400 border-r border-slate-200">
                  https://
                </span>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => handleCustomDomainChange(e.target.value)}
                  placeholder="alubazarplzen.cz"
                  className="w-full rounded-r-xl px-3 py-2 text-sm text-slate-900 outline-none"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Zadejte bez https:// (např. <span className="font-mono text-slate-600">alubazarplzen.cz</span>)
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Systémová subdoména (.prodejomat.cz)
              </label>
              <div className="mt-1 flex rounded-xl border border-slate-200 focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="duplux"
                  className="w-full rounded-l-xl px-3 py-2 text-sm text-slate-900 outline-none"
                />
                <span className="inline-flex items-center rounded-r-xl bg-slate-50 px-2.5 text-xs text-slate-500 border-l border-slate-200">
                  .prodejomat.cz
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Záložní adresa pro e-shop i bez vlastní domény
              </p>
            </div>
          </div>
        </div>

        {/* Contact details */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Kontaktní údaje a provozovna klienta</h2>
            <p className="text-xs text-slate-500">Údaje zobrazené v hlavičce, kontaktech a u inzerátů klienta.</p>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Kontaktní telefon</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="např. 777 123 456"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Kontaktní e-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="např. info@alubazarplzen.cz"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Jméno provozovatele / firmy</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="např. Duplux s.r.o."
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">IČO</label>
              <input
                type="text"
                value={ico}
                onChange={(e) => setIco(e.target.value)}
                placeholder="např. 12345678"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Místo odběru (ulice / lokalita)</label>
              <input
                type="text"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="např. Křimická 134"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Město / okres</label>
              <input
                type="text"
                value={addressCity}
                onChange={(e) => setAddressCity(e.target.value)}
                placeholder="např. Plzeň"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">Otevírací doba</label>
              <input
                type="text"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="např. Po–Pá: 8:00 – 17:00, So: dle telefonické domluvy"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Cena dopravy pneumatik</label>
              <input
                type="text"
                value={shippingPriceTires}
                onChange={(e) => setShippingPriceTires(e.target.value)}
                placeholder="např. 600 Kč"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Cena dopravy disků</label>
              <input
                type="text"
                value={shippingPriceRims}
                onChange={(e) => setShippingPriceRims(e.target.value)}
                placeholder="např. 500 Kč"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Odkaz na Google Mapy (volitelné)</label>
              <input
                type="url"
                value={googleMapsLink}
                onChange={(e) => setGoogleMapsLink(e.target.value)}
                placeholder="https://maps.google.com/..."
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Doplňkový web / služba (volitelné)</label>
              <input
                type="url"
                value={caravanUrl}
                onChange={(e) => setCaravanUrl(e.target.value)}
                placeholder="https://www.alubazarplzen.cz"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        </section>

        {/* Linked accounts selection */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Napojené inzertní účty pro tento e-shop ({linkedEmails.length} vybráno)
              </h2>
              <p className="text-xs text-slate-500">
                Inzeráty z těchto vybraných účtů se budou automaticky promítat do e-shopu tohoto klienta.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectFilteredEmails}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-all"
              >
                Vybrat vše
              </button>
              <button
                type="button"
                onClick={handleDeselectFilteredEmails}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-all"
              >
                Zrušit výběr
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={credSearch}
              onChange={(e) => setCredSearch(e.target.value)}
              placeholder="Vyhledat účet podle e-mailu nebo jména..."
              className="w-full sm:w-72 rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-900"
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

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-72 overflow-y-auto p-0.5">
            {filteredCredentials.map((cred) => {
              const credEmail = (cred.email || '').toLowerCase().trim();
              const isSelected = linkedEmails.includes(credEmail);
              return (
                <div
                  key={cred.id || cred.email}
                  onClick={() => handleToggleEmail(credEmail)}
                  className={`flex items-start gap-2.5 rounded-xl border p-2.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-900">{cred.email}</p>
                    {(cred.bazos_name || cred.telephone1) && (
                      <p className="truncate text-[11px] text-slate-500">
                        {[cred.bazos_name, cred.telephone1].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Save footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Link
            href={liveDomain}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-98"
          >
            Zobrazit e-shop klienta ↗
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-slate-800 active:scale-98 disabled:opacity-50 transition-all"
          >
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Ukládám změny...</span>
              </>
            ) : (
              <span>Uložit konfiguraci</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
