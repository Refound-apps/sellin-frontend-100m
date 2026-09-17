'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatPhoneNumber } from '@/components/offerStatus';

interface MarketplaceOption {
  id: string;
  label: string;
  icon: string;
  desc: string;
}

const MARKETPLACES: MarketplaceOption[] = [
  { id: 'Bazoš', label: 'Bazoš.cz', icon: '🏷️', desc: 'Největší inzertní portál v ČR' },
  { id: 'Bazoš.sk', label: 'Bazoš.sk', icon: '🏷️', desc: 'Slovenský portál Bazoš' },
  { id: 'Sbazar', label: 'Sbazar.cz', icon: '🛒', desc: 'Inzerce na portálu Seznam.cz' },
  { id: 'Facebook', label: 'Facebook', icon: '📘', desc: 'Facebook Marketplace prodej' },
];

const AUTORENEW_OPTIONS = [
  { value: 'Neobnovovat', label: 'Neobnovovat (pouze jednorázové vystavení)' },
  { value: '1x za 1 den', label: '1x za 1 den' },
  { value: '1x za 4 dny', label: '1x za 4 dny' },
  { value: '1x za 7 dní', label: '1x za 7 dní' },
  { value: '1x za 7 dní vč. TOP', label: '1x za 7 dní vč. TOP' },
  { value: '1x za 10 dní', label: '1x za 10 dní (Doporučeno)' },
  { value: '1x za 10 dní vč. TOP', label: '1x za 10 dní vč. TOP (Nejčastější)' },
  { value: '1x za 13 dní', label: '1x za 13 dní' },
  { value: '1x za 13 dní vč. TOP', label: '1x za 13 dní vč. TOP' },
  { value: '1x za 14 dní', label: '1x za 14 dní' },
  { value: '1x za 14 dní vč. TOP', label: '1x za 14 dní vč. TOP' },
  { value: '1x za 30 dní', label: '1x za 30 dní' },
  { value: '1x za 30 dní vč. TOP', label: '1x za 30 dní vč. TOP' },
  { value: 'Po skončení platnosti inzerátu (60 dní)', label: 'Po skončení platnosti inzerátu (60 dní)' },
];

const CATEGORIES = [
  { 
    label: 'Auto - Náhradní díly',
    bazos_category: 'Auto;Náhradní díly',
    bazos_sk_category: 'Auto;Náhradné diely',
    sbazar_category: 'Auto-moto;Náhradní díly, kola a příslušenství;Náhradní díly a příslušenství',
    facebook_category: 'Koníčky;Autodíly'
  },
  {
    label: 'Auto - Karavany, vozíky',
    bazos_category: 'Auto;Karavany, vozíky',
    bazos_sk_category: 'Auto;Karavany, vozíky',
    sbazar_category: 'Auto-moto;Nákladní a užitkové vozy;Návěsy a přívěsy',
    facebook_category: 'Koníčky;Autodíly'
  },
  {
    label: 'Auto - Ostatní značky',
    bazos_category: 'Auto;Ostatní značky',
    bazos_sk_category: 'Auto;Ostatné značky',
    sbazar_category: 'Auto-moto;Ostatní auta',
    facebook_category: 'Koníčky;Autodíly'
  },
  {
    label: 'Motorky - Enduro',
    bazos_category: 'Motorky;Enduro',
    bazos_sk_category: 'Motocykle;Enduro',
    sbazar_category: 'Auto-moto;Motocykly;Enduro',
    facebook_category: 'Koníčky;Sport a outdoorové aktivity'
  },
  {
    label: 'Motorky - Veteráni',
    bazos_category: 'Motorky;Veteráni',
    bazos_sk_category: 'Motocykle;Veterány',
    sbazar_category: 'Auto-moto;Motocykly;Veteráni',
    facebook_category: 'Koníčky;Autodíly'
  },
  {
    label: 'Motorky - Čtyřkolky',
    bazos_category: 'Motorky;Čtyřkolky',
    bazos_sk_category: 'Motocykle;Štvorkolky',
    sbazar_category: 'Auto-moto;Motocykly;Čtyřkolky',
    facebook_category: 'Koníčky;Sport a outdoorové aktivity'
  },
  {
    label: 'Nábytek - Křesla a gauče',
    bazos_category: 'Nábytek;Křesla a gauče',
    bazos_sk_category: 'Nábytok;Kreslá a gauče',
    sbazar_category: 'Dům, byt a zahrada;Nábytek;Křesla',
    facebook_category: 'Dům a zahrada;Nábytek'
  },
  {
    label: 'Nábytek - Ostatní nábytek',
    bazos_category: 'Nábytek;Ostatní nábytek',
    bazos_sk_category: 'Nábytok;Ostatný nábytok',
    sbazar_category: 'Dům, byt a zahrada;Nábytek;Ostatní',
    facebook_category: 'Dům a zahrada;Nábytek'
  },
  {
    label: 'Stroje - Potravinářské stroje',
    bazos_category: 'Stroje;Potravinářské stroje',
    bazos_sk_category: 'Stroje;Potravinárske stroje',
    sbazar_category: 'Služby;Pohostinství',
    facebook_category: 'Dům a zahrada;Spotřebiče'
  },
  {
    label: 'PC - Hry',
    bazos_category: 'PC;Hry',
    bazos_sk_category: 'PC;Hry',
    sbazar_category: 'Hudba, knihy, hry a zábava;Hry a hračky;Počítačové hry',
    facebook_category: 'Elektronika;Počítače a tablety'
  },
  {
    label: 'Sport - Koloběžky',
    bazos_category: 'Sport;Koloběžky',
    bazos_sk_category: 'Šport;Kolobežky',
    sbazar_category: 'Sport a volný čas;Sport;Jiné sportovní vybavení',
    facebook_category: 'Koníčky;Sport a outdoorové aktivity'
  },
  {
    label: 'Sport - Ostatní cyklistika',
    bazos_category: 'Sport;Ostatní cyklistika',
    bazos_sk_category: 'Šport;Ostatná cyklistika',
    sbazar_category: 'Sport a volný čas;Sport;Cyklistika',
    facebook_category: 'Koníčky;Sport a outdoorové aktivity'
  },
  {
    label: 'Ostatní',
    bazos_category: 'Ostatní;Ostatní',
    bazos_sk_category: 'Ostatné;Ostatné',
    sbazar_category: 'Ostatní;Ostatní',
    facebook_category: 'Ostatní;Ostatní'
  },
];

export default function CreateOfferPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingCredentials, setLoadingCredentials] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [imagePreviewError, setImagePreviewError] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    bb_email: '',
    marketplace: ['Bazoš', 'Sbazar'] as string[],
    autorenew_freq: '1x za 10 dní vč. TOP',
    preview_image: '',
    category: 0,
  });

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3300';
      const response = await fetch(`${API_BASE_URL}/api/credentials`, {
        cache: 'no-store',
      });
      
      if (response.ok) {
        const data = await response.json();
        setCredentials(data.data);
        if (data.data.length > 0) {
          setFormData(prev => ({ ...prev, bb_email: data.data[0].email }));
        }
      }
    } catch (err) {
      console.error('Failed to load credentials:', err);
    } finally {
      setLoadingCredentials(false);
    }
  };

  const handleMarketplaceToggle = (marketplaceId: string) => {
    setFormData(prev => ({
      ...prev,
      marketplace: prev.marketplace.includes(marketplaceId)
        ? prev.marketplace.filter(m => m !== marketplaceId)
        : [...prev.marketplace, marketplaceId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.price || !formData.bb_email) {
      setError('Vyplňte prosím všechna povinná pole.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (formData.marketplace.length === 0) {
      setError('Vyberte alespoň jeden prodejní kanál / inzertní portál.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedCategory = CATEGORIES[formData.category];
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3300';
      const response = await fetch(`${API_BASE_URL}/api/offers/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          price: parseFloat(formData.price),
          bb_email: formData.bb_email,
          marketplace: formData.marketplace,
          autorenew_freq: formData.autorenew_freq,
          preview_image: formData.preview_image.trim() || null,
          state: 'app_create',
          category: [{
            bazos_category: selectedCategory.bazos_category,
            bazos_sk_category: selectedCategory.bazos_sk_category,
            sbazar_category: selectedCategory.sbazar_category,
            facebook_category: selectedCategory.facebook_category,
          }],
        }),
      });

      if (!response.ok) {
        throw new Error('Nepodařilo se vytvořit inzerát');
      }

      router.push('/');
    } catch (err) {
      setError('Nepodařilo se vytvořit inzerát. Zkuste to prosím znovu.');
      console.error(err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const selectedCred = credentials.find(c => c.email === formData.bb_email);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header matching Moje nabídka */}
      <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 text-xs font-bold text-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Správa inzerce · Nová položka
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
            Vytvořit inzerát
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Zadejte parametry zboží a vyberte cílové prodejní kanály pro automatickou publikaci.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-950 active:scale-95 transition-all shadow-2xs self-start sm:self-auto"
        >
          <span>←</span>
          <span>Zpět na nabídku</span>
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs sm:text-sm font-semibold text-rose-800 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-800 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Základní informace */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-2xs">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h2 className="text-base font-bold text-slate-950">Základní informace</h2>
            <p className="text-xs text-slate-500 mt-0.5">Výstižný název a detailní popis pro zákazníky.</p>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Název inzerátu <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  {formData.title.length} znaků
                </span>
              </div>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-sm font-medium text-slate-950 shadow-2xs outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all placeholder:text-slate-400"
                placeholder="Např. Sada letních pneu Michelin 225/45 R17 nebo Alu disky Škoda 16&quot;"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Popis položky <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  Podrobný popis stavu, parametrů a dopravy
                </span>
              </div>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="w-full resize-y rounded-xl border border-slate-200/90 bg-white p-4 text-xs sm:text-sm leading-relaxed text-slate-950 shadow-2xs outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all placeholder:text-slate-400"
                placeholder="Podrobný popis zboží, rozměry, stav vzorku, možnost osobního předání v Plzni či zaslání poštou..."
                required
              />
            </div>
          </div>
        </div>

        {/* Card 2: Cena a přiřazený prodejní účet */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-2xs">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h2 className="text-base font-bold text-slate-950">Cena a prodejní účet</h2>
            <p className="text-xs text-slate-500 mt-0.5">Finanční částka a účet prodejce, ke kterému bude položka vázána.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="price" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Cena v Kč <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="price"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full rounded-xl border border-slate-200/90 bg-white py-3 pl-4 pr-12 text-sm font-bold text-slate-950 shadow-2xs outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all placeholder:text-slate-400"
                  placeholder="5000"
                  min="0"
                  step="1"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  Kč
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="bb_email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Přiřazený účet prodejce <span className="text-rose-500">*</span>
              </label>
              {loadingCredentials ? (
                <div className="rounded-xl border border-slate-200/90 bg-slate-50 px-4 py-3 text-xs text-slate-500 font-medium">
                  Načítání účtů prodejců…
                </div>
              ) : credentials.length === 0 ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 font-medium">
                  Nejsou k dispozici žádné účty. Přejděte do sekce &quot;Napojení účtu&quot;.
                </div>
              ) : (
                <select
                  id="bb_email"
                  value={formData.bb_email}
                  onChange={(e) => setFormData({ ...formData, bb_email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-2xs outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all"
                  required
                >
                  {credentials.map((cred) => (
                    <option key={cred.email} value={cred.email}>
                      {cred.email} {cred.telephone1 ? `(${cred.telephone1})` : ''} {cred.bazos_name ? `· ${cred.bazos_name}` : ''}
                    </option>
                  ))}
                </select>
              )}

              {selectedCred && (
                <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-600 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200/70">
                  {selectedCred.telephone1 && (
                    <span className="inline-flex items-center gap-1 font-bold text-slate-900">
                      <svg className="h-3 w-3 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {formatPhoneNumber(selectedCred.telephone1)}
                    </span>
                  )}
                  {selectedCred.location && (
                    <span className="text-slate-500 font-medium">📍 {selectedCred.location}</span>
                  )}
                  {selectedCred.bazos_name && (
                    <span className="text-slate-500 font-medium truncate">👤 {selectedCred.bazos_name}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Kategorie a Prodejní kanály */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-2xs">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h2 className="text-base font-bold text-slate-950">Kategorie a cílové kanály</h2>
            <p className="text-xs text-slate-500 mt-0.5">Kam všude bude inzerát automaticky propisován a synchronizován.</p>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="category" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Kategorie zboží <span className="text-rose-500">*</span>
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: parseInt(e.target.value, 10) })}
                className="w-full rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-2xs outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all"
                required
              >
                {CATEGORIES.map((cat, index) => (
                  <option key={index} value={index}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Inzertní portály a prodejní platformy <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MARKETPLACES.map((marketplace) => {
                  const isChecked = formData.marketplace.includes(marketplace.id);
                  return (
                    <button
                      key={marketplace.id}
                      type="button"
                      onClick={() => handleMarketplaceToggle(marketplace.id)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                        isChecked
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200/90 bg-white text-slate-900 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{marketplace.icon}</span>
                        <div>
                          <p className={`text-sm font-bold ${isChecked ? 'text-white' : 'text-slate-950'}`}>
                            {marketplace.label}
                          </p>
                          <p className={`text-xs ${isChecked ? 'text-slate-300' : 'text-slate-500'}`}>
                            {marketplace.desc}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold border ${
                        isChecked
                          ? 'bg-emerald-500 text-white border-emerald-400'
                          : 'border-slate-300 text-transparent'
                      }`}>
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Informative strip about E-shop channel */}
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3 text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <span className="text-base">🛍️</span>
                  <span>
                    <strong>E-shop Duplux / Sellin:</strong> Každý inzerát je automaticky zařazen i do centrálního katalogu prodeje pro zákazníky.
                  </span>
                </div>
                <span className="shrink-0 rounded-md bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Aktivní
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Média a Automatická obnova */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-2xs">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h2 className="text-base font-bold text-slate-950">Média a plánování obnovy</h2>
            <p className="text-xs text-slate-500 mt-0.5">Fotografie produktu a automatické TOPování inzerátů.</p>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="preview_image" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                URL adresa náhledového obrázku
              </label>
              <input
                type="url"
                id="preview_image"
                value={formData.preview_image}
                onChange={(e) => {
                  setFormData({ ...formData, preview_image: e.target.value });
                  setImagePreviewError(false);
                }}
                className="w-full rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-sm font-medium text-slate-950 shadow-2xs outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all placeholder:text-slate-400"
                placeholder="https://domena.cz/obrazek.jpg nebo /prod-budi-app-assets/..."
              />

              {/* Live image preview */}
              {formData.preview_image && !imagePreviewError && (
                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 max-w-sm">
                  <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-200">
                    <Image
                      src={formData.preview_image}
                      alt="Náhled"
                      fill
                      className="object-cover"
                      sizes="80px"
                      onError={() => setImagePreviewError(true)}
                    />
                  </div>
                  <div className="text-xs text-slate-600 truncate">
                    <p className="font-bold text-slate-900">Náhled obrázku</p>
                    <p className="text-slate-500 truncate text-[11px]">{formData.preview_image}</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="autorenew_freq" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Interval automatické obnovy (TOPování)
              </label>
              <select
                id="autorenew_freq"
                value={formData.autorenew_freq}
                onChange={(e) => setFormData({ ...formData, autorenew_freq: e.target.value })}
                className="w-full rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-2xs outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all"
              >
                {AUTORENEW_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-500">
                Backendový robot se stará o automatické přemazání a posun inzerátu na přední pozice vybraných bazarů.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full sm:w-auto rounded-xl border border-slate-200/90 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-950 active:scale-95 transition-all shadow-2xs"
          >
            Zrušit
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto rounded-xl bg-slate-950 px-8 py-3 text-sm font-bold text-white shadow-xs hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Publikuji inzerát…' : 'Vytvořit inzerát'}
          </button>
        </div>
      </form>
    </main>
  );
}
