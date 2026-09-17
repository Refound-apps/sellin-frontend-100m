export function offerStatusLabel(state: string | null | undefined) {
  if (!state) return 'Aktivní';
  if (state === 'app_active' || state === 'app_create') return 'Aktivní';
  if (state === 'app_archive') return 'Archiv';
  return state;
}

export function offerStatusTone(state: string | null | undefined) {
  if (state === 'app_active' || state === 'app_create' || state?.includes('ok_')) {
    return 'bg-[hsl(142_45%_92%)] text-[hsl(142_55%_24%)] ring-[hsl(142_30%_80%)]';
  }
  if (state === 'app_archive') {
    return 'bg-[hsl(210_20%_94%)] text-[hsl(215_16%_38%)] ring-[hsl(214_16%_84%)]';
  }
  if (state?.includes('error_')) {
    return 'bg-[hsl(0_70%_95%)] text-[hsl(0_55%_38%)] ring-[hsl(0_40%_84%)]';
  }
  return 'bg-[hsl(142_45%_92%)] text-[hsl(142_55%_24%)] ring-[hsl(142_30%_80%)]';
}

export interface StatusStyle {
  label: string;
  badge: string;
  dot: string;
}

export function getOfferStatusInfo(state: string | null | undefined): StatusStyle {
  if (state === 'app_archive') {
    return {
      label: 'Archiv',
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    };
  }
  if (state?.includes('error_')) {
    return {
      label: 'Chyba',
      badge: 'bg-rose-50 text-rose-800 border-rose-200/90',
      dot: 'bg-rose-500',
    };
  }
  return {
    label: 'Aktivní',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
    dot: 'bg-emerald-500',
  };
}

export const AUTORENEW_OPTIONS = [
  { value: 'Neobnovovat', label: 'Neobnovovat (pouze jednorázové vystavení)' },
  { value: '1x za 1 den', label: '1x za 1 den' },
  { value: '1x za 4 dny', label: '1x za 4 dny' },
  { value: '1x za 7 dní', label: '1x za 7 dní' },
  { value: '1x za 7 dní vč. TOP', label: '1x za 7 dní vč. TOP' },
  { value: '1x za 10 dní', label: '1x za 10 dní (Doporučeno)' },
  { value: '1x za 10 dní vč. TOP', label: '1x za 10 dní vč. TOP (Nejčastější)' },
  { value: '1x za 13 dní', label: '1x za 13 dní' },
  { value: '1x za 13 dní vč. TOP', label: '1x za 13 dní vč. TOP' },
  { value: '1x za 14 dní', label: '1x za 14 dní' },
  { value: '1x za 14 dní vč. TOP', label: '1x za 14 dní vč. TOP' },
  { value: '1x za 30 dní', label: '1x za 30 dní' },
  { value: '1x za 30 dní vč. TOP', label: '1x za 30 dní vč. TOP' },
  { value: 'Po skončení platnosti inzerátu (60 dní)', label: 'Po skončení platnosti inzerátu (60 dní)' },
];

export function formatOfferDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startThen = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startToday - startThen) / 86_400_000);

  if (diffDays === 0) return 'Dnes';
  if (diffDays === 1) return 'Včera';
  if (diffDays > 1 && diffDays < 7) return `Před ${diffDays} dny`;

  return date.toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatRenewalDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startThen = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startThen - startToday) / 86_400_000);

  if (diffDays === 0) return 'Dnes';
  if (diffDays === 1) return 'Zítra';
  if (diffDays > 1 && diffDays < 7) return `Za ${diffDays} dní`;
  if (diffDays === -1) return 'Včera';
  if (diffDays < -1 && diffDays > -7) return `Před ${Math.abs(diffDays)} dny`;

  return date.toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatOfferDateTime(dateString: string) {
  return new Date(dateString).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  const clean = String(phone).replace(/\s+/g, '');
  if (clean.length === 9) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)}`;
  }
  if (clean.startsWith('+420') && clean.length === 13) {
    return `+420 ${clean.slice(4, 7)} ${clean.slice(7, 10)} ${clean.slice(10, 13)}`;
  }
  if (clean.length > 6) {
    return clean.replace(/(\d{3})(?=\d)/g, '$1 ');
  }
  return clean;
}

export function formatPhoneHref(phone: string | null | undefined): string {
  if (!phone) return '';
  const clean = String(phone).replace(/\s+/g, '');
  return clean.startsWith('+') ? `tel:${clean}` : `tel:+420${clean}`;
}
