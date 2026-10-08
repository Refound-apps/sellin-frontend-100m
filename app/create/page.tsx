'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatPhoneNumber } from '@/components/offerStatus';
import { apiFetch, getUsers, uploadImagesToR2 } from '@/lib/api';
import { filesToCompressedBase64 } from '@/lib/compressImage';
import { DEFAULT_OFFER_CATEGORIES, OfferCategoryItem, fetchOfferCategories } from '@/lib/categories';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/lib/types';
import SellerAccountSwitcher from '@/components/SellerAccountSwitcher';
import { resolvePairedUserAccounts } from '@/lib/sellerAccounts';

const BAZOS_TITLE_MAX = 59;
const LAST_BB_EMAIL_KEY = 'sellin_last_bb_email';
const OFFER_TEMPLATE_KEY = 'sellin_offer_template';

function templateStorageKey(bbEmail?: string | null) {
  const email = (bbEmail || '').trim().toLowerCase();
  return email ? `${OFFER_TEMPLATE_KEY}:${email}` : OFFER_TEMPLATE_KEY;
}

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
  { id: 'E-shop', label: 'Vlastní e-shop', icon: '🛍️', desc: 'Zobrazení ve vašem storefrontu' },
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
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dropzoneActive, setDropzoneActive] = useState(false);
  const dragFromRef = useRef<number | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    price_agreement: false,
    location: '',
    zipcode: '',
    bb_email: '',
    marketplace: ['Bazoš', 'Sbazar', 'E-shop'] as string[],
    autorenew_freq: '1x za 10 dní vč. TOP',
    categoryId: 45, // Výchozí: Auto > Pneumatiky, kola (id 45)
  });

  const [templateToast, setTemplateToast] = useState<string | null>(null);
  const [templateBusy, setTemplateBusy] = useState(false);

  const showTemplateToast = (msg: string) => {
    setTemplateToast(msg);
    setTimeout(() => setTemplateToast(null), 3500);
  };

  const rememberBbEmail = (email: string) => {
    if (!email?.trim()) return;
    try {
      localStorage.setItem(LAST_BB_EMAIL_KEY, email.trim());
    } catch {}
  };

  const readLastBbEmail = (): string | null => {
    try {
      return localStorage.getItem(LAST_BB_EMAIL_KEY);
    } catch {
      return null;
    }
  };

  const fetchTemplatePayload = async (
    bbEmail?: string | null
  ): Promise<Record<string, any> | null> => {
    const email = (bbEmail || '').trim();
    try {
      const qs = email ? `?bb_email=${encodeURIComponent(email)}` : '';
      const res = await fetch(`/api/offer-templates${qs}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success && data?.template?.payload) {
        return data.template.payload;
      }
    } catch {}

    try {
      const scoped = localStorage.getItem(templateStorageKey(email));
      if (scoped) return JSON.parse(scoped);
      // Legacy single-template fallback
      const legacy = localStorage.getItem(OFFER_TEMPLATE_KEY);
      if (legacy) return JSON.parse(legacy);
    } catch {}
    return null;
  };

  const buildTemplatePayload = () => ({
    title: formData.title.slice(0, BAZOS_TITLE_MAX),
    description: formData.description,
    price: formData.price,
    price_agreement: formData.price_agreement,
    location: formData.location.trim(),
    zipcode: formData.zipcode.trim(),
    bb_email: formData.bb_email,
    marketplace: formData.marketplace,
    autorenew_freq: formData.autorenew_freq,
    categoryId: formData.categoryId,
  });

  const accountLabel = (email: string) => {
    const match =
      pairedAccounts.find((p) => p.email.toLowerCase() === email.toLowerCase()) ||
      availableUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return match?.bazos_name || email;
  };

  /** Apply template fields but keep the currently selected sub-account. */
  const applyTemplatePayload = (
    t: Record<string, any>,
    paired?: User[],
    lockBbEmail?: string | null
  ) => {
    setFormData((prev) => {
      const nextTitle =
        typeof t.title === 'string' ? t.title.slice(0, BAZOS_TITLE_MAX) : prev.title;

      const locked = (lockBbEmail || prev.bb_email || '').trim();
      let nextBbEmail = locked || prev.bb_email;

      if (!locked && typeof t.bb_email === 'string' && t.bb_email.trim()) {
        nextBbEmail = t.bb_email.trim();
      }

      if (nextBbEmail && paired?.length) {
        const inPaired = paired.some(
          (p) => p.email.toLowerCase().trim() === nextBbEmail.toLowerCase().trim()
        );
        if (!inPaired) nextBbEmail = prev.bb_email;
      }

      const matchedAccount = paired?.find(
        (p) => p.email.toLowerCase().trim() === nextBbEmail.toLowerCase().trim()
      );

      return {
        ...prev,
        title: nextTitle,
        description: typeof t.description === 'string' ? t.description : prev.description,
        price: t.price != null ? String(t.price) : prev.price,
        price_agreement:
          typeof t.price_agreement === 'boolean' ? t.price_agreement : prev.price_agreement,
        location:
          matchedAccount?.location ||
          (typeof t.location === 'string' ? t.location : prev.location),
        zipcode: matchedAccount?.zipcode
          ? String(matchedAccount.zipcode)
          : t.zipcode != null
            ? String(t.zipcode)
            : prev.zipcode,
        bb_email: nextBbEmail,
        marketplace:
          Array.isArray(t.marketplace) && t.marketplace.length > 0
            ? t.marketplace.map(String)
            : prev.marketplace,
        autorenew_freq: typeof t.autorenew_freq === 'string' ? t.autorenew_freq : prev.autorenew_freq,
        categoryId:
          t.categoryId != null && !Number.isNaN(Number(t.categoryId))
            ? Number(t.categoryId)
            : prev.categoryId,
      };
    });
  };

  const loadTemplateForAccount = async (
    bbEmail: string,
    paired: User[],
    opts?: { toast?: boolean }
  ) => {
    const payload = await fetchTemplatePayload(bbEmail);
    if (!payload) return false;
    applyTemplatePayload(payload, paired, bbEmail);
    if (opts?.toast !== false) {
      showTemplateToast(`Šablona pro ${accountLabel(bbEmail)} předvyplněna.`);
    }
    return true;
  };

  const handleSaveTemplate = async () => {
    if (templateBusy) return;
    if (!formData.bb_email?.trim()) {
      showTemplateToast('Nejdřív vyberte účet, pro který chcete šablonu uložit.');
      return;
    }
    setTemplateBusy(true);
    try {
      const payload = buildTemplatePayload();
      const email = formData.bb_email.trim();
      try {
        localStorage.setItem(templateStorageKey(email), JSON.stringify(payload));
      } catch {}
      rememberBbEmail(email);

      const res = await fetch('/api/offer-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload, bb_email: email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `Uložení selhalo (${res.status})`);
      }
      showTemplateToast(
        `Šablona uložena pro ${accountLabel(email)} — při příštím inzerátu na tomto účtu se předvyplní.`
      );
    } catch (e: any) {
      console.error('Failed to save template:', e);
      showTemplateToast(e?.message || 'Šablonu se nepodařilo uložit.');
    } finally {
      setTemplateBusy(false);
    }
  };

  const handleApplyTemplate = async () => {
    if (templateBusy) return;
    setTemplateBusy(true);
    try {
      const email = formData.bb_email;
      const payload = await fetchTemplatePayload(email);
      if (!payload) {
        showTemplateToast(
          'Pro tento účet zatím nemáte šablonu. Vyplňte formulář a klikněte Uložit šablonu.'
        );
        return;
      }

      applyTemplatePayload(payload, pairedAccounts, email);
      showTemplateToast(`Šablona pro ${accountLabel(email)} načtena.`);
    } catch (e: any) {
      console.error('Failed to apply template:', e);
      showTemplateToast(e?.message || 'Šablonu se nepodařilo načíst.');
    } finally {
      setTemplateBusy(false);
    }
  };

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

      // 7. Initialize form with last used Bazoš account + that account's template
      const lastBbEmail = readLastBbEmail();

      const sellerLocation = targetSeller?.location || 'Praha';
      const sellerZipcode = targetSeller?.zipcode ? String(targetSeller.zipcode) : '11000';

      const pickInitialEmail = (pairedList: User[], fallback: string) => {
        if (lastBbEmail) {
          const lastMatch = pairedList.find(
            (p) => p.email.toLowerCase().trim() === lastBbEmail.toLowerCase().trim()
          );
          if (lastMatch) return lastMatch.email;
        }
        return fallback;
      };

      if (paired.length > 0) {
        const fallbackEmail =
          paired.find((p) => p.email.toLowerCase() === targetSeller?.email?.toLowerCase())?.email ||
          paired[0].email;
        const initialEmail = pickInitialEmail(paired, fallbackEmail);
        const matchedAccount =
          paired.find((p) => p.email.toLowerCase() === initialEmail.toLowerCase()) || paired[0];

        setFormData((prev) => ({
          ...prev,
          bb_email: initialEmail,
          location: matchedAccount.location || sellerLocation,
          zipcode: matchedAccount.zipcode ? String(matchedAccount.zipcode) : sellerZipcode,
          autorenew_freq: prev.autorenew_freq,
          marketplace: prev.marketplace,
        }));

        await loadTemplateForAccount(initialEmail, paired);
      } else if (targetSeller) {
        setFormData((prev) => ({
          ...prev,
          bb_email: targetSeller.email,
          location: targetSeller.location || sellerLocation,
          zipcode: targetSeller.zipcode ? String(targetSeller.zipcode) : sellerZipcode,
        }));

        await loadTemplateForAccount(targetSeller.email, []);
      }
    } catch (err) {
      console.error('Failed to load user and accounts for create offer:', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Admin Switcher action: select another seller
  const handleSelectSeller = async (user: User | null, customEmail?: string) => {
    if (user) {
      setSelectedSeller(user);
      setSelectedCustomEmail(null);
      const paired = resolvePairedUserAccounts(user, availableUsers);
      setPairedAccounts(paired);
      const lastEmail = readLastBbEmail();
      const defaultEmail =
        (lastEmail &&
          paired.find((p) => p.email.toLowerCase() === lastEmail.toLowerCase().trim())?.email) ||
        paired.find((p) => p.email.toLowerCase() === user.email.toLowerCase())?.email ||
        paired[0]?.email ||
        user.email;
      const matched =
        paired.find((p) => p.email.toLowerCase() === defaultEmail.toLowerCase()) || user;
      setFormData((prev) => ({
        ...prev,
        bb_email: defaultEmail,
        location: matched.location || prev.location || 'Praha',
        zipcode: matched.zipcode ? String(matched.zipcode) : prev.zipcode || '11000',
      }));
      await loadTemplateForAccount(defaultEmail, paired);
    } else if (customEmail) {
      setSelectedSeller(null);
      setSelectedCustomEmail(customEmail);
      const paired = resolvePairedUserAccounts(customEmail, availableUsers);
      setPairedAccounts(paired);
      const lastEmail = readLastBbEmail();
      const email =
        (lastEmail &&
          paired.find((p) => p.email.toLowerCase() === lastEmail.toLowerCase().trim())?.email) ||
        paired[0]?.email ||
        customEmail;
      setFormData((prev) => ({ ...prev, bb_email: email }));
      await loadTemplateForAccount(email, paired);
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
        const lastEmail = readLastBbEmail();
        const email =
          (lastEmail &&
            paired.find((p) => p.email.toLowerCase() === lastEmail.toLowerCase().trim())
              ?.email) ||
          paired[0].email;
        const matched = paired.find((p) => p.email.toLowerCase() === email.toLowerCase());
        setFormData((prev) => ({
          ...prev,
          bb_email: email,
          location: matched?.location || meUser?.location || prev.location || 'Praha',
          zipcode: matched?.zipcode
            ? String(matched.zipcode)
            : meUser?.zipcode
              ? String(meUser.zipcode)
              : prev.zipcode || '11000',
        }));
        await loadTemplateForAccount(email, paired);
      }
    }
  };

  // Direct selection of one of the paired accounts — also loads that account's template
  const handleSelectPairedAccount = async (accountEmail: string) => {
    const matched = pairedAccounts.find((p) => p.email.toLowerCase() === accountEmail.toLowerCase());
    rememberBbEmail(accountEmail);
    setFormData((prev) => ({
      ...prev,
      bb_email: accountEmail,
      location: matched?.location || prev.location,
      zipcode: matched?.zipcode ? String(matched.zipcode) : prev.zipcode,
    }));
    await loadTemplateForAccount(accountEmail, pairedAccounts);
  };

  const handleMarketplaceToggle = (marketplaceId: string) => {
    setFormData((prev) => ({
      ...prev,
      marketplace: prev.marketplace.includes(marketplaceId)
        ? prev.marketplace.filter((m) => m !== marketplaceId)
        : [...prev.marketplace, marketplaceId],
    }));
  };

  const uploadImageFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    const remainingSlots = 9 - imageList.length;
    if (remainingSlots <= 0) {
      alert('Lze nahrát maximálně 9 fotografií na jeden inzerát.');
      return;
    }

    const selectedFiles = fileArray.slice(0, remainingSlots);
    setUploadingImages(true);
    setError(null);

    try {
      const base64Files = await filesToCompressedBase64(selectedFiles);
      const uploadedUrls = await uploadImagesToR2(base64Files);

      setImageList((prev) => [...prev, ...uploadedUrls].slice(0, 9));
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError('Nepodařilo se nahrát obrázky: ' + (err.message || 'Zkuste to prosím znovu.'));
    } finally {
      setUploadingImages(false);
    }
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      await uploadImageFiles(files);
    } finally {
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveImage = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    setImageList((prev) => {
      if (to >= prev.length) return prev;
      const copy = [...prev];
      const item = copy.splice(from, 1)[0];
      copy.splice(to, 0, item);
      return copy;
    });
  };

  const clearPhotoDrag = () => {
    dragFromRef.current = null;
    setDragFromIndex(null);
    setDragOverIndex(null);
  };

  const handlePhotoDragStart = (index: number, e: React.DragEvent) => {
    dragFromRef.current = index;
    setDragFromIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handlePhotoDragOver = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  const handlePhotoDrop = (toIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    const from =
      dragFromRef.current ??
      (e.dataTransfer.getData('text/plain')
        ? Number(e.dataTransfer.getData('text/plain'))
        : null);
    clearPhotoDrag();
    if (from == null || Number.isNaN(from)) return;
    handleMoveImage(from, toIndex);
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

    if (!formData.title.trim() || !formData.description.trim() || !formData.bb_email) {
      setError('Vyplňte prosím všechna povinná pole (název, popis a účet).');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (formData.title.trim().length > BAZOS_TITLE_MAX) {
      setError(`Název inzerátu může mít maximálně ${BAZOS_TITLE_MAX} znaků (limit Bazoše).`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (
      formData.marketplace.includes('Sbazar') &&
      formData.description.trim().length < 15
    ) {
      setError('Sbazar vyžaduje popis alespoň 15 znaků.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!formData.price_agreement && (!formData.price || parseFloat(formData.price) <= 0)) {
      setError('Vyplňte prosím platnou cenu zboží nebo zaškrtněte "Cena dohodou".');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (formData.marketplace.length === 0) {
      setError('Vyberte alespoň jeden prodejní kanál / inzertní portál.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const hasDataUri = imageList.some((url) => typeof url === 'string' && url.trim().startsWith('data:'));
    if (hasDataUri) {
      setError('Fotografie nejsou řádně nahrány v R2 úložišti. Odeberte je prosím a nahrajte znovu.');
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
          price: formData.price_agreement ? 0 : parseFloat(formData.price) || 0,
          price_agreement: Boolean(formData.price_agreement),
          location: formData.location.trim() || undefined,
          zipcode: formData.zipcode.trim() || undefined,
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
        const errBody = await response.json().catch(() => ({}));
        throw new Error(
          (errBody && (errBody.error || errBody.message)) ||
            `Nepodařilo se vytvořit inzerát (${response.status})`
        );
      }

      rememberBbEmail(formData.bb_email);

      // Return back to "Moje nabídka" with the active seller filter preserved
      const returnAccount = selectedSeller?.email || selectedCustomEmail;
      router.push(returnAccount ? `/?account=${encodeURIComponent(returnAccount)}` : '/');
    } catch (err: any) {
      setError(err?.message || 'Nepodařilo se vytvořit inzerát. Zkuste to prosím znovu.');
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

  const formattedPricePreview = formData.price_agreement
    ? 'Cena dohodou'
    : formData.price && !isNaN(Number(formData.price))
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

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href={selectedSeller?.email ? `/?account=${encodeURIComponent(selectedSeller.email)}` : '/'}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-950 active:scale-95 transition-all shadow-xs"
          >
            <span>←</span>
            <span>Zpět na nabídku</span>
          </Link>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="hidden sm:inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Publikuji…
              </span>
            ) : (
              <span>Publikovat</span>
            )}
          </button>
        </div>
      </div>

      {templateToast && (
        <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50/90 p-3.5 text-xs sm:text-sm font-semibold text-blue-900 shadow-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <span>ℹ️</span>
            <span>{templateToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setTemplateToast(null)}
            className="text-blue-500 hover:text-blue-800 text-sm font-bold p-1"
          >
            ✕
          </button>
        </div>
      )}

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
              <div
                className="relative"
                onDragEnter={(e) => {
                  e.preventDefault();
                  if (uploadingImages || imageList.length >= 9) return;
                  if (e.dataTransfer.types.includes('Files')) setDropzoneActive(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.types.includes('Files')) e.dataTransfer.dropEffect = 'copy';
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDropzoneActive(false);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDropzoneActive(false);
                  if (uploadingImages || imageList.length >= 9) return;
                  if (e.dataTransfer.files?.length) {
                    void uploadImageFiles(e.dataTransfer.files);
                  }
                }}
              >
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
                      : dropzoneActive
                      ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
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
                          : dropzoneActive
                          ? 'Pusťte fotografie sem'
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
                  <p className="mb-2 text-xs text-slate-500">
                    Přetáhněte fotky pro změnu pořadí. První = hlavní.
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                    {imageList.map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        draggable={!uploadingImages}
                        onDragStart={(e) => handlePhotoDragStart(index, e)}
                        onDragOver={(e) => handlePhotoDragOver(index, e)}
                        onDrop={(e) => handlePhotoDrop(index, e)}
                        onDragEnd={clearPhotoDrag}
                        className={`group relative aspect-square rounded-2xl overflow-hidden border bg-slate-100 shadow-2xs cursor-grab active:cursor-grabbing touch-none select-none transition-all ${
                          dragFromIndex === index
                            ? 'opacity-40 border-emerald-400 scale-95'
                            : dragOverIndex === index
                            ? 'border-emerald-500 ring-2 ring-emerald-400/60 scale-[1.03]'
                            : 'border-slate-200/90'
                        }`}
                      >
                        <Image
                          src={url}
                          alt={`Fotografie ${index + 1}`}
                          fill
                          draggable={false}
                          className="object-cover pointer-events-none"
                        />

                        {/* Badge pro hlavní foto */}
                        {index === 0 && (
                          <div className="absolute top-1.5 left-1.5 rounded-lg bg-emerald-600/95 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            Hlavní foto
                          </div>
                        )}

                        <div className="absolute top-1.5 right-1.5 rounded-md bg-slate-950/55 px-1.5 py-0.5 text-[10px] font-bold text-white opacity-70 group-hover:opacity-100">
                          {index + 1}
                        </div>

                        {/* Překryv s akcemi */}
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveImage(index, index - 1);
                              }}
                              title="Posunout dopředu"
                              className="h-7 w-7 rounded-lg bg-white/90 text-slate-900 font-bold hover:bg-white text-xs flex items-center justify-center shadow-xs"
                            >
                              ◀
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(index);
                            }}
                            title="Smazat fotografii"
                            className="h-7 w-7 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 text-xs flex items-center justify-center shadow-xs"
                          >
                            ✕
                          </button>
                          {index < imageList.length - 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveImage(index, index + 1);
                              }}
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
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="title"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Název inzerátu <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-semibold tabular-nums ${
                      formData.title.length >= BAZOS_TITLE_MAX
                        ? 'text-rose-600'
                        : formData.title.length >= BAZOS_TITLE_MAX - 10
                          ? 'text-amber-600'
                          : 'text-slate-400'
                    }`}
                  >
                    {formData.title.length}/{BAZOS_TITLE_MAX}
                  </span>
                </div>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value.slice(0, BAZOS_TITLE_MAX) })
                  }
                  maxLength={BAZOS_TITLE_MAX}
                  className="w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm sm:text-base font-semibold text-slate-950 transition-all focus:border-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-900/5 placeholder:text-slate-400"
                  placeholder="např. Macbook Air M1, jako nový!"
                  required
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Maximálně {BAZOS_TITLE_MAX} znaků (limit nadpisu na Bazoši).
                </p>
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
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="description"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Obsah inzerátu <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    {formData.description.trim().length} znaků
                  </span>
                </div>
                <textarea
                  id="description"
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-950 transition-all focus:border-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-900/5 placeholder:text-slate-400 resize-y"
                  placeholder="Co nejlépe popište váš předmět a snažte se o co největší unikátnost inzerátu..."
                  required
                />
                {formData.marketplace.includes('Sbazar') &&
                  formData.description.trim().length < 15 && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Sbazar: min. 15 znaků
                    </p>
                  )}
              </div>
            </div>

            {/* SEKCE 3: Lokalita a předání zboží (Adresa, PSČ) */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-950 flex items-center gap-2">
                  <span>📍</span> Lokalita a předání zboží
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Adresa a PSČ pro kontaktní údaje v inzerátech na Bazoši a Sbazaru.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="location"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Adresa / Město
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 transition-all focus:border-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-900/5 placeholder:text-slate-400"
                    placeholder="např. Praha"
                  />
                </div>

                <div>
                  <label
                    htmlFor="zipcode"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    PSČ
                  </label>
                  <input
                    type="text"
                    id="zipcode"
                    value={formData.zipcode}
                    onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
                    className="w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 transition-all focus:border-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-900/5 placeholder:text-slate-400"
                    placeholder="např. 11000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PRAVÝ PANEL: Cena, Přiřazený účet prodejce a Spárované účty, Kanály (4 sloupce na desktopu) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5 lg:sticky lg:top-20">
            {/* Box: Cena a Přiřazený účet prodejce */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              {/* Cena */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="price"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Cena (v Kč) {!formData.price_agreement && <span className="text-rose-500">*</span>}
                  </label>
                  {formData.price_agreement && (
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      Cena dohodou
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    id="price"
                    value={formData.price_agreement ? '' : formData.price}
                    disabled={formData.price_agreement}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full rounded-xl border border-slate-200/90 bg-white py-3 pl-4 pr-12 text-base sm:text-lg font-black text-slate-950 transition-all focus:border-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-900/5 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    placeholder={formData.price_agreement ? 'Cena dohodou' : 'Uveďte cenu v korunách'}
                    min="0"
                    step="1"
                    required={!formData.price_agreement}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                    Kč
                  </span>
                </div>

                {/* Checkbox Cena dohodou */}
                <label className="mt-2.5 flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="price_agreement"
                    checked={formData.price_agreement}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price_agreement: e.target.checked,
                        price: e.target.checked ? '' : formData.price,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700">Cena dohodou</span>
                </label>
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
                    <p className="font-bold">Nenalezen žádný spárovaný účet</p>
                    <p className="mt-1 text-slate-600">
                      Nejdřív napojte Bazoš (nebo jiný kanál), teprve pak půjde inzerát vystavit.
                    </p>
                    <a
                      href="/accounts"
                      className="mt-2.5 inline-flex min-h-9 items-center rounded-lg bg-slate-950 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-slate-800"
                    >
                      Přejít na Napojení účtů →
                    </a>
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
                              {/* Horní řádek: Telefonní číslo jako hlavní identifikátor s decentním zvýrazněním */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {phone ? (
                                  <span
                                    className={`inline-flex items-center gap-1 font-bold font-mono text-xs sm:text-[13px] tracking-tight px-1.5 py-0.5 rounded-md border transition-colors ${
                                      isSelected
                                        ? 'bg-emerald-100/90 border-emerald-300 text-emerald-950 shadow-2xs'
                                        : 'bg-slate-100/90 border-slate-200/90 text-slate-900'
                                    }`}
                                  >
                                    <span className="text-[10px] text-slate-400">📞</span>
                                    <span>{phone}</span>
                                  </span>
                                ) : (
                                  <span className="text-xs sm:text-sm font-bold text-slate-950 truncate">
                                    {displayName}
                                  </span>
                                )}

                                {isSelected && (
                                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-800 uppercase tracking-wider">
                                    Vybráno
                                  </span>
                                )}
                              </div>

                              {/* Spodní řádek: Název účtu, e-mail a lokalita */}
                              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                                <span className={`font-semibold truncate max-w-[160px] ${isSelected ? 'text-emerald-900 font-bold' : 'text-slate-700'}`}>
                                  {account.bazos_name || 'Bez názvu'}
                                </span>
                                <span className="text-slate-300">·</span>
                                <span className={`truncate max-w-[160px] ${isSelected ? 'text-emerald-700/80' : 'text-slate-400'}`}>
                                  {account.email}
                                </span>
                                {account.location && (
                                  <>
                                    <span className="text-slate-300">·</span>
                                    <span className="inline-flex items-center gap-0.5 text-slate-500">
                                      <span>📍</span>
                                      <span>{account.location}</span>
                                    </span>
                                  </>
                                )}
                                {account.sbazar_email &&
                                  account.sbazar_email.toLowerCase() !== account.email.toLowerCase() && (
                                    <>
                                      <span className="text-slate-300">·</span>
                                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                                        <span>🔗 Sbazar: {account.sbazar_email}</span>
                                      </span>
                                    </>
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

            {/* Box: Automatická obnova */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-slate-950 flex items-center gap-2">
                <span>⚡</span> Auto-obnova inzerátu *
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

            {/* Box: Šablona inzerátu — jedna na každý subúčet */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-950 flex items-center gap-2">
                  <span>📋</span> Šablona inzerátu
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {formData.bb_email
                    ? `Pro účet ${accountLabel(formData.bb_email)} — texty, cena, kategorie a portály (bez fotek). Po přepnutí účtu se načte jeho šablona.`
                    : 'Každý subúčet má vlastní šablonu. Vyberte účet a uložte.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleApplyTemplate}
                  disabled={templateBusy}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:text-slate-950 px-3 py-2 text-xs font-bold text-slate-700 active:scale-95 transition-all text-center disabled:opacity-50"
                >
                  {templateBusy ? 'Načítám…' : 'Použít šablonu'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={templateBusy}
                  className="w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 active:scale-95 transition-all text-center disabled:opacity-50"
                >
                  {templateBusy ? 'Ukládám…' : 'Uložit šablonu'}
                </button>
              </div>
            </div>

            {/* Upozornění pod formulářem */}
            <p className="text-[11px] leading-relaxed text-slate-500 px-1">
              * Beru na vědomí, že při vyšší frekvenci autoobnovy může potenciálně dojít ke smazání mých inzerátů z inzertních serverů, více ve FAQ.
            </p>

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
