'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

export type ChannelCategory = 'all' | 'portals' | 'marketplaces' | 'eshops' | 'comparators';
export type ChannelStatus = 'connected' | 'ready' | 'planned';

export interface ChannelItem {
  id: string;
  name: string;
  category: 'portals' | 'marketplaces' | 'eshops' | 'comparators';
  categoryLabel: string;
  brandColor: string;
  bgLight: string;
  status: ChannelStatus;
  statusLabel: string;
  tagline: string;
  shortDesc: string;
  tags: string[];
  config: {
    username?: string;
    email?: string;
    phone?: string;
    apiKey?: string;
    shopUrl?: string;
    feedUrl?: string;
    availabilityFeedUrl?: string;
    bkod?: string;
    autoTop?: boolean;
    autoRenew?: boolean;
    syncStock?: boolean;
    syncOrders?: boolean;
    location?: string;
    zipcode?: string;
  };
}

// Pořadí: 1 Bazoš → 2 Sbazar → 3 Vlastní e-shop → 4 Google → 5 Facebook → 6 Aukro → 7 Shopify → 8 Shoptet → 9 Allegro → ostatní
const ALL_CHANNELS: ChannelItem[] = [
  // 1. BAZOŠ.CZ / SK
  {
    id: 'bazos',
    name: 'Bazoš.cz / SK',
    category: 'portals',
    categoryLabel: 'Inzertní portál',
    brandColor: '#F59E0B',
    bgLight: 'bg-amber-500/10 text-amber-700 border-amber-200/80',
    status: 'connected',
    statusLabel: 'Aktivní synchronizace',
    tagline: 'Přímý prodej bez provizí',
    shortDesc: 'Nejvyšší obrat použitého zboží v ČR a SK. Přímé telefonické i e-mailové poptávky, nulové transakční poplatky.',
    tags: ['0 % provize', 'Přímý kontakt', 'Auto-TOP'],
    config: {
      username: 'Centrální prodejce',
      email: 'prodej@sellin.cz',
      phone: '+420 777 000 111',
      bkod: 'B-84920',
      autoTop: true,
      autoRenew: true,
      syncStock: true,
      location: 'Praha',
      zipcode: '100 00',
    },
  },

  // 2. SBAZAR.CZ
  {
    id: 'sbazar',
    name: 'Sbazar.cz',
    category: 'portals',
    categoryLabel: 'Inzertní portál',
    brandColor: '#DC2626',
    bgLight: 'bg-rose-500/10 text-rose-700 border-rose-200/80',
    status: 'connected',
    statusLabel: 'Aktivní synchronizace',
    tagline: 'Bezplatná inzerce na Seznamu',
    shortDesc: 'Silný regionální dosah z vyhledávání Seznam.cz. Přímý kontakt se zájemci bez transakčních srážek.',
    tags: ['0 % provize', 'Seznam.cz', 'Auto-obnova'],
    config: {
      email: 'seznam.prodej@sellin.cz',
      shopUrl: 'https://sbazar.cz/sellin-pneu',
      syncStock: true,
      autoRenew: true,
      location: 'Praha',
      zipcode: '100 00',
    },
  },

  // 3. VLASTNÍ E-SHOP (STOREFRONT)
  {
    id: 'sellin-shop',
    name: 'Vlastní E-shop (Storefront)',
    category: 'eshops',
    categoryLabel: 'Vlastní e-shop',
    brandColor: '#10B981',
    bgLight: 'bg-emerald-500/10 text-emerald-800 border-emerald-200/80',
    status: 'connected',
    statusLabel: 'Aktivní storefront',
    tagline: 'Přímý prodej se 100% marží',
    shortDesc: 'Plná marže bez zprostředkovatelských provizí. Přímý nákup přes webový košík a budování vlastní zákaznické báze.',
    tags: ['100 % marže', 'Online košík', 'Vlastní zákazníci'],
    config: {
      shopUrl: '/shop',
      syncStock: true,
      syncOrders: true,
    },
  },

  // 4. GOOGLE NÁKUPY
  {
    id: 'google-shopping',
    name: 'Google Nákupy',
    category: 'comparators',
    categoryLabel: 'Google Ads & PMax',
    brandColor: '#4285F4',
    bgLight: 'bg-sky-500/10 text-sky-700 border-sky-200/80',
    status: 'ready',
    statusLabel: 'Připraveno k napojení',
    tagline: 'Výkonnostní kampaně ve vyhledávání',
    shortDesc: 'Zobrazení produktů ve vyhledávači se štítkem used/refurbished. Cílený nákupní záměr přímo do vašeho e-shopu.',
    tags: ['Google Merchant', 'Used / Refurbished', 'PMax kampaně'],
    config: {
      feedUrl: 'https://sellin.cz/api/feeds/google-merchant.xml',
      syncStock: true,
    },
  },

  // 5. FACEBOOK MARKETPLACE
  {
    id: 'facebook',
    name: 'Facebook Marketplace',
    category: 'marketplaces',
    categoryLabel: 'Sociální inzerce',
    brandColor: '#1877F2',
    bgLight: 'bg-blue-500/10 text-blue-700 border-blue-200/80',
    status: 'ready',
    statusLabel: 'Připraveno k napojení',
    tagline: 'Lokální poptávka bez poplatků',
    shortDesc: 'Rychlý lokální odbyt bez prodejních provizí. Poptávky přímo do Messengeru a okamžitý osobní odběr.',
    tags: ['0 % provize', 'Messenger chat', 'Lokální odběr'],
    config: {
      feedUrl: 'https://sellin.cz/api/feeds/meta-catalog.xml',
      syncStock: true,
    },
  },

  // 6. AUKRO.CZ
  {
    id: 'aukro',
    name: 'Aukro.cz',
    category: 'portals',
    categoryLabel: 'Online tržiště',
    brandColor: '#FF7900',
    bgLight: 'bg-orange-500/10 text-orange-700 border-orange-200/80',
    status: 'ready',
    statusLabel: 'Připraveno k napojení',
    tagline: 'Pevné ceny i aukce s garancí',
    shortDesc: 'Vysoká důvěra kupujících a ochrana plateb. Rychlý odbyt použitého zboží formou Kup teď i aukcí.',
    tags: ['Bezpečná platba', 'Kup teď & Aukce', 'API synchronizace'],
    config: {
      apiKey: '',
      syncStock: true,
      syncOrders: true,
    },
  },

  // 7. SHOPIFY
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'eshops',
    categoryLabel: 'E-shop platforma',
    brandColor: '#008060',
    bgLight: 'bg-teal-500/10 text-teal-800 border-teal-200/80',
    status: 'ready',
    statusLabel: 'Připraveno k napojení',
    tagline: 'Globální e-commerce systém',
    shortDesc: 'Real-time synchronizace zásob a objednávek s platformou Shopify přes Admin API s podporou více měn.',
    tags: ['Admin API', 'Webhooky', 'Multi-měna'],
    config: {
      shopUrl: 'https://vas-obchod.myshopify.com',
      apiKey: '',
      syncStock: true,
      syncOrders: true,
    },
  },

  // 8. SHOPTET
  {
    id: 'shoptet',
    name: 'Shoptet',
    category: 'eshops',
    categoryLabel: 'E-shop platforma',
    brandColor: '#0284C7',
    bgLight: 'bg-sky-500/10 text-sky-700 border-sky-200/80',
    status: 'ready',
    statusLabel: 'Připraveno k napojení',
    tagline: 'Obousměrné propojení skladu',
    shortDesc: 'Prodejomat centrálně řídí zásoby a automaticky synchronizuje počty kusů i ceny do vašeho Shoptetu.',
    tags: ['Obousměrný sklad', 'API doplněk', 'Import objednávek'],
    config: {
      shopUrl: 'https://vas-obchod.myshoptet.cz',
      apiKey: '',
      syncStock: true,
      syncOrders: true,
      feedUrl: 'https://sellin.cz/api/feeds/shoptet-import.xml',
    },
  },

  // 9. ALLEGRO.CZ
  {
    id: 'allegro',
    name: 'Allegro.cz',
    category: 'marketplaces',
    categoryLabel: 'Marketplace',
    brandColor: '#FF5A00',
    bgLight: 'bg-orange-500/10 text-orange-800 border-orange-200/80',
    status: 'ready',
    statusLabel: 'Připraveno k napojení',
    tagline: 'Široký odbyt v ČR a Polsku',
    shortDesc: 'Hromadný odbyt v sekcích Outlet a Použité zboží. Program Allegro Smart zvyšuje konverzi a rychlost prodeje.',
    tags: ['CZ a PL trh', 'Allegro Smart', 'REST API'],
    config: {
      apiKey: '',
      syncStock: true,
      syncOrders: true,
    },
  },

  // 10. VINTED
  {
    id: 'vinted',
    name: 'Vinted',
    category: 'portals',
    categoryLabel: 'Second-hand bazar',
    brandColor: '#09B1BA',
    bgLight: 'bg-teal-500/10 text-teal-700 border-teal-200/80',
    status: 'ready',
    statusLabel: 'Připraveno k napojení',
    tagline: 'Second-hand prodej bez poplatků',
    shortDesc: 'Nulové poplatky pro prodejce s integrovanou zlevněnou dopravou. Platba předem garantovaná platformou.',
    tags: ['0 % prodejci', 'Integrovaná doprava', 'Platba předem'],
    config: {
      syncStock: true,
    },
  },

  // 11. EBAY MOTORS & GOODS
  {
    id: 'ebay',
    name: 'eBay Motors & Goods',
    category: 'marketplaces',
    categoryLabel: 'Globální export',
    brandColor: '#3B82F6',
    bgLight: 'bg-blue-500/10 text-blue-700 border-blue-200/80',
    status: 'ready',
    statusLabel: 'Připraveno k napojení',
    tagline: 'Export do EU za vyšší EUR ceny',
    shortDesc: 'Prodej autodílů a zboží do Německa a celé EU. Podstatně vyšší prodejní ceny kompenzují poplatky tržiště.',
    tags: ['Export v EUR', 'Trh celé EU', 'Vyšší prodejní ceny'],
    config: {
      apiKey: '',
      syncStock: true,
      syncOrders: true,
    },
  },

  // 12. KAUFLAND GLOBAL
  {
    id: 'kaufland',
    name: 'Kaufland Global',
    category: 'marketplaces',
    categoryLabel: 'Marketplace',
    brandColor: '#E10915',
    bgLight: 'bg-red-500/10 text-red-700 border-red-200/80',
    status: 'ready',
    statusLabel: 'Připraveno k napojení',
    tagline: 'Zákaznická báze v CZ, SK a DE',
    shortDesc: 'Vhodné pro outlet, repasy a nadnormativní zásoby. Automatická rezervace skladu a zajištěné platby.',
    tags: ['CZ, SK & DE', 'Katalog Kaufland', 'Zajištěné platby'],
    config: {
      apiKey: '',
      syncStock: true,
      syncOrders: true,
    },
  },

  // 13. ZBOŽÍ.CZ
  {
    id: 'zbozi',
    name: 'Zboží.cz',
    category: 'comparators',
    categoryLabel: 'Srovnávač cen',
    brandColor: '#DC2626',
    bgLight: 'bg-red-500/10 text-red-700 border-red-200/80',
    status: 'ready',
    statusLabel: 'Připraveno k napojení',
    tagline: 'PPC z vyhledávání Seznamu',
    shortDesc: 'Akvizice zákazníků ze srovnávače Seznam.cz s přímou podporou sekce bazarového a rozbaleného zboží.',
    tags: ['Seznam Nákupy', 'Bazarová sekce', 'Zboží XML'],
    config: {
      feedUrl: 'https://sellin.cz/api/feeds/zbozi.xml',
      apiKey: '',
      syncStock: true,
    },
  },

  // 14. HEUREKA.CZ / SK
  {
    id: 'heureka',
    name: 'Heureka.cz / SK',
    category: 'comparators',
    categoryLabel: 'Srovnávač cen',
    brandColor: '#2563EB',
    bgLight: 'bg-blue-500/10 text-blue-700 border-blue-200/80',
    status: 'ready',
    statusLabel: 'Připraveno k napojení',
    tagline: 'Produktový a dostupnostní srovnávač',
    shortDesc: 'Generování produktového XML a depo feedu. Efektivní pro standardizované skladové položky a autodíly.',
    tags: ['Produktový feed', 'Dostupnostní depo', 'Měření konverzí'],
    config: {
      feedUrl: 'https://sellin.cz/api/feeds/heureka.xml',
      availabilityFeedUrl: 'https://sellin.cz/api/feeds/heureka-dostupnost.xml',
      apiKey: '',
      syncStock: true,
    },
  },
];

const CATEGORIES: { id: ChannelCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'Všechny kanály', icon: '⚡' },
  { id: 'portals', label: 'Inzerce & Bazary', icon: '🏷️' },
  { id: 'marketplaces', label: 'Marketplaces & Sítě', icon: '🛍️' },
  { id: 'eshops', label: 'E-shopy & Platformy', icon: '🌐' },
  { id: 'comparators', label: 'Srovnávače cen', icon: '📊' },
];

export default function AccountsView() {
  const [channels, setChannels] = useState<ChannelItem[]>(ALL_CHANNELS);
  const [activeCategory, setActiveCategory] = useState<ChannelCategory>('all');
  const [search, setSearch] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<ChannelItem | null>(null);
  const [copiedFeed, setCopiedFeed] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  const filteredChannels = useMemo(() => {
    return channels.filter((c) => {
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
  }, [channels, activeCategory, search]);

  const stats = useMemo(() => {
    const connected = channels.filter((c) => c.status === 'connected').length;
    const total = channels.length;
    return { connected, total };
  }, [channels]);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const copyUrl = (url: string, title: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedFeed(title);
      showNotification(`URL feedu pro ${title} byla zkopírována!`);
      setTimeout(() => setCopiedFeed(null), 2500);
    }
  };

  const handleTest = () => {
    setTesting(true);
    setTestSuccess(false);
    setTimeout(() => {
      setTesting(false);
      setTestSuccess(true);
    }, 1100);
  };

  const saveConfig = (updated: ChannelItem) => {
    setChannels((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedChannel(null);
    showNotification(`Nastavení pro ${updated.name} bylo uloženo`);
  };

  return (
    <div className="pb-16">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-slate-900 bg-slate-950 px-4 py-3 text-xs font-semibold text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
            ✓
          </span>
          <span>{toast}</span>
        </div>
      )}

      {/* Top Clean Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Centrální synchronizace skladu
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {stats.connected} z {stats.total} aktivní
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
            Prodejní kanály & Integrace
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Centrální sklad propojený na prodejní kanály – od přímé inzerce přes vlastní e-shop až po tržiště a srovnávače.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/shop"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-all active:scale-95"
          >
            <span>🛍️ Vlastní E-shop</span>
            <span className="text-slate-400">↗</span>
          </Link>
          <Link
            href="/create"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-all active:scale-95"
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
                ? channels.length
                : channels.filter((c) => c.category === cat.id).length;

            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
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

        {/* Compact Search */}
        <div className="relative w-full md:w-64">
          <svg
            className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hledat kanál nebo platformu..."
            className="w-full rounded-xl border border-slate-200/90 bg-white py-1.5 pl-8 pr-8 text-xs font-medium text-slate-950 shadow-2xs outline-none focus:border-slate-400 transition-all placeholder:text-slate-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Grid of Clean, Visual Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {filteredChannels.map((channel) => {
          const isConnected = channel.status === 'connected';

          return (
            <div
              key={channel.id}
              onClick={() => {
                setTestSuccess(false);
                setSelectedChannel(channel);
              }}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:border-slate-300 hover:shadow-md transition-all duration-150 cursor-pointer"
            >
              <div>
                {/* Header Row: Logo + Status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <ChannelLogo channelId={channel.id} name={channel.name} />
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-950 leading-tight group-hover:text-blue-600 transition-colors">
                        {channel.name}
                      </h3>
                      <span className="text-[11px] font-medium text-slate-400">
                        {channel.categoryLabel}
                      </span>
                    </div>
                  </div>

                  {isConnected && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Aktivní</span>
                    </span>
                  )}
                </div>

                {/* 1-Line Tagline & Short Desc */}
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                  {channel.shortDesc}
                </p>

                {/* Visual Minimal Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {channel.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-md bg-slate-50 border border-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Action Strip */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] font-semibold text-slate-400">
                  {isConnected ? '● Synchronizováno' : 'K napojení'}
                </span>

                <button
                  type="button"
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    isConnected
                      ? 'bg-slate-100 text-slate-800 group-hover:bg-slate-900 group-hover:text-white'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-transparent'
                  }`}
                >
                  <span>{isConnected ? 'Spravovat' : '+ Napojit'}</span>
                  <span className="text-[10px]">→</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Multichannel sync info banner */}
      <div className="mt-8 rounded-2xl border border-slate-200/90 bg-linear-to-r from-slate-900 via-slate-950 to-slate-900 p-5 sm:p-6 text-white shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="rounded-md bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                MULTIKANÁLOVÁ SYNCHRONIZACE
              </span>
              <span className="text-xs text-slate-400">Automatický odpočet skladu v reálném čase</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white">
              Jeden sklad pro všechny prodejní kanály bez duplicit
            </h3>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              Položku zadáte jednou. Prodejomat ji propíše na vybrané kanály a jakmile se prodá, okamžitě ji odepíše ze skladu a stáhne z ostatních portálů.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-950 hover:bg-slate-100 transition-all shadow-xs"
            >
              <span>+ Vložit nabídku</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Clean Interactive Modal */}
      {selectedChannel && (
        <ChannelModal
          channel={selectedChannel}
          onClose={() => setSelectedChannel(null)}
          onSave={saveConfig}
          onCopy={copyUrl}
          copiedFeed={copiedFeed}
          onTest={handleTest}
          testing={testing}
          testSuccess={testSuccess}
        />
      )}
    </div>
  );
}

// Logo helper with native authentic original brand icons & SVGs
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://d790-a.sdn.cz/d_790/c_static_p8_A/kY1K2LlXQDnuVLFOMF5AcTA/6084/favicons/favicon.svg"
            alt="Sbazar"
            className="w-full h-full object-contain"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div style={{ display: 'none' }} className="w-full h-full items-center justify-center text-xs tracking-tighter">
            Sbazar
          </div>
        </div>
      );

    case 'aukro':
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0055A5] shadow-2xs overflow-hidden" title={name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://aukro.cz/assets/icon/pwa/icon-128x128.png"
            alt="Aukro"
            className="w-full h-full object-contain p-0.5"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div style={{ display: 'none' }} className="w-full h-full items-center justify-center text-[10px] font-black text-white tracking-tight">
            aukro
          </div>
        </div>
      );

    case 'vinted':
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#09B1BA] shadow-2xs p-2 text-white" title={name}>
          <svg role="img" viewBox="0 0 24 24" className="w-full h-full fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.316 0c-.258 0-.571.217-1.415.953-.3.108-.627.027-1.008.613-2.15 3.09-3.825 14.648-5.255 17.984-.286-1.444-.885-10.837-1.116-13.41-.028-.477.027-1.076.027-1.43 0-2.368-.516-3.567-2.886-3.567-1.198 0-2.382.436-3.008 1.226-.299.408-.409.708-.409 1.443 0 4.915 1.171 12.973 2.478 18.228C7.132 23.688 8.603 24 9.99 24c.654 0 1.307-.081 2.233-.544 3.212-1.567 4.07-5.84 4.9-9.993.15-.749.899-4.37 1.253-6.275.476-2.6 1.02-5.54 1.347-6.617C19.833.245 19.63 0 19.317 0z" />
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
          <svg role="img" viewBox="0 0 24 24" className="w-full h-full fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.59 7.981a.124.124 0 0 0-.122.124v5.917a.124.124 0 0 0 .124.124h.72a.124.124 0 0 0 .124-.124h-.002V8.105a.124.124 0 0 0-.124-.124Zm1.691 0a.124.124 0 0 0-.124.124v5.917a.124.124 0 0 0 .124.124h.72a.124.124 0 0 0 .123-.124V8.105a.124.124 0 0 0-.122-.124Zm12.667 1.776a1.868 1.868 0 0 0-1.317.532 1.674 1.674 0 0 0-.531 1.254v2.48a.124.124 0 0 0 .123.123h.72a.124.124 0 0 0 .124-.124v-2.427c0-.752.5-1.113 1.314-.946a.13.13 0 0 0 .168-.142v-.495c0-.13-.014-.18-.1-.208a2.794 2.794 0 0 0-.501-.047Zm-4.626 0a2.193 2.193 0 0 0-1.732.849 2.355 2.355 0 0 0 0 2.678 2.13 2.131 0 0 0 1.732.849 2.21 2.21 0 0 0 1.234-.372v.53c0 .717-.627.848-1.03.873a4.73 4.73 0 0 1-.826-.045c-.11-.017-.188 0-.188.119v.636a.109.109 0 0 0 .114.103c.933.08 1.56.064 2.032-.206a1.537 1.537 0 0 0 .69-.875 2.928 2.928 0 0 0 .117-.874v-2.077h.002a2.245 2.245 0 0 0-.412-1.34 2.193 2.193 0 0 0-1.733-.848Zm-12.255.002a2.903 2.903 0 0 0-1.465.39.092.092 0 0 0-.045.08l.038.63a.112.112 0 0 0 .185.065c.627-.387 1.38-.459 1.764-.265a.67.67 0 0 1 .335.605v.092H1.832c-.45 0-1.83.167-1.83 1.434v.014a1.229 1.229 0 0 0 .45 1.017 1.768 1.768 0 0 0 1.118.32h2.118a.124.124 0 0 0 .124-.125v-2.51l-.002.004c0-.57-.127-1.004-.402-1.303-.274-.3-.827-.45-1.34-.45zm7.707 0c-1.28 0-1.84.858-2.02 1.585a2.44 2.44 0 0 0-.074.6 2.277 2.277 0 0 0 .412 1.338 2.198 2.198 0 0 0 1.733.85c.691.024 1.153-.093 1.506-.294a.196.196 0 0 0 .084-.212v-.558c0-.114-.069-.167-.167-.098a2.185 2.185 0 0 1-1.393.334 1.14 1.14 0 0 1-1.118-1.016h2.845a.117.117 0 0 0 .117-.116c.05-.778-.175-2.413-1.925-2.413Zm12.08 0a2.193 2.193 0 0 0-1.731.848 2.275 2.275 0 0 0-.412 1.34 2.275 2.275 0 0 0 .412 1.339 2.193 2.193 0 0 0 3.465 0 2.277 2.277 0 0 0 .412-1.34 2.277 2.277 0 0 0-.412-1.339 2.193 2.193 0 0 0-1.733-.848Zm-7.532.833c1.157 0 1.196 1.18 1.196 1.351 0 .171-.039 1.351-1.196 1.351-.517 0-.89-.378-1.047-.849a1.552 1.552 0 0 1 0-1.004c.157-.47.53-.849 1.047-.849zm-4.546.004a.86.86 0 0 1 .91.922H8.754a.968.968 0 0 1 1.024-.922zm12.078 0c.515-.012.89.378 1.048.848a1.553 1.553 0 0 1 0 1.003v.002c-.158.47-.531.837-1.048.848-.518.012-.89-.378-1.047-.848a1.552 1.552 0 0 1 0-1.005c.158-.47.53-.837 1.047-.848zM1.89 12.121h.99v1.246H1.63a.773.773 0 0 1-.444-.156.492.492 0 0 1-.21-.412c0-.226.153-.678.914-.678z" />
          </svg>
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
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E10915] shadow-2xs p-2 text-white" title={name}>
          <svg role="img" viewBox="0 0 24 24" className="w-full h-full fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 24h24V0H0zm23.008-.989H.989V.989h22.022zM3.773 3.776h7.651v7.65H3.773zm8.801 0v7.652l7.653-7.652zm-8.801 8.8h7.651v7.651H3.773zm8.801-.004v7.652h7.653z" />
          </svg>
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

    case 'zbozi':
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200/90 shadow-2xs p-1.5" title={name}>
          <svg viewBox="0 0 30 24" className="w-full h-full" fill="none">
            <path
              d="M27.1787879,7.83460811 C23.3078788,9.77468919 13.2190909,12.8936757 11.8672727,13.3611351 C10.9842424,13.6660405 8.06969697,14.7168919 7.91424242,15.8258649 C7.69787879,17.3671757 11.1293939,17.7566216 13.1157576,17.9965676 C14.4548485,18.1585 17.7239394,18.5209054 20.6939394,18.360527 C23.5830303,18.2045 27.6272727,17.5825676 27.7145455,18.2302973 C27.8157576,18.9843243 22.7809091,20.8031892 20.7445455,21.2852568 C19.0081818,21.6961486 13.6330303,22.5362703 10.0527273,22.4498649 C7.07484848,22.3783784 2.24787879,21.9864459 0.511212121,19.0729054 C-0.0945454545,18.0565541 -0.0945454545,16.0235405 0.475454545,15.1399054 C1.10757576,14.1602297 1.79666667,13.183973 3.32787879,12.5092027 C6.24606061,11.2230676 19.5048485,6.27589189 19.9057576,6.1897973 C20.7930303,5.99771622 21.960303,5.42333784 19.6254545,5.23218919 C17.7784848,5.0802027 15.9260606,4.9822973 14.0727273,4.98291892 C13.1857576,4.98354054 12.3009091,5.01555405 11.4154545,5.06062162 C10.7036364,5.0972973 9.88424242,5.17095946 9.33121212,4.61087838 C8.83939394,4.11358108 8.44333333,3.14354054 8.33181818,2.45012162 C8.2269697,1.80083784 8.46,1.25443243 8.97606061,0.868716216 C10.0772727,0.0469324324 11.7942424,0.143283784 13.0827273,0.174364865 C13.7672727,0.190837838 17.69,0.501027027 18.970303,0.607324324 C22.3409091,0.887054054 27.1012121,1.51427027 28.5536364,4.97918919 C29.3509091,6.88166216 27.1787879,7.83460811 27.1787879,7.83460811"
              fill="#DC1F27"
            />
          </svg>
        </div>
      );

    case 'heureka':
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200/90 shadow-2xs p-1" title={name}>
          <svg viewBox="0 0 32 32" className="w-full h-full" fill="none">
            <rect width="32" height="32" rx="7" fill="#0096FF" />
            <path d="M7 8h4v6h6V8h4v16h-4v-6h-6v6H7V8z" fill="#ffffff" />
            <circle cx="26" cy="10" r="2.2" fill="#FF660A" />
            <rect x="24.8" y="14" width="2.4" height="10" rx="1.2" fill="#FF660A" />
          </svg>
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

    default:
      return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 font-black text-white text-base shadow-2xs" title={name}>
          🔗
        </div>
      );
  }
}

// Modal Component for Channel Details & Settings
interface ModalProps {
  channel: ChannelItem;
  onClose: () => void;
  onSave: (channel: ChannelItem) => void;
  onCopy: (url: string, label: string) => void;
  copiedFeed: string | null;
  onTest: () => void;
  testing: boolean;
  testSuccess: boolean;
}

function ChannelModal({
  channel,
  onClose,
  onSave,
  onCopy,
  copiedFeed,
  onTest,
  testing,
  testSuccess,
}: ModalProps) {
  const [data, setData] = useState<ChannelItem>({ ...channel });

  const updateConfig = (key: string, val: unknown) => {
    setData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: val,
      },
    }));
  };

  const toggleStatus = () => {
    setData((prev) => ({
      ...prev,
      status: prev.status === 'connected' ? 'ready' : 'connected',
    }));
  };

  const isConnected = data.status === 'connected';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200/90 bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <ChannelLogo channelId={data.id} name={data.name} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-950 leading-tight">{data.name}</h3>
                {isConnected && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>Aktivní</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{data.tagline}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 text-xs">
          {/* Status Toggle Box */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5">
            <div>
              <p className="font-bold text-slate-900">Stav synchronizace kanálu</p>
              <p className="text-[11px] text-slate-500">
                {isConnected
                  ? 'Kanál je aktivní. Nabídky se automaticky přenáší ze skladu.'
                  : 'Kanál není aktivně propojený. Nastavte údaje a aktivujte.'}
              </p>
            </div>

            <button
              type="button"
              onClick={toggleStatus}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-2xs ${
                isConnected
                  ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-slate-950 text-white hover:bg-slate-800'
              }`}
            >
              {isConnected ? '✓ Aktivní' : '+ Aktivovat'}
            </button>
          </div>

          {/* Form Fields Depending on Channel Type */}
          {(data.category === 'portals' || data.id === 'facebook') && (
            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                Přihlašovací údaje pro inzerci
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Přihlašovací e-mail
                  </label>
                  <input
                    type="email"
                    value={data.config.email || ''}
                    onChange={(e) => updateConfig('email', e.target.value)}
                    placeholder="vas@email.cz"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-slate-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Telefon pro SMS autorizaci
                  </label>
                  <input
                    type="tel"
                    value={data.config.phone || ''}
                    onChange={(e) => updateConfig('phone', e.target.value)}
                    placeholder="+420 777 000 111"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-slate-400 outline-none"
                  />
                </div>

                {data.id === 'bazos' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Ověřovací B-kód (rychlé vystavení)
                    </label>
                    <input
                      type="text"
                      value={data.config.bkod || ''}
                      onChange={(e) => updateConfig('bkod', e.target.value)}
                      placeholder="B-84920"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs font-medium text-slate-950 focus:border-slate-400 outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Výchozí lokalita & PSČ
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={data.config.location || ''}
                      onChange={(e) => updateConfig('location', e.target.value)}
                      placeholder="Praha"
                      className="w-2/3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-slate-400 outline-none"
                    />
                    <input
                      type="text"
                      value={data.config.zipcode || ''}
                      onChange={(e) => updateConfig('zipcode', e.target.value)}
                      placeholder="100 00"
                      className="w-1/3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-slate-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Switches */}
              <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-3 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-semibold text-slate-800">
                    Automatické prodlužování před expirací (60 dní)
                  </span>
                  <input
                    type="checkbox"
                    checked={data.config.autoRenew ?? true}
                    onChange={(e) => updateConfig('autoRenew', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-950"
                  />
                </label>

                {data.id === 'bazos' && (
                  <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200/60">
                    <span className="font-semibold text-slate-800">
                      Automatické TOPování nejlepších nabídek
                    </span>
                    <input
                      type="checkbox"
                      checked={data.config.autoTop ?? true}
                      onChange={(e) => updateConfig('autoTop', e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-950"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* E-shop / Marketplace API Keys */}
          {(data.category === 'eshops' ||
            data.id === 'allegro' ||
            data.id === 'ebay' ||
            data.id === 'aukro' ||
            data.id === 'kaufland') &&
            data.id !== 'sellin-shop' && (
              <div className="space-y-3">
                <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                  API Napojení & Token
                </h4>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">URL obchodu / profilu</label>
                  <input
                    type="url"
                    value={data.config.shopUrl || ''}
                    onChange={(e) => updateConfig('shopUrl', e.target.value)}
                    placeholder="https://muj-obchod.cz"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-slate-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    API Klíč / Access Token
                  </label>
                  <input
                    type="password"
                    value={data.config.apiKey || ''}
                    onChange={(e) => updateConfig('apiKey', e.target.value)}
                    placeholder="Vložte tajný API klíč z administrace..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs font-medium text-slate-950 focus:border-slate-400 outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    disabled={testing}
                    onClick={onTest}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-100 transition-all shadow-2xs"
                  >
                    {testing ? 'Testuji spojení…' : '🔌 Otestovat API spojení'}
                  </button>

                  {testSuccess && (
                    <span className="font-bold text-emerald-700">✓ Spojení navázáno (HTTP 200 OK)</span>
                  )}
                </div>
              </div>
            )}

          {/* Vlastní E-shop Special Box */}
          {data.id === 'sellin-shop' && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-950 text-sm">Váš veřejný Storefront</span>
                  <p className="text-emerald-800/80 text-[11px]">
                    Prodej bez provizí zprostředkovatelům (100 % marže pro vás).
                  </p>
                </div>
                <Link
                  href="/shop"
                  target="_blank"
                  className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 transition-all shadow-2xs"
                >
                  Přejít do e-shopu ↗
                </Link>
              </div>

              <div className="pt-2 border-t border-emerald-200/80 text-emerald-900 space-y-1">
                <div className="flex justify-between font-mono text-[11px]">
                  <span>Adresa:</span>
                  <span className="font-bold">https://prodejomat.cz/shop</span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span>Provize platformě:</span>
                  <span className="font-bold text-emerald-700">0 %</span>
                </div>
              </div>
            </div>
          )}

          {/* XML Feeds (Zboží, Heureka, Google, Meta) */}
          {data.config.feedUrl && (
            <div className="space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                Exportní XML Feed
              </h4>

              <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">URL Feed</span>
                  <button
                    type="button"
                    onClick={() => onCopy(data.config.feedUrl!, data.name)}
                    className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-2xs transition-all active:scale-95"
                  >
                    <span>{copiedFeed === data.name ? '✓ Zkopírováno' : '📋 Kopírovat feed'}</span>
                  </button>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-2 font-mono text-[10px] text-slate-700 break-all select-all">
                  {data.config.feedUrl}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
          >
            Zavřít
          </button>

          <button
            type="button"
            onClick={() => onSave(data)}
            className="rounded-xl bg-slate-950 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-xs"
          >
            Uložit konfiguraci
          </button>
        </div>
      </div>
    </div>
  );
}
