'use client';

import { useState } from 'react';
import Link from 'next/link';
import ShopHeader from '@/components/shop/ShopHeader';
import ShopFooter from '@/components/shop/ShopFooter';
import { useShop } from '@/components/shop/ShopContext';

export default function KontaktPage() {
  const [formSent, setFormSent] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const {
    shopName,
    addressLine,
    addressCity,
    region,
    hours,
    email: shopEmail,
    phone: shopPhone,
    phoneHref: shopPhoneHref,
    ownerName,
    ico,
    googleMapsLink,
    mapLink,
  } = useShop();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setFormSent(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <ShopHeader />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-[hsl(215_16%_47%)]">
          <Link href="/shop" className="hover:text-[hsl(222_47%_11%)]">
            E-shop
          </Link>
          <span>/</span>
          <span className="font-medium text-[hsl(222_47%_11%)]">Kontakt</span>
        </nav>

        {/* Page Header */}
        <div className="border-b border-[hsl(214_32%_91%)] pb-8">
          <span className="inline-block rounded-md bg-[hsl(142_71%_45%/0.12)] px-2.5 py-1 text-xs font-semibold text-[hsl(142_71%_35%)]">
            Kde nás najdete
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[hsl(222_47%_11%)] sm:text-4xl">
            Kontakt & Odběrné místo
          </h1>
          <p className="mt-3 text-base sm:text-lg text-[hsl(215_16%_47%)]">
            Rádi vás uvítáme v naší provozovně (Plzeň Jih). Před příjezdem prosíme o krátké zavolání pro ověření dostupnosti na dílně.
          </p>
        </div>

        {/* Contact Grid */}
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {/* Left Column: Contact Details */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-[hsl(214_32%_91%)] bg-[hsl(210_40%_98%/0.6)] p-6">
              <h2 className="text-lg font-bold text-[hsl(222_47%_11%)]">
                Přímý kontakt
              </h2>
              <dl className="mt-4 space-y-3.5 text-sm">
                <div>
                  <dt className="text-xs text-[hsl(215_16%_47%)]">Telefon (nejrychlejší domluva)</dt>
                  <dd>
                    <a
                      href={`tel:${shopPhoneHref}`}
                      className="text-xl font-bold text-[hsl(142_71%_35%)] hover:underline"
                    >
                      +420 {shopPhone}
                    </a>
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-[hsl(215_16%_47%)]">E-mail</dt>
                  <dd>
                    <a
                      href={`mailto:${shopEmail}`}
                      className="font-medium text-[hsl(222_47%_11%)] hover:text-[hsl(142_71%_35%)]"
                    >
                      {shopEmail}
                    </a>
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-[hsl(215_16%_47%)]">Adresa provozovny</dt>
                  <dd className="font-medium text-[hsl(222_47%_11%)]">
                    {addressLine}<br />
                    {addressCity}<br />
                    <span className="text-xs text-[hsl(215_16%_47%)]">Plzeň Jih (pár minut autem z Plzně)</span>
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-[hsl(215_16%_47%)]">Otevírací doba</dt>
                  <dd className="font-medium text-[hsl(222_47%_11%)]">
                    {hours}
                  </dd>
                </div>

                <div className="border-t border-[hsl(214_32%_91%)] pt-3">
                  <dt className="text-xs text-[hsl(215_16%_47%)]">Fakturační údaje</dt>
                  <dd className="text-xs text-[hsl(215_16%_47%)] mt-0.5">
                    {ownerName} · IČO: {ico}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <a
                  href={googleMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[hsl(222_47%_11%)] px-4 py-2 text-xs font-semibold text-white hover:bg-[hsl(222_47%_18%)]"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Google Mapy</span>
                </a>
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[hsl(214_32%_91%)] bg-white px-4 py-2 text-xs font-semibold text-[hsl(222_47%_11%)] hover:bg-[hsl(210_40%_96%)]"
                >
                  <span>Mapy.cz</span>
                </a>
              </div>
            </div>

            {/* How to get there */}
            <div className="rounded-2xl border border-[hsl(214_32%_91%)] bg-white p-6">
              <h3 className="text-base font-bold text-[hsl(222_47%_11%)]">
                Kudy k nám z Plzně?
              </h3>
              <p className="mt-2 text-sm text-[hsl(215_16%_47%)] leading-relaxed">
                Z Plzně vyjedete na jih (směr Plzeň Jih). Naše dílna a sklad jsou snadno dostupné za pár minut jízdy s bezproblémovým parkováním přímo před vjezdem.
              </p>
            </div>
          </div>

          {/* Right Column: Contact & Question Form */}
          <div className="rounded-2xl border border-[hsl(214_32%_91%)] bg-white p-5 sm:p-7 shadow-2xs">
            <h2 className="text-base sm:text-lg font-bold text-[hsl(222_47%_11%)]">
              Napište nám zprávu
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[hsl(215_16%_47%)]">
              Máte dotaz na konkrétní sadu kol nebo chcete zarezervovat termín přezutí?
            </p>

            {formSent ? (
              <div className="mt-6 sm:mt-8 rounded-xl bg-[hsl(142_71%_45%/0.1)] p-6 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(142_71%_45%)] text-white font-bold">
                  ✓
                </div>
                <h3 className="text-base font-bold text-[hsl(222_47%_11%)]">
                  Zpráva byla odeslána
                </h3>
                <p className="mt-1 text-xs text-[hsl(215_16%_47%)]">
                  Děkujeme! Ozveme se vám zpět co nejdříve.
                </p>
                <a
                  href={`tel:${shopPhoneHref}`}
                  className="mt-4 inline-block text-xs font-semibold text-[hsl(142_71%_35%)] hover:underline"
                >
                  Nebo volejte přímo na {shopPhone}
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 sm:mt-6 space-y-3.5">
                <div>
                  <label htmlFor="kontakt-name" className="block text-xs font-semibold text-[hsl(222_47%_11%)]">
                    Jméno a příjmení
                  </label>
                  <input
                    id="kontakt-name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jan Novák"
                    className="mt-1 w-full rounded-xl border-0 bg-[hsl(210_40%_98%/0.6)] px-3.5 py-2.5 text-base sm:text-sm text-[hsl(222_47%_11%)] ring-1 ring-[hsl(214_32%_91%)] focus:bg-white focus:ring-2 focus:ring-[hsl(142_71%_45%)] outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="kontakt-phone" className="block text-xs font-semibold text-[hsl(222_47%_11%)]">
                    Telefonní číslo
                  </label>
                  <input
                    id="kontakt-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+420 777 000 000"
                    className="mt-1 w-full rounded-xl border-0 bg-[hsl(210_40%_98%/0.6)] px-3.5 py-2.5 text-base sm:text-sm text-[hsl(222_47%_11%)] ring-1 ring-[hsl(214_32%_91%)] focus:bg-white focus:ring-2 focus:ring-[hsl(142_71%_45%)] outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="kontakt-msg" className="block text-xs font-semibold text-[hsl(222_47%_11%)]">
                    Zpráva / Popis poptávky
                  </label>
                  <textarea
                    id="kontakt-msg"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Mám zájem o sadu R16 / chtěl bych se zeptat na možnost montáže..."
                    className="mt-1 w-full rounded-xl border-0 bg-[hsl(210_40%_98%/0.6)] px-3.5 py-2.5 text-base sm:text-sm text-[hsl(222_47%_11%)] ring-1 ring-[hsl(214_32%_91%)] focus:bg-white focus:ring-2 focus:ring-[hsl(142_71%_45%)] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[hsl(142_71%_45%)] py-3 text-sm font-semibold text-white shadow-2xs transition-colors hover:bg-[hsl(142_71%_35%)] active:scale-98"
                >
                  Odeslat zprávu
                </button>

                <p className="text-center text-[11px] text-[hsl(215_16%_55%)]">
                  Rychlejší odpověď získáte telefonicky na čísle{' '}
                  <a href={`tel:${shopPhoneHref}`} className="font-semibold text-[hsl(222_47%_11%)] hover:underline">
                    {shopPhone}
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>
      </main>

      <ShopFooter />
    </div>
  );
}
