import React, { useState, useRef } from 'react';
import {
  X,
  Database,
  Upload,
  FileText,
  Check,
  Trash2,
  FileDown,
  Sparkles,
  Search,
  Building,
  RotateCcw,
  Plus,
  Tag,
  AlertCircle,
  FileCode,
  CheckCircle2,
  Info
} from 'lucide-react';
import { PriceBankItem, PriceDocumentParseResult } from '../types/procurement';
import { exportPriceBankToExcel, resetToSamplePriceBank } from '../utils/priceBankStorage';

interface PriceBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceBankItems: PriceBankItem[];
  onSavePriceBankItems: (items: PriceBankItem[]) => void;
  usePriceBankAsSource: boolean;
  onToggleUsePriceBank: (val: boolean) => void;
  onOpenGitHub?: () => void;
}

// Sample XML content for instant test
const SAMPLE_NFE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe35240543214055000107550010001048591000000010" versao="4.00">
      <ide>
        <nNF>104859</nNF>
        <dhEmi>2024-05-18T14:30:00-03:00</dhEmi>
      </ide>
      <emit>
        <CNPJ>43214055000107</CNPJ>
        <xNome>Kalunga Comercial e Distribuidora Ltda</xNome>
        <xFant>Kalunga Corporativo</xFant>
      </emit>
      <det nItem="1">
        <prod>
          <cProd>PAP-001</cProd>
          <xProd>PAPEL SULFITE A4 75G CHAMEX OFFICE BRANCO 500 FLS</xProd>
          <uCom>PCT</uCom>
          <qCom>150.0000</qCom>
          <vUnCom>24.9000</vUnCom>
          <vProd>3735.00</vProd>
        </prod>
        <infAdProd>Marca Chamex Alcalino 75g</infAdProd>
      </det>
      <det nItem="2">
        <prod>
          <cProd>CAN-002</cProd>
          <xProd>CANETA ESFEROGRAFICA BIC CRISTAL AZUL PONTA MEDIA 1.0MM</xProd>
          <uCom>CX</uCom>
          <qCom>30.0000</qCom>
          <vUnCom>42.5000</vUnCom>
          <vProd>1275.00</vProd>
        </prod>
        <infAdProd>Marca BIC Caixa 50 unidades</infAdProd>
      </det>
      <det nItem="3">
        <prod>
          <cProd>GRA-003</cProd>
          <xProd>GRAMPEADOR DE MESA METALICO MENNO 26/6 CAPACIDADE 25 FLS</xProd>
          <uCom>UN</uCom>
          <qCom>20.0000</qCom>
          <vUnCom>21.9000</vUnCom>
          <vProd>438.00</vProd>
        </prod>
        <infAdProd>Marca Menno Modelo Office 25 fls</infAdProd>
      </det>
    </infNFe>
  </NFe>
</nfeProc>`;

// Sample Catalog text for instant test
const SAMPLE_CATALOG_TEXT = `CATÁLOGO DE PREÇOS E PRODUTOS INSTITUCIONAIS - TABELA 2024/02
FORNECEDOR: LimpMax Distribuidora de Saneantes e Higiene Ltda
CNPJ: 24.112.564/0001-88
DATA: 15/05/2024
DOCUMENTO: Catálogo Comercial de Referência para Órgãos Públicos

ITENS E PREÇOS UNITÁRIOS HOMOLOGADOS:
1. Detergente Líquido Neutro Biodegradável Frasco 500ml - Marca Ypê - Valor Unitário: R$ 2,89 / UN
2. Água Sanitária com Cloro Ativo 2,0% a 2,5% Bombona 5 Litros - Marca Qboa - Valor Unitário: R$ 14,80 / GL
3. Desinfetante Uso Geral Eucalipto Frasco 1000ml - Marca Veja Floral - Valor Unitário: R$ 5,40 / UN
4. Papel Toalha Interfolhado 100% Celulose Virgem 2 Dobras Fardo 1000 Folhas - Marca Santher Inovatta - Valor Unitário: R$ 22,50 / PCT
5. Sabonete Líquido Erva Doce Galão 5 Litros - Marca Premisse - Valor Unitário: R$ 28,90 / GL`;

export const PriceBankModal: React.FC<PriceBankModalProps> = ({
  isOpen,
  onClose,
  priceBankItems,
  onSavePriceBankItems,
  usePriceBankAsSource,
  onToggleUsePriceBank,
  onOpenGitHub,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'import' | 'manual'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import State
  const [importText, setImportText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [parsedPreview, setParsedPreview] = useState<PriceDocumentParseResult | null>(null);
  const [editableItems, setEditableItems] = useState<any[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    productDescription: '',
    brand: '',
    model: '',
    unit: 'UN',
    unitPrice: '',
    quantity: '1',
    supplier: '',
    cnpj: '',
    documentType: 'nfe' as const,
    documentNumber: '',
    documentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  if (!isOpen) return null;

  // Filter items in Price Bank
  const filteredItems = priceBankItems.filter((item) => {
    if (typeFilter !== 'all' && item.documentType !== typeFilter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.productDescription.toLowerCase().includes(term) ||
      item.recognizedProduct.toLowerCase().includes(term) ||
      item.brand.toLowerCase().includes(term) ||
      item.supplier.toLowerCase().includes(term) ||
      (item.documentNumber && item.documentNumber.toLowerCase().includes(term))
    );
  });

  // Calculate quick stats
  const totalItemsCount = priceBankItems.length;
  const uniqueSuppliers = new Set(priceBankItems.map((i) => i.supplier)).size;
  const uniqueBrands = new Set(priceBankItems.map((i) => i.brand)).size;

  // Process Document (file or raw text)
  const processDocument = async (opts: {
    content?: string;
    fileName?: string;
    base64Data?: string;
    mimeType?: string;
  }) => {
    setIsProcessing(true);
    setImportError(null);
    setProcessingStep('Iniciando análise do documento...');

    try {
      setProcessingStep('Reconhecendo dados do fornecedor, CNPJ e tipo de documento...');
      
      const payload: any = {
        fileName: opts.fileName || 'documento_banco_precos',
        content: opts.content,
        base64Data: opts.base64Data,
        mimeType: opts.mimeType,
      };

      const res = await fetch('/api/parse-price-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data) {
        throw new Error(data?.error || `Falha no processamento (Código HTTP ${res.status}).`);
      }

      setProcessingStep('Identificando itens, marcas comerciais e valores unitários...');

      if (!data.success || !data.result || !Array.isArray(data.result.items) || data.result.items.length === 0) {
        throw new Error(data.error || 'Nenhum item ou preço pôde ser reconhecido neste documento. Verifique se o arquivo possui dados fiscais legíveis.');
      }

      setParsedPreview({
        ...data.result,
        source: data.source,
      });

      setEditableItems(
        data.result.items.map((it: any, idx: number) => ({
          ...it,
          tempId: `temp_${Date.now()}_${idx}`,
          selected: true,
        }))
      );
      setProcessingStep('');
    } catch (err: any) {
      console.error('Error parsing document:', err);
      setImportError(err.message || 'Ocorreu um erro ao processar o documento.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Robust processor for any selected file (XML, PDF, PNG/JPG, TXT, CSV)
  const handleProcessSelectedFile = async (file: File) => {
    if (!file) return;

    // Reset file input value so re-selecting same file works
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    const lowerName = file.name.toLowerCase();
    const ext = lowerName.split('.').pop() || '';

    if (
      lowerName.endsWith('.xml') ||
      file.type.includes('xml') ||
      lowerName.endsWith('.txt') ||
      lowerName.endsWith('.csv') ||
      lowerName.endsWith('.json')
    ) {
      try {
        const text = await file.text();
        processDocument({ content: text, fileName: file.name });
      } catch (err: any) {
        setImportError('Erro ao ler arquivo de texto: ' + err.message);
      }
    } else {
      // PDF or Image
      let resolvedMime = file.type;
      if (!resolvedMime || resolvedMime === 'application/octet-stream') {
        if (ext === 'pdf') resolvedMime = 'application/pdf';
        else if (ext === 'png') resolvedMime = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') resolvedMime = 'image/jpeg';
        else if (ext === 'webp') resolvedMime = 'image/webp';
        else resolvedMime = 'application/pdf';
      }

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const resultStr = reader.result as string;
          const base64Data = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;
          processDocument({
            base64Data,
            mimeType: resolvedMime,
            fileName: file.name,
          });
        } catch (readErr: any) {
          setImportError('Erro ao decodificar arquivo binário: ' + readErr.message);
        }
      };
      reader.onerror = () => {
        setImportError('Não foi possível ler o arquivo selecionado.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle File Upload from input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessSelectedFile(file);
    }
  };

  // Confirm and Save parsed items to Price Bank
  const handleConfirmImport = () => {
    if (!parsedPreview || editableItems.length === 0) return;

    const selectedRows = editableItems.filter((it) => it.selected);
    if (selectedRows.length === 0) {
      alert('Selecione pelo menos um item para salvar no Banco de Preços.');
      return;
    }

    const newBankItems: PriceBankItem[] = selectedRows.map((it) => ({
      id: `pb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      productDescription: it.productDescription,
      recognizedProduct: it.recognizedProduct || it.productDescription,
      brand: it.brand || 'Marca Homologada',
      model: it.model || '',
      unit: it.unit || 'UN',
      unitPrice: Number(it.unitPrice) || 0,
      quantity: Number(it.quantity) || 1,
      totalPrice: Number(it.totalPrice) || Number(it.unitPrice) * (Number(it.quantity) || 1),
      supplier: parsedPreview.supplier || 'Fornecedor Cadastrado',
      cnpj: parsedPreview.cnpj,
      documentType: parsedPreview.documentType || 'catalogo',
      documentNumber: parsedPreview.documentNumber,
      documentDate: parsedPreview.documentDate || new Date().toISOString().split('T')[0],
      sourceFileName: 'Importado com IA',
      notes: it.notes || parsedPreview.summary || '',
      createdAt: new Date().toISOString(),
    }));

    onSavePriceBankItems([...newBankItems, ...priceBankItems]);
    setParsedPreview(null);
    setEditableItems([]);
    setImportText('');
    setActiveTab('list');
  };

  // Handle Manual Item Add
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.productDescription || !manualForm.unitPrice || !manualForm.supplier) {
      alert('Preencha os campos obrigatórios (Produto, Preço Unitário e Fornecedor).');
      return;
    }

    const priceNum = parseFloat(manualForm.unitPrice.replace(',', '.'));
    const qtyNum = parseFloat(manualForm.quantity.replace(',', '.')) || 1;

    const newItem: PriceBankItem = {
      id: `pb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      productDescription: manualForm.productDescription,
      recognizedProduct: manualForm.productDescription,
      brand: manualForm.brand || 'Marca Homologada',
      model: manualForm.model,
      unit: manualForm.unit.toUpperCase(),
      unitPrice: priceNum,
      quantity: qtyNum,
      totalPrice: priceNum * qtyNum,
      supplier: manualForm.supplier,
      cnpj: manualForm.cnpj || undefined,
      documentType: manualForm.documentType,
      documentNumber: manualForm.documentNumber || undefined,
      documentDate: manualForm.documentDate,
      notes: manualForm.notes,
      createdAt: new Date().toISOString(),
    };

    onSavePriceBankItems([newItem, ...priceBankItems]);
    setManualForm({
      productDescription: '',
      brand: '',
      model: '',
      unit: 'UN',
      unitPrice: '',
      quantity: '1',
      supplier: '',
      cnpj: '',
      documentType: 'nfe',
      documentNumber: '',
      documentDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setActiveTab('list');
  };

  // Delete item from bank
  const handleDeleteItem = (id: string) => {
    if (confirm('Deseja excluir este item do Banco de Preços?')) {
      onSavePriceBankItems(priceBankItems.filter((i) => i.id !== id));
    }
  };

  // Restore samples
  const handleRestoreSamples = () => {
    if (confirm('Deseja restaurar a base modelo de demonstração do Banco de Preços?')) {
      const reset = resetToSamplePriceBank();
      onSavePriceBankItems(reset);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold tracking-tight">Banco de Preços Institucional</h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {totalItemsCount} registros homologados
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Repositório de Notas Fiscais (NF-e/DANFE), Catálogos e Contratos (Art. 23, § 1º, inciso II da Lei 14.133/2021)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Toggle Source */}
            <label className="hidden sm:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={usePriceBankAsSource}
                onChange={(e) => onToggleUsePriceBank(e.target.checked)}
                className="rounded text-emerald-500 focus:ring-emerald-500 h-4 w-4"
              />
              <span className="text-xs text-slate-200 font-medium">
                Ativo nas Pesquisas
              </span>
            </label>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3.5 py-1.5 rounded-lg transition font-semibold flex items-center space-x-1.5 ${
                activeTab === 'list'
                  ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Itens Cadastrados ({totalItemsCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`px-3.5 py-1.5 rounded-lg transition font-semibold flex items-center space-x-1.5 ${
                activeTab === 'import'
                  ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Importar NF / Catálogo com IA</span>
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-3.5 py-1.5 rounded-lg transition font-semibold flex items-center space-x-1.5 ${
                activeTab === 'manual'
                  ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-slate-700" />
              <span>Cadastro Manual</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenGitHub && (
              <button
                onClick={onOpenGitHub}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition shadow-2xs"
                title="Sincronizar Banco de Preços com o GitHub"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>GitHub</span>
              </button>
            )}
            <button
              onClick={() => exportPriceBankToExcel(priceBankItems)}
              disabled={priceBankItems.length === 0}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium transition disabled:opacity-40"
              title="Exportar base completa para Excel"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exportar Excel</span>
            </button>
            <button
              onClick={handleRestoreSamples}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 font-medium transition"
              title="Restaurar dados de demonstração da base"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Amostras Licitatórias</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* TAB 1: LIST VIEW */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              {/* Quick Summary Pill Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-slate-500 block text-[11px]">Total de Itens</span>
                  <span className="text-base font-bold text-slate-900">{totalItemsCount}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-slate-500 block text-[11px]">Fornecedores / CNPJs</span>
                  <span className="text-base font-bold text-slate-900">{uniqueSuppliers}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-slate-500 block text-[11px]">Marcas Catalogadas</span>
                  <span className="text-base font-bold text-slate-900">{uniqueBrands}</span>
                </div>
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
                  <span className="text-emerald-700 block text-[11px]">Status na Pesquisa</span>
                  <span className="text-xs font-bold text-emerald-800 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{usePriceBankAsSource ? 'Ativo como Fonte' : 'Pausado'}</span>
                  </span>
                </div>
              </div>

              {/* Search & Category Filter */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Pesquisar por produto, marca, fornecedor ou nº de NF..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white"
                  />
                </div>
                <div className="flex items-center space-x-1 text-xs shrink-0">
                  <button
                    onClick={() => setTypeFilter('all')}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      typeFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setTypeFilter('nfe')}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      typeFilter === 'nfe'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    NF-e
                  </button>
                  <button
                    onClick={() => setTypeFilter('catalogo')}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      typeFilter === 'catalogo'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Catálogos
                  </button>
                  <button
                    onClick={() => setTypeFilter('ata')}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      typeFilter === 'ata'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Atas RP
                  </button>
                  <button
                    onClick={() => setTypeFilter('contrato')}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      typeFilter === 'contrato'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Contratos
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Produto / Especificação</th>
                        <th className="py-2.5 px-3">Marca</th>
                        <th className="py-2.5 px-3">Preço Unitário</th>
                        <th className="py-2.5 px-3">Fornecedor / CNPJ</th>
                        <th className="py-2.5 px-3">Documento & Data</th>
                        <th className="py-2.5 px-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-slate-400">
                            Nenhum item encontrado no Banco de Preços com esses filtros.
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-2.5 px-3 max-w-[260px]">
                              <span className="font-semibold text-slate-900 block truncate" title={item.productDescription}>
                                {item.recognizedProduct || item.productDescription}
                              </span>
                              <span className="text-[11px] text-slate-500 block truncate" title={item.productDescription}>
                                {item.productDescription}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
                                <Tag className="w-2.5 h-2.5" />
                                <span>{item.brand}</span>
                              </span>
                              {item.model && (
                                <span className="block text-[10px] text-slate-500 truncate max-w-[120px] mt-0.5">
                                  {item.model}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              R$ {item.unitPrice.toFixed(2)}
                              <span className="text-[10px] text-slate-500 font-normal ml-1">/ {item.unit}</span>
                            </td>
                            <td className="py-2.5 px-3 max-w-[180px]">
                              <span className="font-medium text-slate-800 block truncate" title={item.supplier}>
                                {item.supplier}
                              </span>
                              {item.cnpj && (
                                <span className="text-[10px] font-mono text-slate-500 block">
                                  {item.cnpj}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold bg-slate-100 text-slate-700">
                                {item.documentType.toUpperCase()} {item.documentNumber ? `nº ${item.documentNumber}` : ''}
                              </span>
                              <span className="block text-[10px] text-slate-500 mt-0.5">
                                {item.documentDate}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-slate-100 transition"
                                title="Excluir item do banco"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT WITH AI (NF-e, Catalogs, Documents) */}
          {activeTab === 'import' && (
            <div className="space-y-5">
              {/* Informational Guidance */}
              <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 text-xs text-indigo-950 flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">
                    Tecnologia de Reconhecimento Automático de Notas Fiscais e Catálogos Comerciais
                  </p>
                  <p className="text-indigo-900/80 leading-relaxed">
                    Faça upload de arquivos XML de NF-e, DANFEs em PDF, imagens ou tabelas de preços de fornecedores.
                    O sistema identifica a Razão Social, CNPJ, número do documento, e reconhece a <strong>marca exata</strong> e o <strong>preço unitário</strong> de cada produto, montando seu banco de forma inteligente.
                  </p>
                </div>
              </div>

              {/* Upload Dropzone with Drag and Drop */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const droppedFile = e.dataTransfer.files?.[0];
                  if (droppedFile) {
                    handleProcessSelectedFile(droppedFile);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/80 scale-[1.01]'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/20'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-xs transition ${
                  isDragging ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block">
                    {isDragging ? 'Solte o arquivo para iniciar o reconhecimento' : 'Clique para selecionar ou arraste o arquivo aqui'}
                  </span>
                  <span className="text-xs text-slate-500 mt-1 block">
                    Formatos aceitos: <strong>XML (NF-e)</strong>, <strong>PDF (DANFE/Catálogo)</strong>, <strong>PNG/JPG (Foto da NF)</strong>, <strong>TXT/CSV</strong>
                  </span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xml,.pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.json"
                  className="hidden"
                />
              </div>

              {/* Quick Demo Test Buttons */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-slate-600 font-medium flex items-center space-x-1.5">
                  <FileCode className="w-4 h-4 text-slate-500" />
                  <span>Deseja testar a extração agora sem arquivo próprio?</span>
                </span>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => processDocument({ content: SAMPLE_NFE_XML, fileName: 'NFe_104859_Kalunga.xml' })}
                    disabled={isProcessing}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:border-indigo-400 text-slate-800 font-semibold rounded-lg shadow-xs hover:bg-indigo-50/50 transition disabled:opacity-40"
                  >
                    📄 Testar com NF-e XML Real
                  </button>
                  <button
                    onClick={() => processDocument({ content: SAMPLE_CATALOG_TEXT, fileName: 'Catalogo_LimpMax_2024.pdf' })}
                    disabled={isProcessing}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:border-indigo-400 text-slate-800 font-semibold rounded-lg shadow-xs hover:bg-indigo-50/50 transition disabled:opacity-40"
                  >
                    📑 Testar com Catálogo Comercial
                  </button>
                </div>
              </div>

              {/* Direct Paste Alternative */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Ou cole o texto / XML da Nota Fiscal ou Catálogo diretamente:
                </label>
                <div className="flex gap-2">
                  <textarea
                    rows={3}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Cole aqui o conteúdo de um XML de NF-e, linhas de um catálogo de produtos ou dados de um contrato..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white font-mono"
                  />
                  <button
                    onClick={() => processDocument({ content: importText, fileName: 'Texto_Colado_Diretamente.txt' })}
                    disabled={isProcessing || !importText.trim()}
                    className="px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition shrink-0 flex items-center space-x-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Processar</span>
                  </button>
                </div>
              </div>

              {/* Processing Progress Bar */}
              {isProcessing && (
                <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 text-xs shadow-md">
                  <div className="flex items-center space-x-2 text-indigo-400 font-semibold">
                    <div className="w-3 h-3 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                    <span>Processamento Inteligente de Documentos em Andamento...</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{processingStep}</p>
                </div>
              )}

              {/* Error Message */}
              {importError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Extracted Items Preview and Confirmation */}
              {parsedPreview && (
                <div className="border border-emerald-300 bg-emerald-50/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                  {/* Extracted Document Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-sm text-slate-900">
                          {parsedPreview.supplier}
                        </span>
                        {parsedPreview.cnpj && (
                          <span className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                            CNPJ: {parsedPreview.cnpj}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
                        <span className="uppercase font-semibold text-emerald-800">
                          Tipo: {parsedPreview.documentType}
                        </span>
                        <span>·</span>
                        <span>Doc nº {parsedPreview.documentNumber || 'S/N'}</span>
                        <span>·</span>
                        <span>Data: {parsedPreview.documentDate}</span>
                        {parsedPreview.source && (
                          <>
                            <span>·</span>
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium text-[10px]">
                              {parsedPreview.source === 'xml_native_parser'
                                ? '✓ NF-e XML Oficial'
                                : parsedPreview.source === 'gemini_ai_parser'
                                ? '✨ IA Gemini'
                                : '📄 Leitor Estruturado'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleConfirmImport}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Aprovar e Salvar ({editableItems.filter((i) => i.selected).length} itens)</span>
                      </button>
                    </div>
                  </div>

                  {/* Editable Items Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="overflow-x-auto max-h-[40vh]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-3 w-8">
                              <input
                                type="checkbox"
                                checked={editableItems.every((i) => i.selected)}
                                onChange={(e) =>
                                  setEditableItems((prev) =>
                                    prev.map((i) => ({ ...i, selected: e.target.checked }))
                                  )
                                }
                                className="rounded text-emerald-600"
                              />
                            </th>
                            <th className="py-2 px-3">Produto Reconhecido</th>
                            <th className="py-2 px-3">Marca Extraída</th>
                            <th className="py-2 px-3">Preço Unit. (R$)</th>
                            <th className="py-2 px-3">Qtd / Un</th>
                            <th className="py-2 px-3">Total (R$)</th>
                            <th className="py-2 px-3 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {editableItems.map((item, idx) => (
                            <tr key={item.tempId || idx} className={item.selected ? 'bg-white' : 'bg-slate-50 opacity-60'}>
                              <td className="py-2 px-3">
                                <input
                                  type="checkbox"
                                  checked={item.selected}
                                  onChange={(e) =>
                                    setEditableItems((prev) =>
                                      prev.map((it, i) =>
                                        i === idx ? { ...it, selected: e.target.checked } : it
                                      )
                                    )
                                  }
                                  className="rounded text-emerald-600"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={item.recognizedProduct}
                                  onChange={(e) =>
                                    setEditableItems((prev) =>
                                      prev.map((it, i) =>
                                        i === idx ? { ...it, recognizedProduct: e.target.value } : it
                                      )
                                    )
                                  }
                                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-900 focus:bg-white focus:outline-none"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={item.brand}
                                  onChange={(e) =>
                                    setEditableItems((prev) =>
                                      prev.map((it, i) =>
                                        i === idx ? { ...it, brand: e.target.value } : it
                                      )
                                    )
                                  }
                                  className="w-full bg-emerald-50/50 border border-emerald-200 rounded px-2 py-1 text-xs text-emerald-900 font-semibold focus:bg-white focus:outline-none"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setEditableItems((prev) =>
                                      prev.map((it, i) =>
                                        i === idx
                                          ? { ...it, unitPrice: val, totalPrice: Number((val * it.quantity).toFixed(2)) }
                                          : it
                                      )
                                    );
                                  }}
                                  className="w-24 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 1;
                                      setEditableItems((prev) =>
                                        prev.map((it, i) =>
                                          i === idx
                                            ? { ...it, quantity: val, totalPrice: Number((it.unitPrice * val).toFixed(2)) }
                                            : it
                                        )
                                      );
                                    }}
                                    className="w-14 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-center"
                                  />
                                  <input
                                    type="text"
                                    value={item.unit}
                                    onChange={(e) =>
                                      setEditableItems((prev) =>
                                        prev.map((it, i) =>
                                          i === idx ? { ...it, unit: e.target.value.toUpperCase() } : it
                                        )
                                      )
                                    }
                                    className="w-12 bg-slate-50 border border-slate-200 rounded px-1 py-1 text-xs text-center uppercase"
                                  />
                                </div>
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-800">
                                R$ {Number(item.totalPrice || item.unitPrice * item.quantity).toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  onClick={() =>
                                    setEditableItems((prev) => prev.filter((_, i) => i !== idx))
                                  }
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MANUAL REGISTRATION */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4 max-w-2xl mx-auto py-2">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  Dados do Fornecedor e Documento
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">
                      Fornecedor / Razão Social *
                    </label>
                    <input
                      type="text"
                      required
                      value={manualForm.supplier}
                      onChange={(e) => setManualForm({ ...manualForm, supplier: e.target.value })}
                      placeholder="Ex: Kalunga Comercial Ltda"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-slate-400 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">CNPJ</label>
                    <input
                      type="text"
                      value={manualForm.cnpj}
                      onChange={(e) => setManualForm({ ...manualForm, cnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-slate-400 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">Tipo de Documento</label>
                    <select
                      value={manualForm.documentType}
                      onChange={(e) => setManualForm({ ...manualForm, documentType: e.target.value as any })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-slate-400 text-xs"
                    >
                      <option value="nfe">Nota Fiscal Eletrônica (NF-e)</option>
                      <option value="catalogo">Catálogo Comercial de Fabricante</option>
                      <option value="ata">Ata de Registro de Preços</option>
                      <option value="contrato">Contrato Administrativo</option>
                      <option value="cotacao_direta">Cotação Direta Formal</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-600 font-medium block mb-1">Nº do Documento</label>
                      <input
                        type="text"
                        value={manualForm.documentNumber}
                        onChange={(e) => setManualForm({ ...manualForm, documentNumber: e.target.value })}
                        placeholder="Ex: 104859"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-slate-400 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 font-medium block mb-1">Data</label>
                      <input
                        type="date"
                        value={manualForm.documentDate}
                        onChange={(e) => setManualForm({ ...manualForm, documentDate: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-slate-400 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  Identificação do Produto e Preço
                </span>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">
                      Descrição do Item / Produto *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={manualForm.productDescription}
                      onChange={(e) => setManualForm({ ...manualForm, productDescription: e.target.value })}
                      placeholder="Ex: Papel Sulfite A4 75g/m² Branco Pacote com 500 Folhas..."
                      className="w-full bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-slate-400 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-slate-600 font-medium block mb-1">
                        Marca do Produto *
                      </label>
                      <input
                        type="text"
                        required
                        value={manualForm.brand}
                        onChange={(e) => setManualForm({ ...manualForm, brand: e.target.value })}
                        placeholder="Ex: Chamex, Dell, BIC"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-slate-400 text-xs font-semibold text-emerald-800"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 font-medium block mb-1">Modelo / Linha</label>
                      <input
                        type="text"
                        value={manualForm.model}
                        onChange={(e) => setManualForm({ ...manualForm, model: e.target.value })}
                        placeholder="Ex: Office 75g"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-slate-400 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 font-medium block mb-1">Unidade</label>
                      <input
                        type="text"
                        value={manualForm.unit}
                        onChange={(e) => setManualForm({ ...manualForm, unit: e.target.value.toUpperCase() })}
                        placeholder="UN, PCT, CX"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-slate-400 text-xs uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 font-medium block mb-1">
                        Preço Unitário (R$) *
                      </label>
                      <input
                        type="text"
                        required
                        value={manualForm.unitPrice}
                        onChange={(e) => setManualForm({ ...manualForm, unitPrice: e.target.value })}
                        placeholder="Ex: 24.90"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-slate-400 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 font-medium block mb-1">Quantidade</label>
                      <input
                        type="text"
                        value={manualForm.quantity}
                        onChange={(e) => setManualForm({ ...manualForm, quantity: e.target.value })}
                        placeholder="1"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-slate-400 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar no Banco de Preços</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-slate-400" />
            <span>
              Base legal: <strong>Art. 23, § 1º, II</strong> da Nova Lei de Licitações (Lei 14.133/2021).
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
