/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Database,
  CheckCircle2
} from 'lucide-react';
import { ProcurementProject, ProcurementItem, SearchSiteConfig, PriceBankItem } from './types/procurement';
import { DEFAULT_SEARCH_SITES } from './utils/sitePresets';
import { calculateStats, formatCurrencyBRL } from './utils/procurementStats';
import { exportProcurementToExcel, ParsedItemRow } from './utils/spreadsheetHelper';
import { loadPriceBank, savePriceBank, matchPriceBankItems } from './utils/priceBankStorage';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { SingleItemSearch } from './components/SingleItemSearch';
import { ProcurementTable } from './components/ProcurementTable';
import { SiteFilterModal } from './components/SiteFilterModal';
import { SpreadsheetUploadModal } from './components/SpreadsheetUploadModal';
import { ItemDetailModal } from './components/ItemDetailModal';
import { ProcurementReportModal } from './components/ProcurementReportModal';
import { PriceBankModal } from './components/PriceBankModal';
import { GitHubModal } from './components/GitHubModal';
import { HowToUseModal } from './components/HowToUseModal';
import { loadGitHubAuth } from './utils/githubStorage';

const INITIAL_PROJECT: ProcurementProject = {
  id: 'proj_default',
  processNumber: 'Pregão Eletrônico SRP nº 012/2025',
  title: 'Aquisição de Materiais de Escritório, Informática e Suprimentos Gerais',
  entityName: 'Prefeitura Municipal / Órgão Licitante',
  department: 'Secretaria Municipal de Administração - Divisão de Compras',
  responsibleName: 'Comissão Permanente de Licitação / Agente de Contratação',
  createdAt: new Date().toISOString(),
  methodology: 'media',
  items: [],
  usePriceBankAsSource: true,
};

export default function App() {
  const [project, setProject] = useState<ProcurementProject>(() => {
    const saved = localStorage.getItem('cotalicit_project');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved project:', e);
      }
    }
    return INITIAL_PROJECT;
  });

  const [sites, setSites] = useState<SearchSiteConfig[]>(() => {
    const saved = localStorage.getItem('cotalicit_sites');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved sites:', e);
      }
    }
    return DEFAULT_SEARCH_SITES;
  });

  // Price Bank State
  const [priceBankItems, setPriceBankItems] = useState<PriceBankItem[]>(() => loadPriceBank());
  const [usePriceBank, setUsePriceBank] = useState<boolean>(() => {
    const saved = localStorage.getItem('cotalicit_use_price_bank');
    return saved !== null ? saved === 'true' : true;
  });

  // Modals state
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isPriceBankModalOpen, setIsPriceBankModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  const [gitHubAuth, setGitHubAuth] = useState(() => loadGitHubAuth());
  const [selectedItemDetail, setSelectedItemDetail] = useState<ProcurementItem | null>(null);

  // Refresh GitHub auth on window focus or storage change
  useEffect(() => {
    const checkAuth = () => setGitHubAuth(loadGitHubAuth());
    window.addEventListener('storage', checkAuth);
    window.addEventListener('focus', checkAuth);
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('focus', checkAuth);
    };
  }, []);

  // Batch queue state
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const shouldStopBatchRef = useRef(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('cotalicit_project', JSON.stringify(project));
  }, [project]);

  useEffect(() => {
    localStorage.setItem('cotalicit_sites', JSON.stringify(sites));
  }, [sites]);

  useEffect(() => {
    localStorage.setItem('cotalicit_use_price_bank', String(usePriceBank));
  }, [usePriceBank]);

  const handleSavePriceBankItems = (newItems: PriceBankItem[]) => {
    setPriceBankItems(newItems);
    savePriceBank(newItems);
  };

  // Perform research for a single item via AI backend + Price Bank integration
  const executeItemResearch = async (item: ProcurementItem): Promise<ProcurementItem> => {
    try {
      const selectedDomains = sites.filter((s) => s.selected).map((s) => s.domain);

      // Match items in Price Bank if enabled
      const matchedBankQuotes = usePriceBank
        ? matchPriceBankItems(item.originalDescription, item.referenceBrand, priceBankItems)
        : [];

      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item: {
            originalDescription: item.originalDescription,
            referenceBrand: item.referenceBrand,
            quantity: item.quantity,
            unit: item.unit,
          },
          targetSites: selectedDomains,
          priceBankQuotes: matchedBankQuotes,
          preferredMethod: project.methodology || 'media',
        }),
      });

      if (!response.ok) {
        throw new Error(`Falha no servidor de cotação (código ${response.status})`);
      }

      const data = await response.json();
      const quotes = data.quotes || [];

      // Calculate statistical metrics
      const stats = calculateStats(quotes, item.quantity, project.methodology || 'media');

      return {
        ...item,
        status: 'completed',
        recognizedProduct: data.recognizedProduct || item.recognizedProduct,
        technicalSummary: data.technicalSummary || item.technicalSummary,
        referenceBrand: data.referenceBrand || item.referenceBrand,
        quotes,
        ...stats,
        methodologyApplied: project.methodology || 'media',
        errorMessage: undefined,
      };
    } catch (err: any) {
      console.error('Error researching item:', err);

      // If network fails, try matching locally from Price Bank as offline safeguard
      const fallbackBankQuotes = usePriceBank
        ? matchPriceBankItems(item.originalDescription, item.referenceBrand, priceBankItems)
        : [];

      if (fallbackBankQuotes.length > 0) {
        const stats = calculateStats(fallbackBankQuotes, item.quantity, project.methodology || 'media');
        return {
          ...item,
          status: 'completed',
          quotes: fallbackBankQuotes,
          ...stats,
          methodologyApplied: project.methodology || 'media',
          technicalSummary: `Item orçado a partir do Banco de Preços Institucional (${fallbackBankQuotes[0].supplier}).`,
          errorMessage: undefined,
        };
      }

      return {
        ...item,
        status: 'error',
        errorMessage: err.message || 'Erro ao buscar cotações nas lojas online.',
      };
    }
  };

  // Add a single item and optionally research
  const handleAddItemAndResearch = async (
    itemData: Partial<ProcurementItem>,
    autoSearch: boolean
  ) => {
    const newItem: ProcurementItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      itemNumber: itemData.itemNumber || project.items.length + 1,
      originalDescription: itemData.originalDescription || '',
      quantity: itemData.quantity || 1,
      unit: itemData.unit || 'UN',
      referenceBrand: itemData.referenceBrand,
      quotes: [],
      status: autoSearch ? 'searching' : 'pending',
    };

    setProject((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    if (autoSearch) {
      const updated = await executeItemResearch(newItem);
      setProject((prev) => ({
        ...prev,
        items: prev.items.map((it) => (it.id === newItem.id ? updated : it)),
      }));
    }
  };

  // Trigger search on existing single item
  const handleSearchSingleItem = async (itemId: string) => {
    const targetItem = project.items.find((i) => i.id === itemId);
    if (!targetItem) return;

    setProject((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === itemId ? { ...it, status: 'searching' } : it)),
    }));

    const updated = await executeItemResearch(targetItem);
    setProject((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === itemId ? updated : it)),
    }));

    if (selectedItemDetail && selectedItemDetail.id === itemId) {
      setSelectedItemDetail(updated);
    }
  };

  // Handle batch import from spreadsheet
  const handleImportSpreadsheetItems = (
    newRows: ParsedItemRow[],
    autoStartBatch: boolean
  ) => {
    const startNum = project.items.length + 1;
    const newItems: ProcurementItem[] = newRows.map((row, idx) => ({
      id: `item_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      itemNumber: startNum + idx,
      originalDescription: row.originalDescription,
      quantity: row.quantity,
      unit: row.unit,
      referenceBrand: row.referenceBrand,
      quotes: [],
      status: 'pending',
    }));

    setProject((prev) => ({
      ...prev,
      items: [...prev.items, ...newItems],
    }));

    if (autoStartBatch) {
      setTimeout(() => {
        handleStartBatchQueue(newItems);
      }, 200);
    }
  };

  // Start batch processing queue
  const handleStartBatchQueue = async (itemsToProcess?: ProcurementItem[]) => {
    const queue = itemsToProcess || project.items.filter((i) => i.status === 'pending' || i.status === 'error');
    if (queue.length === 0) return;

    shouldStopBatchRef.current = false;
    setIsBatchRunning(true);
    setBatchProgress({ current: 0, total: queue.length });

    for (let i = 0; i < queue.length; i++) {
      if (shouldStopBatchRef.current) {
        break;
      }
      const item = queue[i];
      setBatchProgress({ current: i + 1, total: queue.length });

      setProject((prev) => ({
        ...prev,
        items: prev.items.map((it) => (it.id === item.id ? { ...it, status: 'searching' } : it)),
      }));

      const updated = await executeItemResearch(item);
      setProject((prev) => ({
        ...prev,
        items: prev.items.map((it) => (it.id === item.id ? updated : it)),
      }));
    }

    setIsBatchRunning(false);
  };

  const handleStopBatch = () => {
    shouldStopBatchRef.current = true;
    setIsBatchRunning(false);
  };

  // Methodology change (media / mediana / menor_preco)
  const handleUpdateMethodology = (newMethod: 'media' | 'mediana' | 'menor_preco') => {
    setProject((prev) => {
      const recalculatedItems = prev.items.map((item) => {
        const stats = calculateStats(item.quotes, item.quantity, newMethod);
        return {
          ...item,
          ...stats,
          methodologyApplied: newMethod,
        };
      });
      return {
        ...prev,
        methodology: newMethod,
        items: recalculatedItems,
      };
    });
  };

  // Site Configuration Handlers
  const handleToggleSite = (siteId: string) => {
    setSites((prev) =>
      prev.map((s) => (s.id === siteId ? { ...s, selected: !s.selected } : s))
    );
  };

  const handleAddCustomSite = (name: string, domain: string) => {
    const newSite: SearchSiteConfig = {
      id: `custom_${Date.now()}`,
      name,
      domain,
      category: 'especializado',
      selected: true,
      description: 'Fonte personalizada inserida pelo usuário',
    };
    setSites((prev) => [...prev, newSite]);
  };

  const handleRemoveSite = (siteId: string) => {
    setSites((prev) => prev.filter((s) => s.id !== siteId));
  };

  const handleSelectAllSites = (select: boolean) => {
    setSites((prev) => prev.map((s) => ({ ...s, selected: select })));
  };

  // Item deletion
  const handleDeleteItem = (itemId: string) => {
    setProject((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== itemId),
    }));
  };

  const handleClearAllItems = () => {
    if (window.confirm('Deseja realmente limpar todos os itens da pesquisa de preços?')) {
      setProject((prev) => ({
        ...prev,
        items: [],
      }));
    }
  };

  // Update item from modal
  const handleUpdateItemFromModal = (updatedItem: ProcurementItem) => {
    setProject((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === updatedItem.id ? updatedItem : i)),
    }));
    setSelectedItemDetail(updatedItem);
  };

  // Export to Excel
  const handleExportExcel = () => {
    exportProcurementToExcel(project.items, project.processNumber || 'Pesquisa_Precos');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <Header
        project={project}
        onUpdateProject={(updates) => setProject((prev) => ({ ...prev, ...updates }))}
        onOpenSiteConfig={() => setIsSiteModalOpen(true)}
        onOpenPriceBank={() => setIsPriceBankModalOpen(true)}
        onOpenGitHub={() => setIsGitHubModalOpen(true)}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenNewItem={() => {
          window.scrollTo({ top: 120, behavior: 'smooth' });
        }}
        onExportExcel={handleExportExcel}
        onOpenReport={() => setIsReportModalOpen(true)}
        onOpenHowToUse={() => setIsHowToUseOpen(true)}
        selectedSites={sites}
        priceBankCount={priceBankItems.length}
        usePriceBank={usePriceBank}
        isGitHubConnected={Boolean(gitHubAuth.user)}
        gitHubUsername={gitHubAuth.user?.login}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Project Title / Entity Bar with Price Bank Indicator */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="text"
                value={project.processNumber}
                onChange={(e) => setProject({ ...project, processNumber: e.target.value })}
                className="bg-transparent text-sm sm:text-base font-bold text-slate-900 focus:outline-none border-b border-transparent hover:border-slate-300 focus:border-slate-800 transition w-full max-w-md"
                placeholder="Nº do Processo / Pregão"
              />
            </div>
            <input
              type="text"
              value={project.title}
              onChange={(e) => setProject({ ...project, title: e.target.value })}
              className="bg-transparent text-xs sm:text-sm text-slate-600 focus:outline-none border-b border-transparent hover:border-slate-300 focus:border-slate-800 transition w-full"
              placeholder="Objeto licitatório (ex: Aquisição de material permanente...)"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs shrink-0 flex-wrap">
            {/* Price Bank Status Badge */}
            <button
              onClick={() => setIsPriceBankModalOpen(true)}
              className={`px-3 py-1.5 rounded-lg border flex items-center space-x-1.5 transition ${
                usePriceBank
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
              title="Gerenciar e importar Notas Fiscais e Catálogos"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Banco de Preços:</span>
              <strong className="text-emerald-800">{priceBankItems.length} registros</strong>
              {usePriceBank && <CheckCircle2 className="w-3 h-3 text-emerald-600 ml-0.5" />}
            </button>

            {/* Active web sites */}
            <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center space-x-2">
              <span className="text-slate-600">Lojas Virtuais:</span>
              <button
                onClick={() => setIsSiteModalOpen(true)}
                className="text-slate-900 hover:text-emerald-700 underline font-semibold"
              >
                {sites.filter((s) => s.selected).length} portais
              </button>
            </div>
          </div>
        </div>

        {/* Statistical Summary Cards */}
        <StatsCards
          project={project}
          items={project.items}
          onUpdateMethodology={handleUpdateMethodology}
        />

        {/* Single Item Inquiry Form */}
        <SingleItemSearch
          onAddItemAndResearch={handleAddItemAndResearch}
          nextItemNumber={project.items.length + 1}
        />

        {/* Central Procurement Interactive Table */}
        <ProcurementTable
          project={project}
          items={project.items}
          isBatchRunning={isBatchRunning}
          batchProgress={batchProgress}
          onStartBatch={() => handleStartBatchQueue()}
          onStopBatch={handleStopBatch}
          onSearchItem={handleSearchSingleItem}
          onDeleteItem={handleDeleteItem}
          onOpenItemDetail={(item) => setSelectedItemDetail(item)}
          onOpenNewItem={() => window.scrollTo({ top: 120, behavior: 'smooth' })}
          onClearAll={handleClearAllItems}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>
          CotaLicit • Plataforma de Pesquisa de Preços para Licitações e Contratações Públicas (Lei nº 14.133/2021)
        </p>
      </footer>

      {/* Modals */}
      <SiteFilterModal
        isOpen={isSiteModalOpen}
        onClose={() => setIsSiteModalOpen(false)}
        sites={sites}
        onToggleSite={handleToggleSite}
        onAddCustomSite={handleAddCustomSite}
        onRemoveSite={handleRemoveSite}
        onSelectAll={handleSelectAllSites}
      />

      <SpreadsheetUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImportItems={handleImportSpreadsheetItems}
      />

      <ItemDetailModal
        item={selectedItemDetail}
        isOpen={Boolean(selectedItemDetail)}
        onClose={() => setSelectedItemDetail(null)}
        onUpdateItem={handleUpdateItemFromModal}
        onReSearchItem={handleSearchSingleItem}
      />

      <ProcurementReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        project={project}
        onUpdateProject={(updates) => setProject((prev) => ({ ...prev, ...updates }))}
      />

      <PriceBankModal
        isOpen={isPriceBankModalOpen}
        onClose={() => setIsPriceBankModalOpen(false)}
        priceBankItems={priceBankItems}
        onSavePriceBankItems={handleSavePriceBankItems}
        usePriceBankAsSource={usePriceBank}
        onToggleUsePriceBank={(val) => setUsePriceBank(val)}
        onOpenGitHub={() => setIsGitHubModalOpen(true)}
      />

      <GitHubModal
        isOpen={isGitHubModalOpen}
        onClose={() => {
          setIsGitHubModalOpen(false);
          setGitHubAuth(loadGitHubAuth());
        }}
        priceBankItems={priceBankItems}
        onUpdatePriceBankItems={handleSavePriceBankItems}
        currentProject={project}
      />

      <HowToUseModal
        isOpen={isHowToUseOpen}
        onClose={() => setIsHowToUseOpen(false)}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenPriceBank={() => setIsPriceBankModalOpen(true)}
        onOpenGitHub={() => setIsGitHubModalOpen(true)}
        onOpenReport={() => setIsReportModalOpen(true)}
      />
    </div>
  );
}
