import React, { useState } from 'react';
import { 
  X, 
  Globe, 
  Plus, 
  Check, 
  Trash2, 
  ShieldCheck, 
  ShoppingBag, 
  Cpu, 
  Info 
} from 'lucide-react';
import { SearchSiteConfig } from '../types/procurement';

interface SiteFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: SearchSiteConfig[];
  onToggleSite: (siteId: string) => void;
  onAddCustomSite: (name: string, domain: string) => void;
  onRemoveSite: (siteId: string) => void;
  onSelectAll: (select: boolean) => void;
}

export const SiteFilterModal: React.FC<SiteFilterModalProps> = ({
  isOpen,
  onClose,
  sites,
  onToggleSite,
  onAddCustomSite,
  onRemoveSite,
  onSelectAll,
}) => {
  const [customName, setCustomName] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customDomain.trim()) return;

    let cleanDomain = customDomain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    onAddCustomSite(customName.trim(), cleanDomain);
    setCustomName('');
    setCustomDomain('');
  };

  const filteredSites = sites.filter((site) => {
    if (activeCategory === 'all') return true;
    return site.category === activeCategory;
  });

  const selectedCount = sites.filter((s) => s.selected).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Fontes e Portais de Pesquisa</h2>
            <p className="text-xs text-slate-500">
              Selecione os portais oficiais e lojas onde as cotações serão priorizadas (Art. 23 Lei 14.133/2021)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Bar & Quick actions */}
        <div className="px-6 py-2.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                activeCategory === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({sites.length})
            </button>
            <button
              onClick={() => setActiveCategory('governamental')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                activeCategory === 'governamental'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Governamentais
            </button>
            <button
              onClick={() => setActiveCategory('marketplace')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                activeCategory === 'marketplace'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Marketplaces
            </button>
            <button
              onClick={() => setActiveCategory('especializado')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                activeCategory === 'especializado'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Especialistas
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <button
              onClick={() => onSelectAll(true)}
              className="hover:text-slate-900 hover:underline"
            >
              Selecionar Todos
            </button>
            <span>·</span>
            <button
              onClick={() => onSelectAll(false)}
              className="hover:text-slate-900 hover:underline"
            >
              Desmarcar Todos
            </button>
          </div>
        </div>

        {/* Sites list */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filteredSites.map((site) => (
              <div
                key={site.id}
                onClick={() => onToggleSite(site.id)}
                className={`p-3 rounded-lg border cursor-pointer transition flex items-start space-x-3 ${
                  site.selected
                    ? 'bg-emerald-50/50 border-emerald-300 text-slate-900'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <div
                  className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition flex-shrink-0 ${
                    site.selected
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-300 bg-white'
                  }`}
                >
                  {site.selected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold truncate text-slate-900">
                      {site.name}
                    </span>
                    {site.id.startsWith('custom_') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveSite(site.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-0.5 ml-1 transition"
                        title="Remover fonte customizada"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] text-emerald-800 font-mono block">
                    {site.domain}
                  </span>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {site.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Custom site addition */}
          <div className="pt-3 border-t border-slate-200">
            <span className="text-xs font-semibold text-slate-700 mb-2 block">
              Adicionar Fornecedor ou Portal Específico
            </span>
            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Nome do Fornecedor / Empresa"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white"
              />
              <input
                type="text"
                placeholder="Domínio (ex: portalfornecedor.com.br)"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white font-mono"
              />
              <button
                type="submit"
                disabled={!customName.trim() || !customDomain.trim()}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg text-xs font-medium transition"
              >
                Adicionar
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-600">
            <strong>{selectedCount}</strong> fontes ativas para cotação
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
          >
            Confirmar e Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};
