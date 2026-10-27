import React, { useState } from 'react';
import { 
  RotateCw, 
  Trash2, 
  ExternalLink, 
  Eye, 
  Search, 
  Plus, 
  Loader2
} from 'lucide-react';
import { ProcurementItem, ProcurementProject } from '../types/procurement';
import { formatCurrencyBRL } from '../utils/procurementStats';

interface ProcurementTableProps {
  project: ProcurementProject;
  items: ProcurementItem[];
  isBatchRunning: boolean;
  batchProgress: { current: number; total: number };
  onStartBatch: () => void;
  onStopBatch: () => void;
  onSearchItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onOpenItemDetail: (item: ProcurementItem) => void;
  onOpenNewItem: () => void;
  onClearAll: () => void;
}

export const ProcurementTable: React.FC<ProcurementTableProps> = ({
  project,
  items,
  isBatchRunning,
  batchProgress,
  onStartBatch,
  onStopBatch,
  onSearchItem,
  onDeleteItem,
  onOpenItemDetail,
  onOpenNewItem,
  onClearAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'alert'>('all');

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.originalDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.recognizedProduct && item.recognizedProduct.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.referenceBrand && item.referenceBrand.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'pending') return item.status === 'pending' || item.status === 'searching';
    if (statusFilter === 'completed') return item.status === 'completed';
    if (statusFilter === 'alert') return (item.coefficientOfVariation || 0) > 25;
    return true;
  });

  const pendingCount = items.filter((i) => i.status === 'pending').length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col mb-12">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search & Segmented Filter */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por descrição, produto ou marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition"
            />
          </div>

          {/* Segmented Filter Control */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded font-medium transition ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({items.length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1 rounded font-medium transition ${
                statusFilter === 'completed'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cotados ({items.filter((i) => i.status === 'completed').length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded font-medium transition ${
                statusFilter === 'pending'
                  ? 'bg-white text-amber-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pendentes ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('alert')}
              className={`px-3 py-1 rounded font-medium transition ${
                statusFilter === 'alert'
                  ? 'bg-white text-rose-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dispersão Alta ({items.filter((i) => (i.coefficientOfVariation || 0) > 25).length})
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {isBatchRunning ? (
            <button
              onClick={onStopBatch}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Pausar Pesquisa</span>
            </button>
          ) : (
            <button
              onClick={onStartBatch}
              disabled={pendingCount === 0}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
            >
              <span>Pesquisar Pendentes ({pendingCount})</span>
            </button>
          )}

          {items.length > 0 && (
            <button
              onClick={onClearAll}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
              title="Limpar todos os itens da tabela"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Informative Automated Market Search Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-[11px] text-slate-600">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
          <span>
            <strong>Pesquisa de Mercado Automatizada:</strong> A IA consulta as lojas virtuais, localiza a oferta de menor valor, anota a marca vendida e inclui o link na planilha.
          </span>
        </div>
      </div>

      {/* Batch Progress Bar */}
      {isBatchRunning && (
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-700">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            <span>
              Consultando cotações no mercado: item {batchProgress.current} de {batchProgress.total}...
            </span>
          </div>
          <span className="font-mono font-semibold text-slate-900 tabular-nums">
            {Math.round((batchProgress.current / (batchProgress.total || 1)) * 100)}%
          </span>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">Item</th>
              <th className="py-2.5 px-3 min-w-[220px]">Descrição Licitatória</th>
              <th className="py-2.5 px-3 min-w-[180px]">Produto Reconhecido</th>
              <th className="py-2.5 px-3 w-20 text-center">Qtd/Un</th>
              <th className="py-2.5 px-3 min-w-[190px] bg-emerald-50/80 text-emerald-950 border-x border-emerald-200">
                <div className="flex flex-col">
                  <span>Melhor Preço & Marca</span>
                  <span className="text-[9px] font-normal text-emerald-800 lowercase tracking-normal">menor custo no site</span>
                </div>
              </th>
              <th className="py-2.5 px-3 min-w-[160px]">Cotações Encontradas</th>
              <th className="py-2.5 px-3 w-24 text-right">Preço Médio</th>
              <th className="py-2.5 px-3 w-28 text-right font-bold text-slate-900">Total Estimado</th>
              <th className="py-2.5 px-3 w-24 text-center">Status</th>
              <th className="py-2.5 px-3 w-20 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  <div className="max-w-sm mx-auto space-y-2">
                    <p className="text-sm font-medium text-slate-700">
                      Nenhum item na planilha de cotação
                    </p>
                    <p className="text-xs text-slate-500">
                      Importe uma planilha (.xlsx) ou adicione itens manualmente para iniciar a pesquisa.
                    </p>
                    <button
                      onClick={onOpenNewItem}
                      className="mt-3 inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Primeiro Item</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const activeQuotes = item.quotes.filter((q) => !q.isExcluded);
                const hasHighCV = (item.coefficientOfVariation || 0) > 25;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => onOpenItemDetail(item)}
                  >
                    {/* Item Number */}
                    <td className="py-3 px-3 text-center font-mono font-semibold text-slate-400">
                      {item.itemNumber}
                    </td>

                    {/* Original Description */}
                    <td className="py-3 px-3">
                      <p className="font-medium text-slate-900 line-clamp-2" title={item.originalDescription}>
                        {item.originalDescription}
                      </p>
                      {item.referenceBrand && (
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                          Ref: {item.referenceBrand}
                        </span>
                      )}
                    </td>

                    {/* Recognized Product */}
                    <td className="py-3 px-3">
                      {item.recognizedProduct ? (
                        <div>
                          <span className="font-semibold text-slate-900 block line-clamp-1">
                            {item.recognizedProduct}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {item.referenceBrand || activeQuotes[0]?.brand || 'Marcas diversas'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">
                          Aguardando pesquisa
                        </span>
                      )}
                    </td>

                    {/* Quantity & Unit */}
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-slate-900 block tabular-nums font-mono">{item.quantity}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{item.unit}</span>
                    </td>

                    {/* Highlighted Lowest Price & Brand */}
                    <td className="py-3 px-3 bg-emerald-50/40 border-x border-emerald-100">
                      {item.lowestPrice ? (
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-sm text-emerald-800 font-mono tabular-nums">
                              {formatCurrencyBRL(item.lowestPrice)}
                            </span>
                            {item.lowestPriceUrl && (
                              <a
                                href={item.lowestPriceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-700 hover:text-emerald-900 p-0.5 transition inline-flex items-center space-x-0.5 text-[10px] font-semibold"
                                title={`Abrir anúncio na loja ${item.lowestPriceSupplier || 'loja'}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span>Ver</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          {item.lowestPriceBrand && (
                            <span className="text-[11px] text-slate-800 block truncate mt-0.5" title={item.lowestPriceBrand}>
                              Marca: <strong className="text-slate-900 font-bold">{item.lowestPriceBrand}</strong>
                            </span>
                          )}
                          {item.lowestPriceSupplier && (
                            <div className="flex items-center space-x-1 mt-0.5">
                              <span className="text-[10px] text-slate-600 truncate block">
                                Fonte: <span className="font-medium text-slate-800">{item.lowestPriceSupplier}</span>
                              </span>
                              {/nf|ata|catálogo|banco/i.test(item.lowestPriceSupplier) && (
                                <span className="bg-indigo-100 text-indigo-800 text-[9px] font-bold px-1 py-0.2 rounded shrink-0">
                                  Banco
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      )}
                    </td>

                    {/* Quotes List */}
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      {activeQuotes.length > 0 ? (
                        <div className="space-y-1">
                          {activeQuotes.slice(0, 2).map((q, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                              <span className="truncate max-w-[90px] text-slate-700">
                                {q.supplier}
                              </span>
                              <div className="flex items-center space-x-1.5">
                                <span className="font-semibold text-slate-900 font-mono tabular-nums">
                                  {formatCurrencyBRL(q.price)}
                                </span>
                                {q.url ? (
                                  <a
                                    href={q.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-400 hover:text-slate-700 transition"
                                    title={`Abrir em ${q.supplier}`}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          ))}
                          {activeQuotes.length > 2 && (
                            <span className="text-[10px] text-slate-400 block text-right">
                              +{activeQuotes.length - 2} cotações
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">
                          {item.status === 'searching' ? 'Buscando...' : 'Sem cotação'}
                        </span>
                      )}
                    </td>

                    {/* Average Price */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-medium text-slate-900 block font-mono tabular-nums">
                        {formatCurrencyBRL(item.averagePrice)}
                      </span>
                      {hasHighCV && (
                        <span className="text-[10px] text-amber-700 block" title="Coeficiente de variação superior a 25%">
                          CV: {item.coefficientOfVariation}%
                        </span>
                      )}
                    </td>

                    {/* Total Estimated */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-slate-900 block font-mono tabular-nums">
                        {formatCurrencyBRL(item.totalEstimated)}
                      </span>
                    </td>

                    {/* Status Indicator (Clean dot + text) */}
                    <td className="py-3 px-3 text-center">
                      {item.status === 'searching' && (
                        <span className="inline-flex items-center text-[11px] text-amber-700 font-medium">
                          <Loader2 className="w-3 h-3 animate-spin mr-1 text-amber-600" /> Cotando
                        </span>
                      )}
                      {item.status === 'completed' && (
                        <span className="inline-flex items-center text-[11px] text-emerald-700 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5" /> Cotado
                        </span>
                      )}
                      {item.status === 'pending' && (
                        <span className="inline-flex items-center text-[11px] text-slate-500 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-1.5" /> Pendente
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span className="inline-flex items-center text-[11px] text-rose-700 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" /> Erro
                        </span>
                      )}
                    </td>

                    {/* Row Actions */}
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onSearchItem(item.id)}
                          disabled={item.status === 'searching'}
                          className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded transition"
                          title="Recotar"
                        >
                          <RotateCw className={`w-3.5 h-3.5 ${item.status === 'searching' ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => onOpenItemDetail(item)}
                          className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                          title="Ver detalhes"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition"
                          title="Remover"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
