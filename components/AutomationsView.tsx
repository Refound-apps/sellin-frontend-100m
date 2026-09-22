'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CronJob, CronJobLog, CronActionType, CronTriggerType, User } from '@/lib/types';
import {
  getCronJobs,
  createCronJob,
  updateCronJob,
  deleteCronJob,
  runCronJobNow,
  getCronJobLogs,
  getUsers,
} from '@/lib/api';
import { formatDateTime } from './TransactionsView';

const SCHEDULE_PRESETS = [
  { id: 'daily_21', label: 'Každý večer ve 21:00', cron: '0 21 * * *' },
  { id: 'daily_08', label: 'Každé ráno v 08:00', cron: '0 8 * * *' },
  { id: 'daily_12', label: 'Každý den v poledne (12:00)', cron: '0 12 * * *' },
  { id: 'every_6h', label: 'Každých 6 hodin', cron: '0 */6 * * *' },
  { id: 'every_hour', label: 'Každou celou hodinu', cron: '0 * * * *' },
  { id: 'weekly_mon', label: 'Každé pondělí ráno v 07:00', cron: '0 7 * * 1' },
  { id: 'manual', label: 'Pouze manuálně (App Action)', cron: '0 0 * * *' },
  { id: 'custom', label: 'Vlastní Cron výraz', cron: '' },
];

const ACTION_TYPES: { id: CronActionType; label: string; desc: string; icon: string; badgeColor: string }[] = [
  {
    id: 'renew_sbazar',
    label: 'Obnova Sbazar (Sbazar.cz)',
    desc: 'Odešle batch request s inzeráty k obnovení na Sbazaru',
    icon: '🔄',
    badgeColor: 'bg-rose-500/10 text-rose-700 border-rose-200',
  },
  {
    id: 'renew_bazos',
    label: 'Obnova Bazoš (Bazoš.cz)',
    desc: 'Odešle inzeráty k obnově + automaticky přiřadí vouchery pro TOP',
    icon: '⚡',
    badgeColor: 'bg-amber-500/10 text-amber-700 border-amber-200',
  },
  {
    id: 'renew_bazos_sk',
    label: 'Obnova Bazoš.sk (Slovensko)',
    desc: 'Pravidelná obnova inzerátů pro slovenské pobočky a účty',
    icon: '🇸🇰',
    badgeColor: 'bg-blue-500/10 text-blue-700 border-blue-200',
  },
  {
    id: 'recreate_bazos',
    label: 'Pře-vytvořit Bazoš (Recreate)',
    desc: 'Vymaže a znovu založí inzeráty jako zbrusu nové (nové ID/odkazy)',
    icon: '✨',
    badgeColor: 'bg-indigo-500/10 text-indigo-700 border-indigo-200',
  },
  {
    id: 'recreate_sbazar',
    label: 'Pře-vytvořit Sbazar (Recreate)',
    desc: 'Kompletní znovuvytvoření inzerátů pro čerstvé indexování',
    icon: '✨',
    badgeColor: 'bg-purple-500/10 text-purple-700 border-purple-200',
  },
  {
    id: 'api_request',
    label: 'Vlastní backend webhook / API akce',
    desc: 'Volání jakékoliv routy na backendu (GET/POST s parametry)',
    icon: '🔌',
    badgeColor: 'bg-slate-500/10 text-slate-700 border-slate-200',
  },
];

export default function AutomationsView() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [logs, setLogs] = useState<CronJobLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | CronActionType>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal pro tvorbu / editaci úlohy
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<CronJob | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formTriggerType, setFormTriggerType] = useState<CronTriggerType>('cron');
  const [formSchedulePreset, setFormSchedulePreset] = useState('daily_21');
  const [formScheduleCron, setFormScheduleCron] = useState('0 21 * * *');
  const [formActionType, setFormActionType] = useState<CronActionType>('renew_sbazar');
  const [formTargetEmails, setFormTargetEmails] = useState<string[]>([]);
  const [formMaxItems, setFormMaxItems] = useState<number>(40);
  const [formWithDelay, setFormWithDelay] = useState(false);
  const [formAutotop, setFormAutotop] = useState(false);
  const [formCustomEndpoint, setFormCustomEndpoint] = useState('/testsellin');
  const [formCustomMethod, setFormCustomMethod] = useState<'GET' | 'POST'>('POST');
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Email input pomocný stav v modalu
  const [emailInput, setEmailInput] = useState('');

  // Toast / oznámení
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobsData, logsData, usersData] = await Promise.all([
        getCronJobs().catch(() => []),
        getCronJobLogs().catch(() => []),
        getUsers().catch(() => []),
      ]);
      setJobs(jobsData);
      setLogs(logsData);
      setUsers(usersData);
    } catch (err: any) {
      showNotification(err.message || 'Chyba při načítání dat', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Otevření modalu pro novou úlohu
  const handleOpenCreateModal = () => {
    setEditingJob(null);
    setFormName('');
    setFormDesc('');
    setFormIsActive(true);
    setFormTriggerType('cron');
    setFormSchedulePreset('daily_21');
    setFormScheduleCron('0 21 * * *');
    setFormActionType('renew_sbazar');
    setFormTargetEmails([]);
    setFormMaxItems(40);
    setFormWithDelay(false);
    setFormAutotop(false);
    setFormCustomEndpoint('/testsellin');
    setFormCustomMethod('POST');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Otevření modalu pro editaci existující úlohy
  const handleOpenEditModal = (job: CronJob) => {
    setEditingJob(job);
    setFormName(job.name);
    setFormDesc(job.description || '');
    setFormIsActive(job.is_active);
    setFormTriggerType(job.trigger_type);
    setFormSchedulePreset(job.schedule_preset || 'daily_21');
    setFormScheduleCron(job.schedule_cron);
    setFormActionType(job.action_type);
    setFormTargetEmails(job.target_emails || []);
    setFormMaxItems(job.max_items || 40);
    setFormWithDelay(Boolean(job.settings?.with_delay));
    setFormAutotop(Boolean(job.settings?.autotop));
    setFormCustomEndpoint(job.settings?.endpoint || '/testsellin');
    setFormCustomMethod(job.settings?.method || 'POST');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handlePresetChange = (presetId: string) => {
    setFormSchedulePreset(presetId);
    if (presetId === 'manual') {
      setFormTriggerType('manual');
      setFormScheduleCron('0 0 * * *');
    } else if (presetId !== 'custom') {
      setFormTriggerType('cron');
      const found = SCHEDULE_PRESETS.find((p) => p.id === presetId);
      if (found?.cron) {
        setFormScheduleCron(found.cron);
      }
    }
  };

  const handleAddEmail = (emailToAdd: string) => {
    const clean = emailToAdd.trim().toLowerCase();
    if (!clean) return;
    if (!formTargetEmails.includes(clean)) {
      setFormTargetEmails([...formTargetEmails, clean]);
    }
    setEmailInput('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setFormTargetEmails(formTargetEmails.filter((e) => e !== emailToRemove));
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Zadejte prosím název automatizace.');
      return;
    }

    setFormSaving(true);
    setFormError(null);

    try {
      const preset = SCHEDULE_PRESETS.find((p) => p.id === formSchedulePreset);
      const scheduleHuman =
        formTriggerType === 'manual'
          ? 'Na vyžádání (manuálně)'
          : preset && preset.id !== 'custom'
          ? preset.label
          : `Cron výraz: ${formScheduleCron}`;

      const payload: Partial<CronJob> = {
        name: formName.trim(),
        description: formDesc.trim() || null,
        is_active: formIsActive,
        trigger_type: formTriggerType,
        schedule_cron: formScheduleCron,
        schedule_preset: formSchedulePreset,
        schedule_human: scheduleHuman,
        action_type: formActionType,
        target_emails: formTargetEmails,
        max_items: Number(formMaxItems) || 40,
        settings: {
          with_delay: formWithDelay,
          autotop: formAutotop,
          ...(formActionType === 'api_request'
            ? { endpoint: formCustomEndpoint, method: formCustomMethod }
            : {}),
        },
      };

      if (editingJob) {
        const updated = await updateCronJob(editingJob.id, payload);
        setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
        showNotification(`Úloha "${updated.name}" byla úspěšně upravena.`);
      } else {
        const created = await createCronJob(payload);
        setJobs((prev) => [created, ...prev]);
        showNotification(`Automatizace "${created.name}" byla vytvořena.`);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Chyba při ukládání');
    } finally {
      setFormSaving(false);
    }
  };

  // Rychlé zapnutí/vypnutí
  const handleToggleActive = async (job: CronJob, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = !job.is_active;
    try {
      const updated = await updateCronJob(job.id, { is_active: newStatus });
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
      showNotification(
        `Úloha "${job.name}" byla ${newStatus ? 'aktivována' : 'pozastavena'}.`
      );
    } catch (err: any) {
      showNotification(err.message || 'Nepodařilo se změnit stav', 'error');
    }
  };

  // Smazání úlohy
  const handleDeleteJob = async (job: CronJob, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Opravdu chcete smazat automatizaci "${job.name}"?`)) {
      return;
    }
    try {
      await deleteCronJob(job.id);
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      if (selectedJobId === job.id) setSelectedJobId(null);
      showNotification(`Úloha "${job.name}" byla smazána.`);
    } catch (err: any) {
      showNotification(err.message || 'Chyba při mazání úlohy', 'error');
    }
  };

  // Okamžité spuštění (Spustit nyní)
  const handleRunNow = async (job: CronJob, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRunningJobId(job.id);
    showNotification(`Spouštím úlohu "${job.name}"... Vyčkejte.`);

    try {
      const result = await runCronJobNow(job.id);
      showNotification(result.message || `Úloha "${job.name}" proběhla úspěšně!`);
      // Znovu načteme úlohy a logy
      const [refreshedJobs, refreshedLogs] = await Promise.all([
        getCronJobs().catch(() => jobs),
        getCronJobLogs().catch(() => logs),
      ]);
      setJobs(refreshedJobs);
      setLogs(refreshedLogs);
    } catch (err: any) {
      showNotification(err.message || `Chyba při běhu úlohy "${job.name}"`, 'error');
    } finally {
      setRunningJobId(null);
    }
  };

  // Filtrované úlohy
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (activeFilter === 'active' && !job.is_active) return false;
      if (activeFilter === 'inactive' && job.is_active) return false;
      if (actionFilter !== 'all' && job.action_type !== actionFilter) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesName = job.name.toLowerCase().includes(q);
        const matchesDesc = (job.description || '').toLowerCase().includes(q);
        const matchesEmails = (job.target_emails || []).some((e) => e.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesEmails) return false;
      }
      return true;
    });
  }, [jobs, activeFilter, actionFilter, search]);

  // Statistiky
  const stats = useMemo(() => {
    return {
      total: jobs.length,
      active: jobs.filter((j) => j.is_active).length,
      sbazar: jobs.filter((j) => j.action_type.includes('sbazar')).length,
      bazos: jobs.filter((j) => j.action_type.includes('bazos')).length,
    };
  }, [jobs]);

  return (
    <div className="space-y-8">
      {/* Notifikace toast */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl transition-all animate-in fade-in slide-in-from-bottom-5 ${
            notification.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-900'
              : 'border-emerald-200 bg-emerald-50 text-emerald-900'
          }`}
        >
          <span>{notification.type === 'error' ? '❌' : '✅'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Horní hlavička */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Automatizace & Cron
            </h1>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200">
              Admin nástroj
            </span>
          </div>
          <p className="mt-1.5 text-sm text-slate-500">
            Jednoduchá správa pravidelných cron úloh, nočních obnov inzerátů (Bazoš, Sbazar) a synchronizací.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            title="Obnovit data"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-950 disabled:opacity-50"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            Obnovit
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-98"
          >
            <span>➕</span>
            Vytvořit automatizaci
          </button>
        </div>
      </div>

      {/* Souhrnné statistické karty */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Celkem úloh</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{stats.total}</p>
          <div className="mt-2 text-[11px] font-medium text-slate-400">Všechny nakonfigurované úlohy</div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-2xs">
          <p className="text-xs font-medium text-emerald-700">Aktivní cron úlohy</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-950">{stats.active}</p>
          <div className="mt-2 text-[11px] font-medium text-emerald-600">Běží v nastavených časech</div>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-5 shadow-2xs">
          <p className="text-xs font-medium text-rose-700">Sbazar automatizace</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-rose-950">{stats.sbazar}</p>
          <div className="mt-2 text-[11px] font-medium text-rose-600">Noční a odložené obnovy</div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 shadow-2xs">
          <p className="text-xs font-medium text-amber-700">Bazoš automatizace</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-amber-950">{stats.bazos}</p>
          <div className="mt-2 text-[11px] font-medium text-amber-600">Včetně TOP a multi-vouchery</div>
        </div>
      </div>

      {/* Vyhledávání a filtry */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hledat podle názvu, účtu, e-mailu..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtr podle stavu */}
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-slate-400"
          >
            <option value="all">Všechny stavy</option>
            <option value="active">Pouze aktivní</option>
            <option value="inactive">Pozastavené</option>
          </select>

          {/* Filtr podle typu akce */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-slate-400"
          >
            <option value="all">Všechny typy akcí</option>
            <option value="renew_sbazar">Obnova Sbazar</option>
            <option value="renew_bazos">Obnova Bazoš</option>
            <option value="renew_bazos_sk">Obnova Bazoš.sk</option>
            <option value="recreate_bazos">Pře-vytvořit Bazoš</option>
            <option value="recreate_sbazar">Pře-vytvořit Sbazar</option>
            <option value="api_request">API Webhook</option>
          </select>
        </div>
      </div>

      {/* Seznam automatizací */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white py-16 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
            <p className="mt-3 text-xs font-semibold text-slate-500">Načítám automatizace…</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <span className="text-3xl">⚙️</span>
            <h3 className="mt-2 text-sm font-semibold text-slate-900">Nenalezeny žádné automatizace</h3>
            <p className="mt-1 text-xs text-slate-500">
              {search || actionFilter !== 'all' || activeFilter !== 'all'
                ? 'Zkuste upravit nebo resetovat filtry'
                : 'Začněte vytvořením své první pravidelné úlohy na obnovu inzerátů'}
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              <span>➕</span> Vytvořit první automatizaci
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredJobs.map((job) => {
              const actionMeta = ACTION_TYPES.find((a) => a.id === job.action_type);
              const isRunning = runningJobId === job.id;

              return (
                <div
                  key={job.id}
                  onClick={() => handleOpenEditModal(job)}
                  className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-2xs transition-all hover:border-slate-300 hover:shadow-md cursor-pointer ${
                    !job.is_active ? 'opacity-70 bg-slate-50/50' : ''
                  }`}
                >
                  <div>
                    {/* Horní řádek: Ikona, název a aktivní switch */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
                          {actionMeta?.icon || '⚙️'}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-950 group-hover:text-indigo-600 transition-colors">
                            {job.name}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                                actionMeta?.badgeColor || 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {actionMeta?.label || job.action_type}
                            </span>
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                              {job.schedule_human || job.schedule_cron}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tlačítko On/Off */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleActive(job, e)}
                        title={job.is_active ? 'Pozastavit úlohu' : 'Aktivovat úlohu'}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          job.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            job.is_active ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Popis */}
                    {job.description && (
                      <p className="mt-3 text-xs leading-relaxed text-slate-600 line-clamp-2">
                        {job.description}
                      </p>
                    )}

                    {/* Nastavení a parametry */}
                    <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 space-y-1.5 border border-slate-100">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Cílové účty:</span>
                        <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]" title={job.target_emails?.join(', ')}>
                          {job.target_emails && job.target_emails.length > 0
                            ? job.target_emails.join(', ')
                            : 'Všechny účty'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Limit / dávka:</span>
                        <span className="font-semibold text-slate-800">max {job.max_items} inzerátů</span>
                      </div>
                      {job.settings?.with_delay && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Náhodné zpoždění:</span>
                          <span className="font-semibold text-amber-700">Aktivní (0–90 min ochrana)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Spodní řádek: Poslední běh a akční tlačítka */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-400 truncate">
                      {job.last_run_at ? (
                        <span>
                          Poslední běh: <strong className="text-slate-700">{formatDateTime(job.last_run_at).relative}</strong>
                        </span>
                      ) : (
                        <span>Zatím nespuštěno</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleRunNow(job, e)}
                        disabled={isRunning}
                        title="Spustit automatizaci ihned"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 active:scale-95 transition-all disabled:opacity-50"
                      >
                        <span className={isRunning ? 'animate-spin' : ''}>⚡</span>
                        {isRunning ? 'Běží...' : 'Spustit hned'}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteJob(job, e)}
                        title="Smazat automatizaci"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historie běhů / Logy */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Historie spuštění a logy</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Přehled posledních automatických a manuálních volání přes backend API
            </p>
          </div>
          <button
            onClick={async () => {
              const refreshed = await getCronJobLogs().catch(() => []);
              setLogs(refreshed);
            }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Obnovit logy
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="mt-6 py-8 text-center text-xs text-slate-400">
            Zatím nejsou zaznamenány žádné spuštěné úlohy.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="pb-3 pt-1">Úloha</th>
                  <th className="pb-3 pt-1">Spouštěč</th>
                  <th className="pb-3 pt-1">Stav</th>
                  <th className="pb-3 pt-1">Inzerátů</th>
                  <th className="pb-3 pt-1">Trvání</th>
                  <th className="pb-3 pt-1">Čas spuštění</th>
                  <th className="pb-3 pt-1">Výsledek / Zpráva</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {logs.slice(0, 20).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 font-semibold text-slate-900">{log.job_name}</td>
                    <td className="py-3">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                        {log.triggered_by === 'cron' ? '⏰ Plánovač' : '👤 Manuální admin'}
                      </span>
                    </td>
                    <td className="py-3">
                      {log.status === 'success' && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          ● Úspěch
                        </span>
                      )}
                      {log.status === 'running' && (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-semibold animate-pulse">
                          ● Probíhá...
                        </span>
                      )}
                      {log.status === 'error' && (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                          ● Chyba
                        </span>
                      )}
                    </td>
                    <td className="py-3">{log.processed_count || 0} ks</td>
                    <td className="py-3 text-slate-500">
                      {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : '—'}
                    </td>
                    <td className="py-3 text-slate-500">{formatDateTime(log.started_at).formatted}</td>
                    <td className="py-3 text-slate-600 max-w-xs truncate" title={log.message || ''}>
                      {log.message || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL PRO VYTVOŘENÍ / EDITACI AUTOMATIZACE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl transition-all my-8 max-h-[90vh] overflow-y-auto">
            {/* Hlavička modalu */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingJob ? 'Upravit automatizaci' : 'Nová automatizace / Cron úloha'}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Nastavte časování a parametry odesílaných požadavků na backend
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveJob} className="mt-5 space-y-5">
              {/* Název úlohy */}
              <div>
                <label className="block text-xs font-bold text-slate-700">Název automatizace *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="např. SBAZAR - DUPLUX - RENEWAL"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-indigo-600"
                />
              </div>

              {/* Popis */}
              <div>
                <label className="block text-xs font-bold text-slate-700">Popis / Poznámka (volitelné)</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="např. Každodenní večerní obnova inzerátů z duplux účtu"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-indigo-600"
                />
              </div>

              {/* Typ akce */}
              <div>
                <label className="block text-xs font-bold text-slate-700">Typ akce / Operace na backendu *</label>
                <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {ACTION_TYPES.map((act) => {
                    const isSelected = formActionType === act.id;
                    return (
                      <div
                        key={act.id}
                        onClick={() => setFormActionType(act.id)}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xl">{act.icon}</span>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{act.label}</div>
                          <div className="mt-0.5 text-[11px] text-slate-500 leading-snug">{act.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Časování / Spouštěč */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
                <label className="block text-xs font-bold text-slate-800">Plán spouštění (Kdy se má provést)</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {SCHEDULE_PRESETS.map((preset) => (
                    <label
                      key={preset.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                        formSchedulePreset === preset.id
                          ? 'border-indigo-600 bg-white font-semibold text-indigo-900 shadow-2xs'
                          : 'border-slate-200 bg-white/70 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="schedule_preset"
                        checked={formSchedulePreset === preset.id}
                        onChange={() => handlePresetChange(preset.id)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{preset.label}</span>
                    </label>
                  ))}
                </div>

                {formSchedulePreset === 'custom' && (
                  <div className="mt-2">
                    <label className="block text-[11px] font-semibold text-slate-600">Cron výraz (min hod den měs denvtýdnu):</label>
                    <input
                      type="text"
                      value={formScheduleCron}
                      onChange={(e) => setFormScheduleCron(e.target.value)}
                      placeholder="0 21 * * *"
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 outline-none focus:border-indigo-600"
                    />
                  </div>
                )}
              </div>

              {/* Cílové účty (E-maily) */}
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Cílové e-mailové účty (pro které inzeráty provést akci)
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Můžete vybrat z registrovaných prodejců nebo zadat konkrétní e-mail. Pokud nezadáte žádný, platí pro všechny účty.
                </p>

                {/* Vybrané e-maily (tagy) */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {formTargetEmails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800 border border-slate-200"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                {/* Vkládací řádek a našeptávač */}
                <div className="mt-2 flex gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEmail(emailInput);
                      }
                    }}
                    placeholder="Zadejte e-mail a stiskněte Enter..."
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddEmail(emailInput)}
                    className="rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Přidat
                  </button>
                </div>

                {/* Rychlý výběr existujících účtů */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-400">Rychlý výběr:</span>
                  {users.slice(0, 6).map((u) => (
                    <button
                      type="button"
                      key={u.email}
                      onClick={() => handleAddEmail(u.email)}
                      className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition"
                    >
                      + {u.email}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dodatečné parametry */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Max inzerátů na běh</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={formMaxItems}
                    onChange={(e) => setFormMaxItems(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">Běžně 40–50 inzerátů na jednu dávku.</p>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={formWithDelay}
                      onChange={(e) => setFormWithDelay(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Ochrana proti blokaci (náhodné zpoždění 0–90 min)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={formAutotop}
                      onChange={(e) => setFormAutotop(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Automaticky topovat inzeráty z voucherů</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Úloha je aktivní</span>
                  </label>
                </div>
              </div>

              {/* Tlačítka pro uložení modalu */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  {formSaving ? 'Ukládám…' : editingJob ? 'Uložit změny' : 'Vytvořit automatizaci'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
