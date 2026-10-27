import React from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Globe, 
  Plus, 
  FileDown, 
  Scale,
  Database,
  HelpCircle
} from 'lucide-react';
import { ProcurementProject, SearchSiteConfig } from '../types/procurement';

interface HeaderProps {
  project: ProcurementProject;
  onUpdateProject: (updates: Partial<ProcurementProject>) => void;
  onOpenSiteConfig: () => void;
  onOpenPriceBank: () => void;
  onOpenGitHub: () => void;
  onOpenUpload: () => void;
  onOpenNewItem: () => void;
  onExportExcel: () => void;
  onOpenReport: () => void;
  onOpenHowToUse: () => void;
  selectedSites: SearchSiteConfig[];
  priceBankCount: number;
  usePriceBank: boolean;
  isGitHubConnected: boolean;
  gitHubUsername?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  onOpenSiteConfig,
  onOpenPriceBank,
  onOpenGitHub,
  onOpenUpload,
  onOpenNewItem,
  onExportExcel,
  onOpenReport,
  onOpenHowToUse,
  selectedSites,
  priceBankCount,
  usePriceBank,
  isGitHubConnected,
  gitHubUsername,
}) => {
  const activeSitesCount = selectedSites.filter((s) => s.selected).length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity - Clean 1-Line Typography */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
              <Scale className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base text-slate-900 tracking-tight">CotaLicit</span>
                <span className="text-slate-300 font-light">|</span>
                <span className="text-xs text-slate-500 font-medium">
                  Pesquisa de Preços para Licitações
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                <span>Lei 14.133/2021</span>
                <span>·</span>
                <span>IN SEGES 65/2021</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center space-x-2">
            {/* Banco de Preços Button */}
            <button
              onClick={onOpenPriceBank}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                usePriceBank
                   ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100/80'
                   : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title="Banco de Preços com NFs, Catálogos e Contratos (Art. 23 Lei 14.133/2021)"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Banco de Preços</span>
              <span className="text-[11px] font-bold text-emerald-700 bg-white px-1.5 py-0.2 rounded border border-emerald-200">
                {priceBankCount}
              </span>
            </button>

            {/* GitHub Integration Button */}
            <button
              onClick={onOpenGitHub}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                isGitHubConnected
                  ? 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title="Sincronizar Banco de Preços e Pesquisas com GitHub"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span className="hidden sm:inline">
                {isGitHubConnected ? (gitHubUsername ? `@${gitHubUsername}` : 'GitHub') : 'GitHub'}
              </span>
              {isGitHubConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </button>

            {/* Como Usar Button */}
            <button
              onClick={onOpenHowToUse}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition shadow-2xs"
              title="Guia passo a passo: como usar o sistema de pesquisa e importar o app"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Como Usar</span>
            </button>


            {/* Sites de Pesquisa */}
            <button
              onClick={onOpenSiteConfig}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
              title="Configurar portais e fornecedores de pesquisa na internet"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Sites de Pesquisa</span>
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-200/70 px-1.5 py-0.2 rounded">
                {activeSitesCount}
              </span>
            </button>

            {/* Importar Planilha */}
            <button
              onClick={onOpenUpload}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Importar Planilha</span>
            </button>

            {/* Novo Item */}
            <button
              onClick={onOpenNewItem}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Item</span>
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

            <button
              onClick={onExportExcel}
              disabled={project.items.length === 0}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
              title="Exportar planilha Excel (.xlsx)"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden lg:inline">Exportar Excel</span>
            </button>

            <button
              onClick={onOpenReport}
              disabled={project.items.length === 0}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
              title="Gerar Relatório de Pesquisa de Preços Licitatório"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden lg:inline">Relatório Oficial</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
