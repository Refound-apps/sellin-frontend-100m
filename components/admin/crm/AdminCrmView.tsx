'use client';

import { useState, useEffect, useMemo, useCallback, FormEvent } from 'react';
import { CrmLead, CrmStats, CrmWorklistBucket, CrmWorklistBuckets } from '@/lib/types';
import { getCrmLeads, updateCrmLead, createCrmLead, GetCrmLeadsResponse } from '@/lib/api';

const WORKLIST_BUCKETS: {
  id: CrmWorklistBucket | 'all';
  label: string;
  hint: string;
  dot: string;
}[] = [
  { id: 'all', label: 'Celý den', hint: 'prioritní fronta', dot: 'bg-slate-950' },
  { id: 'stuck', label: '1 · Stuck', hint: 'onboarding + trial', dot: 'bg-sky-500' },
  { id: 'warm', label: '2 · Warm', hint: 'v jednání', dot: 'bg-amber-500' },
  { id: 'contacted', label: '3 · Osloveno', hint: 'callback', dot: 'bg-slate-500' },
  { id: 'cold_a', label: '4 · Cold A', hint: '4 verticals', dot: 'bg-emerald-500' },
];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadDoneToday(): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(`crm-worklist-done-${todayKey()}`);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as number[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveDoneToday(ids: Set<number>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`crm-worklist-done-${todayKey()}`, JSON.stringify([...ids]));
}

const STAGE_CONFIG: Record<
  string,
  { label: string; short: string; badge: string; dot: string; desc: string }
> = {
  won: {
    label: 'Získáno',
    short: 'Won',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    dot: 'bg-emerald-500',
    desc: 'Platící klient',
  },
  onboarding: {
    label: 'Onboarding',
    short: 'Onboard',
    badge: 'bg-sky-50 text-sky-800 border-sky-200/80',
    dot: 'bg-sky-500',
    desc: 'Nasazuje se',
  },
  trial: {
    label: 'Trial',
    short: 'Trial',
    badge: 'bg-violet-50 text-violet-800 border-violet-200/80',
    dot: 'bg-violet-500',
    desc: 'Zkušební období',
  },
  warm: {
    label: 'V jednání',
    short: 'Warm',
    badge: 'bg-amber-50 text-amber-900 border-amber-200/80',
    dot: 'bg-amber-500',
    desc: 'Zájem / callback',
  },
  contacted: {
    label: 'Osloveno',
    short: 'Call',
    badge: 'bg-slate-100 text-slate-800 border-slate-200/80',
    dot: 'bg-slate-500',
    desc: '1. hovor / mail',
  },
  lead: {
    label: 'Nový lead',
    short: 'Lead',
    badge: 'bg-white text-slate-600 border-slate-200/80',
    dot: 'bg-slate-300',
    desc: 'Čeká na oslovení',
  },
  lost: {
    label: 'Ztraceno',
    short: 'Lost',
    badge: 'bg-rose-50 text-rose-800 border-rose-200/80',
    dot: 'bg-rose-400',
    desc: 'Nezájem',
  },
};

const STAGE_ORDER = ['won', 'onboarding', 'trial', 'warm', 'contacted', 'lead', 'lost'] as const;

const CATEGORIES = [
  { id: 'all', label: 'Všechny obory' },
  { id: 'Automoto & Autodíly', label: 'Automoto & Autodíly' },
  { id: 'Pneumatiky & Kola', label: 'Pneumatiky & Kola' },
  { id: 'Elektronika & Apple', label: 'Elektronika & Apple' },
  { id: 'Elektrospotřebiče', label: 'Elektrospotřebiče' },
  { id: 'Nábytek & Bydlení', label: 'Nábytek & Bydlení' },
  { id: 'Bazary & Zastavárny', label: 'Bazary & Zastavárny' },
  { id: 'Cyklo & Sport', label: 'Cyklo & Sport' },
  { id: 'E-shopy', label: 'E-shopy & Katalogy' },
  { id: 'Ostatní', label: 'Ostatní' },
];

type TabId = 'worklist' | 'pipeline' | 'firmy' | 'bazos' | 'eshop' | 'all';

const TABS: { id: TabId; label: string }[] = [
  { id: 'worklist', label: 'Dnes volat' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'firmy', label: 'Firmy.cz' },
  { id: 'bazos', label: 'Bazoš' },
  { id: 'eshop', label: 'E-shopy' },
  { id: 'all', label: 'Vše' },
];

function fmt(n: number | undefined | null) {
  return (n ?? 0).toLocaleString('cs-CZ');
}

function IconSearch({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function IconRefresh({ className = 'h-3.5 w-3.5', spin = false }: { className?: string; spin?: boolean }) {
  return (
    <svg className={`${className} ${spin ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function IconPlus({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconPhone({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  );
}

function IconCopy({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function IconExternal({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

export default function AdminCrmView() {
  const [activeTab, setActiveTab] = useState<TabId>('worklist');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedBucket, setSelectedBucket] = useState<CrmWorklistBucket | 'all'>('all');
  const [page, setPage] = useState(1);
  const limit = activeTab === 'worklist' ? 60 : 50;

  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<CrmStats | null>(null);
  const [worklistBuckets, setWorklistBuckets] = useState<CrmWorklistBuckets | null>(null);
  const [doneToday, setDoneToday] = useState<Set<number>>(() => new Set());
  const [hideDoneToday, setHideDoneToday] = useState(true);

  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<CrmLead>>({});
  const [savingLead, setSavingLead] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPlaybook, setShowPlaybook] = useState(false);
  const [copiedPhoneId, setCopiedPhoneId] = useState<number | null>(null);

  useEffect(() => {
    setDoneToday(loadDoneToday());
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  }, []);

  const fetchLeadsData = useCallback(async () => {
    setLoading(true);
    try {
      const res: GetCrmLeadsResponse = await getCrmLeads({
        page,
        limit,
        tab: activeTab,
        stage: activeTab === 'worklist' ? undefined : selectedStage !== 'all' ? selectedStage : undefined,
        category: activeTab === 'worklist' ? undefined : selectedCategory !== 'all' ? selectedCategory : undefined,
        tier: activeTab === 'worklist' ? undefined : selectedTier !== 'all' ? selectedTier : undefined,
        bucket: activeTab === 'worklist' && selectedBucket !== 'all' ? selectedBucket : undefined,
        search: debouncedSearch || undefined,
        sortBy: activeTab === 'pipeline' ? 'updated_at' : 'id',
        sortOrder: 'desc',
      });
      setLeads(res.leads || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      if (res.stats) setStats(res.stats);
      if (res.worklistBuckets) setWorklistBuckets(res.worklistBuckets);
    } catch (err) {
      console.error('Failed to load leads:', err);
      showToast('Nepodařilo se načíst kontakty');
    } finally {
      setLoading(false);
    }
  }, [
    activeTab,
    selectedStage,
    selectedCategory,
    selectedTier,
    selectedBucket,
    debouncedSearch,
    page,
    limit,
    showToast,
  ]);

  useEffect(() => {
    fetchLeadsData();
  }, [fetchLeadsData]);

  const markDoneToday = useCallback((leadId: number) => {
    setDoneToday((prev) => {
      const next = new Set(prev);
      next.add(leadId);
      saveDoneToday(next);
      return next;
    });
    showToast('Hotovo dnes — zmizí z fronty do zítřka');
  }, [showToast]);

  const handleStageChange = async (leadId: number, newStage: string, opts?: { markDone?: boolean }) => {
    try {
      await updateCrmLead(leadId, { stage: newStage });
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l)));
      if (selectedLead?.id === leadId) {
        setSelectedLead((prev) => (prev ? { ...prev, stage: newStage } : null));
      }
      if (opts?.markDone) markDoneToday(leadId);
      showToast(`Stav → ${STAGE_CONFIG[newStage]?.label || newStage}`);
    } catch {
      showToast('Stav se nepodařilo změnit');
    }
  };

  const handleWorklistOutcome = async (leadId: number, newStage: string) => {
    await handleStageChange(leadId, newStage, { markDone: true });
    // Soft refresh bucket counts after outcome
    try {
      const res = await getCrmLeads({
        page,
        limit,
        tab: 'worklist',
        bucket: selectedBucket !== 'all' ? selectedBucket : undefined,
        search: debouncedSearch || undefined,
      });
      setLeads(res.leads || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      if (res.worklistBuckets) setWorklistBuckets(res.worklistBuckets);
      if (res.stats) setStats(res.stats);
    } catch {
      /* keep local state */
    }
  };

  const handleOpenLead = (lead: CrmLead) => {
    setSelectedLead(lead);
    setEditForm(lead);
    setIsEditing(false);
  };

  const handleCloseLead = () => {
    setSelectedLead(null);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedLead) return;
    setSavingLead(true);
    try {
      const updated = await updateCrmLead(selectedLead.id, editForm);
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? { ...l, ...updated } : l)));
      setSelectedLead(updated);
      setIsEditing(false);
      showToast('Uloženo');
    } catch {
      showToast('Uložení selhalo');
    } finally {
      setSavingLead(false);
    }
  };

  const handleCopyPhone = (id: number, phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    setTimeout(() => setCopiedPhoneId(null), 1800);
    showToast('Telefon zkopírován');
  };

  const handleExportCsv = () => {
    if (leads.length === 0) {
      showToast('Nic k exportu');
      return;
    }
    const headers = [
      'ID',
      'Název',
      'Firma',
      'Kontakt',
      'Telefon',
      'Email',
      'Web',
      'Bazoš URL',
      'Obor',
      'Zdroj',
      'Stav',
      'Tier',
      'Poznámka',
    ];
    const rows = leads.map((l) => [
      l.id,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.company_name || '').replace(/"/g, '""')}"`,
      `"${(l.contact_person || '').replace(/"/g, '""')}"`,
      `"${l.phone || ''}"`,
      `"${l.email || ''}"`,
      `"${l.website || ''}"`,
      `"${l.bazos_url || ''}"`,
      `"${l.category || ''}"`,
      `"${l.source || ''}"`,
      `"${l.stage || ''}"`,
      l.tier || 3,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csv =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `prodejomat-crm-${activeTab}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exportováno ${leads.length} kontaktů`);
  };

  const kanbanColumns = useMemo(() => {
    const cols: Record<string, CrmLead[]> = {};
    for (const s of STAGE_ORDER) cols[s] = leads.filter((l) => l.stage === s);
    return cols;
  }, [leads]);

  const tabCount = (id: TabId) => {
    if (id === 'worklist') {
      const warmTotal =
        (worklistBuckets?.stuck || 0) +
        (worklistBuckets?.warm || 0) +
        (worklistBuckets?.contacted || 0);
      return warmTotal || worklistBuckets?.total || null;
    }
    if (!stats) return null;
    if (id === 'pipeline') return stats.pipelineCount;
    if (id === 'firmy') return stats.sources?.['Firmy.cz'];
    if (id === 'bazos') return (stats.sources?.['Bazoš CZ'] || 0) + (stats.sources?.['Bazoš SK'] || 0);
    if (id === 'eshop') return stats.sources?.['E-shop FB databáze'];
    return stats.total;
  };

  const hasFilters =
    selectedStage !== 'all' ||
    selectedCategory !== 'all' ||
    selectedTier !== 'all' ||
    selectedBucket !== 'all' ||
    !!search;

  const visibleLeads = useMemo(() => {
    if (activeTab !== 'worklist' || !hideDoneToday) return leads;
    return leads.filter((l) => !doneToday.has(l.id));
  }, [activeTab, hideDoneToday, leads, doneToday]);

  const worklistGrouped = useMemo(() => {
    if (activeTab !== 'worklist') return null;
    const groups: Record<CrmWorklistBucket, CrmLead[]> = {
      stuck: [],
      warm: [],
      contacted: [],
      cold_a: [],
    };
    for (const lead of visibleLeads) {
      const bucket = (lead as CrmLead & { worklist_bucket?: CrmWorklistBucket }).worklist_bucket;
      if (bucket && groups[bucket]) groups[bucket].push(lead);
      else if (lead.stage === 'onboarding' || lead.stage === 'trial') groups.stuck.push(lead);
      else if (lead.stage === 'warm') groups.warm.push(lead);
      else if (lead.stage === 'contacted') groups.contacted.push(lead);
      else groups.cold_a.push(lead);
    }
    return groups;
  }, [activeTab, visibleLeads]);

  const kpiItems = [
    {
      key: 'stuck',
      label: 'Stuck',
      value: worklistBuckets?.stuck ?? (stats?.stages?.onboarding || 0) + (stats?.stages?.trial || 0),
      hint: 'onboard + trial',
      dot: 'bg-sky-500',
      onClick: () => {
        setActiveTab('worklist');
        setSelectedBucket('stuck');
        setPage(1);
      },
    },
    {
      key: 'warm',
      label: 'Warm',
      value: worklistBuckets?.warm ?? stats?.stages?.warm,
      hint: 'v jednání',
      dot: 'bg-amber-500',
      onClick: () => {
        setActiveTab('worklist');
        setSelectedBucket('warm');
        setPage(1);
      },
    },
    {
      key: 'contacted',
      label: 'Osloveno',
      value: worklistBuckets?.contacted ?? stats?.stages?.contacted,
      hint: 's telefonem',
      dot: 'bg-slate-500',
      onClick: () => {
        setActiveTab('worklist');
        setSelectedBucket('contacted');
        setPage(1);
      },
    },
    {
      key: 'cold_a',
      label: 'Cold A',
      value: worklistBuckets?.cold_a,
      hint: '4 verticals',
      dot: 'bg-emerald-500',
      onClick: () => {
        setActiveTab('worklist');
        setSelectedBucket('cold_a');
        setPage(1);
      },
    },
    {
      key: 'won',
      label: 'Získáno',
      value: stats?.stages?.won,
      hint: 'klientů',
      dot: 'bg-emerald-500',
      onClick: () => {
        setActiveTab('pipeline');
        setSelectedStage('won');
        setSelectedBucket('all');
        setPage(1);
      },
    },
    {
      key: 'done',
      label: 'Dnes hotovo',
      value: doneToday.size,
      hint: 'odškrtnuto',
      dot: 'bg-slate-950',
      onClick: () => {
        setActiveTab('worklist');
        setHideDoneToday(false);
        setSelectedBucket('all');
        setPage(1);
      },
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2.5 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-medium text-white shadow-2xl">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-950" />
              Admin
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {fmt(
                (worklistBuckets?.stuck || 0) +
                  (worklistBuckets?.warm || 0) +
                  (worklistBuckets?.contacted || 0)
              )}{' '}
              k volání (teplé)
            </span>
            {doneToday.size > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                {doneToday.size} hotovo dnes
              </span>
            )}
          </div>
          <h1 className="mt-1.5 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">Sales CRM</h1>
          <p className="mt-0.5 max-w-2xl text-xs text-slate-500">
            Denní GTM fronta: stuck → warm → osloveno → cold A (bazary, elektronika, autodíly, pneu).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            type="button"
            onClick={() => setShowPlaybook(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 active:scale-95"
          >
            Playbook
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 active:scale-95"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => fetchLeadsData()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 disabled:opacity-50 active:scale-95"
          >
            <IconRefresh spin={loading} />
            Obnovit
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-95"
          >
            <IconPlus />
            Přidat
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {kpiItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className="rounded-2xl border border-slate-200/90 bg-white p-3.5 text-left shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50/80 active:scale-[0.99]"
          >
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
              <span className="text-[11px] font-semibold text-slate-500">{item.label}</span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-xl font-black tracking-tight text-slate-950">{fmt(item.value)}</span>
              <span className="text-[10px] font-medium text-slate-400">{item.hint}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Tabs + view toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200/90 bg-slate-50 p-1 shadow-2xs">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const count = tabCount(tab.id);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedStage('all');
                  setSelectedBucket('all');
                  setPage(1);
                  if (tab.id === 'worklist') setViewMode('table');
                }}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  active
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
                {count != null && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                      active ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/70 text-slate-600'
                    }`}
                  >
                    {fmt(count)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeTab !== 'worklist' && (
          <div className="flex items-center rounded-xl border border-slate-200/90 bg-slate-50 p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-950 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Tabulka
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                viewMode === 'kanban' ? 'bg-white text-slate-950 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Pipeline
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-2.5 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs sm:p-3.5">
        <div className="relative">
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === 'worklist'
                ? 'Hledat ve frontě — firma, telefon, poznámka…'
                : 'Hledat firmu, telefon, e-mail, web, poznámku…'
            }
            className="w-full rounded-xl border border-slate-200/90 bg-white py-2 pl-10 pr-9 text-xs font-medium text-slate-950 outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 sm:text-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2.5">
          {activeTab === 'worklist' ? (
            <>
              {WORKLIST_BUCKETS.map((b) => {
                const count =
                  b.id === 'all'
                    ? worklistBuckets?.total
                    : worklistBuckets?.[b.id as CrmWorklistBucket];
                const active = selectedBucket === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setSelectedBucket(b.id);
                      setPage(1);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all ${
                      active
                        ? 'border-slate-900 bg-slate-950 text-white'
                        : 'border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                    title={b.hint}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-white' : b.dot}`} />
                    {b.label}
                    {count != null && (
                      <span className={`tabular-nums ${active ? 'text-slate-300' : 'text-slate-400'}`}>
                        {fmt(count)}
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setHideDoneToday((v) => !v)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
                  hideDoneToday
                    ? 'border-slate-200/90 bg-white text-slate-600'
                    : 'border-amber-200 bg-amber-50 text-amber-900'
                }`}
              >
                {hideDoneToday ? 'Skrýt hotové' : 'Zobrazit hotové'}
              </button>
            </>
          ) : (
            <>
              <select
                value={selectedStage}
                onChange={(e) => {
                  setSelectedStage(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200/90 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5"
              >
                <option value="all">Všechny stavy</option>
                {STAGE_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_CONFIG[s].label}
                  </option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200/90 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedTier}
                onChange={(e) => {
                  setSelectedTier(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200/90 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5"
              >
                <option value="all">Všechny tiery</option>
                <option value="1">Tier 1</option>
                <option value="2">Tier 2</option>
                <option value="3">Tier 3</option>
              </select>
            </>
          )}

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSelectedStage('all');
                setSelectedCategory('all');
                setSelectedTier('all');
                setSelectedBucket('all');
                setSearch('');
                setPage(1);
              }}
              className="rounded-lg border border-slate-200/90 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 shadow-2xs transition hover:bg-slate-50"
            >
              Reset
            </button>
          )}

          <span className="ml-auto text-[11px] font-medium text-slate-400">
            {fmt(total)} ve frontě
            {activeTab === 'worklist' && hideDoneToday && doneToday.size > 0
              ? ` · −${doneToday.size} hotovo`
              : ''}
          </span>
        </div>
      </div>

      {/* Worklist content */}
      {activeTab === 'worklist' ? (
        <WorklistBoard
          loading={loading}
          grouped={worklistGrouped}
          selectedBucket={selectedBucket}
          doneToday={doneToday}
          copiedPhoneId={copiedPhoneId}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
          onOpen={handleOpenLead}
          onCopyPhone={handleCopyPhone}
          onMarkDone={markDoneToday}
          onOutcome={handleWorklistOutcome}
        />
      ) : viewMode === 'kanban' ? (
        <div className="-mx-1 flex gap-3 overflow-x-auto pb-2">
          {STAGE_ORDER.map((stageKey) => {
            const cfg = STAGE_CONFIG[stageKey];
            const columnLeads = kanbanColumns[stageKey] || [];
            return (
              <div
                key={stageKey}
                className="flex w-[260px] shrink-0 flex-col rounded-2xl border border-slate-200/90 bg-slate-50/80 p-2.5"
              >
                <div className="mb-2.5 flex items-center justify-between px-1.5 pt-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                    <h3 className="text-xs font-bold text-slate-800">{cfg.label}</h3>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold tabular-nums text-slate-600 shadow-2xs border border-slate-200/80">
                    {columnLeads.length}
                  </span>
                </div>

                <div className="max-h-[68vh] flex-1 space-y-2 overflow-y-auto pr-0.5">
                  {columnLeads.length === 0 ? (
                    <div className="py-10 text-center text-[11px] text-slate-400">Prázdné</div>
                  ) : (
                    columnLeads.map((lead) => (
                      <button
                        key={lead.id}
                        type="button"
                        onClick={() => handleOpenLead(lead)}
                        className="w-full rounded-xl border border-slate-200/90 bg-white p-3 text-left shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-1 text-xs font-bold text-slate-950">
                            {lead.company_name || lead.name}
                          </p>
                          {lead.tier === 1 && (
                            <span className="shrink-0 rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 border border-amber-200/80">
                              T1
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">
                          {lead.contact_person || lead.category}
                        </p>
                        {lead.phone && (
                          <div className="mt-2 flex items-center justify-between gap-1">
                            <a
                              href={`tel:${lead.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="truncate text-[11px] font-semibold text-slate-800 hover:underline"
                            >
                              {lead.phone}
                            </a>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyPhone(lead.id, lead.phone!);
                              }}
                              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                              {copiedPhoneId === lead.id ? (
                                <span className="text-[10px] font-bold text-emerald-600">OK</span>
                              ) : (
                                <IconCopy />
                              )}
                            </span>
                          </div>
                        )}
                        {lead.notes && (
                          <p className="mt-2 line-clamp-2 rounded-lg bg-slate-50 px-2 py-1.5 text-[10px] leading-relaxed text-slate-600">
                            {lead.notes}
                          </p>
                        )}
                        <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2">
                          <span className="truncate text-[10px] text-slate-400">{lead.source}</span>
                          <div className="flex gap-1">
                            {stageKey !== 'won' && (
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const i = STAGE_ORDER.indexOf(stageKey);
                                  if (i > 0) handleStageChange(lead.id, STAGE_ORDER[i - 1]);
                                }}
                                className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 hover:bg-slate-200"
                              >
                                ←
                              </span>
                            )}
                            {stageKey !== 'lost' && (
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const i = STAGE_ORDER.indexOf(stageKey);
                                  if (i < STAGE_ORDER.length - 1) handleStageChange(lead.id, STAGE_ORDER[i + 1]);
                                }}
                                className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 hover:bg-slate-200"
                              >
                                →
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/90 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Kontakt</th>
                  <th className="px-4 py-3">Obor</th>
                  <th className="px-4 py-3">Telefon</th>
                  <th className="px-4 py-3">E-mail / Web</th>
                  <th className="px-4 py-3">Stav</th>
                  <th className="px-4 py-3">Poznámka</th>
                  <th className="px-4 py-3 text-right"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                        <IconRefresh spin className="h-4 w-4" />
                        Načítám…
                      </div>
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm text-slate-400">
                      Žádné kontakty pro zvolené filtry
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => {
                    const cfg = STAGE_CONFIG[lead.stage] || STAGE_CONFIG.lead;
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => handleOpenLead(lead)}
                        className="cursor-pointer transition-colors hover:bg-slate-50/90"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-950">{lead.company_name || lead.name}</p>
                            {lead.tier === 1 && (
                              <span className="rounded-md border border-amber-200/80 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                                T1
                              </span>
                            )}
                          </div>
                          {lead.contact_person && (
                            <p className="mt-0.5 text-[11px] font-medium text-slate-500">{lead.contact_person}</p>
                          )}
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {[lead.location || 'ČR', lead.source].filter(Boolean).join(' · ')}
                          </p>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex rounded-lg border border-slate-200/80 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700">
                            {lead.category}
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          {lead.phone ? (
                            <div className="flex items-center gap-1">
                              <a
                                href={`tel:${lead.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="font-semibold text-slate-900 hover:underline"
                              >
                                {lead.phone}
                              </a>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyPhone(lead.id, lead.phone!);
                                }}
                                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                title="Kopírovat"
                              >
                                {copiedPhoneId === lead.id ? (
                                  <span className="text-[10px] font-bold text-emerald-600">OK</span>
                                ) : (
                                  <IconCopy />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="max-w-[200px] space-y-0.5">
                            {lead.email ? (
                              <a
                                href={`mailto:${lead.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="block truncate text-[11px] font-medium text-slate-700 hover:underline"
                              >
                                {lead.email}
                              </a>
                            ) : null}
                            {lead.website ? (
                              <a
                                href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="block truncate text-[11px] text-slate-500 hover:text-slate-800"
                              >
                                {lead.website.replace(/^https?:\/\//, '')}
                              </a>
                            ) : null}
                            {lead.bazos_url ? (
                              <a
                                href={lead.bazos_url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-slate-800"
                              >
                                Bazoš <IconExternal />
                              </a>
                            ) : null}
                            {!lead.email && !lead.website && !lead.bazos_url && (
                              <span className="text-slate-300">—</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={lead.stage}
                            onChange={(e) => handleStageChange(lead.id, e.target.value)}
                            className={`rounded-lg border px-2 py-1 text-[11px] font-bold outline-none ${cfg.badge}`}
                          >
                            {STAGE_ORDER.map((s) => (
                              <option key={s} value={s}>
                                {STAGE_CONFIG[s].label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="max-w-[220px] px-4 py-3">
                          <p className="truncate text-[11px] text-slate-600">
                            {lead.response && (
                              <span className="mr-1 font-semibold text-slate-900">{lead.response}</span>
                            )}
                            {lead.notes || '—'}
                          </p>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenLead(lead);
                            }}
                            className="rounded-lg border border-slate-200/90 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200/90 bg-slate-50/50 px-4 py-3 sm:flex-row">
            <span className="text-xs text-slate-500">
              {leads.length} z {fmt(total)} · strana {page}/{totalPages || 1}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Předchozí
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Další
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail slide-over */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/30 backdrop-blur-[2px]"
          onClick={handleCloseLead}
        >
          <div
            className="flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-slate-200/90 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 border-b border-slate-200/90 bg-white/95 px-5 py-4 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-black tracking-tight text-slate-950">
                      {selectedLead.company_name || selectedLead.name}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                        STAGE_CONFIG[selectedLead.stage]?.badge || STAGE_CONFIG.lead.badge
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${STAGE_CONFIG[selectedLead.stage]?.dot || 'bg-slate-300'}`} />
                      {STAGE_CONFIG[selectedLead.stage]?.label || selectedLead.stage}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {selectedLead.source} · {selectedLead.category} · #{selectedLead.id}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(true);
                        setEditForm(selectedLead);
                      }}
                      className="rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95"
                    >
                      Upravit
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={savingLead}
                      className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50 active:scale-95"
                    >
                      {savingLead ? 'Ukládám…' : 'Uložit'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCloseLead}
                    className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-1.5">
                {[
                  {
                    ok: !!selectedLead.phone,
                    href: selectedLead.phone ? `tel:${selectedLead.phone}` : undefined,
                    label: 'Zavolat',
                    icon: <IconPhone />,
                  },
                  {
                    ok: !!selectedLead.email,
                    href: selectedLead.email ? `mailto:${selectedLead.email}` : undefined,
                    label: 'E-mail',
                  },
                  {
                    ok: !!selectedLead.website,
                    href: selectedLead.website
                      ? selectedLead.website.startsWith('http')
                        ? selectedLead.website
                        : `https://${selectedLead.website}`
                      : undefined,
                    label: 'Web',
                    external: true,
                  },
                  {
                    ok: !!selectedLead.bazos_url,
                    href: selectedLead.bazos_url || undefined,
                    label: 'Bazoš',
                    external: true,
                  },
                ].map((action) =>
                  action.ok && action.href ? (
                    <a
                      key={action.label}
                      href={action.href}
                      target={action.external ? '_blank' : undefined}
                      rel={action.external ? 'noreferrer' : undefined}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50 py-2 text-[11px] font-bold text-slate-800 transition hover:bg-slate-100"
                    >
                      {action.icon}
                      {action.label}
                    </a>
                  ) : (
                    <span
                      key={action.label}
                      className="inline-flex items-center justify-center rounded-xl border border-transparent py-2 text-[11px] font-medium text-slate-300"
                    >
                      {action.label}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="flex-1 space-y-5 p-5">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Fáze pipeline</p>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {STAGE_ORDER.map((stKey) => {
                    const stCfg = STAGE_CONFIG[stKey];
                    const current = (isEditing ? editForm.stage : selectedLead.stage) === stKey;
                    return (
                      <button
                        key={stKey}
                        type="button"
                        onClick={() => {
                          if (isEditing) setEditForm((p) => ({ ...p, stage: stKey }));
                          else handleStageChange(selectedLead.id, stKey);
                        }}
                        className={`rounded-xl border px-2.5 py-2 text-left transition-all ${
                          current
                            ? `${stCfg.badge} ring-2 ring-slate-950/10`
                            : 'border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${stCfg.dot}`} />
                          <span className="text-[11px] font-bold">{stCfg.label}</span>
                        </div>
                        <p className="mt-0.5 truncate text-[10px] text-slate-500">{stCfg.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <section className="space-y-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kontakt</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(
                    [
                      { key: 'company_name', label: 'Firma', value: selectedLead.company_name || selectedLead.name },
                      { key: 'contact_person', label: 'Osoba', value: selectedLead.contact_person || '—' },
                      { key: 'phone', label: 'Telefon', value: selectedLead.phone || '—' },
                      { key: 'email', label: 'E-mail', value: selectedLead.email || '—' },
                      { key: 'website', label: 'Web', value: selectedLead.website || '—' },
                      { key: 'location', label: 'Lokalita', value: selectedLead.location || 'ČR' },
                    ] as const
                  ).map((field) => (
                    <div key={field.key}>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-500">{field.label}</label>
                      {isEditing && field.key !== 'location' ? (
                        <input
                          type="text"
                          value={
                            field.key === 'company_name'
                              ? editForm.company_name || editForm.name || ''
                              : String((editForm as Record<string, unknown>)[field.key] || '')
                          }
                          onChange={(e) => {
                            if (field.key === 'company_name') {
                              setEditForm((p) => ({ ...p, company_name: e.target.value, name: e.target.value }));
                            } else {
                              setEditForm((p) => ({ ...p, [field.key]: e.target.value }));
                            }
                          }}
                          className="w-full rounded-xl border border-slate-200/90 px-3 py-2 text-xs font-medium outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5"
                        />
                      ) : isEditing && field.key === 'location' ? (
                        <input
                          type="text"
                          value={editForm.location || 'ČR'}
                          onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200/90 px-3 py-2 text-xs font-medium outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5"
                        />
                      ) : (
                        <p className="truncate text-xs font-semibold text-slate-900">{field.value}</p>
                      )}
                    </div>
                  ))}

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-500">Obor</label>
                    {isEditing ? (
                      <select
                        value={editForm.category || 'Ostatní'}
                        onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200/90 px-3 py-2 text-xs font-medium outline-none"
                      >
                        {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-xs font-semibold text-slate-900">{selectedLead.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-500">Tier</label>
                    {isEditing ? (
                      <select
                        value={editForm.tier || 3}
                        onChange={(e) => setEditForm((p) => ({ ...p, tier: Number(e.target.value) }))}
                        className="w-full rounded-xl border border-slate-200/90 px-3 py-2 text-xs font-medium outline-none"
                      >
                        <option value={1}>Tier 1</option>
                        <option value={2}>Tier 2</option>
                        <option value={3}>Tier 3</option>
                      </select>
                    ) : (
                      <p className="text-xs font-semibold text-slate-900">Tier {selectedLead.tier || 3}</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Poznámky</p>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-500">Reakce</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.response || ''}
                      onChange={(e) => setEditForm((p) => ({ ...p, response: e.target.value }))}
                      placeholder="např. trial, 250 €, callback…"
                      className="w-full rounded-xl border border-slate-200/90 px-3 py-2 text-xs outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5"
                    />
                  ) : (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-800">
                      {selectedLead.response || 'Bez reakce'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-500">Zápis z hovoru</label>
                  {isEditing ? (
                    <textarea
                      rows={4}
                      value={editForm.notes || ''}
                      onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200/90 px-3 py-2 text-xs outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5"
                    />
                  ) : (
                    <div className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-700">
                      {selectedLead.notes || 'Žádné poznámky'}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs">
                  <div>
                    <span className="text-slate-400">1. hovor</span>
                    <p className="font-semibold text-slate-800">{selectedLead.first_call_date || '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Onboarding</span>
                    <p className="font-semibold text-slate-800">{selectedLead.onboarding_date || '—'}</p>
                  </div>
                </div>
              </section>

              {(selectedLead.origin_sheets?.length || selectedLead.tags?.length) && (
                <section className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4">
                  {!!selectedLead.origin_sheets?.length && (
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Původní listy
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedLead.origin_sheets.map((sheet) => (
                          <span
                            key={sheet}
                            className="rounded-lg border border-slate-200/80 bg-white px-2 py-0.5 font-mono text-[10px] text-slate-600"
                          >
                            {sheet}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {!!selectedLead.tags?.length && (
                    <div className={selectedLead.origin_sheets?.length ? 'mt-3' : ''}>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Tagy</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedLead.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      {showPlaybook && <PlaybookModal onClose={() => setShowPlaybook(false)} />}
      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onCreated={(newLead) => {
            setLeads((prev) => [newLead, ...prev]);
            setShowAddModal(false);
            showToast(`Přidán: ${newLead.name}`);
          }}
        />
      )}
    </div>
  );
}

function PlaybookModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-200/90 px-5 py-4">
          <div>
            <h3 className="text-base font-black tracking-tight text-slate-950">Sales playbook</h3>
            <p className="mt-0.5 text-xs text-slate-500">Námitky a skripty z cold callů Sellin</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            ✕
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5 text-xs text-slate-700">
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4">
            <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Zážitky z hovorů</h4>
            <div className="space-y-2.5">
              <div className="rounded-xl border border-slate-200/80 bg-white p-3 leading-relaxed">
                <p className="text-slate-500">„Volám ohledně inzerce…“ → „Povídejte.“</p>
                <p className="mt-1 text-slate-500">„Vytvářím nástroj na Bazoš…“</p>
                <p className="mt-1 font-semibold text-rose-700">„To nechci!“ (cvak)</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-white p-3 leading-relaxed">
                <p className="text-slate-500">„Odkud jste?“ → „Z Prahy.“</p>
                <p className="mt-1 font-semibold text-rose-700">„Ne, nemáme zájem!“</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4">
            <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-emerald-800">Co fungovalo</h4>
            <ul className="space-y-2 text-emerald-950">
              <li>
                <strong>Okamžitá hodnota:</strong> zmínit počet inzerátů a čas na obnovy / topování.
              </li>
              <li>
                <strong>Multi-inzerce:</strong> jednou do skladu → Bazoš, Sbazar i vlastní e-shop.
              </li>
              <li>
                <strong>Trial 7 dní:</strong> bez peněz předem, nastavit auto-obnovu a měřit poptávky.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4">
            <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Tiery</h4>
            <div className="space-y-2 text-slate-700">
              <p>
                <strong className="text-slate-950">Tier 1</strong> — 100+ inzerátů, kamenná prodejna, pneuservis / vrakoviště
              </p>
              <p>
                <strong className="text-slate-950">Tier 2</strong> — 30–100 inzerátů, servisní technici
              </p>
              <p>
                <strong className="text-slate-950">Tier 3</strong> — občasní inzerenti (self-service)
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200/90 bg-slate-50/80 px-5 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
}

function WorklistBoard({
  loading,
  grouped,
  selectedBucket,
  doneToday,
  copiedPhoneId,
  page,
  totalPages,
  total,
  onPageChange,
  onOpen,
  onCopyPhone,
  onMarkDone,
  onOutcome,
}: {
  loading: boolean;
  grouped: Record<CrmWorklistBucket, CrmLead[]> | null;
  selectedBucket: CrmWorklistBucket | 'all';
  doneToday: Set<number>;
  copiedPhoneId: number | null;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onOpen: (lead: CrmLead) => void;
  onCopyPhone: (id: number, phone: string) => void;
  onMarkDone: (id: number) => void;
  onOutcome: (id: number, stage: string) => void;
}) {
  const sections = WORKLIST_BUCKETS.filter((b) => b.id !== 'all').filter(
    (b) => selectedBucket === 'all' || selectedBucket === b.id
  ) as { id: CrmWorklistBucket; label: string; hint: string; dot: string }[];

  if (loading && !grouped) {
    return (
      <div className="rounded-2xl border border-slate-200/90 bg-white py-16 text-center text-sm text-slate-500 shadow-2xs">
        <span className="inline-flex items-center gap-2">
          <IconRefresh spin className="h-4 w-4" />
          Sestavuji denní frontu…
        </span>
      </div>
    );
  }

  const totalVisible = sections.reduce((sum, s) => sum + (grouped?.[s.id]?.length || 0), 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 to-white p-4 shadow-2xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">GTM denní rytmus</p>
            <p className="mt-0.5 text-sm font-bold text-slate-900">
              Nejdřív stuck → warm → osloveno → teprve cold A
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Po hovoru nastav výsledek (Warm / Trial / Lost) nebo „Hotovo dnes“. CTA: 7denní trial.
            </p>
          </div>
          <div className="text-xs font-medium text-slate-500">
            Strana {page}/{totalPages || 1} · {fmt(total)} prioritních
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center text-xs text-slate-400">
          <IconRefresh spin className="mr-1 inline h-3.5 w-3.5" />
          Obnovuji…
        </div>
      )}

      {!loading && totalVisible === 0 ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white py-14 text-center shadow-2xs">
          <p className="text-sm font-bold text-slate-900">Fronta na dnes je prázdná</p>
          <p className="mt-1 text-xs text-slate-500">Buď jsou všichni odškrtnutí, nebo zvol jiný bucket.</p>
        </div>
      ) : (
        sections.map((section) => {
          const items = grouped?.[section.id] || [];
          if (selectedBucket === 'all' && items.length === 0) return null;
          return (
            <section key={section.id} className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${section.dot}`} />
                  <h3 className="text-sm font-black tracking-tight text-slate-950">{section.label}</h3>
                  <span className="text-[11px] font-medium text-slate-400">{section.hint}</span>
                </div>
                <span className="rounded-full border border-slate-200/80 bg-white px-2 py-0.5 text-[11px] font-bold tabular-nums text-slate-600">
                  {items.length}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-slate-400">Žádné kontakty v tomto bucketu</div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {items.map((lead, idx) => {
                    const done = doneToday.has(lead.id);
                    const cfg = STAGE_CONFIG[lead.stage] || STAGE_CONFIG.lead;
                    return (
                      <li
                        key={lead.id}
                        className={`px-4 py-3.5 transition-colors ${done ? 'bg-slate-50/80 opacity-60' : 'hover:bg-slate-50/70'}`}
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <button
                            type="button"
                            onClick={() => onOpen(lead)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-bold tabular-nums text-slate-300">
                                #{(page - 1) * 60 + idx + 1}
                              </span>
                              <span className="truncate text-sm font-bold text-slate-950">
                                {lead.company_name || lead.name}
                              </span>
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.badge}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                {cfg.label}
                              </span>
                              {lead.tier === 1 && (
                                <span className="rounded-md border border-amber-200/80 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                                  T1
                                </span>
                              )}
                              {done && (
                                <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                                  Hotovo
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-[11px] text-slate-500">
                              {[lead.contact_person, lead.category, lead.source, lead.location]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                            {(lead.response || lead.notes) && (
                              <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-slate-600">
                                {lead.response && (
                                  <span className="mr-1 font-semibold text-slate-900">{lead.response}</span>
                                )}
                                {lead.notes}
                              </p>
                            )}
                          </button>

                          <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
                            {lead.phone && (
                              <>
                                <a
                                  href={`tel:${lead.phone}`}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 text-[11px] font-bold text-white shadow-xs transition hover:bg-slate-800 active:scale-95"
                                >
                                  <IconPhone />
                                  {lead.phone}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => onCopyPhone(lead.id, lead.phone!)}
                                  className="rounded-xl border border-slate-200/90 bg-white p-2 text-slate-500 transition hover:bg-slate-50"
                                  title="Kopírovat"
                                >
                                  {copiedPhoneId === lead.id ? (
                                    <span className="text-[10px] font-bold text-emerald-600">OK</span>
                                  ) : (
                                    <IconCopy />
                                  )}
                                </button>
                              </>
                            )}
                            {lead.bazos_url && (
                              <a
                                href={lead.bazos_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white px-2.5 py-2 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50"
                              >
                                Bazoš <IconExternal />
                              </a>
                            )}

                            {section.id === 'stuck' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onOutcome(lead.id, 'won')}
                                  className="rounded-xl border border-emerald-200/80 bg-emerald-50 px-2.5 py-2 text-[11px] font-bold text-emerald-800 transition hover:bg-emerald-100"
                                >
                                  Won
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onOutcome(lead.id, 'lost')}
                                  className="rounded-xl border border-rose-200/80 bg-rose-50 px-2.5 py-2 text-[11px] font-bold text-rose-700 transition hover:bg-rose-100"
                                >
                                  Lost
                                </button>
                              </>
                            )}
                            {section.id === 'warm' && (
                              <button
                                type="button"
                                onClick={() => onOutcome(lead.id, 'onboarding')}
                                className="rounded-xl border border-sky-200/80 bg-sky-50 px-2.5 py-2 text-[11px] font-bold text-sky-800 transition hover:bg-sky-100"
                              >
                                Onboard
                              </button>
                            )}
                            {section.id === 'contacted' && (
                              <button
                                type="button"
                                onClick={() => onOutcome(lead.id, 'warm')}
                                className="rounded-xl border border-amber-200/80 bg-amber-50 px-2.5 py-2 text-[11px] font-bold text-amber-900 transition hover:bg-amber-100"
                              >
                                Warm
                              </button>
                            )}
                            {section.id === 'cold_a' && (
                              <button
                                type="button"
                                onClick={() => onOutcome(lead.id, 'contacted')}
                                className="rounded-xl border border-slate-200/90 bg-white px-2.5 py-2 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50"
                              >
                                Osloveno
                              </button>
                            )}
                            {(section.id === 'warm' || section.id === 'contacted' || section.id === 'cold_a') && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onOutcome(lead.id, 'trial')}
                                  className="rounded-xl border border-violet-200/80 bg-violet-50 px-2.5 py-2 text-[11px] font-bold text-violet-800 transition hover:bg-violet-100"
                                >
                                  Trial
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onOutcome(lead.id, 'lost')}
                                  className="rounded-xl border border-rose-200/80 bg-rose-50 px-2.5 py-2 text-[11px] font-bold text-rose-700 transition hover:bg-rose-100"
                                >
                                  Lost
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => onMarkDone(lead.id)}
                              disabled={done}
                              className="rounded-xl border border-slate-200/90 bg-white px-2.5 py-2 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                            >
                              Hotovo dnes
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpen(lead)}
                              className="rounded-xl border border-slate-200/90 bg-white px-2.5 py-2 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50"
                            >
                              Detail
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })
      )}

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500">
          {totalVisible} zobrazeno · {fmt(total)} celkem ve frontě
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className="rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-40"
          >
            Předchozí
          </button>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => onPageChange(page + 1)}
            className="rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-40"
          >
            Další
          </button>
        </div>
      </div>
    </div>
  );
}

function AddLeadModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (lead: CrmLead) => void;
}) {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [bazosUrl, setBazosUrl] = useState('');
  const [category, setCategory] = useState('Automoto & Autodíly');
  const [stage, setStage] = useState('lead');
  const [tier, setTier] = useState(2);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name && !companyName && !phone) {
      setError('Vyplňte jméno, firmu nebo telefon');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await createCrmLead({
        name: name || companyName || 'Nový kontakt',
        company_name: companyName || name,
        contact_person: null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        bazos_url: bazosUrl || null,
        category,
        stage,
        tier,
        notes: notes || null,
        source: 'Přímý kontakt',
        location: 'ČR',
      });
      onCreated(created);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Chyba při vytváření');
    } finally {
      setSaving(false);
    }
  };

  const fieldCls =
    'w-full rounded-xl border border-slate-200/90 px-3 py-2 text-xs font-medium outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200/90 px-5 py-4">
          <div>
            <h3 className="text-base font-black tracking-tight text-slate-950">Nový kontakt</h3>
            <p className="mt-0.5 text-xs text-slate-500">Přidat lead do CRM</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 p-5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-500">Jméno *</label>
              <input className={fieldCls} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jan Novák" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-500">Firma</label>
              <input className={fieldCls} value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="AutoDíly s.r.o." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-500">Telefon</label>
              <input className={fieldCls} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+420…" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-500">E-mail</label>
              <input className={fieldCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@…" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-500">Web</label>
              <input className={fieldCls} value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-500">Bazoš URL</label>
              <input className={fieldCls} value={bazosUrl} onChange={(e) => setBazosUrl(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-500">Obor</label>
              <select className={fieldCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-500">Stav</label>
              <select className={fieldCls} value={stage} onChange={(e) => setStage(e.target.value)}>
                {STAGE_ORDER.filter((s) => s !== 'lost').map((s) => (
                  <option key={s} value={s}>
                    {STAGE_CONFIG[s].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-500">Tier</label>
              <select className={fieldCls} value={tier} onChange={(e) => setTier(Number(e.target.value))}>
                <option value={1}>Tier 1</option>
                <option value={2}>Tier 2</option>
                <option value={3}>Tier 3</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-500">Poznámka</label>
            <textarea className={fieldCls} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200/90 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 active:scale-95"
            >
              {saving ? 'Ukládám…' : 'Vytvořit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
