'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { CrmLead, CrmStats, CrmStage } from '@/lib/types';
import { getCrmLeads, updateCrmLead, createCrmLead, deleteCrmLead, GetCrmLeadsResponse } from '@/lib/api';

const STAGE_CONFIG: Record<
  string,
  { label: string; badge: string; dot: string; icon: string; desc: string }
> = {
  won: {
    label: 'Získáno / Klient',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: '★',
    desc: 'Vyfakturováno, platící klient nebo domluvená investice',
  },
  onboarding: {
    label: 'Onboarding',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    icon: '🚀',
    desc: 'Probíhá zaškolení, import katalogu či vystavování',
  },
  trial: {
    label: 'Trial (Testuje)',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
    icon: '🧪',
    desc: 'Aktivní zkušební verze na 7–14 dní',
  },
  warm: {
    label: 'V jednání (Warm)',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    icon: '🔥',
    desc: 'Projevil zájem, domluvená prezentace nebo callback',
  },
  contacted: {
    label: 'Osloveno',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
    icon: '📞',
    desc: 'Proběhl 1. cold call nebo odeslán e-mail s nabídkou',
  },
  lead: {
    label: 'Nový lead',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    icon: '❄️',
    desc: 'Nový kontakt čekající na oslovení',
  },
  lost: {
    label: 'Ztraceno / Nezájem',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    icon: '✕',
    desc: 'Nemá zájem, konkurence, realitka nebo smazaný profil',
  },
};

const CATEGORIES = [
  { id: 'all', label: 'Všechny obory', icon: '📁' },
  { id: 'Automoto & Autodíly', label: 'Automoto & Autodíly', icon: '🚗', color: 'border-amber-200 text-amber-800 bg-amber-50' },
  { id: 'Pneumatiky & Kola', label: 'Pneumatiky & Kola', icon: '🛞', color: 'border-orange-200 text-orange-800 bg-orange-50' },
  { id: 'Elektronika & Apple', label: 'Elektronika & Apple', icon: '💻', color: 'border-sky-200 text-sky-800 bg-sky-50' },
  { id: 'Elektrospotřebiče', label: 'Elektrospotřebiče', icon: '⚡', color: 'border-cyan-200 text-cyan-800 bg-cyan-50' },
  { id: 'Nábytek & Bydlení', label: 'Nábytek & Bydlení', icon: '🛋️', color: 'border-emerald-200 text-emerald-800 bg-emerald-50' },
  { id: 'Bazary & Zastavárny', label: 'Bazary & Zastavárny', icon: '🏪', color: 'border-purple-200 text-purple-800 bg-purple-50' },
  { id: 'Cyklo & Sport', label: 'Cyklo & Sport', icon: '🚲', color: 'border-lime-200 text-lime-800 bg-lime-50' },
  { id: 'E-shopy', label: 'E-shopy & Katalogy', icon: '🛒', color: 'border-indigo-200 text-indigo-800 bg-indigo-50' },
  { id: 'Ostatní', label: 'Ostatní obory', icon: '📦', color: 'border-slate-200 text-slate-700 bg-slate-50' },
];

export default function AdminCrmView() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'pipeline' | 'firmy' | 'bazos' | 'eshop' | 'all'>('pipeline');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Filters & Search
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 50;

  // Data state
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<CrmStats | null>(null);

  // Selected lead for Slide-over Detail / Edit
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<CrmLead>>({});
  const [savingLead, setSavingLead] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPlaybook, setShowPlaybook] = useState(false);
  const [copiedPhoneId, setCopiedPhoneId] = useState<number | null>(null);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Show toast notification
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Fetch leads
  const fetchLeadsData = useCallback(async () => {
    setLoading(true);
    try {
      const res: GetCrmLeadsResponse = await getCrmLeads({
        page,
        limit,
        tab: activeTab,
        stage: selectedStage !== 'all' ? selectedStage : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        tier: selectedTier !== 'all' ? selectedTier : undefined,
        search: debouncedSearch || undefined,
        sortBy: activeTab === 'pipeline' ? 'updated_at' : 'id',
        sortOrder: 'desc',
      });
      setLeads(res.leads || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err: unknown) {
      console.error('Failed to load leads:', err);
      showToast('Chyba při načítání kontaktů');
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedStage, selectedCategory, selectedTier, debouncedSearch, page, showToast]);

  useEffect(() => {
    fetchLeadsData();
  }, [fetchLeadsData]);

  // Handle stage quick change (from table or kanban)
  const handleStageChange = async (leadId: number, newStage: string) => {
    try {
      const updated = await updateCrmLead(leadId, { stage: newStage });
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l)));
      if (selectedLead?.id === leadId) {
        setSelectedLead((prev) => (prev ? { ...prev, stage: newStage } : null));
      }
      showToast(`Stav změněn na: ${STAGE_CONFIG[newStage]?.label || newStage}`);
    } catch (err) {
      console.error('Error changing stage:', err);
      showToast('Nepodařilo se změnit stav');
    }
  };

  // Open detail
  const handleOpenLead = (lead: CrmLead) => {
    setSelectedLead(lead);
    setEditForm(lead);
    setIsEditing(false);
  };

  // Save edit form
  const handleSaveEdit = async () => {
    if (!selectedLead) return;
    setSavingLead(true);
    try {
      const updated = await updateCrmLead(selectedLead.id, editForm);
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? { ...l, ...updated } : l)));
      setSelectedLead(updated);
      setIsEditing(false);
      showToast('Změny byly úspěšně uloženy');
    } catch (err) {
      console.error('Error saving lead:', err);
      showToast('Chyba při ukládání kontaktu');
    } finally {
      setSavingLead(false);
    }
  };

  // Copy phone helper
  const handleCopyPhone = (id: number, phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    setTimeout(() => setCopiedPhoneId(null), 2000);
    showToast(`Telefon ${phone} zkopírován do schránky`);
  };

  // Export current list to CSV
  const handleExportCsv = () => {
    if (leads.length === 0) {
      showToast('Žádná data k exportu');
      return;
    }
    const headers = ['ID', 'Název', 'Firma', 'Kontakt', 'Telefon', 'Email', 'Web', 'Bazoš URL', 'Obor', 'Zdroj', 'Stav', 'Tier', 'Poznámka'];
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
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `prodejomat-crm-export-${activeTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exportováno ${leads.length} kontaktů do CSV`);
  };

  // Kanban columns grouped leads
  const kanbanStages = ['won', 'onboarding', 'trial', 'warm', 'contacted', 'lead', 'lost'];
  const kanbanColumns = useMemo(() => {
    const cols: Record<string, CrmLead[]> = {};
    for (const s of kanbanStages) {
      cols[s] = leads.filter((l) => l.stage === s);
    }
    return cols;
  }, [leads]);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-2xl transition-all">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Sales CRM & Pipeline
            </h1>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
              Prodejomat Sales
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Komplexní přehled leadů z Bazoše, Firem.cz a e-shopů — stavy oslovení, onboarding a uzavřené obchody.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowPlaybook(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <span>💡</span>
            <span>Sales Playbook & Námitky</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <span>📥</span>
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
          >
            <span>➕</span>
            <span>Přidat kontakt</span>
          </button>
          <button
            type="button"
            onClick={() => fetchLeadsData()}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition"
            title="Obnovit data"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Total */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Celkem leadů</span>
            <span className="text-base">📁</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-950">
              {stats?.total?.toLocaleString('cs-CZ') || '24 726'}
            </span>
          </div>
          <span className="mt-1 block text-[11px] text-slate-400">Deduplikovaná báze</span>
        </div>

        {/* Won */}
        <div
          onClick={() => {
            setActiveTab('pipeline');
            setSelectedStage('won');
          }}
          className="cursor-pointer rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs transition hover:border-emerald-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Uzavřeno / Won</span>
            <span className="text-base">★</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-900">
              {stats?.stages?.won || 21}
            </span>
            <span className="text-xs font-medium text-emerald-600">klientů</span>
          </div>
          <span className="mt-1 block text-[11px] text-emerald-700">Fakturováno / 250 € / Invest</span>
        </div>

        {/* Onboarding & Trial */}
        <div
          onClick={() => {
            setActiveTab('pipeline');
            setSelectedStage('onboarding');
          }}
          className="cursor-pointer rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-2xs transition hover:border-blue-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800">Onboarding & Trial</span>
            <span className="text-base">🚀</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-900">
              {(stats?.stages?.onboarding || 89) + (stats?.stages?.trial || 7)}
            </span>
            <span className="text-xs font-medium text-blue-600">aktivních</span>
          </div>
          <span className="mt-1 block text-[11px] text-blue-700">Testování & nasazování</span>
        </div>

        {/* Warm */}
        <div
          onClick={() => {
            setActiveTab('pipeline');
            setSelectedStage('warm');
          }}
          className="cursor-pointer rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs transition hover:border-amber-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">V jednání (Warm)</span>
            <span className="text-base">🔥</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-900">
              {stats?.stages?.warm || 11}
            </span>
            <span className="text-xs font-medium text-amber-600">horkých</span>
          </div>
          <span className="mt-1 block text-[11px] text-amber-700">Zájem o demo / callback</span>
        </div>

        {/* Contacted */}
        <div
          onClick={() => {
            setActiveTab('pipeline');
            setSelectedStage('contacted');
          }}
          className="cursor-pointer rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-2xs transition hover:border-indigo-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-800">Osloveno (Calls)</span>
            <span className="text-base">📞</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-900">
              {stats?.stages?.contacted || 374}
            </span>
          </div>
          <span className="mt-1 block text-[11px] text-indigo-700">1. hovor / e-mail poslán</span>
        </div>

        {/* Firmy.cz B2B */}
        <div
          onClick={() => {
            setActiveTab('firmy');
            setSelectedStage('all');
          }}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition hover:border-slate-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Firmy.cz B2B</span>
            <span className="text-base">🏢</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-950">
              {(stats?.sources?.['Firmy.cz'] || 14866).toLocaleString('cs-CZ')}
            </span>
          </div>
          <span className="mt-1 block text-[11px] text-slate-400">Ověřené firmy s tel. a webem</span>
        </div>
      </div>

      {/* Main Tabs & View Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-2">
        {/* Source / Category Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('pipeline');
              setSelectedStage('all');
              setPage(1);
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-bold transition ${
              activeTab === 'pipeline'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>🎯</span>
            <span>Aktivní Pipeline</span>
            <span
              className={`rounded-full px-2 py-0.2 text-xs font-semibold ${
                activeTab === 'pipeline' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {stats?.pipelineCount || 550}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('firmy');
              setSelectedStage('all');
              setPage(1);
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
              activeTab === 'firmy'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>🏢</span>
            <span>Firmy.cz B2B</span>
            <span
              className={`rounded-full px-2 py-0.2 text-xs font-semibold ${
                activeTab === 'firmy' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {(stats?.sources?.['Firmy.cz'] || 14866).toLocaleString('cs-CZ')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('bazos');
              setSelectedStage('all');
              setPage(1);
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
              activeTab === 'bazos'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>📢</span>
            <span>Bazoš.cz / SK</span>
            <span
              className={`rounded-full px-2 py-0.2 text-xs font-semibold ${
                activeTab === 'bazos' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {((stats?.sources?.['Bazoš CZ'] || 1833) + (stats?.sources?.['Bazoš SK'] || 911)).toLocaleString('cs-CZ')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('eshop');
              setSelectedStage('all');
              setPage(1);
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
              activeTab === 'eshop'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>🛒</span>
            <span>E-shopy</span>
            <span
              className={`rounded-full px-2 py-0.2 text-xs font-semibold ${
                activeTab === 'eshop' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {(stats?.sources?.['E-shop FB databáze'] || 7012).toLocaleString('cs-CZ')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setSelectedStage('all');
              setPage(1);
            }}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
              activeTab === 'all'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>📋</span>
            <span>Všechny kontakty</span>
            <span
              className={`rounded-full px-2 py-0.2 text-xs font-semibold ${
                activeTab === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {(stats?.total || 24726).toLocaleString('cs-CZ')}
            </span>
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold transition ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>📑</span>
            <span>Tabulka</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold transition ${
              viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>📊</span>
            <span>Kanban Pipeline</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Hledat podle názvu, firmy, telefonu, e-mailu, webu, poznámky či ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm placeholder-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
          <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Stage filter */}
          <select
            value={selectedStage}
            onChange={(e) => {
              setSelectedStage(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-slate-900 focus:outline-none"
          >
            <option value="all">Všechny stavy</option>
            <option value="won">★ Získáno / Klient</option>
            <option value="onboarding">🚀 Onboarding</option>
            <option value="trial">🧪 Trial (Testuje)</option>
            <option value="warm">🔥 V jednání (Warm)</option>
            <option value="contacted">📞 Osloveno</option>
            <option value="lead">❄️ Nový lead</option>
            <option value="lost">✕ Ztraceno / Nezájem</option>
          </select>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-slate-900 focus:outline-none"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>

          {/* Tier filter */}
          <select
            value={selectedTier}
            onChange={(e) => {
              setSelectedTier(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-slate-900 focus:outline-none"
          >
            <option value="all">Všechny Tiery</option>
            <option value="1">Tier 1 (Top priorita)</option>
            <option value="2">Tier 2 (Střední priorita)</option>
            <option value="3">Tier 3 (Běžný lead)</option>
          </select>

          {/* Reset button */}
          {(selectedStage !== 'all' || selectedCategory !== 'all' || selectedTier !== 'all' || search) && (
            <button
              type="button"
              onClick={() => {
                setSelectedStage('all');
                setSelectedCategory('all');
                setSelectedTier('all');
                setSearch('');
                setPage(1);
              }}
              className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
            >
              Reset filtrů
            </button>
          )}
        </div>
      </div>

      {/* Main Content View (Kanban or Table) */}
      {viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 overflow-x-auto pb-4">
          {kanbanStages.map((stageKey) => {
            const stageCfg = STAGE_CONFIG[stageKey] || STAGE_CONFIG.lead;
            const columnLeads = kanbanColumns[stageKey] || [];
            return (
              <div
                key={stageKey}
                className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/60 p-3 min-w-[240px]"
              >
                {/* Column header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{stageCfg.icon}</span>
                    <h3 className="text-xs font-bold text-slate-800">{stageCfg.label}</h3>
                  </div>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                    {columnLeads.length}
                  </span>
                </div>

                {/* Column cards list */}
                <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[70vh] pr-1">
                  {columnLeads.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Žádné kontakty
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => handleOpenLead(lead)}
                        className="group relative cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-2xs hover:border-slate-400 hover:shadow-xs transition"
                      >
                        {/* Title & Tier */}
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="text-xs font-bold text-slate-950 group-hover:text-indigo-600 transition line-clamp-1">
                            {lead.company_name || lead.name}
                          </h4>
                          {lead.tier === 1 && (
                            <span className="shrink-0 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-bold text-amber-800">
                              T1
                            </span>
                          )}
                        </div>

                        {/* Person or Category */}
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span>{lead.contact_person || lead.category}</span>
                        </div>

                        {/* Phone if available */}
                        {lead.phone && (
                          <div className="mt-1.5 flex items-center justify-between">
                            <a
                              href={`tel:${lead.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] font-medium text-emerald-700 hover:underline"
                            >
                              📞 {lead.phone}
                            </a>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyPhone(lead.id, lead.phone!);
                              }}
                              className="text-[10px] text-slate-400 hover:text-slate-800"
                              title="Kopírovat telefon"
                            >
                              {copiedPhoneId === lead.id ? '✓' : '📋'}
                            </button>
                          </div>
                        )}

                        {/* Notes preview */}
                        {lead.notes && (
                          <p className="mt-2 text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-1.5 rounded border border-slate-100">
                            {lead.notes}
                          </p>
                        )}

                        {/* Quick move buttons */}
                        <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
                          <span className="text-slate-400">{lead.source}</span>
                          <div className="flex items-center gap-1">
                            {stageKey !== 'won' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const nextIdx = kanbanStages.indexOf(stageKey) - 1;
                                  if (nextIdx >= 0) handleStageChange(lead.id, kanbanStages[nextIdx]);
                                }}
                                className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-700 hover:bg-slate-200"
                                title="Posunout doleva"
                              >
                                ←
                              </button>
                            )}
                            {stageKey !== 'lost' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const nextIdx = kanbanStages.indexOf(stageKey) + 1;
                                  if (nextIdx < kanbanStages.length) handleStageChange(lead.id, kanbanStages[nextIdx]);
                                }}
                                className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-700 hover:bg-slate-200"
                                title="Posunout doprava"
                              >
                                →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* RICH TABLE VIEW */
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Firma / Kontakt</th>
                  <th className="py-3 px-4">Obor</th>
                  <th className="py-3 px-4">Telefon</th>
                  <th className="py-3 px-4">E-mail & Web</th>
                  <th className="py-3 px-4">Bazoš odkaz</th>
                  <th className="py-3 px-4">Stav pipeline</th>
                  <th className="py-3 px-4">Poznámka / Reakce</th>
                  <th className="py-3 px-4 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <span className="animate-spin text-base">🔄</span>
                        <span className="text-sm">Načítám kontakty ze systému...</span>
                      </div>
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Nebyly nalezeny žádné kontakty odpovídající zadaným filtrům.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => {
                    const stageCfg = STAGE_CONFIG[lead.stage] || STAGE_CONFIG.lead;
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => handleOpenLead(lead)}
                        className="cursor-pointer hover:bg-slate-50/75 transition group"
                      >
                        {/* Name & Contact Person */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-950 group-hover:text-indigo-600 transition flex items-center gap-1.5">
                            <span>{lead.company_name || lead.name}</span>
                            {lead.tier === 1 && (
                              <span className="rounded bg-amber-100 px-1 py-0.2 text-[10px] font-bold text-amber-800">
                                Tier 1
                              </span>
                            )}
                          </div>
                          {lead.contact_person && (
                            <div className="text-[11px] text-slate-500 font-medium">
                              👤 {lead.contact_person}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400">
                            {lead.location || 'ČR'} • {lead.source}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-800 border border-slate-200">
                            {lead.category}
                          </span>
                        </td>

                        {/* Phone */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {lead.phone ? (
                            <div className="flex items-center gap-1.5">
                              <a
                                href={`tel:${lead.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="font-semibold text-emerald-700 hover:underline"
                              >
                                {lead.phone}
                              </a>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyPhone(lead.id, lead.phone!);
                                }}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
                                title="Kopírovat telefon"
                              >
                                {copiedPhoneId === lead.id ? '✓' : '📋'}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Email & Website */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            {lead.email ? (
                              <a
                                href={`mailto:${lead.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="block truncate max-w-[180px] text-indigo-600 hover:underline font-medium text-[11px]"
                              >
                                ✉️ {lead.email}
                              </a>
                            ) : null}
                            {lead.website ? (
                              <a
                                href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="block truncate max-w-[180px] text-slate-600 hover:text-slate-900 text-[11px]"
                              >
                                🌐 {lead.website.replace(/^https?:\/\//, '')}
                              </a>
                            ) : null}
                            {!lead.email && !lead.website && <span className="text-slate-300">-</span>}
                          </div>
                        </td>

                        {/* Bazos Profile */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {lead.bazos_url ? (
                            <a
                              href={lead.bazos_url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 rounded border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700 hover:bg-orange-100 transition"
                            >
                              <span>Bazoš</span>
                              <span>↗</span>
                            </a>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Stage Selector */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <select
                            value={lead.stage}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleStageChange(lead.id, e.target.value)}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-semibold focus:outline-none ${stageCfg.badge}`}
                          >
                            <option value="won">★ Získáno / Klient</option>
                            <option value="onboarding">🚀 Onboarding</option>
                            <option value="trial">🧪 Trial (Testuje)</option>
                            <option value="warm">🔥 V jednání (Warm)</option>
                            <option value="contacted">📞 Osloveno</option>
                            <option value="lead">❄️ Nový lead</option>
                            <option value="lost">✕ Ztraceno / Nezájem</option>
                          </select>
                        </td>

                        {/* Notes preview */}
                        <td className="py-3 px-4 max-w-[240px]">
                          <div className="truncate text-[11px] text-slate-600">
                            {lead.response ? (
                              <span className="font-semibold text-slate-900 mr-1">
                                [{lead.response}]
                              </span>
                            ) : null}
                            <span>{lead.notes || '-'}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenLead(lead);
                            }}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
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

          {/* Table Footer with Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/50 px-4 py-3">
            <span className="text-xs text-slate-500">
              Zobrazeno {leads.length} z celkem {total.toLocaleString('cs-CZ')} kontaktů
              (Strana {page} z {totalPages || 1})
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ← Předchozí
              </button>
              <span className="text-xs font-bold text-slate-700">
                {page} / {totalPages || 1}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Další →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL / EDIT SLIDE-OVER MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs">
          <div
            className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b border-slate-200 px-6 py-5 flex items-start justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-950">
                    {selectedLead.company_name || selectedLead.name}
                  </h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                      STAGE_CONFIG[selectedLead.stage]?.badge || 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {STAGE_CONFIG[selectedLead.stage]?.label || selectedLead.stage}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Zdroj: <strong className="text-slate-800">{selectedLead.source}</strong> • Obor:{' '}
                  <strong className="text-slate-800">{selectedLead.category}</strong> • ID: #{selectedLead.id}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setEditForm(selectedLead);
                    }}
                    className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
                  >
                    Upravit
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={savingLead}
                    className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                  >
                    {savingLead ? 'Ukládám...' : 'Uložit změny'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick Action Bar */}
            <div className="grid grid-cols-4 border-b border-slate-100 bg-white p-3 text-center text-xs font-semibold text-slate-700 divide-x divide-slate-100">
              {selectedLead.phone ? (
                <a
                  href={`tel:${selectedLead.phone}`}
                  className="flex items-center justify-center gap-1.5 py-1 text-emerald-700 hover:bg-emerald-50 rounded transition"
                >
                  <span>📞</span>
                  <span>Zavolat</span>
                </a>
              ) : (
                <span className="py-1 text-slate-300">Bez telefonu</span>
              )}

              {selectedLead.email ? (
                <a
                  href={`mailto:${selectedLead.email}`}
                  className="flex items-center justify-center gap-1.5 py-1 text-indigo-700 hover:bg-indigo-50 rounded transition"
                >
                  <span>✉️</span>
                  <span>Poslat e-mail</span>
                </a>
              ) : (
                <span className="py-1 text-slate-300">Bez e-mailu</span>
              )}

              {selectedLead.website ? (
                <a
                  href={selectedLead.website.startsWith('http') ? selectedLead.website : `https://${selectedLead.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 py-1 text-sky-700 hover:bg-sky-50 rounded transition"
                >
                  <span>🌐</span>
                  <span>Otevřít web</span>
                </a>
              ) : (
                <span className="py-1 text-slate-300">Bez webu</span>
              )}

              {selectedLead.bazos_url ? (
                <a
                  href={selectedLead.bazos_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 py-1 text-orange-700 hover:bg-orange-50 rounded transition"
                >
                  <span>Bazoš</span>
                  <span>↗</span>
                </a>
              ) : (
                <span className="py-1 text-slate-300">Bez Bazoše</span>
              )}
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 space-y-6">
              {/* Stepper / Stage selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Fáze v sales pipeline
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {Object.entries(STAGE_CONFIG).map(([stKey, stCfg]) => {
                    const isCur = (isEditing ? editForm.stage : selectedLead.stage) === stKey;
                    return (
                      <button
                        key={stKey}
                        type="button"
                        onClick={() => {
                          if (isEditing) {
                            setEditForm((prev) => ({ ...prev, stage: stKey }));
                          } else {
                            handleStageChange(selectedLead.id, stKey);
                          }
                        }}
                        className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition ${
                          isCur
                            ? `${stCfg.badge} ring-2 ring-slate-900`
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <span>{stCfg.icon}</span>
                          <span>{stCfg.label}</span>
                        </div>
                        <span className="mt-1 text-[10px] text-slate-500 line-clamp-1">{stCfg.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contact Information */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Kontaktní a firemní údaje
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Název firmy / Obchodu</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.company_name || editForm.name || ''}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, company_name: e.target.value, name: e.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                      />
                    ) : (
                      <div className="font-bold text-slate-900">{selectedLead.company_name || selectedLead.name}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Kontaktní osoba / Role</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.contact_person || ''}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, contact_person: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                      />
                    ) : (
                      <div className="font-medium text-slate-800">{selectedLead.contact_person || 'Nespecifikováno'}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Telefon</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.phone || ''}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                      />
                    ) : (
                      <div className="font-semibold text-emerald-800">{selectedLead.phone || '-'}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">E-mail</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                      />
                    ) : (
                      <div className="font-semibold text-indigo-700">{selectedLead.email || '-'}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Web / E-shop</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.website || ''}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, website: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                      />
                    ) : (
                      <div className="font-medium text-slate-800 truncate">{selectedLead.website || '-'}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Obor / Segment</label>
                    {isEditing ? (
                      <select
                        value={editForm.category || 'Ostatní'}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                      >
                        {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="font-medium text-slate-800">{selectedLead.category}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Priorita (Tier)</label>
                    {isEditing ? (
                      <select
                        value={editForm.tier || 3}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, tier: Number(e.target.value) }))}
                        className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                      >
                        <option value={1}>Tier 1 (Vysoký potenciál)</option>
                        <option value={2}>Tier 2 (Střední)</option>
                        <option value={3}>Tier 3 (Běžný)</option>
                      </select>
                    ) : (
                      <div className="font-bold text-slate-900">Tier {selectedLead.tier || 3}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Lokalita</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.location || 'ČR'}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                      />
                    ) : (
                      <div className="font-medium text-slate-800">{selectedLead.location || 'ČR'}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sales Notes & Responses */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Poznámky z hovorů a požadavky
                </h3>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1 text-xs">Reakce klienta</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.response || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, response: e.target.value }))}
                      placeholder="např. yes, 250 eur / zájem o trial / callback..."
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                    />
                  ) : (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 font-medium text-slate-800 text-xs">
                      {selectedLead.response || 'Bez zaznamenané přímé reakce'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1 text-xs">Podrobné poznámky & požadavky</label>
                  {isEditing ? (
                    <textarea
                      rows={4}
                      value={editForm.notes || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Zapište detail hovoru, požadavky na funkce, domluvený termín..."
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                    />
                  ) : (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 text-xs whitespace-pre-wrap leading-relaxed">
                      {selectedLead.notes || 'Žádné doplňující poznámky'}
                    </div>
                  )}
                </div>

                {/* Timeline dates if present */}
                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400">Datum 1. hovoru / mailu:</span>
                    <div className="font-semibold text-slate-800">{selectedLead.first_call_date || '-'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Datum onboardingu:</span>
                    <div className="font-semibold text-slate-800">{selectedLead.onboarding_date || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Origin sheets and tags */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-2">
                <div className="font-semibold text-slate-700">Původní zdroje z Excel sešitu:</div>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedLead.origin_sheets || []).map((sheet, idx) => (
                    <span key={idx} className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 font-mono">
                      📄 {sheet}
                    </span>
                  ))}
                </div>

                {selectedLead.tags && selectedLead.tags.length > 0 && (
                  <div className="pt-2">
                    <div className="font-semibold text-slate-700 mb-1">Tagy:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedLead.tags.map((tag, idx) => (
                        <span key={idx} className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SALES PLAYBOOK & OBJECTIONS MODAL */}
      {showPlaybook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="border-b border-slate-200 bg-slate-950 px-6 py-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight">💡 Sales Playbook & Cold Call Hlášky</h3>
                <p className="text-xs text-slate-400 mt-0.5">Reálné zkušenosti, námitky a sales skripty z praxe Sellin.cz</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPlaybook(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Cold Call Anecdotes from Sheet */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                  <span>🎭</span>
                  <span>Autentické zážitky ze sheetu (Cold calls):</span>
                </h4>
                <div className="space-y-3 font-mono text-[11px]">
                  <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-1">
                    <div className="text-slate-500">Ty: &ldquo;Volám ohledně inzerce a možné spolupráce...&rdquo;</div>
                    <div className="text-emerald-700 font-semibold">Prodejce: &ldquo;Povídejte.&rdquo;</div>
                    <div className="text-slate-500">Ty: &ldquo;Vytvářím nástroj, který by vám mohl pomoct s inzerováním na Bazoši...&rdquo;</div>
                    <div className="text-rose-600 font-bold">Prodejce (přerušil): &ldquo;To nechci!&rdquo; (cvak)</div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-1">
                    <div className="text-slate-500">Prodejce: &ldquo;Odkud jste?&rdquo;</div>
                    <div className="text-slate-700">Ty: &ldquo;Já jsem z Prahy.&rdquo;</div>
                    <div className="text-rose-600 font-bold">Prodejce (naštvaně): &ldquo;Ne, nemáme zájem!&rdquo;</div>
                  </div>
                </div>
              </div>

              {/* What works */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                <h4 className="font-bold text-emerald-900 mb-2 flex items-center gap-1.5">
                  <span>🎯</span>
                  <span>Co fungovalo nejlépe (Konverze na Trial & 250 €):</span>
                </h4>
                <ul className="space-y-2 list-disc pl-4 text-emerald-950">
                  <li>
                    <strong>Okamžitá hodnota:</strong> &ldquo;Všiml jsem si, že máte na Bazoši přes 150 inzerátů. Ruční obnovování a topování vám bere hodiny týdně. Náš robot to dělá automaticky a drží inzeráty nahoře.&rdquo;
                  </li>
                  <li>
                    <strong>B2B prodejci dílů / pneu:</strong> Zmiňovat multi-inzerci: zadáte zboží jednou do centrálního skladu a automaticky se vystaví na Bazoš, Sbazar i na váš vlastní e-shop.
                  </li>
                  <li>
                    <strong>Nabídka zkušebního týdne (Trial):</strong> &ldquo;Nechci po vás žádné peníze předem. Dám vám na 7 dní přístup, nastavíme automatické obnovování a uvidíte, kolik poptávek vám přijde navíc.&rdquo;
                  </li>
                </ul>
              </div>

              {/* Target tiers */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="font-bold text-slate-900 mb-2">Rozdělení Tierů zákazníků:</h4>
                <div className="space-y-2 text-slate-700">
                  <div>
                    <strong className="text-amber-800">Tier 1:</strong> Obchody s více než 100 inzeráty, firmy s kamennou prodejnou, vrakoviště, pneuservisy (vysoká retence, ochota platit měsíční paušál 100–250 €).
                  </div>
                  <div>
                    <strong className="text-slate-800">Tier 2:</strong> Prodejci 30–100 inzerátů, servisní technici (mobilní telefony, spotřebiče).
                  </div>
                  <div>
                    <strong className="text-slate-500">Tier 3:</strong> Občasní inzerenti nebo soukromníci (vhodní na self-service registraci).
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPlaybook(false)}
                className="rounded-lg bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
              >
                Rozumím, zavřít playbook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD LEAD MODAL */}
      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onCreated={(newLead) => {
            setLeads((prev) => [newLead, ...prev]);
            setShowAddModal(false);
            showToast(`Kontakt ${newLead.name} byl úspěšně přidán do CRM`);
          }}
        />
      )}
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
  const [contactPerson, setContactPerson] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name && !companyName && !phone) {
      setError('Vyplňte prosím alespoň jméno, firmu nebo telefon');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await createCrmLead({
        name: name || companyName || 'Nový kontakt',
        company_name: companyName || name,
        contact_person: contactPerson || null,
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
      const msg = err instanceof Error ? err.message : 'Chyba při vytváření';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        <div className="border-b border-slate-200 bg-slate-950 px-6 py-4 text-white flex items-center justify-between">
          <h3 className="text-base font-black">➕ Přidat nový kontakt do CRM</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-rose-700 font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Jméno kontaktu *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="např. Jan Novák / Pneuservis"
                className="w-full rounded-lg border border-slate-200 p-2"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Název firmy</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="např. AutoDíly s.r.o."
                className="w-full rounded-lg border border-slate-200 p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Telefon</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+420 777 123 456"
                className="w-full rounded-lg border border-slate-200 p-2"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@firma.cz"
                className="w-full rounded-lg border border-slate-200 p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Web / E-shop</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="www.eshop.cz"
                className="w-full rounded-lg border border-slate-200 p-2"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Bazoš URL</label>
              <input
                type="text"
                value={bazosUrl}
                onChange={(e) => setBazosUrl(e.target.value)}
                placeholder="https://www.bazos.cz/hodnoceni..."
                className="w-full rounded-lg border border-slate-200 p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Obor</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2"
              >
                {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Stav</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2"
              >
                <option value="lead">❄️ Nový lead</option>
                <option value="contacted">📞 Osloveno</option>
                <option value="warm">🔥 V jednání (Warm)</option>
                <option value="trial">🧪 Trial</option>
                <option value="onboarding">🚀 Onboarding</option>
                <option value="won">★ Získáno</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Priorita</label>
              <select
                value={tier}
                onChange={(e) => setTier(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 p-2"
              >
                <option value={1}>Tier 1 (Top)</option>
                <option value={2}>Tier 2 (Střední)</option>
                <option value={3}>Tier 3 (Běžný)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Poznámka / Záznam z hovoru</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Počet inzerátů, reakce, domluvený termín..."
              className="w-full rounded-lg border border-slate-200 p-2"
            />
          </div>

          <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-950 px-4 py-2 font-semibold text-white shadow-xs hover:bg-slate-800 transition disabled:opacity-50"
            >
              {saving ? 'Ukládám...' : 'Vytvořit kontakt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
