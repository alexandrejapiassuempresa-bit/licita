import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Plus, 
  Trash2, 
  RotateCw, 
  AlertTriangle, 
  ShieldAlert,
  Building2,
  Calendar,
  Check,
  Tag
} from 'lucide-react';
import { ProcurementItem, PriceQuote } from '../types/procurement';
import { formatCurrencyBRL, calculateStats } from '../utils/procurementStats';

interface ItemDetailModalProps {
  item: ProcurementItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateItem: (updatedItem: ProcurementItem) => void;
  onReSearchItem: (itemId: string) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onUpdateItem,
  onReSearchItem,
}) => {
  if (!isOpen || !item) return null;

  const [isAddingQuote, setIsAddingQuote] = useState(false);
  const [newSupplier, setNewSupplier] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const handleToggleExclude = (quoteId: string) => {
    const updatedQuotes = item.quotes.map((q) => {
      if (q.id === quoteId) {
        return { ...q, isExcluded: !q.isExcluded };
      }
      return q;
    });

    const newStats = calculateStats(updatedQuotes, item.quantity, item.methodologyApplied || 'media');
    onUpdateItem({
      ...item,
      ...newStats,
      quotes: updatedQuotes,
    });
  };

  const handleAddManualQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(newPrice.replace(/[^0-9.,]/g, '').replace(',', '.'));
    if (!newSupplier.trim() || isNaN(priceNum) || priceNum <= 0) return;

    const newQuote: PriceQuote = {
      id: `manual_${Date.now()}`,
      supplier: newSupplier.trim(),
      brand: newBrand.trim() || 'Não informada',
      model: newModel.trim(),
      price: Number(priceNum.toFixed(2)),
      url: newUrl.trim() || '',
      date: new Date().toLocaleDateString('pt-BR'),
      notes: newNotes.trim() || 'Cotação direta adicionada pelo pesquisador',
      isExcluded: false,
    };

    const updatedQuotes = [...item.quotes, newQuote];
    const newStats = calculateStats(updatedQuotes, item.quantity, item.methodologyApplied || 'media');

    onUpdateItem({
      ...item,
      ...newStats,
      quotes: updatedQuotes,
    });

    setIsAddingQuote(false);
    setNewSupplier('');
    setNewBrand('');
    setNewModel('');
    setNewPrice('');
    setNewUrl('');
    setNewNotes('');
  };

  const handleDeleteQuote = (quoteId: string) => {
    const updatedQuotes = item.quotes.filter((q) => q.id !== quoteId);
    const newStats = calculateStats(updatedQuotes, item.quantity, item.methodologyApplied || 'media');
    onUpdateItem({
      ...item,
      ...newStats,
      quotes: updatedQuotes,
    });
  };

  const activeQuotesCount = item.quotes.filter((q) => !q.isExcluded).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-md bg-slate-100 text-slate-800 font-mono font-bold text-sm flex items-center justify-center border border-slate-200">
              #{item.itemNumber}
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">
                  {item.recognizedProduct || 'Item Licitatório'}
                </h2>
                {item.status === 'completed' && (
                  <span className="text-[11px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                    Cotação Concluída
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Quantidade: <strong className="text-slate-800">{item.quantity} {item.unit}</strong> • Marca Ref: {item.referenceBrand || 'Equivalente'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => onReSearchItem(item.id)}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
              title="Pesquisar novamente com IA"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Detailed original text & AI interpretation */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Descritivo do Termo de Referência:
              </span>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed bg-white p-3 rounded-md border border-slate-200 font-sans">
                {item.originalDescription}
              </p>
            </div>

            {item.technicalSummary && (
              <div className="text-xs text-slate-700 pt-1 border-t border-slate-200">
                <strong className="text-slate-900">Especificação Padronizada:</strong> {item.technicalSummary}
              </div>
            )}
          </div>

          {/* Statistical Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Menor Preço</span>
              <span className="text-base font-bold text-slate-900 tabular-nums font-mono mt-0.5 block">
                {formatCurrencyBRL(item.lowestPrice)}
              </span>
              {item.lowestPriceBrand && (
                <span className="text-[11px] text-emerald-800 font-medium block mt-0.5 truncate">
                  Marca: {item.lowestPriceBrand}
                </span>
              )}
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Preço Médio</span>
              <span className="text-base font-bold text-slate-900 tabular-nums font-mono mt-0.5 block">
                {formatCurrencyBRL(item.averagePrice)}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Média aritmética
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Mediana</span>
              <span className="text-base font-bold text-slate-900 tabular-nums font-mono mt-0.5 block">
                {formatCurrencyBRL(item.medianPrice)}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Valor central
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Total Estimado</span>
              <span className="text-base font-bold text-emerald-800 tabular-nums font-mono mt-0.5 block">
                {formatCurrencyBRL(item.totalEstimated)}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {item.quantity} {item.unit}
              </span>
            </div>
          </div>

          {/* Quotes Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Cotações Coletadas ({activeQuotesCount} válidas)
                </h3>
                {activeQuotesCount < 3 && (
                  <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" /> Mínimo recomendado: 3 fontes
                  </span>
                )}
              </div>

              <button
                onClick={() => setIsAddingQuote(!isAddingQuote)}
                className="text-xs text-slate-700 hover:text-slate-900 font-medium flex items-center space-x-1 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-md border border-slate-300 transition shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Cotação Manual</span>
              </button>
            </div>

            {/* Manual quote form */}
            {isAddingQuote && (
              <form onSubmit={handleAddManualQuote} className="bg-slate-50 border border-slate-300 rounded-lg p-4 mb-4 space-y-3">
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Inserir Cotação de Fornecedor Local ou Proposta Comercial
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Nome do Fornecedor / Empresa *"
                    value={newSupplier}
                    onChange={(e) => setNewSupplier(e.target.value)}
                    className="bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800"
                  />
                  <input
                    type="text"
                    placeholder="Marca"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Preço Unitário (R$) *"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 font-semibold"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="url"
                    placeholder="Link / URL de Comprovação (opcional)"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Observações (ex: Cotação presencial, proposta com frete)"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingQuote(false)}
                    className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold"
                  >
                    Salvar Cotação
                  </button>
                </div>
              </form>
            )}

            {/* List of quotes */}
            <div className="space-y-2">
              {item.quotes.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                  Nenhuma cotação registrada ainda. Clique em "Recotar com IA" ou adicione manualmente.
                </div>
              ) : (
                item.quotes.map((quote) => {
                  const isLowest = !quote.isExcluded && quote.price === item.lowestPrice;
                  return (
                    <div
                      key={quote.id}
                      className={`p-3.5 rounded-lg border transition ${
                        quote.isExcluded
                          ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                          : isLowest
                          ? 'bg-emerald-50/40 border-emerald-200 text-slate-900'
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 rounded-md bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center flex-wrap gap-1.5">
                              <span className="font-semibold text-xs sm:text-sm text-slate-900">
                                {quote.supplier}
                              </span>
                              <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium border border-slate-200">
                                Marca: {quote.brand || 'Não informada'}
                              </span>
                              {quote.isFromPriceBank && (
                                <span className="text-[10px] text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded font-bold border border-indigo-200">
                                  Banco de Preços (NF / Catálogo)
                                </span>
                              )}
                              {isLowest && (
                                <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold border border-emerald-200">
                                  Menor Preço da Cesta
                                </span>
                              )}
                              {quote.isExcluded && (
                                <span className="text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-medium">
                                  Desconsiderada do cálculo
                                </span>
                              )}
                            </div>

                            {quote.model && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                Modelo: {quote.model}
                              </p>
                            )}
                            {quote.notes && (
                              <p className="text-xs text-slate-500 italic mt-0.5">
                                {quote.notes}
                              </p>
                            )}

                            <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-1.5">
                              <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" /> {quote.date}
                              </span>
                              {quote.url ? (
                                <a
                                  href={quote.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-slate-900 hover:text-emerald-700 underline font-medium flex items-center space-x-1"
                                >
                                  <ExternalLink className="w-3 h-3 mr-0.5 text-slate-600" />
                                  <span>Ver Fonte / Preço Original</span>
                                </a>
                              ) : (
                                <span className="text-slate-400">Sem link online (proposta física)</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end space-x-4 self-end sm:self-center">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Preço Unitário</span>
                            <span className="text-sm sm:text-base font-bold text-slate-900 tabular-nums font-mono">
                              {formatCurrencyBRL(quote.price)}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1 border-l border-slate-200 pl-3">
                            <button
                              onClick={() => handleToggleExclude(quote.id)}
                              className={`p-1.5 rounded-md text-xs transition ${
                                quote.isExcluded
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-500 hover:text-amber-700 hover:bg-slate-200'
                              }`}
                              title={
                                quote.isExcluded
                                  ? 'Reativar cotação no cálculo'
                                  : 'Descartar cotação (ex: sobrepreço ou inexequível)'
                              }
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteQuote(quote.id)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                              title="Excluir cotação"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <button
            onClick={() => onReSearchItem(item.id)}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-medium transition flex items-center space-x-1.5 shadow-2xs"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-600" />
            <span>Recotar com IA</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
