import React, { useState } from 'react';
import { Search, Tag, Hash, Box } from 'lucide-react';
import { ProcurementItem } from '../types/procurement';

interface SingleItemSearchProps {
  onAddItemAndResearch: (item: Partial<ProcurementItem>, autoSearch: boolean) => void;
  nextItemNumber: number;
}

const QUICK_EXAMPLES = [
  {
    label: 'Cadeira Ergonômica',
    desc: 'Cadeira giratória ergonômica com braços reguláveis, espuma injetada D45, regulagem a gás de altura, revestimento tecido crepe preto, conformidade NR-17',
    unit: 'UN',
    qty: 10,
    brand: 'Frisokar ou similar',
  },
  {
    label: 'Papel A4 Sulfite',
    desc: 'Papel sulfite A4, alcalino, 75 g/m², alvura 90%, formato 210 x 297 mm, resma com 500 folhas, embalagem impermeável',
    unit: 'RESMA',
    qty: 50,
    brand: 'Chamex / Report',
  },
  {
    label: 'Notebook Core i5',
    desc: 'Notebook corporativo tela 15.6 FHD, Processador Intel Core i5 12ª geração ou superior, memória RAM 16GB DDR4, SSD 512GB NVMe, Windows 11 Pro',
    unit: 'UN',
    qty: 8,
    brand: 'Dell / Lenovo / HP',
  },
  {
    label: 'Detergente Neutro 500ml',
    desc: 'Detergente líquido lava-louças neutro biodegradável com glicerina, frasco com bico dosador contendo 500 ml',
    unit: 'FRASCO',
    qty: 120,
    brand: 'Ypê / Limpol',
  },
];

export const SingleItemSearch: React.FC<SingleItemSearchProps> = ({
  onAddItemAndResearch,
  nextItemNumber,
}) => {
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('UN');
  const [referenceBrand, setReferenceBrand] = useState('');

  const handleSubmit = (autoSearch: boolean) => {
    if (!description.trim()) return;

    onAddItemAndResearch(
      {
        itemNumber: nextItemNumber,
        originalDescription: description.trim(),
        quantity: Math.max(1, Number(quantity) || 1),
        unit: unit.trim().toUpperCase() || 'UN',
        referenceBrand: referenceBrand.trim() || undefined,
        quotes: [],
        status: autoSearch ? 'searching' : 'pending',
      },
      autoSearch
    );

    setDescription('');
    setQuantity(1);
    setUnit('UN');
    setReferenceBrand('');
  };

  const handleApplyExample = (ex: typeof QUICK_EXAMPLES[0]) => {
    setDescription(ex.desc);
    setQuantity(ex.qty);
    setUnit(ex.unit);
    setReferenceBrand(ex.brand);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Pesquisa Individual de Item
          </h3>
          <p className="text-xs text-slate-500">
            A IA pesquisa as lojas online, identifica o menor custo, anota a marca vendida e inclui o link na planilha
          </p>
        </div>

        {/* Clean text examples */}
        <div className="flex items-center space-x-1.5 text-xs text-slate-500 flex-wrap">
          <span className="text-[11px] text-slate-400">Exemplos:</span>
          {QUICK_EXAMPLES.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleApplyExample(ex)}
              className="text-[11px] text-slate-600 hover:text-emerald-700 hover:underline transition"
            >
              {ex.label}
              {i < QUICK_EXAMPLES.length - 1 && <span className="text-slate-300 ml-1">·</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {/* Description textarea */}
        <div>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Digite ou cole a especificação do termo de referência (ex: Papel sulfite A4 75g alcalino resma 500 folhas; Cadeira giratória ergonômica NR-17)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition resize-none"
          />
        </div>

        {/* Inputs row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:bg-white focus-within:border-slate-400">
            <span className="block text-[10px] text-slate-500 uppercase font-semibold">Quantidade</span>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-transparent text-xs text-slate-900 focus:outline-none font-semibold font-mono"
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:bg-white focus-within:border-slate-400">
            <span className="block text-[10px] text-slate-500 uppercase font-semibold">Unidade</span>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="UN, CX, RESMA..."
              className="w-full bg-transparent text-xs text-slate-900 focus:outline-none font-semibold uppercase"
            />
          </div>

          <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:bg-white focus-within:border-slate-400">
            <span className="block text-[10px] text-slate-500 uppercase font-semibold">
              Marca de Referência (Opcional)
            </span>
            <input
              type="text"
              value={referenceBrand}
              onChange={(e) => setReferenceBrand(e.target.value)}
              placeholder="Ex: Chamex, Dell, Frisokar ou similar"
              className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-1">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={!description.trim()}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition disabled:opacity-40"
          >
            Apenas Registrar
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={!description.trim()}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition disabled:opacity-40 flex items-center space-x-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Pesquisar Menor Preço & Marca</span>
          </button>
        </div>
      </div>
    </div>
  );
};
