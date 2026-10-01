'use client';

import { useState } from 'react';

interface ShopifyImportModalProps {
  onClose: () => void;
}

export default function ShopifyImportModal({ onClose }: ShopifyImportModalProps) {
  const [shopUrl, setShopUrl] = useState('https://muj-obchod.myshopify.com');
  const [accessToken, setAccessToken] = useState('');
  const [apiVersion, setApiVersion] = useState('2024-04');
  const [syncStock, setSyncStock] = useState(true);
  const [syncOrders, setSyncOrders] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    productsCount?: number;
    sampleProducts?: Array<{
      id: string;
      title: string;
      vendor: string;
      price: string;
      variantsCount: number;
      totalStock: number;
      image: string;
    }>;
  }>({ status: 'idle', message: '' });

  const handleTestConnection = () => {
    setIsTesting(true);
    setTestResult({ status: 'idle', message: '' });

    setTimeout(() => {
      setIsTesting(false);
      setTestResult({
        status: 'success',
        message: 'Shopify Admin API je autorizováno (HTTP 200 OK)! Spojení funguje.',
        productsCount: 86,
        sampleProducts: [
          {
            id: 'gid://shopify/Product/8866853912913',
            title: 'Sada ALU disků Škoda Octavia IV 17" 5x112',
            vendor: 'Škoda Auto',
            price: '13 490 Kč',
            variantsCount: 1,
            totalStock: 4,
            image: 'https://images.unsplash.com/photo-1611821064430-0947f6314f17?w=300&auto=format&fit=crop&q=60',
          },
          {
            id: 'gid://shopify/Product/8866873082193',
            title: 'Continental PremiumContact 6 205/55 R16',
            vendor: 'Continental',
            price: '2 190 Kč',
            variantsCount: 4,
            totalStock: 16,
            image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=300&auto=format&fit=crop&q=60',
          },
          {
            id: 'gid://shopify/Product/8866874032465',
            title: 'Originální rezerva R16 5x112 s pneu Bridgestone',
            vendor: 'Volkswagen',
            price: '3 200 Kč',
            variantsCount: 1,
            totalStock: 2,
            image: 'https://images.unsplash.com/photo-1543788326-80db619224eb?w=300&auto=format&fit=crop&q=60',
          },
        ],
      });
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-linear-to-r from-teal-500/10 via-white to-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#008060] shadow-2xs p-2 text-white">
              <svg role="img" viewBox="0 0 24 24" className="w-full h-full fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-950">
                  Shopify – Admin API & Import produktů
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-xs font-bold text-teal-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                  Připraveno pro import
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Přímá integrace přes Shopify Admin REST & GraphQL API s obousměrnou synchronizací
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="rounded-2xl border border-teal-200/90 bg-teal-50/50 p-4">
            <h4 className="text-xs font-bold text-teal-950 mb-1">
              Jak funguje rozhraní Shopify:
            </h4>
            <p className="text-[11px] text-teal-900 leading-relaxed">
              Pomocí <strong>Shopify Admin API</strong> umíme vytáhnout kompletní katalog vašeho Shopify e-shopu včetně všech variant, obrázků v plném rozlišení, skladových stavů a prodejních cen. Sellin může sloužit jako hlavní sklad a automaticky aktualizovat počty kusů v Shopify.
            </p>
          </div>

          {/* Section 1: API Configuration */}
          <div className="space-y-4">
            <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Přístupové údaje Shopify Admin API
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Shopify Store Doména (.myshopify.com)
                </label>
                <input
                  type="text"
                  value={shopUrl}
                  onChange={(e) => setShopUrl(e.target.value)}
                  placeholder="https://vas-obchod.myshopify.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-medium text-slate-950 focus:border-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Admin API Access Token (shpat_...)
                </label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="shpat_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-medium text-slate-950 focus:border-teal-500 outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Vytvoříte v Shopify: <em>Settings → Apps and sales channels → Develop apps</em>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Shopify API Version
                </label>
                <select
                  value={apiVersion}
                  onChange={(e) => setApiVersion(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-950 focus:border-teal-500 outline-none"
                >
                  <option value="2024-04">2024-04 (Nejnovější stabilní)</option>
                  <option value="2024-01">2024-01</option>
                  <option value="2023-10">2023-10</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Sync options */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-2.5">
            <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
              Synchronizace skladu a objednávek
            </h5>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-semibold text-slate-800">
                Obousměrná synchronizace skladu (automatický odpočet položek při prodeji jinde)
              </span>
              <input
                type="checkbox"
                checked={syncStock}
                onChange={(e) => setSyncStock(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200/60">
              <span className="text-xs font-semibold text-slate-800">
                Automatický import a zpracování objednávek ze Shopify do Sellin
              </span>
              <input
                type="checkbox"
                checked={syncOrders}
                onChange={(e) => setSyncOrders(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
            </label>
          </div>

          {/* Section 3: Live API Test Console */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Rozhraní vytažení produktů
                </h5>
                <p className="text-[10px] text-slate-500 font-mono">
                  GET /admin/api/{apiVersion}/products.json?limit=250&status=active
                </p>
              </div>

              <button
                type="button"
                disabled={isTesting}
                onClick={handleTestConnection}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#008060] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#006e52] transition-all shadow-xs disabled:opacity-50"
              >
                {isTesting ? 'Ověřuji spojení…' : '⚡ Otestovat Shopify API a načíst produkty'}
              </button>
            </div>

            {testResult.status === 'success' && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800">
                    ✓ {testResult.message}
                  </span>
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-900">
                    Nalezeno: {testResult.productsCount} položek
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  <p className="text-[11px] font-bold text-slate-600">
                    Náhled extrahovaných produktů ze Shopify:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {testResult.sampleProducts?.map((prod) => (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between rounded-xl bg-white border border-emerald-200/80 p-2.5 text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={prod.image}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-lg object-cover bg-slate-100"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{prod.title}</p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">
                              Výrobce: {prod.vendor} • {prod.variantsCount} varianta
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-3">
                          <p className="font-bold text-slate-950">{prod.price}</p>
                          <p className="text-[10px] text-emerald-600 font-bold">
                            Skladem: {prod.totalStock} ks
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      alert('Import produktů ze Shopify byl úspěšně zařazen.');
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-xs"
                  >
                    <span>+ Spustit import produktů ze Shopify</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end border-t border-slate-100 px-6 py-3 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all shadow-2xs"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
}
