'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatPhoneNumber } from '@/components/offerStatus';
import { apiFetch, uploadImagesToR2 } from '@/lib/api';

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
  const [imageList, setImageList] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    bb_email: '',
    marketplace: ['Bazoš', 'Sbazar'] as string[],
    autorenew_freq: '1x za 10 dní vč. TOP',
    category: 0,
  });

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const response = await apiFetch('/api/credentials');
      
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

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 9 - imageList.length;
    if (remainingSlots <= 0) {
      alert('Lze nahrát maximálně 9 fotografií na jeden inzerát.');
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remainingSlots);
    setUploadingImages(true);
    setError(null);

    try {
      const readPromises = selectedFiles.map((file) => {
        return new Promise<{ data: string; filename: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ data: reader.result as string, filename: file.name });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const base64Files = await Promise.all(readPromises);
      const uploadedUrls = await uploadImagesToR2(base64Files);

      setImageList((prev) => [...prev, ...uploadedUrls].slice(0, 9));
    } catch (err: any) {
      console.error('Upload to R2 failed:', err);
      setError('Nepodařilo se nahrát obrázky do Cloudflare R2: ' + (err.message || ''));
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = customImageUrl.trim();
    if (!trimmed) return;
    if (imageList.length >= 9) {
      alert('Lze nahrát maximálně 9 fotografií.');
      return;
    }
    setImageList((prev) => [...prev, trimmed]);
    setCustomImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setImageList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveImage = (from: number, to: number) => {
    if (to < 0 || to >= imageList.length) return;
    setImageList((prev) => {
      const copy = [...prev];
      const item = copy.splice(from, 1)[0];
      copy.splice(to, 0, item);
      return copy;
    });
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
      const payloadImages = imageList.map(url => ({ url }));
      const response = await apiFetch('/api/offers/create', {
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
          images: payloadImages,
          preview_image: imageList[0] || null,
          image2: imageList[1] || null,
          image3: imageList[2] || null,
          image4: imageList[3] || null,
          image5: imageList[4] || null,
          image6: imageList[5] || null,
          image7: imageList[6] || null,
          image8: imageList[7] || null,
          image9: imageList[8] || null,
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
    <main className="relative mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top subtle progress bar during creation */}
      {loading && (
        <div className="fixed top-0 left-0 right-0 h-[2.5px] z-50 overflow-hidden bg-slate-200">
          <div className="h-full w-full bg-gradient-to-r from-emerald-500 via-slate-900 to-emerald-500 animate-progress-pulse" />
        </div>
      )}

      {/* Ambient glow in background for subtle depth */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl" />

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
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/90 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-white hover:text-slate-950 active:scale-95 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)] self-start sm:self-auto"
        >
          <span>←</span>
          <span>Zpět na nabídku</span>
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs sm:text-sm font-semibold text-rose-800 shadow-[0_4px_16px_rgba(244,63,94,0.08)] flex items-center justify-between gap-3">
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
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 sm:p-8 shadow-[0_16px_36px_-12px_rgba(15,23,42,0.06),0_2px_10px_rgba(15,23,42,0.03)] ring-1 ring-black/[0.02] backdrop-blur-xs">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
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
                className="w-full rounded-xl border border-slate-200/90 bg-white/90 px-4 py-3 text-sm font-medium text-slate-950 shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(0,0,0,0.02)] transition-all focus:border-slate-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:shadow-[0_2px_8px_rgba(0,0,0,0.06)] placeholder:text-slate-400"
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
                className="w-full resize-y rounded-xl border border-slate-200/90 bg-white/90 p-4 text-xs sm:text-sm leading-relaxed text-slate-950 shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(0,0,0,0.02)] transition-all focus:border-slate-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:shadow-[0_2px_8px_rgba(0,0,0,0.06)] placeholder:text-slate-400"
                placeholder="Podrobný popis zboží, rozměry, stav vzorku, možnost osobního předání v Plzni či zaslání poštou..."
                required
              />
            </div>
          </div>
        </div>

        {/* Card 2: Cena a přiřazený prodejní účet */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 sm:p-8 shadow-[0_16px_36px_-12px_rgba(15,23,42,0.06),0_2px_10px_rgba(15,23,42,0.03)] ring-1 ring-black/[0.02] backdrop-blur-xs">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
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
                  className="w-full rounded-xl border border-slate-200/90 bg-white/90 py-3 pl-4 pr-12 text-sm font-bold text-slate-950 shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(0,0,0,0.02)] transition-all focus:border-slate-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:shadow-[0_2px_8px_rgba(0,0,0,0.06)] placeholder:text-slate-400"
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
                  className="w-full rounded-xl border border-slate-200/90 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(0,0,0,0.02)] transition-all focus:border-slate-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
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
                <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-600 bg-slate-50/80 rounded-xl px-3 py-2 border border-slate-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
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
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 sm:p-8 shadow-[0_16px_36px_-12px_rgba(15,23,42,0.06),0_2px_10px_rgba(15,23,42,0.03)] ring-1 ring-black/[0.02] backdrop-blur-xs">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
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
                className="w-full rounded-xl border border-slate-200/90 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(0,0,0,0.02)] transition-all focus:border-slate-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
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
                      className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all active:scale-[0.99] ${
                        isChecked
                          ? 'border-slate-950 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white shadow-[0_8px_20px_-4px_rgba(15,23,42,0.25),inset_0_1px_1px_rgba(255,255,255,0.18)] ring-1 ring-slate-950'
                          : 'border-slate-200/90 bg-white/90 text-slate-900 hover:border-slate-300 hover:bg-slate-50/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)]'
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
                      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold border transition-colors ${
                        isChecked
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-xs'
                          : 'border-slate-300 text-transparent'
                      }`}>
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Informative strip about E-shop channel */}
              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-3.5 text-xs text-emerald-950 shadow-[0_1px_2px_rgba(16,185,129,0.04)]">
                <div className="flex items-center gap-2">
                  <span className="text-base">🛍️</span>
                  <span>
                    <strong>Vlastní E-shop / Prodejomat:</strong> Každý inzerát je automaticky zařazen i do vašeho e-shopu a katalogu prodeje.
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
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 sm:p-8 shadow-[0_16px_36px_-12px_rgba(15,23,42,0.06),0_2px_10px_rgba(15,23,42,0.03)] ring-1 ring-black/[0.02] backdrop-blur-xs">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          <div className="border-b border-slate-100 pb-4 mb-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-950">Média a plánování obnovy</h2>
                <p className="text-xs text-slate-500 mt-0.5">Fotografie produktu (Cloudflare R2) a automatické TOPování.</p>
              </div>
              <span className="rounded-full bg-slate-100 border border-slate-200/70 px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs">
                {imageList.length} / 9 fotek
              </span>
            </div>
          </div>

          <div className="space-y-6">
            {/* R2 Image Upload */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Fotografie produktu (až 9 fotek)
              </label>

              {/* Upload Dropzone */}
              <div className="relative">
                <input
                  type="file"
                  id="image_file_input"
                  multiple
                  accept="image/*"
                  disabled={uploadingImages || imageList.length >= 9}
                  onChange={handleFilesSelected}
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                />
                <div className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-7 transition-all group ${
                  uploadingImages
                    ? 'border-blue-400 bg-blue-50/50 shadow-inner'
                    : imageList.length >= 9
                    ? 'border-slate-200 bg-slate-50 opacity-60'
                    : 'border-slate-200/90 hover:border-slate-400 bg-slate-50/60 hover:bg-slate-50/90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]'
                }`}>
                  {uploadingImages ? (
                    <div className="flex flex-col items-center gap-2.5 text-blue-600 py-2">
                      <div className="relative flex h-8 w-8 items-center justify-center">
                        <span className="absolute h-8 w-8 rounded-full bg-blue-100 animate-ping opacity-75" />
                        <svg className="h-6 w-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-85" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                      </div>
                      <p className="text-xs font-bold text-blue-700">Optimalizuji a nahrávám do Cloudflare R2…</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-[0_4px_12px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.04] mb-2 group-hover:scale-105 transition-transform">
                        ☁️
                      </div>
                      <p className="text-xs font-bold text-slate-900">
                        {imageList.length >= 9
                          ? 'Dosažen maximální limit 9 fotografií'
                          : 'Klikněte nebo přetáhněte fotografie'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        JPEG, PNG, WebP • Automaticky optimalizováno a uloženo v Cloudflare R2
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Uploaded Gallery Grid */}
              {imageList.length > 0 && (
                <div className="mt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {imageList.map((url, idx) => (
                      <div
                        key={idx}
                        className={`group relative aspect-4/3 rounded-xl overflow-hidden border bg-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all ${
                          idx === 0 ? 'ring-2 ring-slate-900 border-transparent shadow-[0_4px_14px_rgba(15,23,42,0.18)]' : 'border-slate-200/80'
                        }`}
                      >
                        <Image
                          src={url}
                          alt={`Fotografie ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        />
                        
                        {/* Badge for 1st image */}
                        {idx === 0 && (
                          <div className="absolute top-1.5 left-1.5 rounded-md bg-slate-900/90 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs backdrop-blur-xs">
                            Hlavní
                          </div>
                        )}

                        {/* Actions overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, idx - 1)}
                              title="Posunout vlevo"
                              className="rounded-lg bg-white/90 p-1.5 text-slate-900 hover:bg-white text-xs shadow-xs"
                            >
                              ◀
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            title="Odstranit"
                            className="rounded-lg bg-rose-600/90 hover:bg-rose-600 p-1.5 text-white text-xs shadow-xs"
                          >
                            ✕
                          </button>
                          {idx < imageList.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, idx + 1)}
                              title="Posunout vpravo"
                              className="rounded-lg bg-white/90 p-1.5 text-slate-900 hover:bg-white text-xs shadow-xs"
                            >
                              ▶
                            </button>
                          )}
                        </div>

                        {/* Number */}
                        <div className="absolute bottom-1 right-1.5 rounded bg-black/60 px-1 text-[9px] font-mono text-white">
                          #{idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add image via URL fallback */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImageUrl();
                      }
                    }}
                    placeholder="Nebo zadejte přímou URL adresu obrázku..."
                    className="flex-1 rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-2.5 text-xs font-medium text-slate-950 shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(0,0,0,0.02)] transition-all focus:border-slate-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    disabled={!customImageUrl.trim() || imageList.length >= 9}
                    className="rounded-xl border border-slate-200/90 bg-white/90 hover:bg-white hover:border-slate-300 px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all disabled:opacity-40"
                  >
                    + Přidat URL
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="autorenew_freq" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Interval automatické obnovy (TOPování)
              </label>
              <select
                id="autorenew_freq"
                value={formData.autorenew_freq}
                onChange={(e) => setFormData({ ...formData, autorenew_freq: e.target.value })}
                className="w-full rounded-xl border border-slate-200/90 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(0,0,0,0.02)] transition-all focus:border-slate-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
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
            className="w-full sm:w-auto rounded-xl border border-slate-200/90 bg-white/90 px-6 py-3.5 text-sm font-bold text-slate-700 hover:bg-white hover:text-slate-950 active:scale-[0.99] transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          >
            Zrušit
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 px-8 py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(15,23,42,0.22),inset_0_1px_1px_rgba(255,255,255,0.18)] ring-1 ring-slate-950/80 hover:from-slate-800 hover:to-slate-900 hover:shadow-[0_6px_22px_rgba(15,23,42,0.28)] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-wait"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white/90" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>Publikuji inzerát…</span>
              </>
            ) : (
              <span>Vytvořit inzerát</span>
            )}
          </button>
        </div>
      </form>
    </main>
  );
}
