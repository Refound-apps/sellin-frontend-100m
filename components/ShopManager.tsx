'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ShopConfigData, User } from '@/lib/types';
import { getUserShop, saveUserShop } from '@/lib/api';

export default function ShopManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Shop management state
  const [shop, setShop] = useState<ShopConfigData | null>(null);
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
      setShopName('Můj E-shop');
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

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserShop();
      const creds = data.availableCredentials || [];
      setAvailableCredentials(creds);
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
        id: shop?.id,
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
          <p className="text-sm font-medium text-slate-500">Načítám nastavení e-shopu...</p>
        </div>
      </div>
    );
  }

  const cleanDomainForLink = customDomain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
  const liveDomain = cleanDomainForLink
    ? `https://${cleanDomainForLink}`
    : `/shop?shop=${slug || 'preview'}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Správa e-shopu
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Základní nastavení vašeho výkladního e-shopu, domény a napojených inzertních účtů.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={liveDomain}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-98 transition-all"
          >
            <span>Zobrazit e-shop</span>
            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-98 disabled:opacity-50 transition-all"
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

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs sm:text-sm text-red-800 flex items-center gap-2">
          <span className="font-bold">Chyba:</span>
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs sm:text-sm text-emerald-800 flex items-center gap-2">
          <span>✓</span>
          <span>Nastavení e-shopu bylo úspěšně uloženo.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. ZÁKLADNÍ NASTAVENÍ & DOMÉNA */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Základní informace a adresa e-shopu</h2>
              <p className="text-xs text-slate-500">Název, popis a internetová adresa vašeho obchodu.</p>
            </div>

            {/* Status toggle */}
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {isActive ? 'E-shop je aktivní' : 'E-shop je pozastaven'}
            </button>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Název e-shopu</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="např. Auto Pneu Centrum"
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
                Vlastní doména (volitelné)
              </label>
              <div className="mt-1 flex rounded-xl border border-slate-200 focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
                <span className="inline-flex items-center rounded-l-xl bg-slate-50 px-2.5 text-xs text-slate-400 border-r border-slate-200">
                  https://
                </span>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => handleCustomDomainChange(e.target.value)}
                  placeholder="mojedomena.cz"
                  className="w-full rounded-r-xl px-3 py-2 text-sm text-slate-900 outline-none"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Zadejte bez https:// (např. <span className="font-mono text-slate-600">mojedomena.cz</span>)
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Systémová adresa (subdoména)
              </label>
              <div className="mt-1 flex rounded-xl border border-slate-200 focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="muj-eshop"
                  className="w-full rounded-l-xl px-3 py-2 text-sm text-slate-900 outline-none"
                />
                <span className="inline-flex items-center rounded-r-xl bg-slate-50 px-2.5 text-xs text-slate-500 border-l border-slate-200">
                  .prodejomat.cz
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Záložní adresa pro váš e-shop i bez vlastní domény
              </p>
            </div>
          </div>

          {/* Collapsible DNS Help */}
          <details className="group rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs">
            <summary className="flex cursor-pointer items-center justify-between font-semibold text-slate-700 select-none">
              <span>Potřebujete pomoc s nastavením vlastní domény? (DNS záznamy)</span>
              <span className="text-slate-400 group-open:rotate-180 transition-transform text-[10px]">▼</span>
            </summary>
            <div className="mt-2.5 space-y-2 border-t border-slate-200 pt-2.5 text-slate-600">
              <p>U svého registrátora domény (např. Wedos, Forpsi, Active24) stačí nastavit tyto záznamy:</p>
              <div className="rounded-lg bg-white p-2.5 font-mono text-[11px] border border-slate-200 space-y-1">
                <div>A záznam: hostitel <strong className="text-slate-900">@</strong> → hodnota <strong className="text-slate-900">76.76.21.21</strong></div>
                <div>CNAME záznam: hostitel <strong className="text-slate-900">www</strong> → hodnota <strong className="text-slate-900">cname.vercel-dns.com</strong></div>
              </div>
              <p className="text-[11px] text-slate-500">Bezpečnostní certifikát (HTTPS) se aktivuje automaticky do několika minut od ověření.</p>
            </div>
          </details>
        </section>

        {/* 2. KONTAKTNÍ ÚDAJE A PROVOZOVNA */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Kontaktní údaje a provozovna</h2>
            <p className="text-xs text-slate-500">Tyto údaje uvidí zákazníci v hlavičce, kontaktech a u inzerátů.</p>
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
              <label className="block text-xs font-semibold text-slate-700">E-mail pro poptávky</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="např. info@mojedomena.cz"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Na tento e-mail chodí poptávky a rezervace z e-shopu (odesílá Prodejomat).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Jméno provozovatele / firmy</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="např. Jan Novák"
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
              <label className="block text-xs font-semibold text-slate-700">Místo osobního odběru (ulice / lokalita)</label>
              <input
                type="text"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="např. Průmyslová 123"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Město / okres</label>
              <input
                type="text"
                value={addressCity}
                onChange={(e) => setAddressCity(e.target.value)}
                placeholder="např. Praha 9 nebo Brno"
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
              <label className="block text-xs font-semibold text-slate-700">Cena dopravy pneumatik (Česká pošta)</label>
              <input
                type="text"
                value={shippingPriceTires}
                onChange={(e) => setShippingPriceTires(e.target.value)}
                placeholder="např. 600 Kč"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Cena dopravy disků (Česká pošta)</label>
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
                placeholder="https://www.vasweb.cz"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        </section>

        {/* 3. VÝBĚR NAPOJENÝCH ÚČTŮ */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Napojené inzertní účty ({linkedEmails.length} vybráno)
              </h2>
              <p className="text-xs text-slate-500">
                Inzeráty z vybraných účtů se budou automaticky promítat do nabídky vašeho e-shopu.
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

          {availableCredentials.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
              Nebyly nalezeny žádné další inzertní účty. E-shop zobrazuje inzeráty podle vašeho přihlašovacího e-mailu.
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-64 overflow-y-auto p-0.5">
              {filteredCredentials.map((cred) => {
                const credEmail = (cred.email || '').toLowerCase().trim();
                const isSelected = linkedEmails.includes(credEmail);
                return (
                  <div
                    key={cred.id || cred.email}
                    onClick={() => handleToggleEmail(credEmail)}
                    className={`flex items-start gap-2.5 rounded-xl border p-2.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40'
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
          )}
        </section>

        {/* 4. ŠABLONA VZHLEDU */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Vzhled a šablona</h2>
            <p className="text-xs text-slate-500">Aktivní vizuální šablona e-shopu.</p>
          </div>

          <div className="rounded-xl border-2 border-emerald-600 bg-emerald-50/20 p-4 max-w-md">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Aktivní
              </span>
              <span className="text-xs font-semibold text-slate-500">Pneu & Disky</span>
            </div>
            <h3 className="mt-2 text-sm font-bold text-slate-900">Katalog kol a pneuservis</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Optimalizováno pro prodej pneumatik a disků s kalkulátorem rozměrů, měřeným dezénem a přímým kontaktem.
            </p>
          </div>
        </section>

        {/* Save button footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Link
            href={liveDomain}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-98"
          >
            Zobrazit e-shop ↗
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-slate-800 active:scale-98 disabled:opacity-50 transition-all"
          >
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Ukládám...</span>
              </>
            ) : (
              <span>Uložit nastavení</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
