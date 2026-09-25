'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ShopOffer } from '@/lib/types';
import { formatCzk, getOfferPricingInfo, getOfferSpecsList, isAluDiskyOffer, isSteelWheelOffer, isWheelOffer } from './offerMeta';

interface ShopOfferCardProps {
  offer: ShopOffer;
  onClick?: () => void;
}

export default function ShopOfferCard({ offer, onClick }: ShopOfferCardProps) {
  const [imgError, setImgError] = useState(false);
  const isAlu = isAluDiskyOffer(offer);
  const isWheel = isWheelOffer(offer);
  const isSteel = isSteelWheelOffer(offer);
  const specs = getOfferSpecsList(offer);
  const pricing = getOfferPricingInfo(offer);

  // Derive subtle category badge for the image corner
  // ALU disky jsou zimní i letní, takže nemají mít tag letní pneu ani zimní pneu, pouze tag ALU disky
  const titleAndDesc = `${offer.title} ${offer.description || ''}`;
  let badgeText = 'Skladem';
  let badgeIcon = '✓';

  if (isAlu) {
    badgeText = 'ALU disky';
    badgeIcon = '🛞';
  } else if (isSteel) {
    badgeText = 'Plechové disky';
    badgeIcon = '🛞';
  } else if (isWheel) {
    badgeText = 'Disky';
    badgeIcon = '🛞';
  } else if (/\bzimn/i.test(offer.title)) {
    badgeText = 'Zimní pneu';
    badgeIcon = '❄';
  } else if (/(?<!komp)\bletn/i.test(offer.title)) {
    badgeText = 'Letní pneu';
    badgeIcon = '☀';
  } else if (/celoroč/i.test(offer.title)) {
    badgeText = 'Celoroční';
    badgeIcon = '⭐';
  } else if (/\bzimn/i.test(titleAndDesc)) {
    badgeText = 'Zimní pneu';
    badgeIcon = '❄';
  } else if (/(?<!komp)\bletn/i.test(titleAndDesc)) {
    badgeText = 'Letní pneu';
    badgeIcon = '☀';
  } else if (/celoroč/i.test(titleAndDesc)) {
    badgeText = 'Celoroční';
    badgeIcon = '⭐';
  } else {
    badgeText = 'Pneumatiky';
    badgeIcon = '🛞';
  }

  // Extract key specs for both AI agent parsing and user view
  const dimensionSpec = specs.find((s) => s.label === 'Rozměr');
  const treadSpec = isWheel ? undefined : specs.find((s) => s.label === 'Vzorek');
  const pcdSpec = specs.find((s) => s.label === 'Rozteč');
  const seasonSpec = isWheel ? undefined : specs.find((s) => s.label === 'Sezóna');

  // U alu disků vzorek není -> nezobrazovat jako pill ani parametr na kartě
  const displaySpecs = specs
    .filter((s) =>
      isWheel
        ? ['Rozteč', 'Průměr', 'Značka', 'Zális (ET)', 'Šířka disku', 'Typ'].includes(s.label)
        : ['Rozměr', 'Vzorek', 'Rozteč', 'Značka', 'Typ'].includes(s.label)
    )
    .slice(0, 3);

  return (
    <article
      itemScope
      itemType="https://schema.org/Product"
      data-ai-product-id={offer.id}
      data-ai-title={offer.title}
      data-ai-price={offer.price}
      data-ai-currency="CZK"
      data-ai-pricing-unit={pricing.isPerPiece ? 'piece' : 'set'}
      data-ai-dimension={dimensionSpec?.value || ''}
      data-ai-season={seasonSpec?.value || ''}
      data-ai-tread={treadSpec?.value || ''}
      data-ai-pcd={pcdSpec?.value || ''}
      data-ai-in-stock="true"
      className="flex flex-col h-full"
    >
      <button
        type="button"
        onClick={onClick}
        className="group flex h-full flex-col rounded-3xl bg-white p-3 sm:p-4 text-left border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_16px_36px_-6px_rgba(15,23,42,0.13),0_2px_8px_rgba(15,23,42,0.06)] hover:border-slate-300 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        {/* Image Container with grounding border and zoom */}
        <div className="relative h-44 sm:h-56 w-full overflow-hidden rounded-2xl bg-slate-100/80 border border-slate-200/70">
          {/* Top-left status badge */}
          <div className="absolute left-2.5 top-2.5 sm:left-3 sm:top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-800 shadow-xs border border-slate-200/80 backdrop-blur-xs">
            <span className="text-xs">{badgeIcon}</span>
            <span>{badgeText}</span>
          </div>

          {/* Top-right tread depth badge if present (pouze u pneu, nikdy u alu disků) */}
          {treadSpec && !isWheel && (
            <div className="absolute right-2.5 top-2.5 sm:right-3 sm:top-3 z-10 inline-flex items-center gap-1 rounded-full bg-slate-900/90 px-2 py-0.5 text-[10px] sm:text-[11px] font-extrabold text-white shadow-xs backdrop-blur-xs">
              <span className="text-emerald-400">Vzorek:</span>
              <span>{treadSpec.value}</span>
            </div>
          )}

          {offer.preview_image && !imgError ? (
            <Image
              src={offer.preview_image}
              alt={offer.title}
              fill
              itemProp="image"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Card Details */}
        <div className="flex flex-1 flex-col px-0.5 pb-0.5 pt-3 sm:pt-4">
          {/* Title */}
          <h3
            itemProp="name"
            className="line-clamp-2 min-h-[2.5rem] sm:min-h-[2.85rem] text-sm sm:text-lg font-bold leading-snug text-slate-950 group-hover:text-emerald-700 transition-colors"
          >
            {offer.title}
          </h3>

          {/* Structured Spec Badges */}
          {displaySpecs.length > 0 && (
            <div className="mt-2.5 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
              {displaySpecs.map((spec, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-50 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-slate-800"
                >
                  <span className="text-slate-400 font-normal">{spec.label}:</span>
                  <span className="font-bold">{spec.value}</span>
                </span>
              ))}
            </div>
          )}

          {/* Schema.org Offer Microdata */}
          <div
            itemProp="offers"
            itemScope
            itemType="https://schema.org/Offer"
            className="mt-auto flex items-end justify-between gap-2 border-t border-slate-100 pt-3.5 sm:pt-4 mt-4"
          >
            <meta itemProp="priceCurrency" content="CZK" />
            <meta itemProp="price" content={String(offer.price)} />
            <meta itemProp="availability" content="https://schema.org/InStock" />
            <meta itemProp="itemCondition" content="https://schema.org/UsedCondition" />

            <div>
              <div className="flex items-baseline gap-1">
                <p className="text-xl sm:text-[26px] font-black leading-none tracking-tight text-slate-950">
                  {formatCzk(offer.price)}
                </p>
                {pricing.isPerPiece && (
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500">
                    / kus
                  </span>
                )}
              </div>
              <p
                className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${
                  pricing.isPerPiece ? 'text-emerald-700' : 'text-slate-500'
                }`}
              >
                {pricing.priceLabel}
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-slate-800 shadow-2xs group-hover:bg-[hsl(142_71%_45%)] group-hover:text-white group-hover:border-transparent transition-all duration-200 shrink-0">
              <span>Detail</span>
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </span>
          </div>
        </div>
      </button>
    </article>
  );
}
