'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Offer } from '@/lib/types';
import { formatCzk, getOfferSpecsList } from '@/components/shop/offerMeta';
import { formatOfferDate, formatPhoneNumber, getOfferStatusInfo } from './offerStatus';

interface OfferCardProps {
  offer: Offer;
  onClick?: () => void;
  priority?: boolean;
}

export default function OfferCard({ offer, onClick, priority = false }: OfferCardProps) {
  const [imgError, setImgError] = useState(false);
  const specs = getOfferSpecsList(offer);
  const statusInfo = getOfferStatusInfo(offer.state);

  // Derive category badge
  const titleAndDesc = `${offer.title} ${offer.description || ''}`;
  let typeBadge: string | null = null;
  if (/zimn/i.test(titleAndDesc)) {
    typeBadge = '❄ Zimní';
  } else if (/letn/i.test(titleAndDesc)) {
    typeBadge = '☀ Letní';
  } else if (/celoroč/i.test(titleAndDesc)) {
    typeBadge = 'Celoroční';
  } else if (/disky|alu/i.test(titleAndDesc)) {
    typeBadge = 'ALU disky';
  } else if (/pneu|pneumatik/i.test(titleAndDesc)) {
    typeBadge = 'Pneu';
  }

  // Filter top 3 most informative specs for the card
  const displaySpecs = specs
    .filter((s) => ['Rozměr', 'Vzorek', 'Rozteč', 'Značka', 'Typ'].includes(s.label))
    .slice(0, 3);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex h-full flex-col rounded-3xl bg-white/95 p-3 text-left border border-slate-200/80 shadow-[0_10px_28px_-6px_rgba(15,23,42,0.06),0_2px_8px_rgba(15,23,42,0.03)] hover:shadow-[0_22px_45px_-8px_rgba(15,23,42,0.13),0_4px_16px_rgba(15,23,42,0.05)] hover:border-slate-300 hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 touch-manipulation cursor-pointer ring-1 ring-black/[0.02] backdrop-blur-xs overflow-hidden"
    >
      {/* Subtilní horní světelná linka */}
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent group-hover:via-emerald-500/40 transition-colors" />

      {/* Image Container with grounding border and zoom */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden rounded-2xl bg-slate-100/90 border border-slate-200/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]">
        {/* Top-left status badge */}
        <div className="absolute left-2.5 top-2.5 z-10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-[0_2px_6px_rgba(0,0,0,0.06)] border backdrop-blur-md bg-white/95 border-slate-200/90 text-slate-800">
          <span className={`h-2 w-2 rounded-full ${statusInfo.dot}`} />
          <span>{statusInfo.label}</span>
        </div>

        {/* Top-right product type badge */}
        {typeBadge && (
          <div className="absolute right-2.5 top-2.5 z-10 inline-flex items-center rounded-full bg-slate-950/85 border border-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-[0_2px_6px_rgba(0,0,0,0.2)] backdrop-blur-md">
            <span>{typeBadge}</span>
          </div>
        )}

        {offer.preview_image && !imgError ? (
          <Image
            src={offer.preview_image}
            alt={offer.title}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            priority={priority}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Card Details */}
      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        {/* Title */}
        <h3 className="line-clamp-2 min-h-[2.75rem] text-base font-bold leading-snug text-slate-950 group-hover:text-emerald-700 transition-colors">
          {offer.title}
        </h3>

        {/* Structured Spec Badges */}
        {displaySpecs.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {displaySpecs.map((spec, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-slate-50/80 px-2 py-0.5 text-[11px] font-semibold text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                <span className="text-slate-400 font-normal">{spec.label}:</span>
                <span>{spec.value}</span>
              </span>
            ))}
          </div>
        )}

        {/* Price & Detail CTA Footer */}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-3 mt-3">
          <div>
            <p className="text-2xl font-black leading-none tracking-tight text-slate-950">
              {formatCzk(offer.price)}
            </p>
          </div>

          <span className="inline-flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] group-hover:bg-gradient-to-b group-hover:from-slate-900 group-hover:to-slate-950 group-hover:text-white group-hover:border-transparent group-hover:shadow-[0_4px_12px_rgba(15,23,42,0.18)] transition-all duration-200">
            <span>Detail</span>
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </span>
        </div>

        {/* Admin Account, Phone & Date meta strip */}
        <div className="mt-2.5 flex flex-col gap-1 border-t border-slate-100 pt-2 text-[11px]">
          <div className="flex items-center justify-between gap-2 text-slate-600">
            {offer.seller_phone ? (
              <span className="inline-flex items-center gap-1 font-bold text-slate-900 truncate">
                <svg className="h-3 w-3 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{formatPhoneNumber(offer.seller_phone)}</span>
                {offer.seller_name && (
                  <span className="text-slate-500 font-normal truncate max-w-[90px]">({offer.seller_name})</span>
                )}
              </span>
            ) : (
              <span className="text-slate-400 italic">Bez tel. čísla</span>
            )}

            <span className="shrink-0 font-medium text-slate-500">
              {formatOfferDate(offer.created_at)}
            </span>
          </div>

          <div className="flex items-center text-[10.5px] text-slate-500">
            <span className="truncate" title={offer.bb_email || undefined}>
              {offer.bb_email ? (
                <span className="inline-flex items-center gap-1 text-slate-500 truncate">
                  <span className="text-slate-400">@</span> {offer.bb_email}
                </span>
              ) : (
                <span className="text-slate-400 italic">Bez e-mailu</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
