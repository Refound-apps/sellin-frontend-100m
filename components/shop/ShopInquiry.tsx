'use client';

import { useState } from 'react';
import { SHOP_PHONE, SHOP_PHONE_HREF, SHOP_EMAIL } from './shopConfig';

export default function ShopInquiry() {
  const [sizeInput, setSizeInput] = useState('');
  const [contactInput, setContactInput] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sizeInput || !contactInput) return;
    setSent(true);
  };

  return (
    <section id="poptavka" className="scroll-mt-20 sm:scroll-mt-24 border-b border-[hsl(214_32%_91%)] bg-gradient-to-b from-white to-[hsl(210_40%_98%)] py-10 sm:py-18">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-3xl border border-[hsl(214_32%_88%)] bg-white p-5 sm:p-10 shadow-2xs">
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 md:items-center">
            <div>
              <span className="inline-block rounded-md bg-[hsl(142_71%_45%/0.12)] px-2.5 py-1 text-xs font-semibold text-[hsl(142_71%_35%)]">
                Poptávka rozměru
              </span>
              <h2 className="mt-2.5 sm:mt-3 text-xl font-bold tracking-tight text-[hsl(222_47%_11%)] sm:text-3xl">
                Nenašli jste svůj rozměr?
              </h2>
              <p className="mt-2.5 sm:mt-3 text-xs sm:text-base leading-relaxed text-[hsl(215_16%_47%)]">
                Skladové zásoby se nám mění každý týden a řada sad teprve čeká na nafocení. Napište nám, co sháníte, nebo nám přímo zavolejte.
              </p>

              <div className="mt-4 sm:mt-6 flex flex-col gap-2 text-xs sm:text-sm text-[hsl(222_20%_28%)]">
                <div className="flex items-center gap-2">
                  <span className="text-[hsl(142_71%_45%)] font-bold">✓</span>
                  <span>Ověříme skladové zásoby do 24 hodin</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[hsl(142_71%_45%)] font-bold">✓</span>
                  <span>Doporučíme vhodnou alternativu s odpovídajícím indexem</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[hsl(214_32%_91%)] bg-[hsl(210_40%_98%/0.6)] p-4 sm:p-6">
              {sent ? (
                <div className="py-6 sm:py-8 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(142_71%_45%/0.15)] text-[hsl(142_71%_35%)]">
                    ✓
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[hsl(222_47%_11%)]">
                    Poptávka odeslána
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[hsl(215_16%_47%)]">
                    Děkujeme. Ozveme se vám zpět s dostupnými možnostmi. Pokud spěcháte, zavolejte nám.
                  </p>
                  <a
                    href={`tel:${SHOP_PHONE_HREF}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[hsl(142_71%_35%)] hover:underline"
                  >
                    <span>Zavolat {SHOP_PHONE}</span>
                  </a>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <label htmlFor="dimension-input" className="block text-xs font-semibold text-[hsl(222_47%_11%)]">
                      Požadovaný rozměr nebo auto
                    </label>
                    <input
                      id="dimension-input"
                      type="text"
                      required
                      value={sizeInput}
                      onChange={(e) => setSizeInput(e.target.value)}
                      placeholder="např. 205/55 R16 zimní Škoda Octavia"
                      className="mt-1 w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-base sm:text-sm text-[hsl(222_47%_11%)] shadow-2xs outline-none ring-1 ring-[hsl(214_32%_88%)] placeholder:text-[hsl(215_16%_60%)] focus:ring-2 focus:ring-[hsl(142_71%_45%)]"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-input" className="block text-xs font-semibold text-[hsl(222_47%_11%)]">
                      Váš telefon nebo e-mail
                    </label>
                    <input
                      id="contact-input"
                      type="text"
                      required
                      value={contactInput}
                      onChange={(e) => setContactInput(e.target.value)}
                      placeholder="+420 ... nebo email@seznam.cz"
                      className="mt-1 w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-base sm:text-sm text-[hsl(222_47%_11%)] shadow-2xs outline-none ring-1 ring-[hsl(214_32%_88%)] placeholder:text-[hsl(215_16%_60%)] focus:ring-2 focus:ring-[hsl(142_71%_45%)]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-[hsl(142_71%_45%)] py-3 text-xs sm:text-sm font-semibold text-white shadow-2xs transition-colors hover:bg-[hsl(142_71%_35%)] active:scale-98"
                  >
                    Nezávazně poptat rozměr
                  </button>

                  <p className="text-center text-[11px] text-[hsl(215_16%_55%)]">
                    Nebo rovnou volejte na{' '}
                    <a href={`tel:${SHOP_PHONE_HREF}`} className="font-semibold text-[hsl(222_47%_11%)] hover:underline">
                      {SHOP_PHONE}
                    </a>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
