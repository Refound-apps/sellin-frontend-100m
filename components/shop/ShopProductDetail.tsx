'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShopOffer } from '@/lib/types';
import { getShopOfferImages, submitShopInquiry } from '@/lib/api';
import {
  formatCzk,
  getOfferPricingInfo,
  getOfferSpecsList,
  getOfferTags,
} from './offerMeta';
import { useShop } from './ShopContext';
import { getProductPath } from '@/lib/shop/seo';
import ShopHeader from './ShopHeader';
import ShopFooter from './ShopFooter';

interface ShopProductDetailProps {
  offer: ShopOffer;
  initialImages?: string[];
}

export default function ShopProductDetail({
  offer,
  initialImages = [],
}: ShopProductDetailProps) {
  const {
    phone,
    phoneHref,
    addressLine,
    addressCity,
    hours,
    googleMapsLink,
    shopName,
    shop,
  } = useShop();

  const [images, setImages] = useState<string[]>(
    initialImages.length > 0
      ? initialImages
      : offer.preview_image
        ? [offer.preview_image]
        : []
  );
  const [index, setIndex] = useState(0);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [reservePhone, setReservePhone] = useState('');
  const [reserveEmail, setReserveEmail] = useState('');
  const [reserveAddress, setReserveAddress] = useState('');
  const [reserveName, setReserveName] = useState('');
  const [reservePickup, setReservePickup] = useState<'osobni' | 'posta'>('osobni');
  const [reserveNote, setReserveNote] = useState('');
  const [orderSent, setOrderSent] = useState(false);
  const [reserveSubmitting, setReserveSubmitting] = useState(false);
  const [reserveError, setReserveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialImages.length > 0) return;
    getShopOfferImages(offer.id).then((gallery) => {
      if (gallery.length > 0) {
        setImages(gallery);
        setIndex(0);
      }
    });
  }, [offer.id, initialImages.length]);

  const specsList = useMemo(() => getOfferSpecsList(offer), [offer]);
  const tags = useMemo(() => getOfferTags(offer), [offer]);
  const pricing = useMemo(() => getOfferPricingInfo(offer), [offer]);
  const currentImage = images.length > 0 ? images[((index % images.length) + images.length) % images.length] : null;

  const handleCopyLink = async () => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}${getProductPath(offer.id)}`
        : getProductPath(offer.id);
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservePhone.trim() || !reserveEmail.trim() || !reserveAddress.trim() || reserveSubmitting) {
      return;
    }
    setReserveSubmitting(true);
    setReserveError(null);

    const result = await submitShopInquiry({
      type: 'reservation',
      shop_id: shop.id,
      shop: shop.custom_domain || shop.slug || undefined,
      phone: reservePhone.trim(),
      email: reserveEmail.trim(),
      address: reserveAddress.trim(),
      name: reserveName.trim() || undefined,
      message: reserveNote.trim() || undefined,
      offer_id: String(offer.id),
      offer_title: offer.title || undefined,
      offer_price: offer.price ?? null,
      pickup: reservePickup,
    });

    setReserveSubmitting(false);
    if (!result.success) {
      setReserveError(result.error || 'Odeslání rezervace selhalo.');
      return;
    }
    setOrderSent(true);
  };

  return (
    <>
      <ShopHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <nav className="mb-5 text-xs font-semibold text-slate-500">
          <Link href="/shop" className="hover:text-emerald-700">
            Domů
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/shop#nabidka" className="hover:text-emerald-700">
            Nabídka
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-slate-800">{offer.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
              {currentImage ? (
                <Image
                  src={currentImage}
                  alt={offer.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">
                  Bez fotografie
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={`${img}-${i}`}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border ${
                      i === index % images.length
                        ? 'border-emerald-500 ring-2 ring-emerald-200'
                        : 'border-slate-200'
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-6 space-y-5">
            <div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-700"
                  >
                    {tag}
                  </span>
                ))}
                <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                  Skladem
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                {offer.title}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {shopName}
                {addressCity ? ` · ${addressCity}` : ''}
                {addressLine ? ` · ${addressLine}` : ''}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-black text-slate-950">{formatCzk(offer.price)}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
                    {pricing.priceLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  {copied ? 'Zkopírováno' : 'Sdílet odkaz'}
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-500">{pricing.summaryNote}</p>
              <p className="mt-1 text-xs text-slate-500">{pricing.shippingText}</p>
            </div>

            {specsList.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {specsList.map((spec) => (
                  <div
                    key={`${spec.label}-${spec.value}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {spec.label}
                    </div>
                    <div className="text-sm font-bold text-slate-900">{spec.value}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <a
                href={`tel:${phoneHref || phone}`}
                className="inline-flex flex-1 items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800"
              >
                Zavolat {phone}
              </a>
              <button
                type="button"
                onClick={() => setReserveOpen(true)}
                className="inline-flex flex-1 items-center justify-center rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900 hover:bg-emerald-100"
              >
                Rezervovat / koupit
              </button>
            </div>

            {offer.description && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Popis
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {offer.description}
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p>
                Osobní odběr: {addressLine || 'provozovna'}
                {addressCity ? `, ${addressCity}` : ''}
              </p>
              <p className="mt-1">Otevírací doba: {hours}</p>
              {googleMapsLink && (
                <a
                  href={googleMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block font-bold text-emerald-700 hover:underline"
                >
                  Navigovat na mapě →
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
      <ShopFooter />

      {reserveOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-slate-950/60"
            onClick={() => setReserveOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-950">Rezervace</h3>
              <button
                type="button"
                onClick={() => setReserveOpen(false)}
                className="rounded-lg bg-slate-100 px-2 py-1 text-sm font-bold text-slate-700"
              >
                Zavřít
              </button>
            </div>

            {orderSent ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                Rezervace odeslána. Ozveme se vám co nejdříve.
              </div>
            ) : (
              <form onSubmit={handleReserveSubmit} className="space-y-3">
                <input
                  value={reserveName}
                  onChange={(e) => setReserveName(e.target.value)}
                  placeholder="Jméno"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  required
                  value={reservePhone}
                  onChange={(e) => setReservePhone(e.target.value)}
                  placeholder="Telefon *"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  required
                  type="email"
                  value={reserveEmail}
                  onChange={(e) => setReserveEmail(e.target.value)}
                  placeholder="E-mail *"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  required
                  value={reserveAddress}
                  onChange={(e) => setReserveAddress(e.target.value)}
                  placeholder="Adresa / město *"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <select
                  value={reservePickup}
                  onChange={(e) => setReservePickup(e.target.value as 'osobni' | 'posta')}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="osobni">Osobní odběr</option>
                  <option value="posta">Zaslání poštou</option>
                </select>
                <textarea
                  value={reserveNote}
                  onChange={(e) => setReserveNote(e.target.value)}
                  placeholder="Poznámka"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                {reserveError && (
                  <p className="text-xs font-bold text-red-600">{reserveError}</p>
                )}
                <button
                  type="submit"
                  disabled={reserveSubmitting}
                  className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  {reserveSubmitting ? 'Odesílám…' : 'Odeslat rezervaci'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
