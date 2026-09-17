import { ShopOffer } from '@/lib/types';
import { getOfferMeta, getOfferTags } from './offerMeta';

function MetaIcon({ index }: { index: number }) {
  const className = 'h-4 w-4 shrink-0 text-[hsl(142_71%_45%)]';
  if (index === 0) {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05 5.636 5.636m12.728 0L16.95 7.05M7.05 16.95l-1.414 1.414M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" strokeWidth={1.8} />
        <circle cx="12" cy="12" r="3" strokeWidth={1.8} />
      </svg>
    );
  }
  if (index === 2) {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

export default function OfferSpecs({
  offer,
  contrast = false,
}: {
  offer: ShopOffer;
  contrast?: boolean;
}) {
  const meta = getOfferMeta(offer);
  const tags = getOfferTags(offer);

  if (meta.length === 0 && tags.length === 0) return null;

  return (
    <div>
      {meta.length > 0 && (
        <div className={`grid grid-cols-2 gap-x-4 gap-y-2 text-sm ${contrast ? 'text-[hsl(222_20%_28%)]' : 'text-[hsl(215_16%_47%)]'}`}>
          {meta.map((item, index) => (
            <div key={`${item.label}-${index}`} className="flex items-center gap-2">
              <MetaIcon index={index} />
              <span className={contrast ? 'font-medium' : undefined}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`rounded-full px-2.5 py-1 text-xs ${
                contrast
                  ? 'bg-[hsl(210_30%_93%)] font-medium text-[hsl(222_25%_28%)] ring-1 ring-[hsl(214_20%_86%)]'
                  : 'bg-[hsl(210_40%_96%)] text-[hsl(215_16%_47%)]'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
