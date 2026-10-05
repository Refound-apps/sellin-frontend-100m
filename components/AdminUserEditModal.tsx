'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from '@/lib/types';
import { updateCredential } from '@/lib/api';
import { formatPhoneNumber } from './offerStatus';
import { formatDateTime } from './TransactionsView';

function statusInfo(status: string | null) {
  if (status === 'OK') {
    return {
      label: 'Stav OK',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
      dot: 'bg-emerald-500',
    };
  }
  if (status && status.toLowerCase().includes('not working')) {
    return {
      label: 'Chyba spojení',
      badge: 'bg-rose-50 text-rose-800 border-rose-200/90',
      dot: 'bg-rose-500',
    };
  }
  return {
    label: status || 'Neznámý stav',
    badge: 'bg-slate-50 text-slate-700 border-slate-200/90',
    dot: 'bg-slate-400',
  };
}

type FormState = {
  email: string;
  bazos_name: string;
  telephone1: string;
  telephone2: string;
  location: string;
  zipcode: string;
  zipcode_sk: string;
  tier: string;
  bazos_email: string;
  bazos_password: string;
  bazos_bkod: string;
  bazos_sk_bkod: string;
  status_cz: string;
  status_sk: string;
  bazos_rewrite: boolean;
  bazos_top_max: string;
  sbazar_email: string;
  sbazar_password: string;
  sbazar_cookie_ds: string;
  sbazar_profile: string;
  proxy_ip: string;
  proxy_ip_sbazar: string;
  facebook_email: string;
  facebook_password: string;
  facebook_cuser: string;
  facebook_xs: string;
};

function toForm(user: User): FormState {
  return {
    email: user.email || '',
    bazos_name: user.bazos_name || '',
    telephone1: user.telephone1 || '',
    telephone2: user.telephone2 || '',
    location: user.location || '',
    zipcode: user.zipcode != null ? String(user.zipcode) : '',
    zipcode_sk: user.zipcode_sk || '',
    tier: user.tier || '',
    bazos_email: user.bazos_email || '',
    bazos_password: user.bazos_password || '',
    bazos_bkod: user.bazos_bkod || '',
    bazos_sk_bkod: user.bazos_sk_bkod || '',
    status_cz: user.status_cz || 'OK',
    status_sk: user.status_sk || '',
    bazos_rewrite: user.bazos_rewrite ?? true,
    bazos_top_max: user.bazos_top_max != null ? String(user.bazos_top_max) : '0',
    sbazar_email: user.sbazar_email || '',
    sbazar_password: user.sbazar_password || '',
    sbazar_cookie_ds: user.sbazar_cookie_ds || '',
    sbazar_profile: user.sbazar_profile || '',
    proxy_ip: user.proxy_ip || '',
    proxy_ip_sbazar: user.proxy_ip_sbazar || '',
    facebook_email: user.facebook_email || '',
    facebook_password: user.facebook_password || '',
    facebook_cuser: user.facebook_cuser || '',
    facebook_xs: user.facebook_xs || '',
  };
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      {children}
      {hint ? <span className="block text-[10px] text-slate-400">{hint}</span> : null}
    </label>
  );
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-slate-400';

export default function AdminUserEditModal({
  user,
  onClose,
  onSaved,
}: {
  user: User;
  onClose: () => void;
  onSaved: (updated: User) => void;
}) {
  const [form, setForm] = useState<FormState>(() => toForm(user));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  useEffect(() => {
    setForm(toForm(user));
    setError(null);
    setSuccess(false);
  }, [user.id]);

  const set = (key: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
  };

  const onSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const updated = await updateCredential(user.id, {
        email: form.email.trim(),
        bazos_name: form.bazos_name.trim() || null,
        telephone1: form.telephone1.trim() || null,
        telephone2: form.telephone2.trim() || null,
        location: form.location.trim() || null,
        zipcode: form.zipcode.trim() || null,
        zipcode_sk: form.zipcode_sk.trim() || null,
        tier: form.tier.trim() || null,
        bazos_email: form.bazos_email.trim() || null,
        bazos_password: form.bazos_password || null,
        bazos_bkod: form.bazos_bkod.trim() || null,
        bazos_sk_bkod: form.bazos_sk_bkod.trim() || null,
        status_cz: form.status_cz.trim() || 'OK',
        status_sk: form.status_sk.trim() || null,
        bazos_rewrite: form.bazos_rewrite,
        bazos_top_max: form.bazos_top_max.trim() ? Number(form.bazos_top_max) : 0,
        sbazar_email: form.sbazar_email.trim() || null,
        sbazar_password: form.sbazar_password || null,
        sbazar_cookie_ds: form.sbazar_cookie_ds.trim() || null,
        sbazar_profile: form.sbazar_profile.trim() || null,
        proxy_ip: form.proxy_ip.trim() || null,
        proxy_ip_sbazar: form.proxy_ip_sbazar.trim() || null,
        facebook_email: form.facebook_email.trim() || null,
        facebook_password: form.facebook_password || null,
        facebook_cuser: form.facebook_cuser.trim() || null,
        facebook_xs: form.facebook_xs.trim() || null,
      });
      onSaved({
        ...user,
        ...updated,
        last_sign_in_at: user.last_sign_in_at,
        error_count: user.error_count,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Uložení selhalo');
    } finally {
      setSaving(false);
    }
  };

  const sInfo = statusInfo(form.status_cz);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-xs sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-slate-950">
              {form.bazos_name || 'Účet prodejce'}
            </h3>
            <p className="truncate text-xs text-slate-500">{form.email}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span>#{user.id}</span>
              <span>·</span>
              <span>
                Login:{' '}
                {user.last_sign_in_at
                  ? formatDateTime(user.last_sign_in_at).relative
                  : 'nikdy / bez auth'}
              </span>
              <span>·</span>
              <span className={user.error_count ? 'font-bold text-rose-700' : ''}>
                Errory: {user.error_count ?? 0}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${sInfo.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${sInfo.dot}`} />
              {sInfo.label}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Zavřít"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              Uloženo.
            </div>
          )}

          <section className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Kontakt & účet
              </h4>
              <button
                type="button"
                onClick={() => setShowSecrets((v) => !v)}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900"
              >
                {showSecrets ? 'Skrýt hesla/cookies' : 'Zobrazit hesla/cookies'}
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="E-mail účtu">
                <input className={inputCls} value={form.email} onChange={(e) => set('email', e.target.value)} />
              </Field>
              <Field label="Jméno (bazos_name)">
                <input
                  className={inputCls}
                  value={form.bazos_name}
                  onChange={(e) => set('bazos_name', e.target.value)}
                />
              </Field>
              <Field label="Telefon 1">
                <input
                  className={inputCls}
                  value={form.telephone1}
                  onChange={(e) => set('telephone1', e.target.value)}
                  placeholder={form.telephone1 ? formatPhoneNumber(form.telephone1) : ''}
                />
              </Field>
              <Field label="Telefon 2">
                <input
                  className={inputCls}
                  value={form.telephone2}
                  onChange={(e) => set('telephone2', e.target.value)}
                />
              </Field>
              <Field label="Lokalita">
                <input
                  className={inputCls}
                  value={form.location}
                  onChange={(e) => set('location', e.target.value)}
                />
              </Field>
              <Field label="PSČ CZ">
                <input
                  className={inputCls}
                  value={form.zipcode}
                  onChange={(e) => set('zipcode', e.target.value)}
                />
              </Field>
              <Field label="PSČ SK">
                <input
                  className={inputCls}
                  value={form.zipcode_sk}
                  onChange={(e) => set('zipcode_sk', e.target.value)}
                />
              </Field>
              <Field label="Tier">
                <input className={inputCls} value={form.tier} onChange={(e) => set('tier', e.target.value)} />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
            <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Bazoš.cz / SK
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Bazoš e-mail">
                <input
                  className={inputCls}
                  value={form.bazos_email}
                  onChange={(e) => set('bazos_email', e.target.value)}
                />
              </Field>
              <Field label="Bazoš heslo">
                <input
                  className={inputCls}
                  type={showSecrets ? 'text' : 'password'}
                  value={form.bazos_password}
                  onChange={(e) => set('bazos_password', e.target.value)}
                />
              </Field>
              <Field label="bazos_bkod (CZ cookie)" hint="Session B-kód pro Bazoš.cz">
                <input
                  className={inputCls}
                  value={form.bazos_bkod}
                  onChange={(e) => set('bazos_bkod', e.target.value)}
                />
              </Field>
              <Field label="bazos_sk_bkod (SK cookie)">
                <input
                  className={inputCls}
                  value={form.bazos_sk_bkod}
                  onChange={(e) => set('bazos_sk_bkod', e.target.value)}
                />
              </Field>
              <Field label="status_cz">
                <select
                  className={inputCls}
                  value={form.status_cz}
                  onChange={(e) => set('status_cz', e.target.value)}
                >
                  <option value="OK">OK</option>
                  <option value="Not working">Not working</option>
                  <option value="">—</option>
                </select>
              </Field>
              <Field label="status_sk">
                <select
                  className={inputCls}
                  value={form.status_sk}
                  onChange={(e) => set('status_sk', e.target.value)}
                >
                  <option value="OK">OK</option>
                  <option value="Not working">Not working</option>
                  <option value="">—</option>
                </select>
              </Field>
              <Field label="bazos_top_max">
                <input
                  className={inputCls}
                  value={form.bazos_top_max}
                  onChange={(e) => set('bazos_top_max', e.target.value)}
                />
              </Field>
              <label className="flex items-center gap-2 pt-5 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.bazos_rewrite}
                  onChange={(e) => set('bazos_rewrite', e.target.checked)}
                />
                bazos_rewrite
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
            <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Sbazar + proxy
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="sbazar_email">
                <input
                  className={inputCls}
                  value={form.sbazar_email}
                  onChange={(e) => set('sbazar_email', e.target.value)}
                />
              </Field>
              <Field label="sbazar_password">
                <input
                  className={inputCls}
                  type={showSecrets ? 'text' : 'password'}
                  value={form.sbazar_password}
                  onChange={(e) => set('sbazar_password', e.target.value)}
                />
              </Field>
              <Field label="sbazar_cookie_ds" hint="Cookie DS">
                <input
                  className={inputCls}
                  type={showSecrets ? 'text' : 'password'}
                  value={form.sbazar_cookie_ds}
                  onChange={(e) => set('sbazar_cookie_ds', e.target.value)}
                />
              </Field>
              <Field label="sbazar_profile URL">
                <input
                  className={inputCls}
                  value={form.sbazar_profile}
                  onChange={(e) => set('sbazar_profile', e.target.value)}
                />
              </Field>
              <Field label="proxy_ip (Bazoš)">
                <input
                  className={inputCls}
                  value={form.proxy_ip}
                  onChange={(e) => set('proxy_ip', e.target.value)}
                />
              </Field>
              <Field label="proxy_ip_sbazar">
                <input
                  className={inputCls}
                  value={form.proxy_ip_sbazar}
                  onChange={(e) => set('proxy_ip_sbazar', e.target.value)}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4">
            <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Facebook
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="facebook_email">
                <input
                  className={inputCls}
                  value={form.facebook_email}
                  onChange={(e) => set('facebook_email', e.target.value)}
                />
              </Field>
              <Field label="facebook_password">
                <input
                  className={inputCls}
                  type={showSecrets ? 'text' : 'password'}
                  value={form.facebook_password}
                  onChange={(e) => set('facebook_password', e.target.value)}
                />
              </Field>
              <Field label="facebook_cuser">
                <input
                  className={inputCls}
                  value={form.facebook_cuser}
                  onChange={(e) => set('facebook_cuser', e.target.value)}
                />
              </Field>
              <Field label="facebook_xs">
                <input
                  className={inputCls}
                  type={showSecrets ? 'text' : 'password'}
                  value={form.facebook_xs}
                  onChange={(e) => set('facebook_xs', e.target.value)}
                />
              </Field>
            </div>
          </section>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 sm:px-6">
          <Link
            href={`/?account=${encodeURIComponent(user.email)}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Nabídka →
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Zavřít
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void onSave()}
              className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? 'Ukládám…' : 'Uložit změny'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
