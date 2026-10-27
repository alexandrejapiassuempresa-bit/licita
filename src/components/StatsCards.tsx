import React from 'react';
import { 
  Calculator, 
  TrendingUp, 
  Layers, 
  DollarSign
} from 'lucide-react';
import { ProcurementItem, ProcurementProject } from '../types/procurement';
import { formatCurrencyBRL } from '../utils/procurementStats';

interface StatsCardsProps {
  project: ProcurementProject;
  items: ProcurementItem[];
  onUpdateMethodology: (method: 'media' | 'mediana' | 'menor_preco') => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  project,
  items,
  onUpdateMethodology,
}) => {
  const totalItems = items.length;
  const completedItems = items.filter((i) => i.status === 'completed');

  // Total estimated value
  const totalEstimated = items.reduce((acc, curr) => {
    let unitPrice = 0;
    if (project.methodology === 'mediana') {
      unitPrice = curr.medianPrice || curr.averagePrice || curr.lowestPrice || 0;
    } else if (project.methodology === 'menor_preco') {
      unitPrice = curr.lowestPrice || curr.averagePrice || 0;
    } else {
      unitPrice = curr.averagePrice || curr.medianPrice || curr.lowestPrice || 0;
    }
    return acc + unitPrice * (curr.quantity || 1);
  }, 0);

  // Average Coefficient of Variation (CV%)
  const itemsWithCV = completedItems.filter(
    (i) => i.coefficientOfVariation !== undefined && !isNaN(i.coefficientOfVariation)
  );
  const avgCV =
    itemsWithCV.length > 0
      ? itemsWithCV.reduce((acc, curr) => acc + (curr.coefficientOfVariation || 0), 0) /
        itemsWithCV.length
      : 0;

  const isHighDispersion = avgCV > 25;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
        {/* Total Items & Progress */}
        <div className="px-3 py-1 first:pl-0">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Itens no Processo
          </span>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums font-mono">
              {totalItems}
            </span>
            <span className="text-xs text-slate-500">
              {completedItems.length} cotados · {items.length - completedItems.length} pendentes
            </span>
          </div>
          {totalItems > 0 && (
            <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(completedItems.length / totalItems) * 100}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Total Estimated Value */}
        <div className="px-3 py-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Valor Estimado Total
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold text-slate-900 tabular-nums font-mono">
              {formatCurrencyBRL(totalEstimated)}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Critério: {project.methodology === 'mediana' ? 'Mediana' : project.methodology === 'menor_preco' ? 'Menor Preço' : 'Média Aritmética'}
            </span>
          </div>
        </div>

        {/* Dispersion & Homogeneity */}
        <div className="px-3 py-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Dispersão Amostral (CV)
          </span>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums font-mono">
              {avgCV.toFixed(1)}%
            </span>
            <span className={`text-xs font-medium ${isHighDispersion ? 'text-amber-700' : 'text-emerald-700'}`}>
              {isHighDispersion ? 'Dispersão alta' : 'Amostra homogênea'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {isHighDispersion ? 'Adote a Mediana (Art. 23 Lei 14.133)' : 'Conforme parâmetros TCU'}
          </span>
        </div>

        {/* Methodology Selection */}
        <div className="px-3 py-1 last:pr-0">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Critério de Preço Estimado
          </span>
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => onUpdateMethodology('media')}
              className={`py-1 text-xs font-medium rounded transition ${
                project.methodology === 'media'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Média
            </button>
            <button
              onClick={() => onUpdateMethodology('mediana')}
              className={`py-1 text-xs font-medium rounded transition ${
                project.methodology === 'mediana'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mediana
            </button>
            <button
              onClick={() => onUpdateMethodology('menor_preco')}
              className={`py-1 text-xs font-medium rounded transition ${
                project.methodology === 'menor_preco'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Menor
            </button>
          </div>
          <span className="text-[10px] text-slate-400 block text-center mt-1">
            Instrução Normativa SEGES nº 65/2021
          </span>
        </div>
      </div>
    </div>
  );
};
