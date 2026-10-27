import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  FileCheck
} from 'lucide-react';
import { parseSpreadsheetBuffer, downloadSampleSpreadsheet, ParsedItemRow } from '../utils/spreadsheetHelper';

interface SpreadsheetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportItems: (items: ParsedItemRow[], autoStartBatch: boolean) => void;
}

export const SpreadsheetUploadModal: React.FC<SpreadsheetUploadModalProps> = ({
  isOpen,
  onClose,
  onImportItems,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedItemRow[]>([]);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [autoStartBatch, setAutoStartBatch] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setErrorMsg('');
    try {
      setFileName(file.name);
      const buffer = await file.arrayBuffer();
      const { items, headers } = parseSpreadsheetBuffer(buffer);

      if (items.length === 0) {
        setErrorMsg('Nenhum item com descrição válida foi encontrado na planilha. Verifique os títulos das colunas.');
        return;
      }

      setParsedItems(items);
      setDetectedHeaders(headers);
    } catch (err: any) {
      setErrorMsg('Falha ao processar o arquivo. Certifique-se de que é um formato válido (.xlsx, .xls ou .csv).');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirm = () => {
    if (parsedItems.length === 0) return;
    onImportItems(parsedItems, autoStartBatch);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setParsedItems([]);
    setDetectedHeaders([]);
    setFileName('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Importação de Planilha de Itens</h2>
            <p className="text-xs text-slate-500">
              Importe termos de referência em Excel (.xlsx, .xls) ou CSV para cotação em lote
            </p>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {parsedItems.length === 0 ? (
            <>
              {/* Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                  dragActive
                    ? 'border-emerald-500 bg-emerald-50/40'
                    : 'border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />
                <div className="mx-auto w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 mb-2 shadow-xs">
                  <UploadCloud className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  Arraste seu arquivo aqui ou clique para selecionar
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Formatos suportados: .xlsx, .xls ou .csv com colunas de Descrição, Quantidade e Unidade
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Sample Templates & Download */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Modelos de Planilha para Teste
                  </span>
                  <span className="text-[11px] text-slate-400">Clique para baixar arquivo modelo</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => downloadSampleSpreadsheet('escritorio')}
                    className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 text-left transition"
                  >
                    <div className="text-xs font-semibold text-slate-900">
                      Material de Escritório
                    </div>
                    <div className="text-[11px] text-slate-500">Papel A4, cadeiras, canetas</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadSampleSpreadsheet('ti')}
                    className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 text-left transition"
                  >
                    <div className="text-xs font-semibold text-slate-900">
                      Equipamentos de TI
                    </div>
                    <div className="text-[11px] text-slate-500">Notebooks, monitores, switches</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadSampleSpreadsheet('limpeza')}
                    className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 text-left transition"
                  >
                    <div className="text-xs font-semibold text-slate-900">
                      Limpeza e Higiene
                    </div>
                    <div className="text-[11px] text-slate-500">Detergente, água sanitária</div>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Preview of parsed rows */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">
                      {parsedItems.length} itens identificados com sucesso
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {fileName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-slate-600 hover:text-slate-900 hover:underline"
                >
                  Trocar arquivo
                </button>
              </div>

              {/* Table preview */}
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0 font-semibold">
                    <tr>
                      <th className="p-2.5 w-12 text-center">Item</th>
                      <th className="p-2.5">Descrição</th>
                      <th className="p-2.5 w-16 text-center">Qtd</th>
                      <th className="p-2.5 w-16 text-center">Unid</th>
                      <th className="p-2.5 w-24">Marca Ref.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {parsedItems.slice(0, 15).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/70">
                        <td className="p-2 text-center font-mono text-slate-500">{row.itemNumber}</td>
                        <td className="p-2 font-medium text-slate-900 line-clamp-2">{row.originalDescription}</td>
                        <td className="p-2 text-center tabular-nums font-mono">{row.quantity}</td>
                        <td className="p-2 text-center font-mono uppercase">{row.unit}</td>
                        <td className="p-2 text-slate-500">{row.referenceBrand || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Auto start toggle */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    Iniciar pesquisa automática imediatamente
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Busca o menor valor, marca e cotações para os {parsedItems.length} itens importados
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoStartBatch}
                  onChange={(e) => setAutoStartBatch(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            disabled={parsedItems.length === 0}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
          >
            <FileCheck className="w-4 h-4" />
            <span>Confirmar Importação ({parsedItems.length} itens)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
