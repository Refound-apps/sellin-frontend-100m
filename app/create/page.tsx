'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatPhoneNumber } from '@/components/offerStatus';
import { apiFetch, getUsers, uploadImagesToR2 } from '@/lib/api';
import { DEFAULT_OFFER_CATEGORIES, OfferCategoryItem, fetchOfferCategories } from '@/lib/categories';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/lib/types';
import SellerAccountSwitcher from '@/components/SellerAccountSwitcher';
import { resolvePairedUserAccounts } from '@/lib/sellerAccounts';

interface MarketplaceOption {
  id: string;
  label: string;
  icon: string;
  desc: string;
  badge?: string;
}

const MARKETPLACES: MarketplaceOption[] = [
  { id: 'Bazoš', label: 'Bazoš.cz', icon: '🏷️', desc: 'Největší inzertní portál v ČR' },
  { id: 'Sbazar', label: 'Sbazar.cz', icon: '🛒', desc: 'Inzerce na portálu Seznam.cz' },
  { id: 'Facebook', label: 'Facebook', icon: '📘', desc: 'Facebook Marketplace prodej' },
  { id: 'Bazoš.sk', label: 'Bazoš.sk', icon: '🇸🇰', desc: 'Slovenský portál Bazoš' },
];

const AUTORENEW_OPTIONS = [
  { value: '1x za 10 dní vč. TOP', label: '1x za 10 dní vč. TOP (Doporučeno)' },
  { value: '1x za 7 dní vč. TOP', label: '1x za 7 dní vč. TOP' },
  { value: '1x za 4 dny', label: '1x za 4 dny' },
  { value: '1x za 1 den', label: '1x za 1 den' },
  { value: '1x za 14 dní vč. TOP', label: '1x za 14 dní vč. TOP' },
  { value: '1x za 30 dní vč. TOP', label: '1x za 30 dní vč. TOP' },
  { value: 'Neobnovovat', label: 'Neobnovovat (pouze jednorázově)' },
];

function CreateOfferContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlAccountParam = searchParams?.get('account') || searchParams?.get('seller') || null;

  const supabase = useMemo(() => createClient(), []);

  // Form & Process State
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Accounts & Paired Accounts State (matching "Moje nabídka")
  const [myEmail, setMyEmail] = useState<string | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<User | null>(null);
  const [selectedCustomEmail, setSelectedCustomEmail] = useState<string | null>(null);
  const [pairedAccounts, setPairedAccounts] = useState<User[]>([]);

  // Categories & Photos
  const [categories, setCategories] = useState<OfferCategoryItem[]>(DEFAULT_OFFER_CATEGORIES);
  const [categorySearch, setCategorySearch] = useState('');
  const [imageList, setImageList] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    bb_email: '',
    marketplace: ['Bazoš', 'Sbazar'] as string[],
    autorenew_freq: '1x za 10 dní vč. TOP',
    categoryId: 45, // Výchozí: Auto > Pneumatiky, kola (id 45)
  });

  // Load Categories & Accounts on mount
  useEffect(() => {
    loadUserDataAndAccounts();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const fetched = await fetchOfferCategories();
      if (fetched && fetched.length > 0) {
        setCategories(fetched);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const loadUserDataAndAccounts = async () => {
    try {
      setLoadingAccounts(true);

      // 1. Get logged in user from Supabase auth
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      const userAuthEmail = authUser?.email ?? null;
      setMyEmail(userAuthEmail);

      // 2. Fetch all users from API
      let allUsers: User[] = [];
      try {
        allUsers = await getUsers();
        setAvailableUsers(allUsers);
      } catch (e) {
        console.error('Failed to load all users from API:', e);
      }

      // 3. Check credentials and admin role in Supabase
      let isUserAdmin = false;
      let directCredentials: any[] = [];
      if (authUser) {
        const { data: directData } = await supabase
          .from('credential_pg')
          .select('*')
          .or(`user_id.eq.${authUser.id},email.ilike.${authUser.email},sbazar_email.ilike.${authUser.email}`);
        directCredentials = directData || [];
        if (directCredentials.some((c) => c.role === 'admin')) {
          isUserAdmin = true;
        }
      }
      setIsAdminUser(isUserAdmin);

      // 4. Fallback if allUsers was empty but direct credentials exist
      if (allUsers.length === 0 && directCredentials.length > 0) {
        allUsers = directCredentials.map((c) => ({
          id: c.id,
          email: c.email,
          telephone1: c.telephone1,
          telephone2: c.telephone2,
          bazos_email: c.bazos_email,
          sbazar_email: c.sbazar_email,
          facebook_email: c.facebook_email,
          bazos_name: c.bazos_name,
          location: c.location,
          zipcode: c.zipcode,
          zipcode_sk: c.zipcode_sk,
          status_cz: c.status_cz,
          status_sk: c.status_sk,
          sbazar_profile: c.sbazar_profile,
          tier: c.tier,
          bazos_rewrite: c.bazos_rewrite,
          bazos_top_max: c.bazos_top_max,
          bazos_bkod: c.bazos_bkod,
        }));
        setAvailableUsers(allUsers);
      }

      // 5. Determine active target seller:
      // Priority: A. URL param ?account=..., B. Logged in user email, C. First user
      let targetSeller: User | null = null;
      if (urlAccountParam) {
        const cleanTarget = urlAccountParam.toLowerCase().trim();
        targetSeller =
          allUsers.find(
            (u) =>
              u.email?.toLowerCase().trim() === cleanTarget ||
              u.sbazar_email?.toLowerCase().trim() === cleanTarget ||
              u.bazos_email?.toLowerCase().trim() === cleanTarget
          ) || null;
      }

      if (!targetSeller && userAuthEmail) {
        const cleanAuth = userAuthEmail.toLowerCase().trim();
        targetSeller =
          allUsers.find(
            (u) =>
              u.email?.toLowerCase().trim() === cleanAuth ||
              u.sbazar_email?.toLowerCase().trim() === cleanAuth ||
              u.bazos_email?.toLowerCase().trim() === cleanAuth
          ) || null;
      }

      if (!targetSeller && allUsers.length > 0) {
        targetSeller = allUsers[0];
      }

      setSelectedSeller(targetSeller);

      // 6. Resolve paired accounts for targetSeller (matching "Moje nabídka" logic)
      const targetQuery = targetSeller || urlAccountParam || userAuthEmail;
      const paired = resolvePairedUserAccounts(targetQuery, allUsers);
      setPairedAccounts(paired);

      // 7. Initialize formData.bb_email to target account
      if (paired.length > 0) {
        const initialEmail =
          paired.find((p) => p.email.toLowerCase() === targetSeller?.email?.toLowerCase())?.email ||
          paired[0].email;
        setFormData((prev) => ({ ...prev, bb_email: initialEmail }));
      } else if (targetSeller) {
        setFormData((prev) => ({ ...prev, bb_email: targetSeller.email }));
      }
    } catch (err) {
      console.error('Failed to load user and accounts for create offer:', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Admin Switcher action: select another seller
  const handleSelectSeller = (user: User | null, customEmail?: string) => {
    if (user) {
      setSelectedSeller(user);
      setSelectedCustomEmail(null);
      const paired = resolvePairedUserAccounts(user, availableUsers);
      setPairedAccounts(paired);
      const defaultEmail =
        paired.find((p) => p.email.toLowerCase() === user.email.toLowerCase())?.email ||
        paired[0]?.email ||
        user.email;
      setFormData((prev) => ({ ...prev, bb_email: defaultEmail }));
    } else if (customEmail) {
      setSelectedSeller(null);
      setSelectedCustomEmail(customEmail);
      const paired = resolvePairedUserAccounts(customEmail, availableUsers);
      setPairedAccounts(paired);
      setFormData((prev) => ({ ...prev, bb_email: paired[0]?.email || customEmail }));
    } else {
      // Reset back to logged in user / admin
      setSelectedSeller(null);
      setSelectedCustomEmail(null);
      const meUser =
        availableUsers.find(
          (u) => u.email?.toLowerCase().trim() === myEmail?.toLowerCase().trim()
        ) || null;
      const paired = meUser
        ? resolvePairedUserAccounts(meUser, availableUsers)
        : availableUsers.slice(0, 1);
      setPairedAccounts(paired);
      if (paired.length > 0) {
        setFormData((prev) => ({ ...prev, bb_email: paired[0].email }));
      }
    }
  };

  // Direct selection of one of the paired accounts
  const handleSelectPairedAccount = (accountEmail: string) => {
    setFormData((prev) => ({ ...prev, bb_email: accountEmail }));
  };

  const handleMarketplaceToggle = (marketplaceId: string) => {
    setFormData((prev) => ({
      ...prev,
      marketplace: prev.marketplace.includes(marketplaceId)
        ? prev.marketplace.filter((m) => m !== marketplaceId)
        : [...prev.marketplace, marketplaceId],
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
      console.error('Upload failed:', err);
      setError('Nepodařilo se nahrát obrázky: ' + (err.message || 'Zkuste to prosím znovu.'));
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
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

  // Filtered and grouped categories
  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.section.toLowerCase().includes(q) ||
        c.bazos_category.toLowerCase().includes(q)
    );
  }, [categories, categorySearch]);

  const categoriesBySection = useMemo(() => {
    const map: Record<string, OfferCategoryItem[]> = {};
    filteredCategories.forEach((cat) => {
      if (!map[cat.section]) map[cat.section] = [];
      map[cat.section].push(cat);
    });
    return map;
  }, [filteredCategories]);

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.id === formData.categoryId) || categories[0];
  }, [categories, formData.categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim() || !formData.price || !formData.bb_email) {
      setError('Vyplňte prosím všechna povinná pole (název, popis, cena, účet).');
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
      const payloadImages = imageList.map((url) => ({ url }));
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
          category: [
            {
              bazos_category: selectedCategory.bazos_category,
              bazos_sk_category: selectedCategory.bazos_sk_category,
              sbazar_category: selectedCategory.sbazar_category,
              facebook_category: selectedCategory.facebook_category,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Nepodařilo se vytvořit inzerát');
      }

      // Return back to "Moje nabídka" with the active seller filter preserved
      const returnAccount = selectedSeller?.email || selectedCustomEmail;
      router.push(returnAccount ? `/?account=${encodeURIComponent(returnAccount)}` : '/');
    } catch (err: any) {
      setError('Nepodařilo se vytvořit inzerát. Zkuste to prosím znovu.');
      console.error(err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const selectedAccount =
    pairedAccounts.find((a) => a.email.toLowerCase() === formData.bb_email.toLowerCase()) ||
    availableUsers.find((a) => a.email.toLowerCase() === formData.bb_email.toLowerCase()) ||
    null;

  const formattedPricePreview =
    formData.price && !isNaN(Number(formData.price))
      ? `${Number(formData.price).toLocaleString('cs-CZ')} Kč`
      : null;

  return (
    <main className="relative mx-auto w-full max-w-6xl px-3.5 py-5 sm:px-6 sm:py-8 lg:px-8 pb-28 lg:pb-12">
      {/* Top subtle progress bar during creation */}
      {loading && (
        <div className="fixed top-0 left-0 right-0 h-[2.5px] z-50 overflow-hidden bg-slate-200">
          <div className="h-full w-full bg-gradient-to-r from-emerald-500 via-slate-900 to-emerald-500 animate-progress-pulse" />
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Nový inzerát
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
            Vytvořit inzerát
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Jednoduché vystavení zboží s automatickým propisem na bazary i do e-shopu.
          </p>
        </div>

        <Link
          href={selectedSeller?.email ? `/?account=${encodeURIComponent(selectedSeller.email)}` : '/'}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-950 active:scale-95 transition-all shadow-xs self-start sm:self-auto"
        >
          <span>←</span>
          <span>Zpět na nabídku</span>
        </Link>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs sm:text-sm font-semibold text-rose-800 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-800 text-sm font-bold p-1"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-start">
          {/* LEVÝ PANEL: Fotografie & Obsah zboží (8 sloupců na desktopu) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5">
            {/* SEKCE 1: Fotografie zboží */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-3.5">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-950 flex items-center gap-2">
                    <span>📸</span> Fotografie zboží
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Přidejte až 9 fotek. První fotka bude použita jako hlavní.
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold border ${
                    imageList.length > 0
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {imageList.length} / 9
                </span>
              </div>

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
                <div
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all ${
                    uploadingImages
                      ? 'border-emerald-500 bg-emerald-50/50'
                      : imageList.length >= 9
                      ? 'border-slate-200 bg-slate-50 opacity-60'
                      : 'border-slate-300 hover:border-slate-500 bg-slate-50/60 hover:bg-slate-50'
                  }`}
                >
                  {uploadingImages ? (
                    <div className="flex flex-col items-center gap-2 text-emerald-700 py-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
                      <p className="text-sm font-bold">Zpracovávám a optimalizuji fotografie…</p>
                      <p className="text-xs text-slate-500">Může to chvilku trvat</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs text-2xl mb-2">
                        📷
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        {imageList.length >= 9
                          ? 'Dosažen maximální počet 9 fotografií'
                          : 'Vyberte fotografie z mobilu / počítače'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        Klikněte pro výběr souborů nebo přetáhněte sem. Podporujeme JPG, PNG, WebP.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Náhledy fotografií */}
              {imageList.length > 0 && (
                <div className="mt-4">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                    {imageList.map((url, index) => (
                      <div
                        key={index}
                        className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-100 shadow-2xs"
                      >
                        <Image
                          src={url}
                          alt={`Fotografie ${index + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />

                        {/* Badge pro hlavní foto */}
                        {index === 0 && (
                          <div className="absolute top-1.5 left-1.5 rounded-lg bg-emerald-600/95 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            Hlavní foto
                          </div>
                        )}

                        {/* Překryv s akcemi */}
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMoveImage(index, index - 1)}
                              title="Posunout dopředu"
                              className="h-7 w-7 rounded-lg bg-white/90 text-slate-900 font-bold hover:bg-white text-xs flex items-center justify-center shadow-xs"
                            >
                              ◀
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            title="Smazat fotografii"
                            className="h-7 w-7 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 text-xs flex items-center justify-center shadow-xs"
                          >
                            ✕
                          </button>
                          {index < imageList.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMoveImage(index, index + 1)}
                              title="Posunout dozadu"
                              className="h-7 w-7 rounded-lg bg-white/90 text-slate-900 font-bold hover:bg-white text-xs flex items-center justify-center shadow-xs"
                            >
                              ▶
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SEKCE 2: Informace o zboží (Název, Kategorie, Popis) */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-950 flex items-center gap-2">
                  <span>📝</span> Informace o zboží
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Zadejte název, zvolte kategorii podle Bazoše a doplňte popis.
                </p>
              </div>

              {/* Název inzerátu */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Název inzerátu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm sm:text-base font-semibold text-slate-950 transition-all focus:border-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-900/5 placeholder:text-slate-400"
                  placeholder="Např. Zimní pneumatiky Continental 205/55 R16 vzorek 7mm"
                  required
                />
              </div>

              {/* Kategorie zboží podle Bazoše */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="category_select"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Kategorie zboží (Bazoš) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {categories.length} kategorií
                  </span>
                </div>

                {/* Vyhledávací filtr nad kategoriemi */}
                <div className="relative mb-2">
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Vyhledat v kategoriích (např. pneumatiky, audi, iphone...)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-8 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                    🔍
                  </span>
                  {categorySearch && (
                    <button
                      type="button"
                      onClick={() => setCategorySearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <select
                  id="category_select"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 transition-all focus:border-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-900/5"
                  required
                >
                  {Object.keys(categoriesBySection).map((sectionName) => (
                    <optgroup key={sectionName} label={sectionName}>
                      {categoriesBySection[sectionName].map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} ({cat.bazos_category})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                {/* Zvolená kategorie badge */}
                {selectedCategory && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                    <span className="text-slate-400 text-[11px]">Vybráno:</span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 font-bold text-slate-800">
                      <span>📁</span>
                      <span>{selectedCategory.section}</span>
                      <span className="text-slate-400">›</span>
                      <span>{selectedCategory.name}</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                      Bazoš sekce: {selectedCategory.bazos_category}
                    </span>
                  </div>
                )}
              </div>

              {/* Popis zboží */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Popis zboží <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="description"
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-950 transition-all focus:border-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-900/5 placeholder:text-slate-400 resize-y"
                  placeholder="Detailní popis stavu zboží, technické parametry, rozměry, důvod prodeje a podmínky předání..."
                  required
                />
              </div>
            </div>
          </div>

          {/* PRAVÝ PANEL: Cena, Přiřazený účet prodejce a Spárované účty, Kanály (4 sloupce na desktopu) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5 lg:sticky lg:top-20">
            {/* Box: Cena a Přiřazený účet prodejce */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              {/* Cena */}
              <div>
                <label
                  htmlFor="price"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Cena zboží <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="price"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full rounded-xl border border-slate-200/90 bg-white py-3 pl-4 pr-12 text-base sm:text-lg font-black text-slate-950 transition-all focus:border-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-900/5 placeholder:text-slate-400"
                    placeholder="5000"
                    min="0"
                    step="1"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                    Kč
                  </span>
                </div>
              </div>

              {/* ÚČET PRODEJCE & SPÁROVANÉ ÚČTY (přesně podle Moje nabídka) */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Přiřazený účet prodejce <span className="text-rose-500">*</span>
                    </label>

                    {/* Switcher pro administrátory (stejný jako v Moje nabídka) */}
                    {isAdminUser && (
                      <SellerAccountSwitcher
                        currentEmail={selectedSeller?.email || selectedCustomEmail || myEmail}
                        myEmail={myEmail}
                        onSelectAccount={handleSelectSeller}
                      />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Zvolte spárovaný účet prodejce, pod kterým bude inzerát vystaven.
                  </p>
                </div>

                {loadingAccounts ? (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs text-slate-500 font-medium">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
                    <span>Načítám spárované účty…</span>
                  </div>
                ) : pairedAccounts.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 font-medium">
                    <p className="font-bold">⚠️ Nenalezen žádný spárovaný účet</p>
                    <p className="mt-1 text-slate-600">
                      Zkontrolujte prosím napojení účtů v nastavení profilu.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Badge se souhrnem spárovaných účtů */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 font-bold text-slate-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>
                          {pairedAccounts.length === 1
                            ? '1 spárovaný účet'
                            : `${pairedAccounts.length} spárované účty`}
                        </span>
                      </span>
                      {selectedSeller?.bazos_name && (
                        <span className="font-semibold text-slate-500 truncate max-w-[150px]">
                          {selectedSeller.bazos_name}
                        </span>
                      )}
                    </div>

                    {/* Karty jednotlivých spárovaných účtů k okamžitému výběru */}
                    <div className="space-y-1.5">
                      {pairedAccounts.map((account) => {
                        const isSelected =
                          formData.bb_email.toLowerCase().trim() === account.email.toLowerCase().trim();
                        const displayName = account.bazos_name || account.email;
                        const phone = account.telephone1 ? formatPhoneNumber(account.telephone1) : null;

                        return (
                          <button
                            key={account.email}
                            type="button"
                            onClick={() => handleSelectPairedAccount(account.email)}
                            className={`w-full text-left p-3 rounded-2xl border transition-all active:scale-[0.99] flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50/40 text-slate-950 ring-2 ring-emerald-500/20 shadow-xs'
                                : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/80 text-slate-700'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs sm:text-sm font-bold text-slate-950 truncate">
                                  {displayName}
                                </span>
                                {account.bazos_name && (
                                  <span className="text-[10px] font-medium text-slate-500 truncate">
                                    ({account.email})
                                  </span>
                                )}
                                {isSelected && (
                                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-800 uppercase tracking-wider">
                                    Vybráno
                                  </span>
                                )}
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                                {phone && (
                                  <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                                    <span>📞</span>
                                    <span>{phone}</span>
                                  </span>
                                )}
                                {account.location && (
                                  <span className="inline-flex items-center gap-1">
                                    <span>📍</span>
                                    <span>{account.location}</span>
                                  </span>
                                )}
                                {account.sbazar_email &&
                                  account.sbazar_email.toLowerCase() !== account.email.toLowerCase() && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                                      <span>🔗 Sbazar: {account.sbazar_email}</span>
                                    </span>
                                  )}
                              </div>
                            </div>

                            {/* Radio checkmark */}
                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && (
                                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 12 12">
                                  <path d="M9.707 3.293a1 1 0 00-1.414 0L5 6.586 3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 000-1.414z" />
                                </svg>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Box: Cílové portály (Čisté, světlé, moderní přepínače) */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-bold text-slate-950 flex items-center gap-2">
                  <span>🚀</span> Prodejní kanály
                </h2>
                <span className="text-[11px] font-bold text-slate-500">
                  {formData.marketplace.length} vybráno
                </span>
              </div>

              {/* Portály v moderním lehkém designu */}
              <div className="space-y-2">
                {MARKETPLACES.map((marketplace) => {
                  const isChecked = formData.marketplace.includes(marketplace.id);
                  return (
                    <button
                      key={marketplace.id}
                      type="button"
                      onClick={() => handleMarketplaceToggle(marketplace.id)}
                      className={`w-full group flex items-center justify-between p-3 rounded-2xl border text-left transition-all active:scale-[0.99] ${
                        isChecked
                          ? 'border-emerald-500/80 bg-emerald-50/40 text-slate-950 ring-2 ring-emerald-500/15 shadow-xs'
                          : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/70 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base transition-transform group-hover:scale-105 ${
                            isChecked
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {marketplace.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-950 truncate">
                            {marketplace.label}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">{marketplace.desc}</p>
                        </div>
                      </div>

                      {/* Moderní přepínač (switch) */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isChecked && (
                          <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                            Aktivní
                          </span>
                        )}
                        <div
                          className={`h-6 w-11 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                            isChecked ? 'bg-emerald-600' : 'bg-slate-200'
                          }`}
                        >
                          <div
                            className={`h-5 w-5 rounded-full bg-white shadow-xs transform transition-transform duration-200 ease-in-out ${
                              isChecked ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Box: Interval obnovování (TOPování) */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-slate-950 flex items-center gap-2">
                <span>⚡</span> Automatické TOPování
              </h2>
              <div>
                <select
                  value={formData.autorenew_freq}
                  onChange={(e) => setFormData({ ...formData, autorenew_freq: e.target.value })}
                  className="w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 transition-all focus:border-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-900/5"
                >
                  {AUTORENEW_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Desktop Tlačítko Publikovat (skryto na mobilu, kde je sticky lišta) */}
            <div className="hidden lg:block space-y-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 px-6 py-4 text-sm font-bold text-white shadow-[0_4px_16px_rgba(15,23,42,0.22)] hover:from-slate-800 hover:to-slate-900 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-wait"
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
                  <span>Vytvořit a publikovat inzerát</span>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    selectedSeller?.email ? `/?account=${encodeURIComponent(selectedSeller.email)}` : '/'
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-950 transition-all"
              >
                Zrušit
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE STICKY BOTTOM BAR (Na mobilu vždy snadno dostupné publikování bez scrollování) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500">
              {formData.marketplace.length} portálů • {imageList.length} fotek
            </p>
            <p className="text-sm font-black text-slate-950 truncate">
              {formattedPricePreview || 'Zadejte cenu'}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>Ukládám…</span>
              </>
            ) : (
              <span>Vytvořit inzerát →</span>
            )}
          </button>
        </div>
      </form>
    </main>
  );
}

export default function CreateOfferPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
          <p className="mt-3 text-xs font-semibold text-slate-500">Načítám formulář…</p>
        </div>
      }
    >
      <CreateOfferContent />
    </Suspense>
  );
}
