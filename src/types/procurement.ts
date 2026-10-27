export interface PriceQuote {
  id: string;
  supplier: string;
  brand: string;
  model?: string;
  price: number;
  url: string;
  date: string;
  isExcluded?: boolean;
  notes?: string;
  siteName?: string;
  isFromPriceBank?: boolean;
  documentType?: 'nfe' | 'catalogo' | 'contrato' | 'ata' | 'cotacao_direta';
  documentNumber?: string;
  cnpj?: string;
}

export interface ProcurementItem {
  id: string;
  itemNumber: number;
  originalDescription: string;
  quantity: number;
  unit: string;
  referenceBrand?: string;
  recognizedProduct?: string;
  technicalSummary?: string;
  quotes: PriceQuote[];
  status: 'pending' | 'searching' | 'completed' | 'error';
  errorMessage?: string;
  
  // Statistical metrics (Lei 14.133/2021)
  lowestPrice?: number;
  lowestPriceBrand?: string;
  lowestPriceSupplier?: string;
  lowestPriceUrl?: string;
  averagePrice?: number;
  medianPrice?: number;
  standardDeviation?: number;
  coefficientOfVariation?: number; // CV% = (SD / Mean) * 100. If > 25%, high dispersion alert
  totalEstimated?: number; // unitPrice (average or median) * quantity
  
  methodologyApplied?: 'media' | 'mediana' | 'menor_preco';
}

export interface SearchSiteConfig {
  id: string;
  name: string;
  category: 'governamental' | 'marketplace' | 'varejo_geral' | 'especializado';
  domain: string;
  selected: boolean;
  description: string;
}

export interface PriceBankItem {
  id: string;
  productDescription: string;       // Descrição original do produto
  recognizedProduct: string;        // Nome padronizado pela IA
  brand: string;                    // Marca reconhecida
  model?: string;                   // Modelo ou especificação técnica
  unit: string;                     // Unidade de medida (UN, CX, PCT, etc)
  unitPrice: number;                // Valor unitário (R$)
  quantity?: number;                // Quantidade registrada no doc
  totalPrice?: number;              // Valor total
  supplier: string;                 // Nome do Fornecedor / Razão Social
  cnpj?: string;                    // CNPJ
  documentType: 'nfe' | 'catalogo' | 'contrato' | 'ata' | 'cotacao_direta';
  documentNumber?: string;          // Nº da NF-e, Nº da Ata ou Código do Catálogo
  documentDate: string;             // Data de emissão ou validade
  sourceFileName?: string;          // Nome do arquivo original
  notes?: string;                   // Observações ou justificativa
  createdAt: string;                // Data de inclusão
}

export interface PriceDocumentParseResult {
  supplier: string;
  cnpj?: string;
  documentNumber?: string;
  documentDate: string;
  documentType: 'nfe' | 'catalogo' | 'contrato' | 'ata' | 'cotacao_direta';
  summary?: string;
  source?: string;
  items: Array<{
    productDescription: string;
    recognizedProduct: string;
    brand: string;
    model?: string;
    unit: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    notes?: string;
  }>;
}

export interface ProcurementProject {
  id: string;
  processNumber: string;
  title: string;
  entityName: string; // Ex: Prefeitura Municipal de..., Câmara, Tribunal
  department: string;
  responsibleName: string;
  createdAt: string;
  methodology: 'media' | 'mediana' | 'menor_preco';
  items: ProcurementItem[];
  usePriceBankAsSource?: boolean;
}
