'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { ShopOffer } from '@/lib/types';
import { getShopOfferImages } from '@/lib/api';
import { formatCzk, getOfferPricingInfo, getOfferSpecsList, getOfferTags } from './offerMeta';
import { useShop } from './ShopContext';

interface ShopOfferModalProps {
  offer: ShopOffer;
  onClose: () => void;
}

function renderTextWithPhoneLinks(text: string) {
  const phoneRegex = /(\+420\s*)?([1-9]\d{2}\s*\d{3}\s*\d{3})\b/g;
  const parts: (string | React.ReactNode)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = phoneRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const rawNumber = match[0];
    const cleanNumber = rawNumber.replace(/\s+/g, '');
    const href = cleanNumber.startsWith('+') ? `tel:${cleanNumber}` : `tel:+420${cleanNumber}`;
    parts.push(
      <a
        key={match.index}
        href={href}
        className="font-bold text-emerald-700 underline hover:text-emerald-800"
      >
        {rawNumber}
      </a>
    );
    lastIndex = match.index + rawNumber.length;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}

export default function ShopOfferModal({ offer, onClose }: ShopOfferModalProps) {
  const {
    phone,
    phoneHref,
    addressLine,
    addressCity,
    hours,
    googleMapsLink,
    shippingPrice,
  } = useShop();

  const [images, setImages] = useState<string[]>(
    offer.preview_image ? [offer.preview_image] : []
  );
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Quick reservation drawer
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [reservePhone, setReservePhone] = useState('');
  const [reserveName, setReserveName] = useState('');
  const [reservePickup, setReservePickup] = useState<'osobni' | 'posta'>('osobni');
  const [reserveNote, setReserveNote] = useState('');
  const [orderSent, setOrderSent] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    getShopOfferImages(offer.id).then((gallery) => {
      if (gallery.length > 0) {
        setImages(gallery);
        setIndex(0);
      }
    });
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [offer.id]);

  const count = images.length;
  const current = count > 0 ? ((index % count) + count) % count : 0;
  const currentImage = images[current];

  const handleNext = useCallback(() => {
    setIndex((prev) => prev + 1);
  }, []);

  const handlePrev = useCallback(() => {
    setIndex((prev) => prev - 1);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (buyModalOpen) {
          setBuyModalOpen(false);
        } else if (lightboxOpen) {
          setLightboxOpen(false);
        } else {
          onClose();
        }
      }
      if (e.key === 'ArrowRight') {
        handleNext();
      }
      if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, lightboxOpen, buyModalOpen, handleNext, handlePrev]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 45) {
      handleNext();
    } else if (diff < -45) {
      handlePrev();
    }
    setTouchStart(null);
  };

  const handleCopyLink = async () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/shop?offer=${offer.id}`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: offer.title,
            url: url,
          });
          return;
        } catch {
          // If cancelled or rejected, fall back to copying to clipboard
        }
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    }
  };

  const handleReserveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservePhone.trim()) return;
    setOrderSent(true);
  };

  const specsList = getOfferSpecsList(offer);
  const tags = getOfferTags(offer);
  const pricing = getOfferPricingInfo(offer);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 lg:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container: Solid Grounded Card with crisp border and elevation */}
      <div className="relative flex max-h-[94dvh] h-[92dvh] sm:h-auto sm:max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[28px] sm:rounded-3xl bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] ring-1 ring-slate-900/10 border border-slate-200/80">
        
        {/* Mobile Swipe Handle */}
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-slate-300 sm:hidden shrink-0" />

        {/* Top Header: Clean status bar with crisp contrast */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 py-2.5 sm:px-6 sm:py-3 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
            </span>
            <span className="text-xs font-bold text-slate-800 truncate">
              Skladem · Osobní odběr {addressLine || 'Plzeň Jih'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300/80 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950 shadow-2xs transition-colors"
              title="Zkopírovat odkaz"
            >
              {copied ? (
                <>
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span className="text-emerald-700">Zkopírováno</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span className="hidden sm:inline">Sdílet</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/80 text-slate-700 hover:bg-slate-300 hover:text-slate-950 transition-colors"
              aria-label="Zavřít"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-7">
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-8 items-start">
            
            {/* Left Column: Image Gallery (lg: 6 cols) */}
            <div className="lg:col-span-6 flex flex-col">
              {currentImage ? (
                <div className="space-y-2.5">
                  {/* Main Large Image Viewport */}
                  <div
                    className="group relative h-60 xs:h-72 sm:h-80 md:h-[340px] w-full overflow-hidden rounded-2xl bg-slate-100/70 border border-slate-200 touch-pan-y"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                  >
                    <Image
                      src={currentImage}
                      alt={`${offer.title} - foto ${current + 1}`}
                      fill
                      className="object-contain p-2.5 transition-transform duration-300 group-hover:scale-[1.02]"
                      sizes="(max-width: 1024px) 100vw, 480px"
                      priority
                    />

                    {/* Magnifier click trigger */}
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(true)}
                      className="absolute inset-0 z-10 cursor-zoom-in"
                      aria-label="Zvětšit fotografii"
                    />

                    {/* Photo counter */}
                    <span className="pointer-events-none absolute right-3 top-3 z-20 rounded-md bg-slate-900/80 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-xs shadow-xs">
                      {current + 1} / {count}
                    </span>

                    {/* Carousel navigation arrows */}
                    {count > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrev();
                          }}
                          className="absolute left-2.5 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/95 p-2 text-slate-800 shadow-md border border-slate-200/60 transition-all hover:bg-white active:scale-95"
                          aria-label="Předchozí fotka"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNext();
                          }}
                          className="absolute right-2.5 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/95 p-2 text-slate-800 shadow-md border border-slate-200/60 transition-all hover:bg-white active:scale-95"
                          aria-label="Další fotka"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Row */}
                  {count > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none touch-pan-x">
                      {images.map((img, thumbIdx) => {
                        const isActive = thumbIdx === current;
                        return (
                          <button
                            key={thumbIdx}
                            type="button"
                            onClick={() => setIndex(thumbIdx)}
                            className={`relative h-12 w-16 sm:h-14 sm:w-18 shrink-0 overflow-hidden rounded-xl bg-slate-50 transition-all ${
                              isActive
                                ? 'border-2 border-emerald-600 ring-2 ring-emerald-500/25 shadow-xs'
                                : 'border border-slate-200/90 opacity-70 hover:opacity-100'
                            }`}
                            aria-label={`Přejít na fotku ${thumbIdx + 1}`}
                          >
                            <Image
                              src={img}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="72px"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-60 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 border border-slate-200">
                  <span>Fotografie není k dispozici</span>
                </div>
              )}

              {/* Grounded Trust Bar below photo */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-2 sm:p-2.5 shadow-2xs">
                  <p className="font-bold text-xs text-slate-900">100% reálné</p>
                  <p className="text-[11px] text-slate-500">fotky sady</p>
                </div>
                <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-2 sm:p-2.5 shadow-2xs">
                  <p className="font-bold text-xs text-slate-900">Změřený</p>
                  <p className="text-[11px] text-slate-500">přesný dezén</p>
                </div>
                <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-2 sm:p-2.5 shadow-2xs">
                  <p className="font-bold text-xs text-slate-900">Přezutí</p>
                  <p className="text-[11px] text-slate-500">v pneuservisu</p>
                </div>
              </div>
            </div>

            {/* Right Column: Title, Anchored Purchase Card & Structured Specs (lg: 6 cols) */}
            <div className="lg:col-span-6 flex flex-col">
              
              {/* Category tags with solid contrast */}
              {tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg bg-slate-100 border border-slate-200/90 px-2.5 py-0.5 text-[11px] font-semibold text-slate-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-950 leading-snug">
                {offer.title}
              </h1>

              {/* GROUNDED HERO PURCHASE CARD: Clear price, guarantee badge & desktop CTAs */}
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-4.5 shadow-2xs">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block leading-none">
                      {pricing.priceLabel}
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 leading-tight">
                        {formatCzk(offer.price)}
                      </span>
                      {pricing.isPerPiece && (
                        <span className="text-sm font-bold text-slate-600">
                          / kus
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="rounded-lg bg-emerald-100/90 border border-emerald-300/80 px-2.5 py-1 text-xs font-bold text-emerald-800">
                      Osobní odběr zdarma
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600">
                      Česká pošta: {pricing.shippingPrice}
                    </span>
                  </div>
                </div>
                <p className="mt-1.5 text-xs font-medium text-slate-600">
                  {pricing.summaryNote}
                </p>

                {/* Desktop / Tablet Action Buttons anchored right in the purchase card */}
                <div className="mt-3.5 hidden sm:grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBuyModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-[hsl(142_71%_45%)] px-3 py-2.5 text-xs sm:text-[13px] font-bold text-white shadow-xs hover:bg-[hsl(142_71%_36%)] active:scale-98 transition-all text-center whitespace-nowrap"
                  >
                    <span>Koupit</span>
                  </button>

                  <a
                    href={`tel:${phoneHref}`}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs sm:text-[13px] font-bold text-slate-800 hover:bg-slate-100/80 active:scale-98 transition-all shadow-2xs text-center whitespace-nowrap"
                  >
                    <svg className="h-4 w-4 shrink-0 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="whitespace-nowrap">Zavolat {phone.replace(/\s+/g, '\u00A0')}</span>
                  </a>
                </div>
              </div>

              {/* STRUCTURED PARAMETERS: High contrast 2-column key-value tiles */}
              {specsList.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                    Parametry sady
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {specsList.map((spec, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-3 py-2 shadow-2xs"
                      >
                        <span className="text-slate-500 font-medium">{spec.label}</span>
                        <span className="font-bold text-slate-900">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description - Grounded Box */}
              <div className="mt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                  Popis položky
                </h4>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 sm:p-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed max-h-28 sm:max-h-36 overflow-y-auto overscroll-contain">
                  {offer.description
                    ? renderTextWithPhoneLinks(offer.description)
                    : 'K této položce není uveden podrobnější textový popis. Pro ověření detailů a rozměrů nám prosím zavolejte.'}
                </div>
              </div>

              {/* Location & Contact - Grounded Bar */}
              <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/90 bg-slate-50/80 px-3.5 py-2.5 text-xs">
                <div className="flex items-center gap-2 truncate pr-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-bold text-slate-800 truncate">
                    {addressLine}{addressCity ? `, ${addressCity}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <a
                    href={`tel:${phoneHref}`}
                    className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 active:scale-95 transition-transform"
                    title={`Zavolat ${phone}`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{phone}</span>
                  </a>
                  {googleMapsLink && (
                    <a
                      href={googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-emerald-700 hover:underline"
                    >
                      Mapa ↗
                    </a>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* MOBILE-ONLY PINNED BOTTOM ACTION BAR (Hidden on sm+ to prevent duplicate buttons) */}
        <div className="sm:hidden shrink-0 border-t border-slate-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_20px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between gap-2.5">
            <div className="shrink-0 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block leading-none">
                {pricing.priceLabel}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-black tracking-tight text-slate-950 truncate block">
                  {formatCzk(offer.price)}
                </span>
                {pricing.isPerPiece && (
                  <span className="text-xs font-bold text-slate-600">
                    / kus
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setBuyModalOpen(true)}
                className="flex items-center justify-center rounded-xl bg-[hsl(142_71%_45%)] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[hsl(142_71%_35%)] active:scale-95 whitespace-nowrap"
              >
                Koupit
              </button>

              <a
                href={`tel:${phoneHref}`}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 active:scale-95 shadow-2xs whitespace-nowrap"
              >
                <svg className="h-3.5 w-3.5 shrink-0 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Zavolat {phone}</span>
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* QUICK BUY / RESERVATION POPUP DIALOG */}
      {buyModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs"
            onClick={() => setBuyModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-lg overflow-hidden rounded-t-[28px] sm:rounded-3xl bg-white p-5 sm:p-7 shadow-2xl ring-1 ring-slate-900/10 border border-slate-200 pb-[max(1.25rem,env(safe-area-inset-bottom))] max-h-[90dvh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3.5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Nezávazná rezervace
                </span>
                <h3 className="mt-0.5 text-base sm:text-lg font-bold text-slate-950">
                  Rezervovat sadu
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[280px] sm:max-w-none">
                  {offer.title} · <strong className="text-slate-950">{formatCzk(offer.price)}{pricing.isPerPiece ? ' / kus' : ' za sadu'}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setBuyModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95"
                aria-label="Zavřít"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {orderSent ? (
              <div className="py-6 sm:py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xl font-bold">
                  ✓
                </div>
                <h4 className="text-base sm:text-lg font-bold text-slate-950">
                  Sada byla úspěšně rezervována!
                </h4>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Děkujeme. Položku pro vás držíme v dílně. Brzy vám zavoláme na číslo{' '}
                  <strong className="text-slate-950">{reservePhone}</strong> pro domluvu termínu předání či montáže.
                </p>
                <div className="mt-5 sm:mt-6 flex flex-col gap-2">
                  <a
                    href={`tel:${phoneHref}`}
                    className="rounded-xl bg-[hsl(142_71%_45%)] py-3 text-xs sm:text-sm font-bold text-white hover:bg-[hsl(142_71%_35%)] active:scale-98 shadow-xs"
                  >
                    Nebo zavolat ihned ({phone})
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setBuyModalOpen(false);
                      setOrderSent(false);
                      setReservePhone('');
                    }}
                    className="rounded-xl border border-slate-300 bg-white py-3 text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-50 active:scale-98"
                  >
                    Hotovo, zavřít
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReserveSubmit} className="mt-4 space-y-3">
                <div>
                  <label htmlFor="reserve-phone" className="block text-xs font-bold text-slate-800">
                    Telefonní číslo <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="reserve-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    value={reservePhone}
                    onChange={(e) => setReservePhone(e.target.value)}
                    placeholder="+420 777 000 000"
                    className="mt-1 w-full rounded-xl border-0 bg-slate-50 px-3.5 py-2.5 text-base sm:text-sm text-slate-950 ring-1 ring-slate-300 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="reserve-name" className="block text-xs font-bold text-slate-800">
                    Jméno a příjmení
                  </label>
                  <input
                    id="reserve-name"
                    type="text"
                    autoComplete="name"
                    value={reserveName}
                    onChange={(e) => setReserveName(e.target.value)}
                    placeholder="např. Jan Novák"
                    className="mt-1 w-full rounded-xl border-0 bg-slate-50 px-3.5 py-2.5 text-base sm:text-sm text-slate-950 ring-1 ring-slate-300 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Způsob předání
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setReservePickup('osobni')}
                      className={`rounded-xl border p-2.5 text-left font-medium transition-all ${
                        reservePickup === 'osobni'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <p className="font-bold">Osobní odběr</p>
                      <p className="text-[10px] text-slate-500">Plzeň Jih (zdarma)</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReservePickup('posta')}
                      className={`rounded-xl border p-2.5 text-left font-medium transition-all ${
                        reservePickup === 'posta'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <p className="font-bold">Poštou po ČR</p>
                      <p className="text-[10px] text-slate-500">Česká pošta ({pricing.shippingPrice})</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="reserve-note" className="block text-xs font-bold text-slate-800">
                    Poznámka (např. zájem o přezutí, model vozu)
                  </label>
                  <input
                    id="reserve-note"
                    type="text"
                    value={reserveNote}
                    onChange={(e) => setReserveNote(e.target.value)}
                    placeholder="Mám zájem o obutí na auto v sobotu..."
                    className="mt-1 w-full rounded-xl border-0 bg-slate-50 px-3.5 py-2.5 text-base sm:text-sm text-slate-950 ring-1 ring-slate-300 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-[hsl(142_71%_45%)] py-3 text-sm font-bold text-white shadow-xs hover:bg-[hsl(142_71%_35%)] transition-colors active:scale-98"
                  >
                    Potvrdit rezervaci
                  </button>
                  <p className="mt-2 text-center text-[11px] text-slate-500">
                    Nebo rovnou volejte na{' '}
                    <a href={`tel:${phoneHref}`} className="font-bold text-slate-900 hover:underline">
                      {phone}
                    </a>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox View */}
      {lightboxOpen && currentImage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/92 p-2 sm:p-4">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={() => setLightboxOpen(false)}
            aria-label="Zavřít zvětšení"
          />

          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-white/30 transition-colors active:scale-95"
          >
            <span>Zavřít</span>
            <span>✕</span>
          </button>

          <div className="relative z-10 h-[80vh] sm:h-[86vh] w-full max-w-6xl">
            <Image
              src={currentImage}
              alt={`${offer.title} ${current + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          <span className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur">
            {current + 1} z {count}
          </span>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-2 sm:left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 p-2.5 sm:p-3 text-xl sm:text-2xl text-slate-900 shadow-lg backdrop-blur hover:bg-white active:scale-95"
                aria-label="Předchozí fotka"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-2 sm:right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 p-2.5 sm:p-3 text-xl sm:text-2xl text-slate-900 shadow-lg backdrop-blur hover:bg-white active:scale-95"
                aria-label="Další fotka"
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
