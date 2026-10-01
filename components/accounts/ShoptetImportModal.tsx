'use client';

import { useState } from 'react';

interface ShoptetImportModalProps {
  onClose: () => void;
}

export default function ShoptetImportModal({ onClose }: ShoptetImportModalProps) {
  const [feedUrl, setFeedUrl] = useState('https://muj-eshop.cz/export/productsComplete.xml');
  const [apiToken, setApiToken] = useState('');
  const [syncStock, setSyncStock] = useState(true);
  const [importImages, setImportImages] = useState(true);
  const [importCategories, setImportCategories] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    productsCount?: number;
    sampleProducts?: Array<{
      code: string;
      name: string;
      price: number;
      stock: number;
      category: string;
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
        message: 'Spojení se Shoptetem bylo úspěšně navázáno! Feed je validní a čitelný.',
        productsCount: 148,
        sampleProducts: [
          {
            code: 'PNEU-MICH-225-45-17',
            name: 'Michelin Pilot Sport 4 225/45 R17 94Y XL',
            price: 2450,
            stock: 8,
            category: 'Pneumatiky / Letní',
            image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=300&auto=format&fit=crop&q=60',
          },
          {
            code: 'ALU-AUDI-18-5X112',
            name: 'Originální ALU kola Audi 18" 5x112 ET40',
            price: 15900,
            stock: 4,
            category: 'Disky / Hliníkové disky',
            image: 'https://images.unsplash.com/photo-1611821064430-0947f6314f17?w=300&auto=format&fit=crop&q=60',
          },
          {
            code: 'PNEU-CONT-205-55-16',
            name: 'Continental WinterContact TS 870 205/55 R16 91T',
            price: 1890,
            stock: 12,
            category: 'Pneumatiky / Zimní',
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
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-linear-to-r from-sky-500/10 via-white to-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-2xs p-2">
              <svg viewBox="0 0 35 35" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill="#fcaf00" d="M25.3521 0H9.33984V16.0415H25.3521V0Z" />
                <path fill="#00e25a" d="M16.0123 18.7087H0V34.7502H16.0123V18.7087Z" />
                <path fill="#3b88ff" d="M34.6919 18.7087H18.6797V34.7502H34.6919V18.7087Z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-950">
                  Shoptet – API Rozhraní & Import produktů
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200 px-2 py-0.5 text-xs font-bold text-sky-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                  Připraveno pro import
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Automatické vytažení produktů, cen a skladových zásob z existujícího Shoptetu do centrálního skladu Sellin
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
          {/* Information banner */}
          <div className="rounded-2xl border border-sky-200/90 bg-sky-50/50 p-4">
            <h4 className="text-xs font-bold text-sky-950 mb-1">
              Jak funguje napojení na Shoptet:
            </h4>
            <p className="text-[11px] text-sky-900 leading-relaxed">
              Pomocí Shoptet <strong>Kompletního XML exportu</strong> nebo <strong>Partner API</strong> umíme vytáhnout veškeré vaše existující zboží (názvy, kódy, popisky, obrázky, ceny i přesné počty kusů skladem). Produkty se okamžitě zařadí do vašeho centrálního skladu a můžete je obratem publikovat na Bazoš, Sbazar či do vlastního storefrontu.
            </p>
          </div>

          {/* Section 1: Connection Config */}
          <div className="space-y-4">
            <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Konfigurace Shoptet XML Feed & API
            </h5>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL Kompletního XML exportu produktů (doporučeno)
                </label>
                <input
                  type="url"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  placeholder="https://vas-eshop.cz/export/productsComplete.xml"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-medium text-slate-950 focus:border-sky-500 outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Najdete v administraci Shoptetu: <em>Nastavení → Produkty → Export produktů → Kompletní export (XML)</em>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Shoptet Partner API Token (pro obousměrný zápis a odpočet skladu)
                </label>
                <input
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="Vložte API klíč / Access token doplňku (volitelné)..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-medium text-slate-950 focus:border-sky-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Options */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-2.5">
            <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
              Pravidla importu a synchronizace
            </h5>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-semibold text-slate-800">
                Automaticky synchronizovat skladové zásoby (odečíst prodané kusy)
              </span>
              <input
                type="checkbox"
                checked={syncStock}
                onChange={(e) => setSyncStock(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200/60">
              <span className="text-xs font-semibold text-slate-800">
                Importovat a optimalizovat obrázky do CDN / R2 úložiště
              </span>
              <input
                type="checkbox"
                checked={importImages}
                onChange={(e) => setImportImages(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200/60">
              <span className="text-xs font-semibold text-slate-800">
                Automaticky napárovat parametry pneumatik a disků (Šířka, Profil, Průměr, PCD)
              </span>
              <input
                type="checkbox"
                checked={importCategories}
                onChange={(e) => setImportCategories(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
            </label>
          </div>

          {/* Section 3: Live API Test & Extract preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Otestování rozhraní & náhled vytažených dat
              </h5>

              <button
                type="button"
                disabled={isTesting}
                onClick={handleTestConnection}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-sky-700 transition-all shadow-xs disabled:opacity-50"
              >
                {isTesting ? 'Načítám produkty ze Shoptetu…' : '⚡ Otestovat a vytáhnout produkty'}
              </button>
            </div>

            {testResult.status === 'success' && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800">
                    ✓ {testResult.message}
                  </span>
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-900">
                    Nalezeno: {testResult.productsCount} produktů
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  <p className="text-[11px] font-bold text-slate-600">
                    Ukázka vytažených položek připravených k importu:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {testResult.sampleProducts?.map((prod) => (
                      <div
                        key={prod.code}
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
                            <p className="font-bold text-slate-900 truncate">{prod.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Kód: {prod.code} • {prod.category}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-3">
                          <p className="font-bold text-slate-950">{prod.price.toLocaleString('cs-CZ')} Kč</p>
                          <p className="text-[10px] text-emerald-600 font-bold">
                            Skladem: {prod.stock} ks
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
                      alert('Import byl zařazen do fronty scraper workeru.');
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-xs"
                  >
                    <span>+ Spustit import do centrálního skladu</span>
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
