'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getShopReservations,
  updateShopReservationStatus,
  type ShopReservation,
  type ShopReservationStatus,
} from '@/lib/api';

type StatusFilter = 'all' | ShopReservationStatus;

const STATUS_META: Record<
  ShopReservationStatus,
  { label: string; className: string; buttonClass: string }
> = {
  new: {
    label: 'Nová',
    className: 'bg-amber-50 text-amber-800 ring-amber-200',
    buttonClass: 'bg-amber-50 text-amber-900 ring-amber-200 hover:bg-amber-100',
  },
  contacted: {
    label: 'Kontaktováno',
    className: 'bg-sky-50 text-sky-800 ring-sky-200',
    buttonClass: 'bg-sky-50 text-sky-900 ring-sky-200 hover:bg-sky-100',
  },
  completed: {
    label: 'Vyřízeno',
    className: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    buttonClass: 'bg-emerald-50 text-emerald-900 ring-emerald-200 hover:bg-emerald-100',
  },
  cancelled: {
    label: 'Zrušeno',
    className: 'bg-slate-100 text-slate-600 ring-slate-200',
    buttonClass: 'bg-slate-100 text-slate-700 ring-slate-200 hover:bg-slate-200',
  },
};

const FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: 'all', label: 'Vše' },
  { id: 'new', label: 'Nové' },
  { id: 'contacted', label: 'Kontaktováno' },
  { id: 'completed', label: 'Vyřízeno' },
  { id: 'cancelled', label: 'Zrušeno' },
];

function formatPrice(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${Math.round(value).toLocaleString('cs-CZ')} Kč`;
}

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat('cs-CZ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function pickupLabel(pickup: string | null | undefined): string {
  if (pickup === 'posta') return 'Zaslání poštou';
  if (pickup === 'osobni') return 'Osobní odběr';
  return '—';
}

function statusOf(value: string): ShopReservationStatus {
  if (value === 'contacted' || value === 'completed' || value === 'cancelled') return value;
  return 'new';
}

export default function ReservationsView() {
  const [reservations, setReservations] = useState<ShopReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadReservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getShopReservations();
    if (!result.success) {
      setError(result.error || 'Načtení rezervací selhalo.');
      setReservations([]);
    } else {
      setReservations(result.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  const counts = useMemo(() => {
    const base = { all: reservations.length, new: 0, contacted: 0, completed: 0, cancelled: 0 };
    for (const item of reservations) {
      const status = statusOf(item.status);
      base[status] += 1;
    }
    return base;
  }, [reservations]);

  const visible = useMemo(() => {
    if (filter === 'all') return reservations;
    return reservations.filter((item) => statusOf(item.status) === filter);
  }, [reservations, filter]);

  const handleStatusChange = async (id: string, status: ShopReservationStatus) => {
    setUpdatingId(id);
    const result = await updateShopReservationStatus(id, status);
    if (result.success && result.data) {
      setReservations((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...result.data! } : item))
      );
    } else {
      setError(result.error || 'Aktualizace selhala.');
    }
    setUpdatingId(null);
  };

  return (
    <div className="pb-16">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Rezervace
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 max-w-2xl">
            Rezervace produktů z e-shopu — dohledání, kontakt a odbavení.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadReservations()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        >
          Obnovit
        </button>
      </div>

      <div className="mb-5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map((item) => {
          const active = filter === item.id;
          const count = counts[item.id];
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'bg-slate-950 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {item.label}
              <span className={`ml-1.5 ${active ? 'text-slate-300' : 'text-slate-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
          <p className="mt-3 text-xs font-semibold text-slate-500">Načítám rezervace…</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-16 text-center">
          <p className="text-sm font-semibold text-slate-800">
            {filter === 'all' ? 'Zatím žádné rezervace' : 'Žádné rezervace v tomto stavu'}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            Nové rezervace z e-shopu se zde zobrazí automaticky.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((reservation) => {
            const status = statusOf(reservation.status);
            const meta = STATUS_META[status];
            const busy = updatingId === reservation.id;
            const shopName = reservation.shops?.shop_name;

            return (
              <article
                key={reservation.id}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(reservation.created_at)}</span>
                      {shopName && (
                        <span className="text-xs font-medium text-slate-500">{shopName}</span>
                      )}
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-slate-950">
                        {reservation.offer_title || 'Produkt bez názvu'}
                      </h2>
                      <p className="mt-0.5 text-sm font-semibold text-slate-700">
                        {formatPrice(reservation.offer_price)}
                        <span className="mx-1.5 text-slate-300">·</span>
                        <span className="font-medium text-slate-500">
                          {pickupLabel(reservation.pickup)}
                        </span>
                      </p>
                    </div>

                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                          Zákazník
                        </p>
                        <p className="mt-0.5 font-semibold text-slate-900">
                          {reservation.customer_name || 'Bez jména'}
                        </p>
                        <a
                          href={`tel:${reservation.customer_phone.replace(/\s+/g, '')}`}
                          className="mt-0.5 block text-slate-700 hover:text-slate-950"
                        >
                          {reservation.customer_phone}
                        </a>
                        {reservation.customer_email && (
                          <a
                            href={`mailto:${reservation.customer_email}`}
                            className="mt-0.5 block text-slate-600 hover:text-slate-950"
                          >
                            {reservation.customer_email}
                          </a>
                        )}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                          Adresa
                        </p>
                        <p className="mt-0.5 whitespace-pre-wrap text-slate-700">
                          {reservation.customer_address || '—'}
                        </p>
                        {reservation.note && (
                          <>
                            <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                              Poznámka
                            </p>
                            <p className="mt-0.5 whitespace-pre-wrap text-slate-700">
                              {reservation.note}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 lg:w-44 lg:flex-col lg:items-stretch">
                    {(Object.keys(STATUS_META) as ShopReservationStatus[]).map((nextStatus) => {
                      const nextMeta = STATUS_META[nextStatus];
                      const isCurrent = nextStatus === status;
                      return (
                        <button
                          key={nextStatus}
                          type="button"
                          disabled={busy || isCurrent}
                          onClick={() => void handleStatusChange(reservation.id, nextStatus)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition disabled:cursor-default ${
                            isCurrent
                              ? `${nextMeta.className} opacity-100`
                              : `${nextMeta.buttonClass} opacity-80 disabled:opacity-50`
                          }`}
                        >
                          {busy && !isCurrent ? '…' : nextMeta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
