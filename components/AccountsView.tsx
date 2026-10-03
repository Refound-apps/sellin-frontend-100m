'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { User, ShopConfigData } from '@/lib/types';
import { getUsers, getUserShop } from '@/lib/api';
import { resolvePairedUserAccounts } from '@/lib/sellerAccounts';
import SellerAccountSwitcher from '@/components/SellerAccountSwitcher';
import BazosAccountsModal from './accounts/BazosAccountsModal';
import SbazarAccountsModal from './accounts/SbazarAccountsModal';
import CustomShopModal from './accounts/CustomShopModal';
import ShoptetImportModal from './accounts/ShoptetImportModal';
import ShopifyImportModal from './accounts/ShopifyImportModal';
import ComingSoonModal from './accounts/ComingSoonModal';

export type ChannelCategory = 'all' | 'portals' | 'eshops' | 'marketplaces' | 'comparators';

export interface ChannelItem {
  id: string;
  name: string;
  category: 'portals' | 'eshops' | 'marketplaces' | 'comparators';
  categoryLabel: string;
  isReady: boolean;
  statusLabel: string;
  tagline: string;
  shortDesc: string;
  tags: string[];
}

const ALL_CHANNELS: ChannelItem[] = [
  // 1. BAZOŠ.CZ / SK - AKTIVNÍ
  {
    id: 'bazos',
    name: 'Bazoš.cz / SK',
    category: 'portals',
    categoryLabel: 'Inzertní portál',
    isReady: true,
    statusLabel: 'Aktivní synchronizace',
    tagline: 'Přímý prodej bez provizí • B-kód autorizace',
    shortDesc: 'Nejvyšší obrat inzerce v ČR a SK. Přímé telefonické i e-mailové poptávky, nulové transakční poplatky a okamžitá obnova.',
    tags: ['0 % provize', 'B-kód autorizace', 'Auto-TOP', 'CZ & SK'],
  },

  // 2. SBAZAR.CZ - AKTIVNÍ
  {
    id: 'sbazar',
    name: 'Sbazar.cz',
    category: 'portals',
    categoryLabel: 'Inzertní portál',
    isReady: true,
    statusLabel: 'Aktivní synchronizace',
    tagline: 'Bezplatná inzerce na Seznamu',
    shortDesc: 'Silný regionální dosah z vyhledávání Seznam.cz. Přímý kontakt se zájemci bez transakčních srážek s podporou Cookie DS.',
    tags: ['0 % provize', 'Seznam.cz', 'Cookie DS', 'Auto-obnova'],
  },

  // 3. VLASTNÍ E-SHOP (STOREFRONT) - AKTIVNÍ
  {
    id: 'sellin-shop',
    name: 'Vlastní E-shop (Storefront)',
    category: 'eshops',
    categoryLabel: 'Vlastní e-shop',
    isReady: true,
    statusLabel: 'Aktivní storefront',
    tagline: 'Přímý prodej se 100% marží na vlastní doméně',
    shortDesc: 'Plná marže bez zprostředkovatelských provizí. Přímý nákup přes webový košík, vlastní doména a napojení všech skladů.',
    tags: ['100 % marže', 'Vlastní doména', 'Online košík', 'Centrální sklad'],
  },

  // 4. SHOPTET - API IMPORT PŘIPRAVEN
  {
    id: 'shoptet',
    name: 'Shoptet',
    category: 'eshops',
    categoryLabel: 'E-shop platforma',
    isReady: true,
    statusLabel: 'API import připraven',
    tagline: 'Vytažení produktů & Obousměrný sklad',
    shortDesc: 'Předpřipravené API rozhraní pro vytažení produktů, cen a stavu skladu z existujícího Shoptetu přes kompletní XML feed nebo Partner API.',
    tags: ['API Import', 'Kompletní XML', 'Obousměrný sklad'],
  },

  // 5. SHOPIFY - API IMPORT PŘIPRAVEN
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'eshops',
    categoryLabel: 'E-shop platforma',
    isReady: true,
    statusLabel: 'API import připraven',
    tagline: 'Globální e-commerce systém & Admin API',
    shortDesc: 'Předpřipravené API rozhraní pro načtení produktů, variant a fotek z existujícího Shopify obchodu přes Shopify Admin REST & GraphQL API.',
    tags: ['Admin API', 'REST / GraphQL', 'Import produktů'],
  },

  // 6. GOOGLE NÁKUPY - XML FEED DOSTUPNÝ VE VLASTNÍM E-SHOPU
  {
    id: 'google-shopping',
    name: 'Google Nákupy',
    category: 'comparators',
    categoryLabel: 'Srovnávač & Ads',
    isReady: true,
    statusLabel: 'XML feed připraven',
    tagline: 'Merchant feed z vlastního e-shopu',
    shortDesc: 'Produktový XML feed je dostupný v konfiguraci Vlastního E-shopu (Google Merchant). Napojení do Merchant Center provedete ručně vložením feed URL.',
    tags: ['Google Merchant', 'XML feed', 'Vlastní E-shop'],
  },

  // 7. FACEBOOK MARKETPLACE - PŘIPRAVUJEME (ZAŠEDLÉ)
  {
    id: 'facebook',
    name: 'Facebook Marketplace',
    category: 'marketplaces',
    categoryLabel: 'Sociální inzerce',
    isReady: false,
    statusLabel: 'Připravujeme',
    tagline: 'Lokální poptávka bez poplatků',
    shortDesc: 'Rychlý lokální odbyt bez prodejních provizí. Poptávky přímo do Messengeru a okamžitý osobní odběr v regionu.',
    tags: ['Messenger chat', 'Lokální odběr', 'Ve vývoji'],
  },

  // 8. AUKRO.CZ - PŘIPRAVUJEME (ZAŠEDLÉ)
  {
    id: 'aukro',
    name: 'Aukro.cz',
    category: 'marketplaces',
    categoryLabel: 'Online tržiště',
    isReady: false,
    statusLabel: 'Připravujeme',
    tagline: 'Pevné ceny i aukce s garancí',
    shortDesc: 'Vysoká důvěra kupujících a ochrana plateb. Rychlý odbyt použitého zboží formou Kup teď i aukcí se zabezpečenou platbou.',
    tags: ['Bezpečná platba', 'Kup teď & Aukce', 'Ve vývoji'],
  },

  // 9. ALLEGRO.CZ - PŘIPRAVUJEME (ZAŠEDLÉ)
  {
    id: 'allegro',
    name: 'Allegro.cz',
    category: 'marketplaces',
    categoryLabel: 'Marketplace',
    isReady: false,
    statusLabel: 'Připravujeme',
    tagline: 'Široký odbyt v ČR a Polsku',
    shortDesc: 'Hromadný odbyt v sekcích Outlet a Použité zboží. Program Allegro Smart zvyšuje konverzi a rychlost prodeje.',
    tags: ['CZ a PL trh', 'Allegro Smart', 'Ve vývoji'],
  },

  // 10. VINTED - PŘIPRAVUJEME (ZAŠEDLÉ)
  {
    id: 'vinted',
    name: 'Vinted',
    category: 'portals',
    categoryLabel: 'Second-hand bazar',
    isReady: false,
    statusLabel: 'Připravujeme',
    tagline: 'Second-hand prodej bez poplatků',
    shortDesc: 'Nulové poplatky pro prodejce s integrovanou zlevněnou dopravou. Platba předem garantovaná platformou.',
    tags: ['0 % poplatky', 'Integrovaná doprava', 'Ve vývoji'],
  },

  // 11. EBAY MOTORS - PŘIPRAVUJEME (ZAŠEDLÉ)
  {
    id: 'ebay',
    name: 'eBay Motors & Goods',
    category: 'marketplaces',
    categoryLabel: 'Globální export',
    isReady: false,
    statusLabel: 'Připravujeme',
    tagline: 'Export do EU za vyšší EUR ceny',
    shortDesc: 'Prodej autodílů a zboží do Německa a celé EU. Podstatně vyšší prodejní ceny kompenzují transakční poplatky tržiště.',
    tags: ['Export v EUR', 'Trh celé EU', 'Ve vývoji'],
  },

  // 12. KAUFLAND GLOBAL - PŘIPRAVUJEME (ZAŠEDLÉ)
  {
    id: 'kaufland',
    name: 'Kaufland Global',
    category: 'marketplaces',
    categoryLabel: 'Marketplace',
    isReady: false,
    statusLabel: 'Připravujeme',
    tagline: 'Zákaznická báze v CZ, SK a DE',
    shortDesc: 'Vhodné pro outlet, repasy a nadnormativní zásoby. Automatická rezervace skladu a zajištěné platby.',
    tags: ['CZ, SK & DE', 'Katalog Kaufland', 'Ve vývoji'],
  },

  // 13. ZBOŽÍ.CZ - XML FEED DOSTUPNÝ VE VLASTNÍM E-SHOPU
  {
    id: 'zbozi',
    name: 'Zboží.cz',
    category: 'comparators',
    categoryLabel: 'Srovnávač cen',
    isReady: true,
    statusLabel: 'XML feed připraven',
    tagline: 'Zboží.cz feed z vlastního e-shopu',
    shortDesc: 'XML feed pro Zboží.cz je dostupný v konfiguraci Vlastního E-shopu. URL zkopírujete a vložíte v administraci Seznam Zboží.',
    tags: ['Seznam Nákupy', 'XML feed', 'Vlastní E-shop'],
  },

  // 14. HEUREKA.CZ / SK - XML FEED DOSTUPNÝ VE VLASTNÍM E-SHOPU
  {
    id: 'heureka',
    name: 'Heureka.cz / SK',
    category: 'comparators',
    categoryLabel: 'Srovnávač cen',
    isReady: true,
    statusLabel: 'XML feed připraven',
    tagline: 'Heureka feed z vlastního e-shopu',
    shortDesc: 'Produktový XML feed pro Heureku je dostupný v konfiguraci Vlastního E-shopu. Automatická synchronizace portálu zatím neběží — feed napojíte ručně.',
    tags: ['Produktový feed', 'XML feed', 'Vlastní E-shop'],
  },
];

const CATEGORIES: { id: ChannelCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'Všechny kanály', icon: '⚡' },
  { id: 'portals', label: 'Inzerce & Bazary', icon: '🏷️' },
  { id: 'eshops', label: 'E-shopy & Platformy', icon: '🌐' },
  { id: 'marketplaces', label: 'Marketplaces', icon: '🛍️' },
  { id: 'comparators', label: 'Srovnávače cen', icon: '📊' },
];

export default function AccountsView() {
  const [activeCategory, setActiveCategory] = useState<ChannelCategory>('all');
  const [search, setSearch] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<ChannelItem | null>(null);

  // Users & seller data
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [myEmail, setMyEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shopConfig, setShopConfig] = useState<ShopConfigData | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);

        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        const authEmail = authUser?.email || null;
        if (isMounted) setMyEmail(authEmail);

        const users = await getUsers();
        if (isMounted) setAllUsers(users);

        let userIsAdmin = false;
        if (authUser) {
          const { data: userCreds } = await supabase
            .from('credential_pg')
            .select('role')
            .or(`user_id.eq.${authUser.id},email.ilike.${authEmail}`)
            .eq('role', 'admin')
            .limit(1);

          userIsAdmin = Boolean(userCreds && userCreds.length > 0);
        }
        if (isMounted) setIsAdmin(userIsAdmin);

        let defaultSellerEmail = 'duplux@seznam.cz';
        if (authEmail && !userIsAdmin) {
          defaultSellerEmail = authEmail;
        } else {
          const duplux = users.find((u) => u.email?.toLowerCase().includes('duplux'));
          if (duplux) {
            defaultSellerEmail = duplux.email;
          } else if (users.length > 0) {
            defaultSellerEmail = users[0].email;
          }
        }

        if (isMounted) setCurrentEmail(defaultSellerEmail);

        try {
          const shopRes = await getUserShop(`?seller=${encodeURIComponent(defaultSellerEmail)}`);
          if (isMounted && shopRes.shop) {
            setShopConfig(shopRes.shop);
          }
        } catch (e) {
          console.error('Failed to load shop in AccountsView:', e);
        }
      } catch (err) {
        console.error('Failed to initialize AccountsView:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // Compute paired subaccounts for the active seller
  const pairedAccounts = useMemo(() => {
    if (!currentEmail || allUsers.length === 0) return [];
    return resolvePairedUserAccounts(currentEmail, allUsers);
  }, [currentEmail, allUsers]);

  // When switcher changes seller
  const handleSelectSeller = (user: User | null, customEmail?: string) => {
    const newEmail = user ? user.email : customEmail || myEmail || 'duplux@seznam.cz';
    setCurrentEmail(newEmail);

    // Refresh shop for new seller
    getUserShop(`?seller=${encodeURIComponent(newEmail)}`)
      .then((res) => {
        setShopConfig(res.shop || null);
      })
      .catch((err) => console.error(err));
  };

  // Callback when an account is updated in Bazos/Sbazar modals
  const handleAccountUpdated = (updatedAccount: User) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === updatedAccount.id ? { ...u, ...updatedAccount } : u))
    );
  };

  const handleAccountCreated = (newAccount: User) => {
    setAllUsers((prev) => [newAccount, ...prev]);
  };

  // Filter channels by category & search query
  const filteredChannels = useMemo(() => {
    return ALL_CHANNELS.filter((c) => {
      if (activeCategory !== 'all') {
        if (c.category !== activeCategory) return false;
      }

      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        c.name.toLowerCase().includes(q) ||
        c.categoryLabel.toLowerCase().includes(q) ||
        c.tagline.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [activeCategory, search]);

  const openChannel = (channel: ChannelItem) => {
    if (
      loading &&
      (channel.id === 'bazos' ||
        channel.id === 'sbazar' ||
        channel.id === 'sellin-shop' ||
        channel.id === 'google-shopping' ||
        channel.id === 'zbozi' ||
        channel.id === 'heureka')
    ) {
      return;
    }
    // Feed channels open the e-shop config where XML URLs live
    if (
      channel.id === 'google-shopping' ||
      channel.id === 'zbozi' ||
      channel.id === 'heureka'
    ) {
      setSelectedChannel(ALL_CHANNELS.find((c) => c.id === 'sellin-shop') || channel);
      return;
    }
    setSelectedChannel(channel);
  };

  return (
    <div className="pb-16">
      {/* Top Header – clean, same style as rest of app */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Napojení účtů
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 max-w-2xl">
            {loading
              ? 'Načítám napojené účty…'
              : currentEmail
                ? `${pairedAccounts.length} spárovaných účtů · ${currentEmail}`
                : 'Správa napojení na Bazoš, Sbazar a vlastní e-shop.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <SellerAccountSwitcher
              currentEmail={currentEmail}
              myEmail={myEmail}
              onSelectAccount={handleSelectSeller}
            />
          )}
          <Link
            href="/create"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <span>+</span>
            <span>Vložit nabídku</span>
          </Link>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const count =
              cat.id === 'all'
                ? ALL_CHANNELS.length
                : ALL_CHANNELS.filter((c) => c.category === cat.id).length;
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hledat kanál nebo platformu..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-950 placeholder:text-slate-400 shadow-2xs focus:border-slate-400 outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Grid of Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChannels.map((channel) => {
          const isReady = channel.isReady;

          // Badges and stats
          let dynamicBadge = channel.statusLabel;
          let dynamicBadgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';

          if (channel.id === 'bazos') {
            dynamicBadge = `Aktivní (${pairedAccounts.length} účtů)`;
            dynamicBadgeStyle = 'bg-amber-50 text-amber-900 border-amber-200 font-bold';
          } else if (channel.id === 'sbazar') {
            dynamicBadge = `Aktivní (${pairedAccounts.length} účtů)`;
            dynamicBadgeStyle = 'bg-red-50 text-red-900 border-red-200 font-bold';
          } else if (channel.id === 'sellin-shop') {
            dynamicBadge = shopConfig?.is_active ? 'Aktivní storefront' : 'Vlastní storefront';
            dynamicBadgeStyle = 'bg-emerald-50 text-emerald-900 border-emerald-200 font-bold';
          } else if (channel.id === 'shoptet' || channel.id === 'shopify') {
            dynamicBadge = 'API Import připraven';
            dynamicBadgeStyle = 'bg-sky-50 text-sky-900 border-sky-200 font-bold';
          } else if (
            channel.id === 'google-shopping' ||
            channel.id === 'zbozi' ||
            channel.id === 'heureka'
          ) {
            dynamicBadge = 'XML feed připraven';
            dynamicBadgeStyle = 'bg-sky-50 text-sky-900 border-sky-200 font-bold';
          } else {
            dynamicBadge = 'Připravujeme';
            dynamicBadgeStyle = 'bg-slate-100 text-slate-500 border-slate-200 font-medium';
          }

          return (
            <div
              key={channel.id}
              onClick={() => openChannel(channel)}
              className={`group relative flex flex-col justify-between rounded-3xl p-5 cursor-pointer transition-all duration-200 ${
                isReady
                  ? 'border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 shadow-2xs'
                  : 'border border-dashed border-slate-300 bg-slate-50/60 opacity-70 saturate-50 hover:opacity-90 hover:saturate-85 hover:border-slate-400 hover:bg-white shadow-none'
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <ChannelLogo channelId={channel.id} name={channel.name} />
                    <div>
                      <h3 className="text-base font-black text-slate-950 group-hover:text-slate-900">
                        {channel.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">{channel.categoryLabel}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] ${dynamicBadgeStyle}`}
                  >
                    {isReady && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                    <span>{dynamicBadge}</span>
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-800 mb-1 leading-snug">
                  {channel.tagline}
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                  {channel.shortDesc}
                </p>
              </div>

              {/* Card Footer */}
              <div>
                {/* Specific Preview Badges for Active Channels */}
                {channel.id === 'bazos' && (
                  <div className="mb-3 rounded-xl bg-amber-50/60 border border-amber-200/60 p-2.5 text-[11px] text-amber-900">
                    <span className="font-bold block mb-0.5">Spárované Bazoš účty:</span>
                    <span className="text-amber-800/90 line-clamp-1">
                      {pairedAccounts.map((a) => a.bazos_name || a.email.split('@')[0]).join(', ') || 'Žádné účty'}
                    </span>
                  </div>
                )}

                {channel.id === 'sbazar' && (
                  <div className="mb-3 rounded-xl bg-red-50/60 border border-red-200/60 p-2.5 text-[11px] text-red-900">
                    <span className="font-bold block mb-0.5">Seznam přihlášení:</span>
                    <span className="font-mono text-red-800/90">{currentEmail}</span>
                  </div>
                )}

                {channel.id === 'sellin-shop' && (
                  <div className="mb-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60 p-2.5 text-[11px] text-emerald-900">
                    <span className="font-bold block mb-0.5">
                      {shopConfig?.shop_name || 'Alu Bazar Plzeň'}
                    </span>
                    <span className="font-mono text-emerald-800/90">
                      {shopConfig?.custom_domain || '/shop'}
                    </span>
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  {channel.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-lg bg-slate-100/90 px-2 py-0.5 text-[10px] font-bold text-slate-600"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold">
                  {isReady ? (
                    <>
                      <span className="text-slate-800 group-hover:text-slate-950 flex items-center gap-1">
                        <span>Upravit credentials & napojení</span>
                        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                      </span>
                      <span className="text-slate-400 text-[11px]">Nastavit</span>
                    </>
                  ) : (
                    <>
                      <span className="text-slate-400 flex items-center gap-1">
                        <span>Integrace ve vývoji</span>
                      </span>
                      <span className="text-slate-400 text-[11px]">Více info ↗</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Modals */}
      {selectedChannel?.id === 'bazos' && pairedAccounts.length > 0 && (
        <BazosAccountsModal
          onClose={() => setSelectedChannel(null)}
          accounts={pairedAccounts}
          mainEmail={currentEmail || 'duplux@seznam.cz'}
          onAccountsUpdated={handleAccountUpdated}
          onAccountCreated={handleAccountCreated}
        />
      )}

      {selectedChannel?.id === 'sbazar' && pairedAccounts.length > 0 && (
        <SbazarAccountsModal
          onClose={() => setSelectedChannel(null)}
          accounts={pairedAccounts}
          mainEmail={currentEmail || 'duplux@seznam.cz'}
          onAccountsUpdated={handleAccountUpdated}
        />
      )}

      {selectedChannel?.id === 'sellin-shop' && !loading && (
        <CustomShopModal
          onClose={() => setSelectedChannel(null)}
          sellerEmail={currentEmail || 'duplux@seznam.cz'}
          pairedAccounts={pairedAccounts}
          onShopSaved={(savedShop) => setShopConfig(savedShop)}
        />
      )}

      {selectedChannel?.id === 'shoptet' && (
        <ShoptetImportModal onClose={() => setSelectedChannel(null)} />
      )}

      {selectedChannel?.id === 'shopify' && (
        <ShopifyImportModal onClose={() => setSelectedChannel(null)} />
      )}

      {selectedChannel && !selectedChannel.isReady && (
        <ComingSoonModal
          channel={selectedChannel}
          userEmail={currentEmail || myEmail || ''}
          onClose={() => setSelectedChannel(null)}
        />
      )}
    </div>
  );
}

// Brand Logos helper
function ChannelLogo({ channelId, name }: { channelId: string; name: string }) {
  switch (channelId) {
    case 'bazos':
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF6ED] border border-amber-200/90 shadow-2xs p-1 overflow-hidden" title={name}>
          <svg viewBox="0 0 74 56" className="w-full h-full" fill="none">
            <path
              fill="#FF6600"
              d="M49.15,42.33h6.05c-1.9,3.86-4.8,6.89-8.72,9.08c-4.49,2.51-9.97,3.77-16.43,3.77c-6.25,0-11.65-1.06-16.2-3.18c-4.55-2.12-7.93-5.25-10.15-9.39c-2.22-4.14-3.33-8.64-3.33-13.52c0-5.35,1.26-10.33,3.78-14.94c2.52-4.61,5.97-8.08,10.34-10.39c4.38-2.31,9.38-3.47,15-3.47c4.77,0,9.02,0.93,12.73,2.8c3.71,1.87,6.55,4.52,8.51,7.95c1.96,3.44,2.94,7.19,2.94,11.26c0,4.85-1.49,9.24-4.46,13.16c-3.73,4.95-8.52,7.42-14.35,7.42c-1.57,0-2.76-0.28-3.55-0.83c-0.8-0.55-1.33-1.36-1.59-2.43c-2.24,2.17-4.81,3.25-7.73,3.25c-3.15,0-5.75-1.09-7.83-3.27c-2.07-2.18-3.11-5.08-3.11-8.69c0-4.47,1.25-8.55,3.75-12.25c3.03-4.49,6.92-6.74,11.65-6.74c3.37,0,5.86,1.29,7.47,3.88l0.71-3.17h7.5l-4.29,20.47c-0.27,1.29-0.4,2.13-0.4,2.51c0,0.48,0.11,0.83,0.33,1.07c0.22,0.24,0.48,0.36,0.78,0.36c0.91,0,2.08-0.55,3.52-1.66c1.93-1.45,3.5-3.39,4.69-5.82c1.19-2.44,1.79-4.96,1.79-7.56c0-4.68-1.69-8.6-5.06-11.75c-3.37-3.15-8.08-4.72-14.12-4.72c-5.13,0-9.49,1.05-13.06,3.15c-3.57,2.1-6.26,5.06-8.07,8.88c-1.81,3.82-2.71,7.79-2.71,11.92c0,4.02,1.01,7.67,3.03,10.96c2.02,3.29,4.85,5.7,8.5,7.21c3.65,1.51,7.82,2.27,12.52,2.27c4.53,0,8.42-0.63,11.68-1.9C44.54,46.76,47.16,44.86,49.15,42.33z M18.43,30.6c0,2.42,0.49,4.2,1.46,5.34c0.98,1.14,2.18,1.71,3.62,1.71c1.08,0,2.09-0.27,3.04-0.8c0.72-0.38,1.43-0.98,2.13-1.8c1-1.16,1.87-2.85,2.6-5.08c0.73-2.23,1.09-4.3,1.09-6.22c0-2.15-0.5-3.8-1.49-4.95c-0.99-1.15-2.25-1.73-3.77-1.73c-1.63,0-3.14,0.63-4.52,1.9s-2.43,3.07-3.13,5.41C18.78,26.72,18.43,28.79,18.43,30.6z"
            />
            <path
              fill="#FF6600"
              d="M72.82,55.18h-5.48c-2.9-4.4-5.11-8.96-6.62-13.7c-1.52-4.74-2.27-9.33-2.27-13.76c0-5.5,0.94-10.71,2.81-15.62c1.63-4.26,3.69-8.19,6.2-11.79h5.46c-2.6,5.77-4.38,10.67-5.36,14.72c-0.98,4.04-1.46,8.33-1.46,12.86c0,3.12,0.29,6.32,0.87,9.59c0.58,3.27,1.37,6.38,2.37,9.33C69.99,48.76,71.16,51.54,72.82,55.18z"
            />
          </svg>
        </div>
      );

    case 'sbazar':
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#DC2626] shadow-2xs p-1.5 overflow-hidden text-white font-bold" title={name}>
          <span className="text-xl font-black">S</span>
        </div>
      );

    case 'sellin-shop':
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 shadow-2xs text-white p-2" title={name}>
          <svg viewBox="0 0 24 24" className="w-full h-full fill-none stroke-current" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </div>
      );

    case 'shoptet':
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200/90 shadow-2xs p-2" title={name}>
          <svg viewBox="0 0 35 35" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="#fcaf00" d="M25.3521 0H9.33984V16.0415H25.3521V0Z" />
            <path fill="#00e25a" d="M16.0123 18.7087H0V34.7502H16.0123V18.7087Z" />
            <path fill="#3b88ff" d="M34.6919 18.7087H18.6797V34.7502H34.6919V18.7087Z" />
          </svg>
        </div>
      );

    case 'shopify':
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#008060] shadow-2xs p-2 text-white" title={name}>
          <svg role="img" viewBox="0 0 24 24" className="w-full h-full fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z" />
          </svg>
        </div>
      );

    case 'aukro':
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0055A5] shadow-2xs text-white font-black text-xs" title={name}>
          aukro
        </div>
      );

    case 'google-shopping':
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200/90 shadow-2xs p-2" title={name}>
          <svg viewBox="0 0 24 24" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
        </div>
      );

    case 'facebook':
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1877F2] shadow-2xs p-2 text-white" title={name}>
          <svg role="img" viewBox="0 0 24 24" className="w-full h-full fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
          </svg>
        </div>
      );

    case 'allegro':
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FF5A00] shadow-2xs p-1.5 text-white" title={name}>
          <span className="font-bold text-xs tracking-tighter">allegro</span>
        </div>
      );

    case 'vinted':
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#09B1BA] shadow-2xs p-2 text-white font-black text-xs" title={name}>
          vinted
        </div>
      );

    case 'ebay':
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200/90 shadow-2xs p-1" title={name}>
          <span className="font-black text-sm tracking-tighter flex items-center select-none">
            <span className="text-[#E53238]">e</span>
            <span className="text-[#0064D2]">b</span>
            <span className="text-[#F5AF02]">a</span>
            <span className="text-[#86B817]">y</span>
          </span>
        </div>
      );

    case 'kaufland':
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E10915] shadow-2xs p-1 text-white font-black text-xs" title={name}>
          K
        </div>
      );

    case 'zbozi':
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200/90 shadow-2xs p-1.5" title={name}>
          <span className="font-black text-red-600 text-xs">zboží.cz</span>
        </div>
      );

    case 'heureka':
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-2xs p-1 text-white font-black text-xs" title={name}>
          !H
        </div>
      );

    default:
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 font-black text-white text-base shadow-2xs" title={name}>
          🔗
        </div>
      );
  }
}
