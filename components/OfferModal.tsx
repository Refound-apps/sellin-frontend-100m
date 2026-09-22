'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Offer, OfferDetail } from '@/lib/types';
import { getOfferDetails, getShopOfferImages, updateOfferById, uploadImagesToR2 } from '@/lib/api';
import { formatCzk, getOfferTags } from '@/components/shop/offerMeta';
import {
  formatOfferDate,
  formatOfferDateTime,
  formatPhoneNumber,
  formatPhoneHref,
  getOfferStatusInfo,
  AUTORENEW_OPTIONS,
} from './offerStatus';

interface OfferModalProps {
  offer: Offer;
  onClose: () => void;
  onOfferUpdated?: (updatedOffer: Offer) => void;
}

function getPortalInfo(rawId: string | null | undefined) {
  const lower = (rawId || '').toLowerCase();
  if (lower.includes('bazos') || lower.includes('bazoš')) {
    if (lower.includes('sk')) return { label: 'Bazoš.sk', icon: '🏷️' };
    return { label: 'Bazoš.cz', icon: '🏷️' };
  }
  if (lower.includes('sbazar')) {
    return { label: 'Sbazar.cz', icon: '🛒' };
  }
  if (lower.includes('face') || lower.includes('fb')) {
    return { label: 'Facebook Marketplace', icon: '📘' };
  }
  return { label: rawId || 'Inzertní portál', icon: '🌐' };
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

export default function OfferModal({ offer, onClose, onOfferUpdated }: OfferModalProps) {
  const [details, setDetails] = useState<OfferDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedOffer, setEditedOffer] = useState({
    title: offer.title,
    description: offer.description,
    price: offer.price,
    autorenew_freq: offer.autorenew_freq || 'Neobnovovat',
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const getInitialImages = useCallback(() => {
    const arr: string[] = [];
    if (offer.preview_image) arr.push(offer.preview_image);
    for (let i = 2; i <= 9; i++) {
      const extra = (offer as any)[`image${i}`];
      if (extra && typeof extra === 'string' && !arr.includes(extra)) {
        arr.push(extra);
      }
    }
    return arr;
  }, [offer]);

  // Gallery & Lightbox
  const [images, setImages] = useState<string[]>(getInitialImages);
  const [editedImages, setEditedImages] = useState<string[]>(getInitialImages);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [imageIndex, setImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Load details & images
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    // Fetch images
    getShopOfferImages(offer.id).then((gallery) => {
      if (gallery && gallery.length > 0) {
        setImages(gallery);
        setEditedImages(gallery);
        setImageIndex(0);
      }
    });

    // Fetch marketplace links
    if (offer.bb_id) {
      getOfferDetails(offer.bb_id).then((data) => {
        setDetails(data);
        setLoadingDetails(false);
        const freqFromDetail = data.find(
          (d) => d.autorenew_freq && d.autorenew_freq !== 'Neobnovovat'
        )?.autorenew_freq;
        if (freqFromDetail && !offer.autorenew_freq) {
          setEditedOffer((prev) => ({ ...prev, autorenew_freq: freqFromDetail }));
        }
      });
    } else {
      setLoadingDetails(false);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [offer.id, offer.bb_id, offer.autorenew_freq]);

  const count = images.length;
  const current = count > 0 ? ((imageIndex % count) + count) % count : 0;
  const currentImage = images[current];

  const handleNext = useCallback(() => {
    setImageIndex((prev) => prev + 1);
  }, []);

  const handlePrev = useCallback(() => {
    setImageIndex((prev) => prev - 1);
  }, []);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 9 - editedImages.length;
    if (remainingSlots <= 0) {
      alert('Lze mít maximálně 9 fotografií na jeden inzerát.');
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remainingSlots);
    setUploadingImages(true);
    setSaveError(null);

    try {
      const readPromises = selectedFiles.map((file) => {
        return new Promise<{ data: string; filename: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ data: reader.result as string, filename: file.name });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const base64Files = await Promise.all(readPromises);
      const uploadedUrls = await uploadImagesToR2(base64Files);

      setEditedImages((prev) => [...prev, ...uploadedUrls].slice(0, 9));
    } catch (err: any) {
      console.error('Upload to R2 failed in modal:', err);
      setSaveError('Nepodařilo se nahrát obrázky do Cloudflare R2: ' + (err.message || ''));
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = customImageUrl.trim();
    if (!trimmed) return;
    if (editedImages.length >= 9) {
      alert('Lze mít maximálně 9 fotografií.');
      return;
    }
    setEditedImages((prev) => [...prev, trimmed]);
    setCustomImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setEditedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveImage = (from: number, to: number) => {
    if (to < 0 || to >= editedImages.length) return;
    setEditedImages((prev) => {
      const copy = [...prev];
      const item = copy.splice(from, 1)[0];
      copy.splice(to, 0, item);
      return copy;
    });
  };

  const handleMakePrimary = (index: number) => {
    if (index === 0) return;
    handleMoveImage(index, 0);
  };

  const handleCancel = useCallback(() => {
    const fallbackFreq =
      offer.autorenew_freq ||
      details.find((d) => d.autorenew_freq && d.autorenew_freq !== 'Neobnovovat')?.autorenew_freq ||
      'Neobnovovat';
    setEditedOffer({
      title: offer.title,
      description: offer.description,
      price: offer.price,
      autorenew_freq: fallbackFreq,
    });
    setEditedImages([...images]);
    setIsEditing(false);
    setSaveError(null);
  }, [offer.title, offer.description, offer.price, offer.autorenew_freq, details, images]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await updateOfferById(offer.id, {
        ...editedOffer,
        images: editedImages,
      });

      offer.title = editedOffer.title;
      offer.description = editedOffer.description;
      offer.price = editedOffer.price;
      offer.autorenew_freq = editedOffer.autorenew_freq;
      offer.preview_image = editedImages[0] || '';
      offer.image2 = editedImages[1] || null;
      offer.image3 = editedImages[2] || null;
      offer.image4 = editedImages[3] || null;
      offer.image5 = editedImages[4] || null;
      offer.image6 = editedImages[5] || null;
      offer.image7 = editedImages[6] || null;
      offer.image8 = editedImages[7] || null;
      offer.image9 = editedImages[8] || null;

      setImages([...editedImages]);
      setImageIndex(0);
      onOfferUpdated?.(offer);

      setDetails((prev) =>
        prev.map((d) => ({ ...d, autorenew_freq: editedOffer.autorenew_freq }))
      );
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (error: any) {
      console.error('Error saving offer:', error);
      setSaveError('Chyba při ukládání: ' + (error.message || 'Chyba při komunikaci se serverem.'));
    } finally {
      setSaving(false);
    }
  }, [editedOffer, editedImages, offer, onOfferUpdated]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxOpen) {
          setLightboxOpen(false);
        } else if (isEditing) {
          handleCancel();
        } else {
          onClose();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && isEditing) {
        e.preventDefault();
        handleSave();
      }
      if (!lightboxOpen) return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, isEditing, onClose, handleNext, handlePrev, handleCancel, handleSave]);

  // Touch Swipe Handlers for mobile gallery
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 50) handleNext();
    if (diff < -50) handlePrev();
    setTouchStart(null);
  };

  const handleToggleArchive = async () => {
    const isArchived = offer.state === 'app_archive';
    const nextState = isArchived ? 'app_active' : 'app_archive';
    const confirmText = isArchived
      ? 'Chcete tento inzerát vrátit zpět mezi aktivní?'
      : 'Opravdu chcete tento inzerát přesunout do archivu?';

    if (!window.confirm(confirmText)) return;

    setSaving(true);
    try {
      await updateOfferById(offer.id, { state: nextState });
      offer.state = nextState;
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Chyba při ukládání');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(String(offer.id));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Tags computation
  const currentOfferForMeta = {
    ...offer,
    title: editedOffer.title,
    description: editedOffer.description,
    price: editedOffer.price,
  };
  const tags = getOfferTags(currentOfferForMeta);
  const statusInfo = getOfferStatusInfo(offer.state);

  const effectiveAutorenewFreq =
    offer.autorenew_freq ||
    details.find((d) => d.autorenew_freq && d.autorenew_freq !== 'Neobnovovat')?.autorenew_freq ||
    details[0]?.autorenew_freq ||
    'Neobnovovat';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Grounded Modal Window */}
      <div
        className="relative flex flex-col w-full max-w-5xl max-h-[92dvh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar - Clean, uncluttered, focused */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          {/* Left info: ID, Status & E-shop Link */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyId}
              title="Kliknutím zkopírujete ID"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
            >
              <span>#{offer.id}</span>
              {copiedId ? (
                <span className="text-emerald-700 font-bold text-[10px]">✓ Zkopírováno</span>
              ) : (
                <svg className="h-3 w-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>

            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border ${statusInfo.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
              <span>{statusInfo.label}</span>
            </span>

            <a
              href={`/shop?offer=${offer.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-colors"
              title="Otevřít produkt na e-shopu v novém okně"
            >
              <span>🛍️</span>
              <span>E-shop</span>
              <span className="text-slate-400">↗</span>
            </a>
          </div>

          {/* Right actions: Edit, Archive, Close */}
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 active:scale-95 transition-all shadow-xs"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Upravit inzerát</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleArchive}
                  disabled={saving}
                  className={`hidden sm:inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                    offer.state === 'app_archive'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-rose-700'
                  }`}
                >
                  <span>{offer.state === 'app_archive' ? 'Obnovit z archivu' : 'Archivovat'}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
                >
                  Zrušit
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-xs disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Ukládám…</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>Uložit změny</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 active:scale-95 transition-all ml-1"
              aria-label="Zavřít"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Feedback Banners */}
        {saveSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-xs font-bold text-emerald-800 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5">
              <span>✓</span>
              <span>Změny v inzerátu byly úspěšně uloženy.</span>
            </span>
            <button onClick={() => setSaveSuccess(false)} className="text-emerald-700 hover:underline">
              Zavřít
            </button>
          </div>
        )}
        {saveError && (
          <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-xs font-bold text-rose-800 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5">
              <span>⚠</span>
              <span>{saveError}</span>
            </span>
            <button onClick={() => setSaveError(null)} className="text-rose-700 hover:underline">
              Zavřít
            </button>
          </div>
        )}

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6">
            
            {/* Left Column: Visuals & Secondary Meta (lg: 5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              
              {/* Photo Gallery Frame OR Photo Manager when Editing */}
              {!isEditing ? (
                <div>
                  <div
                    className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 shadow-xs select-none touch-pan-y"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                  >
                    {currentImage ? (
                      <>
                        <Image
                          src={currentImage}
                          alt={offer.title}
                          fill
                          className="cursor-zoom-in object-contain p-1 transition-transform duration-300 hover:scale-[1.02]"
                          sizes="(max-width: 1024px) 100vw, 40vw"
                          priority
                          onClick={() => setLightboxOpen(true)}
                        />

                        {/* Image Counter Badge */}
                        {count > 1 && (
                          <div className="absolute left-3 bottom-3 z-10 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-white shadow-xs backdrop-blur-xs">
                            {current + 1} / {count}
                          </div>
                        )}

                        {/* Gallery Navigation Buttons */}
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <svg className="h-14 w-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Thumbnails Strip */}
                  {count > 1 && (
                    <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {images.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setImageIndex(i)}
                          className={`relative h-14 w-18 shrink-0 overflow-hidden rounded-xl border bg-slate-100 transition-all ${
                            i === current
                              ? 'border-2 border-slate-900 ring-2 ring-slate-900/20 shadow-xs'
                              : 'border-slate-200 opacity-75 hover:opacity-100'
                          }`}
                        >
                          <Image
                            src={img}
                            alt={`Náhled ${i + 1}`}
                            fill
                            className="object-cover"
                            sizes="72px"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Manage Photos Quick Button in View Mode */}
                  <div className="mt-2.5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setEditedImages([...images]);
                        setIsEditing(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-all shadow-2xs"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Spravovat fotografie ({count})</span>
                    </button>
                    {count > 1 && (
                      <span className="text-[11px] text-slate-400">
                        Kliknutím na foto zvětšíte
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                /* PHOTO MANAGER IN EDIT MODE */
                <div className="flex flex-col gap-3 rounded-2xl border-2 border-slate-900/10 bg-white p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-950 flex items-center gap-1.5">
                        <span>📸</span>
                        <span>Fotografie inzerátu</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Nahrávání do Cloudflare R2 • Max. 9 fotek
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      editedImages.length >= 9
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {editedImages.length} / 9
                    </span>
                  </div>

                  {/* Dropzone for R2 upload */}
                  <div className="relative">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      disabled={uploadingImages || editedImages.length >= 9}
                      onChange={handleFilesSelected}
                      className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                    />
                    <div className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center transition-all ${
                      uploadingImages
                        ? 'border-blue-400 bg-blue-50/50'
                        : editedImages.length >= 9
                        ? 'border-slate-200 bg-slate-50 opacity-60'
                        : 'border-slate-300 hover:border-slate-500 bg-slate-50/60 hover:bg-slate-50'
                    }`}>
                      {uploadingImages ? (
                        <div className="flex flex-col items-center gap-1.5 text-blue-600 py-1">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                          <p className="text-xs font-bold">Nahrávám a optimalizuji v Cloudflare R2…</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-2xs text-base mb-1">
                            ☁️
                          </div>
                          <p className="text-xs font-bold text-slate-800">
                            {editedImages.length >= 9
                              ? 'Dosažen limit 9 fotografií'
                              : 'Klikněte nebo přetáhněte nové fotografie'}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            JPEG, PNG, WebP • Automatické uložení na Cloudflare R2
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* URL Input */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="url"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddImageUrl();
                        }
                      }}
                      disabled={editedImages.length >= 9}
                      placeholder="Nebo vložte URL adresu..."
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900/10 outline-none placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      disabled={!customImageUrl.trim() || editedImages.length >= 9}
                      className="rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors disabled:opacity-40"
                    >
                      + Přidat
                    </button>
                  </div>

                  {/* Image List / Grid */}
                  {editedImages.length > 0 ? (
                    <div className="space-y-2 mt-1 max-h-[380px] overflow-y-auto pr-1">
                      {editedImages.map((img, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-2.5 rounded-xl border p-2 bg-slate-50/80 transition-all ${
                            idx === 0
                              ? 'border-slate-900 ring-1 ring-slate-900/20 bg-slate-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="relative h-13 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-200 border border-slate-200">
                            <Image
                              src={img}
                              alt={`Fotografie ${idx + 1}`}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                            <div className="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 text-[8px] font-mono font-bold text-white">
                              #{idx + 1}
                            </div>
                          </div>

                          {/* Info & badges */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {idx === 0 ? (
                                <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                                  ★ Hlavní foto
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleMakePrimary(idx)}
                                  className="rounded-md border border-slate-300 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-950 transition-colors"
                                  title="Nastavit tuto fotografii jako hlavní náhled"
                                >
                                  Nastavit jako hlavní
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate" title={img}>
                              {img}
                            </p>
                          </div>

                          {/* Order & Delete buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(idx, idx - 1)}
                                title="Posunout nahoru"
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950 text-[10px] shadow-2xs font-bold"
                              >
                                ▲
                              </button>
                            )}
                            {idx < editedImages.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(idx, idx + 1)}
                                title="Posunout dolů"
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950 text-[10px] shadow-2xs font-bold"
                              >
                                ▼
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              title="Smazat fotografii"
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white text-xs transition-colors shadow-2xs ml-0.5"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-400">
                      Žádné fotografie. Přidejte fotku nahráním nebo zadáním URL.
                    </div>
                  )}
                </div>
              )}

              {/* Prodejní kanály - Compact & Clean */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Prodejní kanály ({1 + details.length})
                  </span>
                  <a
                    href={`/shop?offer=${offer.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    Zobrazit e-shop ↗
                  </a>
                </div>

                <div className="space-y-1.5">
                  {/* E-shop Channel */}
                  <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span>🛍️</span>
                      <span className="font-bold text-slate-900 truncate">E-shop Duplux</span>
                      <span className="rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        {offer.state === 'app_archive' ? 'Archiv' : 'Aktivní'}
                      </span>
                    </div>
                    <a
                      href={`/shop?offer=${offer.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-slate-600 hover:text-slate-950 transition-colors"
                    >
                      Otevřít ↗
                    </a>
                  </div>

                  {/* Marketplace Channels */}
                  {loadingDetails ? (
                    <div className="relative overflow-hidden h-10 rounded-xl bg-slate-100 border border-slate-200/80">
                      <div className="h-full w-full -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/80 to-transparent" />
                    </div>
                  ) : (
                    details.map((detail, idx) => {
                      const portal = getPortalInfo(detail.bb_marketplace_id);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span>{portal.icon}</span>
                            <span className="font-bold text-slate-900 truncate">{portal.label}</span>
                          </div>
                          {detail.link ? (
                            <a
                              href={detail.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-slate-600 hover:text-slate-950 transition-colors"
                            >
                              Otevřít ↗
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400">Bez odkazu</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Informace o inzerátu & Kontakt - Single Compact Table */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 text-xs text-slate-600 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                  Podrobnosti a kontakt
                </span>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
                  <span className="text-slate-500">Telefon k inzerátu</span>
                  {offer.seller_phone ? (
                    <a
                      href={formatPhoneHref(offer.seller_phone)}
                      className="inline-flex items-center gap-1 font-bold text-slate-900 hover:text-emerald-700"
                    >
                      <svg className="h-3 w-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{formatPhoneNumber(offer.seller_phone)}</span>
                      {offer.seller_name && <span className="text-slate-500 font-normal">({offer.seller_name})</span>}
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Neuveden</span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
                  <span className="text-slate-500">Účet (e-mail)</span>
                  <span className="font-medium text-slate-900 truncate max-w-[200px]" title={offer.bb_email || undefined}>
                    {offer.bb_email || '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
                  <span className="text-slate-500">Auto-obnova</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900 text-right">
                    {effectiveAutorenewFreq !== 'Neobnovovat' ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-emerald-800 font-bold">{effectiveAutorenewFreq}</span>
                      </>
                    ) : (
                      <span className="text-slate-400 italic">Neobnovovat</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
                  <span className="text-slate-500">Vytvořeno</span>
                  <span className="font-medium text-slate-900" title={formatOfferDateTime(offer.created_at)}>
                    {formatOfferDate(offer.created_at)}
                  </span>
                </div>
              </div>

            </div>

            {/* Right Column: Inzerát & Editace (The Core Work Area - lg: 7 cols) */}
            <div className="lg:col-span-7 flex flex-col">
              
              {/* Category tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* CORE CONTENT: Either View Mode or Edit Mode */}
              {!isEditing ? (
                /* VIEW MODE: Clean, elegant presentation */
                <div className="flex flex-col flex-1 gap-4">
                  
                  {/* Title & Price Header */}
                  <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Název inzerátu
                        </span>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 leading-snug">
                          {offer.title}
                        </h1>
                      </div>

                      <div className="sm:text-right shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Cena
                        </span>
                        <div className="inline-block rounded-xl bg-slate-900 px-3.5 py-1.5 text-xl sm:text-2xl font-black text-white shadow-2xs">
                          {formatCzk(offer.price)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="flex flex-col flex-1 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Popis inzerátu
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-950 transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Upravit</span>
                      </button>
                    </div>

                    <div className="text-xs sm:text-sm leading-relaxed text-slate-700 whitespace-pre-wrap flex-1 min-h-[140px]">
                      {offer.description
                        ? renderTextWithPhoneLinks(offer.description)
                        : <span className="text-slate-400 italic">K této položce není uveden podrobnější textový popis.</span>}
                    </div>
                  </div>

                </div>
              ) : (
                /* EDIT MODE: Dedicated, spacious and distraction-free editor */
                <div className="flex flex-col flex-1 rounded-2xl border-2 border-slate-900/10 bg-white p-4 sm:p-5 shadow-xs">
                  
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                    <div>
                      <h2 className="text-base font-bold text-slate-950">
                        Úprava inzerátu
                      </h2>
                      <p className="text-xs text-slate-500">
                        Upravte název, cenu nebo popis a potvrďte tlačítkem Uložit změny.
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Zkratka: Ctrl+Enter
                    </span>
                  </div>

                  <div className="space-y-4 flex-1">
                    {/* Název */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="edit-title" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Název inzerátu
                        </label>
                        <span className="text-[11px] text-slate-400">
                          {editedOffer.title.length} znaků
                        </span>
                      </div>
                      <input
                        id="edit-title"
                        type="text"
                        value={editedOffer.title}
                        onChange={(e) => setEditedOffer({ ...editedOffer, title: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm sm:text-base font-bold text-slate-950 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all"
                        placeholder="Název inzerátu..."
                      />
                    </div>

                    {/* Cena & Autoobnova */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label htmlFor="edit-price" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Cena v Kč
                        </label>
                        <div className="relative">
                          <input
                            id="edit-price"
                            type="number"
                            value={editedOffer.price}
                            onChange={(e) => setEditedOffer({ ...editedOffer, price: parseFloat(e.target.value) || 0 })}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base sm:text-lg font-black text-slate-950 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all pr-12"
                            placeholder="Např. 1200"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                            Kč
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label htmlFor="edit-autorenew" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Auto-obnova (TOP)
                          </label>
                          <span className="text-[10px] text-emerald-700 font-bold">
                            Bazoš / Sbazar
                          </span>
                        </div>
                        <select
                          id="edit-autorenew"
                          value={editedOffer.autorenew_freq}
                          onChange={(e) => setEditedOffer({ ...editedOffer, autorenew_freq: e.target.value })}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all"
                        >
                          {AUTORENEW_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Popis */}
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="edit-desc" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Textový popis inzerátu
                        </label>
                        <span className="text-[11px] text-slate-400">
                          {editedOffer.description?.length || 0} znaků
                        </span>
                      </div>
                      <textarea
                        id="edit-desc"
                        rows={10}
                        value={editedOffer.description}
                        onChange={(e) => setEditedOffer({ ...editedOffer, description: e.target.value })}
                        className="w-full resize-y rounded-xl border border-slate-300 bg-white p-3.5 text-xs sm:text-sm leading-relaxed text-slate-950 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all"
                        placeholder="Detailní popis inzerátu (rozměry, vzorek, stav, DOT, osobní odběr)..."
                      />
                    </div>
                  </div>

                  {/* Form Footer Action Buttons */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
                    >
                      Zrušit
                    </button>

                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs sm:text-sm font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-xs disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Ukládám…</span>
                        </>
                      ) : (
                        <>
                          <span>✓</span>
                          <span>Uložit změny</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>

        {/* Mobile-Only Pinned Bottom Action Bar */}
        <div className="sm:hidden shrink-0 border-t border-slate-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_20px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between gap-2.5">
            <div className="shrink-0 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block leading-none">
                Cena
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-black tracking-tight text-slate-950 truncate block">
                  {formatCzk(offer.price)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 active:scale-95 shadow-2xs"
                  >
                    Zrušit
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 whitespace-nowrap"
                  >
                    {saving ? 'Ukládám…' : 'Uložit'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleToggleArchive}
                    disabled={saving}
                    className="rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 shadow-2xs"
                  >
                    {offer.state === 'app_archive' ? 'Aktivovat' : 'Archiv'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 active:scale-95 whitespace-nowrap"
                  >
                    Upravit
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Fullscreen Lightbox for Images */}
      {lightboxOpen && currentImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95"
            aria-label="Zavřít celoobrazovkový náhled"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 active:scale-95"
                aria-label="Předchozí fotka"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 active:scale-95"
                aria-label="Další fotka"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <div
            className="relative h-[85vh] w-[90vw] max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={currentImage}
              alt={offer.title}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {count > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-xs">
              {current + 1} / {count}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
