'use client';

import { useState } from 'react';
import { ChannelItem } from '../AccountsView';

interface ComingSoonModalProps {
  channel: ChannelItem;
  userEmail: string;
  onClose: () => void;
}

export default function ComingSoonModal({ channel, userEmail, onClose }: ComingSoonModalProps) {
  const [email, setEmail] = useState(userEmail || '');
  const [subscribed, setSubscribed] = useState(false);

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-2xs p-2">
              <span className="text-xl">⏳</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-950">{channel.name}</h3>
                <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  Připravujeme
                </span>
              </div>
              <p className="text-xs text-slate-500">{channel.categoryLabel}</p>
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
        <div className="p-6 space-y-5">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-900">
              Tento kanál je momentálně ve vývoji
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Integraci pro <strong>{channel.name}</strong> právě připravujeme. V této verzi se soustředíme na 100% spolehlivost klíčových kanálů.
            </p>
          </div>

          {/* Active channels summary */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-slate-700">
              Aktuálně plně podporované kanály:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 rounded-xl border border-amber-200/70 bg-amber-50/50 p-2.5">
                <span className="text-amber-600 font-bold">✓</span>
                <div>
                  <p className="font-bold text-slate-900">Bazoš.cz / SK</p>
                  <p className="text-[10px] text-slate-500">Inzerce, subúčty, B-kódy</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-rose-200/70 bg-rose-50/50 p-2.5">
                <span className="text-rose-600 font-bold">✓</span>
                <div>
                  <p className="font-bold text-slate-900">Sbazar.cz</p>
                  <p className="text-[10px] text-slate-500">Seznam účty, sync skladu</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-2.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <div>
                  <p className="font-bold text-slate-900">Vlastní E-shop</p>
                  <p className="text-[10px] text-slate-500">Storefront s vlastní doménou</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-sky-200/70 bg-sky-50/50 p-2.5">
                <span className="text-sky-600 font-bold">✓</span>
                <div>
                  <p className="font-bold text-slate-900">Shoptet & Shopify</p>
                  <p className="text-[10px] text-slate-500">API vytažení produktů</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notification signup */}
          <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
            {subscribed ? (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                  ✓
                </span>
                <span>Děkujeme! Jakmile integraci {channel.name} spustíme, dáme vám ihned vědět.</span>
              </div>
            ) : (
              <form onSubmit={handleNotify} className="space-y-2">
                <label className="block text-xs font-bold text-slate-900">
                  Chcete upozornit při spuštění integrace {channel.name}?
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vas@email.cz"
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-400 outline-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs"
                  >
                    Upozornit mě
                  </button>
                </div>
              </form>
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
            Rozumím
          </button>
        </div>
      </div>
    </div>
  );
}
