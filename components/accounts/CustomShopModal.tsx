'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ShopConfigData, User } from '@/lib/types';
import { getUserShop, saveUserShop } from '@/lib/api';
import ShopSeoFeedsPanel from '@/components/shop/ShopSeoFeedsPanel';

interface CustomShopModalProps {
  onClose: () => void;
  sellerEmail: string;
  pairedAccounts: User[];
  onShopSaved?: (shop: ShopConfigData) => void;
}

export default function CustomShopModal({
  onClose,
  sellerEmail,
  pairedAccounts,
  onShopSaved,
}: CustomShopModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shop state
  const [shopId, setShopId] = useState<string | null>(null);
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
  const [openingHours, setOpeningHours] = useState('');
  const [shippingPriceTires, setShippingPriceTires] = useState('600 Kč');
  const [shippingPriceRims, setShippingPriceRims] = useState('500 Kč');
  const [linkedEmails, setLinkedEmails] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getUserShop(`?seller=${encodeURIComponent(sellerEmail)}`);
        if (mounted) {
          const s = data.shop;
          if (s) {
            setShopId(s.id);
            setIsActive(s.is_active);
            setShopName(s.shop_name || '');
            setTagline(s.tagline || '');
            setSlug(s.slug || '');
            setCustomDomain(s.custom_domain || '');
            setPhone(s.phone || '');
            setEmail(s.email || sellerEmail);
            setOwnerName(s.owner_name || '');
            setIco(s.ico || '');
            setAddressLine(s.address_line || '');
            setAddressCity(s.address_city || '');
            setOpeningHours(s.opening_hours || 'Po–Pá: 8:00 – 17:00');
            setShippingPriceTires(s.shipping_price_tires || '600 Kč');
            setShippingPriceRims(s.shipping_price_rims || '500 Kč');
            setLinkedEmails(s.linked_credential_emails || []);
          } else {
            // Defaults
            setShopName('Můj E-shop');
            setTagline('Prověřené pneumatiky a disky');
            setSlug('muj-eshop');
            setEmail(sellerEmail);
            setOpeningHours('Po–Pá: 8:00 – 17:00');
            setLinkedEmails([]);
          }
        }
      } catch (err: any) {
        console.error('Error loading shop data in modal:', err);
        if (mounted) setError('Nepodařilo se načíst data e-shopu.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [sellerEmail]);

  const toggleLinkedEmail = (em: string) => {
    const clean = em.toLowerCase().trim();
    setLinkedEmails((prev) =>
      prev.includes(clean) ? prev.filter((e) => e !== clean) : [...prev, clean]
    );
  };

  const handleSelectAllEmails = () => {
    setLinkedEmails(pairedAccounts.map((a) => a.email.toLowerCase().trim()));
  };

  const handleDeselectAllEmails = () => {
    setLinkedEmails([]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);

      const payload: Partial<ShopConfigData> = {
        id: shopId || undefined,
        owner_email: sellerEmail,
        shop_name: shopName.trim(),
        tagline: tagline.trim(),
        slug: slug.trim(),
        custom_domain: customDomain.trim() || null,
        is_active: isActive,
        phone: phone.trim() || null,
        email: email.trim() || null,
        owner_name: ownerName.trim() || null,
        ico: ico.trim() || null,
        address_line: addressLine.trim() || null,
        address_city: addressCity.trim() || null,
        opening_hours: openingHours.trim() || null,
        shipping_price_tires: shippingPriceTires.trim() || null,
        shipping_price_rims: shippingPriceRims.trim() || null,
        linked_credential_emails: linkedEmails,
        template_id: 'pneu-classic',
      };

      const saved = await saveUserShop(payload);
      if (saved?.id) setShopId(saved.id);
      if (onShopSaved && saved) onShopSaved(saved);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving shop configuration:', err);
      setError(err?.message || 'Uložení konfigurace e-shopu se nezdařilo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-linear-to-r from-emerald-500/10 via-white to-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 shadow-2xs text-white p-2">
              <svg viewBox="0 0 24 24" className="w-full h-full fill-none stroke-current" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-950">
                  Vlastní E-shop (Storefront) – Konfigurace
                </h3>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold border ${
                  isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  {isActive ? 'Aktivní storefront' : 'Pozastaveno'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Přímý prodej bez provizí pro <strong className="text-slate-800">{sellerEmail}</strong> se 100% marží
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Načítám konfiguraci e-shopu…
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-semibold">
                {error}
              </div>
            )}

            {/* Active Toggle & Live Link Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-emerald-200/90 bg-emerald-50/40 p-4">
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
                <div>
                  <p className="text-xs font-bold text-slate-950">
                    {isActive ? 'Storefront je aktivní a otevřený' : 'Storefront je dočasně pozastaven'}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Zákazníci si mohou prohlížet nabídky a objednávat přímo přes webový košík.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/shop"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3.5 py-1.5 text-xs font-bold text-emerald-900 shadow-2xs hover:bg-emerald-50 transition-all"
                >
                  <span>🛍️ Otevřít živý e-shop</span>
                  <span className="text-emerald-500">↗</span>
                </Link>
              </div>
            </div>

            {/* Section 1: Základní nastavení a doména */}
            <div className="space-y-4">
              <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                1. Základní identita a doména e-shopu
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Název e-shopu *
                  </label>
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="např. Alu Bazar Plzeň"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Podtitul / Slogan
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Prověřené disky a pneumatiky se zárukou"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    URL slug (cesta na Sellin.cz)
                  </label>
                  <div className="flex items-center">
                    <span className="rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-400 font-mono">
                      /shop/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="alubazar-plzen"
                      className="w-full rounded-r-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-medium text-slate-950 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vlastní doména (např. alubazarplzen.cz)
                  </label>
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="alubazarplzen.cz (bez https://)"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-medium text-slate-950 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Kontakty a prodejna */}
            <div className="space-y-4">
              <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                2. Kontaktní údaje pro zákazníky & Otevírací doba
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefon pro objednávky
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+420 777 000 111"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail pro objednávky
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="prodej@sellin.cz"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Otevírací doba výdejního místa
                  </label>
                  <input
                    type="text"
                    value={openingHours}
                    onChange={(e) => setOpeningHours(e.target.value)}
                    placeholder="Po–Pá: 8:00 – 17:00"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jméno provozovatele / majitele
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Jan Novák"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    IČO
                  </label>
                  <input
                    type="text"
                    value={ico}
                    onChange={(e) => setIco(e.target.value)}
                    placeholder="12345678"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-medium text-slate-950 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Město provozovny
                  </label>
                  <input
                    type="text"
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    placeholder="Plzeň"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Ceny dopravy */}
            <div className="space-y-4">
              <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                3. Ceny dopravy v košíku
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cena dopravy – Pneumatiky
                  </label>
                  <input
                    type="text"
                    value={shippingPriceTires}
                    onChange={(e) => setShippingPriceTires(e.target.value)}
                    placeholder="600 Kč"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cena dopravy – Disky & Kola
                  </label>
                  <input
                    type="text"
                    value={shippingPriceRims}
                    onChange={(e) => setShippingPriceRims(e.target.value)}
                    placeholder="500 Kč"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: SEO & feedy */}
            <ShopSeoFeedsPanel
              shopName={shopName || 'E-shop'}
              slug={slug || 'shop'}
              customDomain={customDomain || null}
              tagline={tagline || null}
              addressCity={addressCity || null}
            />

            {/* Section 5: Napojené skladové účty (Linked Accounts) */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs font-black text-slate-900">
                      Napojené skladové účty do e-shopu ({linkedEmails.length} z {pairedAccounts.length})
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Zboží z vybraných subúčtů bude automaticky nabízeno ve vašem e-shopu.
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAllEmails}
                    className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
                  >
                    Vybrat všechny
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllEmails}
                    className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-100 transition-colors shadow-2xs"
                  >
                    Odznačit vše
                  </button>
                </div>
              </div>

              {/* Grid of account pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {pairedAccounts.map((acc) => {
                  const clean = acc.email.toLowerCase().trim();
                  const isChecked = linkedEmails.includes(clean);
                  const name = acc.bazos_name || acc.email.split('@')[0];

                  return (
                    <label
                      key={acc.id}
                      className={`flex items-center gap-2 rounded-xl p-2 cursor-pointer transition-all border ${
                        isChecked
                          ? 'border-emerald-300 bg-emerald-50/80 text-emerald-950 font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleLinkedEmail(clean)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs truncate block">{name}</span>
                        <span className="text-[10px] text-slate-400 truncate block font-mono">
                          {acc.email}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Bottom Footer Actions */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <Link
                href="/shop"
                target="_blank"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
              >
                Náhled živého e-shopu ↗
              </Link>

              <div className="flex items-center gap-3">
                {saveSuccess && (
                  <span className="text-xs font-bold text-emerald-600 animate-in fade-in">
                    ✓ Konfigurace e-shopu uložena
                  </span>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Ukládám…' : 'Uložit konfiguraci e-shopu'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
