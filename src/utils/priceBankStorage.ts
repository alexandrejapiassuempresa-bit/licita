import * as XLSX from 'xlsx';
import { PriceBankItem, PriceQuote } from '../types/procurement';

const STORAGE_KEY = 'cotalicit_price_bank_items_v1';

export const SAMPLE_PRICE_BANK_ITEMS: PriceBankItem[] = [
  {
    id: 'pb_sample_1',
    productDescription: 'Papel Sulfite A4 75g/m² Branco Pacote com 500 Folhas',
    recognizedProduct: 'Papel Sulfite A4 75g 500 Folhas',
    brand: 'Chamex',
    model: 'Office A4 75g/m² 210x297mm',
    unit: 'PCT',
    unitPrice: 24.90,
    quantity: 200,
    totalPrice: 4980.00,
    supplier: 'Kalunga Comercial Ltda',
    cnpj: '43.214.055/0001-07',
    documentType: 'nfe',
    documentNumber: '104859',
    documentDate: '2024-04-15',
    sourceFileName: 'NFe_104859_Kalunga.xml',
    notes: 'Nota Fiscal homologada em aquisição anterior da Secretaria de Educação',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pb_sample_2',
    productDescription: 'Caneta Esferográfica Ponta Média 1.0mm Azul Caixa com 50 Unidades',
    recognizedProduct: 'Caneta Esferográfica Azul 1.0mm Cx c/ 50',
    brand: 'BIC',
    model: 'Cristal Tradicional 1.0mm',
    unit: 'CX',
    unitPrice: 42.50,
    quantity: 40,
    totalPrice: 1700.00,
    supplier: 'Distribuidora Papel Forte Ltda',
    cnpj: '18.942.331/0001-44',
    documentType: 'nfe',
    documentNumber: '028412',
    documentDate: '2024-03-20',
    sourceFileName: 'NF_028412_PapelForte.xml',
    notes: 'Aquisição regular de material de expediente',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pb_sample_3',
    productDescription: 'Notebook 15.6" Intel Core i5 16GB SSD 512GB Windows 11 Pro',
    recognizedProduct: 'Notebook Corporativo 15.6" i5 16GB SSD 512GB',
    brand: 'Dell',
    model: 'Vostro 3520 Core i5-1235U',
    unit: 'UN',
    unitPrice: 3890.00,
    quantity: 15,
    totalPrice: 58350.00,
    supplier: 'Dell Computadores do Brasil Ltda',
    cnpj: '72.381.189/0001-10',
    documentType: 'ata',
    documentNumber: 'Ata RP 08/2024',
    documentDate: '2024-05-02',
    sourceFileName: 'Ata_Registro_Precos_08_2024_Dell.pdf',
    notes: 'Ata de Registro de Preços válida para adesão institucional',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pb_sample_4',
    productDescription: 'Cadeira Giratória Ergonômica com Braços Reguláveis e Mecanismo Back System (NR-17)',
    recognizedProduct: 'Cadeira Giratória NR-17 Ergonômica',
    brand: 'Frisokar',
    model: 'Linha Diretor Ergo NR-17',
    unit: 'UN',
    unitPrice: 535.00,
    quantity: 25,
    totalPrice: 13375.00,
    supplier: 'Mobiliário Brasil Indústria e Comércio',
    cnpj: '05.678.912/0001-33',
    documentType: 'contrato',
    documentNumber: 'Contrato 44/2023',
    documentDate: '2024-02-18',
    sourceFileName: 'Contrato_44_2023_Mobiliario.pdf',
    notes: 'Mobiliário com laudo de conformidade à NR-17',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pb_sample_5',
    productDescription: 'Detergente Líquido Neutro Biodegradável Frasco 500ml',
    recognizedProduct: 'Detergente Líquido Neutro 500ml',
    brand: 'Ypê',
    model: 'Lava-louças Neutro Tradicional',
    unit: 'UN',
    unitPrice: 2.89,
    quantity: 300,
    totalPrice: 867.00,
    supplier: 'LimpMax Distribuidora de Saneantes',
    cnpj: '24.112.564/0001-88',
    documentType: 'nfe',
    documentNumber: '009843',
    documentDate: '2024-06-10',
    sourceFileName: 'NFe_009843_LimpMax.xml',
    notes: 'Nota fiscal de compra para almoxarifado central',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pb_sample_6',
    productDescription: 'Água Sanitária com Cloro Ativo 2,0% a 2,5% Bombona 5 Litros',
    recognizedProduct: 'Água Sanitária Cloro Ativo Bombona 5L',
    brand: 'Qboa',
    model: 'Galão Institucional 5L',
    unit: 'GL',
    unitPrice: 14.80,
    quantity: 50,
    totalPrice: 740.00,
    supplier: 'LimpMax Distribuidora de Saneantes',
    cnpj: '24.112.564/0001-88',
    documentType: 'catalogo',
    documentNumber: 'Catálogo Tab. 2024/02',
    documentDate: '2024-05-20',
    sourceFileName: 'Catalogo_Tabela_LimpMax_2024.pdf',
    notes: 'Catálogo oficial de preços registrado pelo fornecedor',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pb_sample_7',
    productDescription: 'Grampeador de Mesa Metálico para até 25 Folhas 26/6',
    recognizedProduct: 'Grampeador de Mesa 26/6 até 25 fls',
    brand: 'Menno',
    model: 'Grampeador Office 26/6 Médio',
    unit: 'UN',
    unitPrice: 21.90,
    quantity: 30,
    totalPrice: 657.00,
    supplier: 'Kalunga Comercial Ltda',
    cnpj: '43.214.055/0001-07',
    documentType: 'nfe',
    documentNumber: '104859',
    documentDate: '2024-04-15',
    sourceFileName: 'NFe_104859_Kalunga.xml',
    notes: 'Item de expediente com garantia de 1 ano',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pb_sample_8',
    productDescription: 'Fita Adesiva Transparente Larga 45mm x 45m Polipropileno',
    recognizedProduct: 'Fita Adesiva Transparente 45mm x 45m',
    brand: '3M Tartan',
    model: 'Fita para empacotamento 45x45',
    unit: 'UN',
    unitPrice: 4.80,
    quantity: 100,
    totalPrice: 480.00,
    supplier: 'Distribuidora Papel Forte Ltda',
    cnpj: '18.942.331/0001-44',
    documentType: 'nfe',
    documentNumber: '028412',
    documentDate: '2024-03-20',
    sourceFileName: 'NF_028412_PapelForte.xml',
    notes: 'Fita adesiva para empacotamento',
    createdAt: new Date().toISOString(),
  },
];

export function loadPriceBank(): PriceBankItem[] {
  if (typeof window === 'undefined') return SAMPLE_PRICE_BANK_ITEMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_PRICE_BANK_ITEMS));
      return SAMPLE_PRICE_BANK_ITEMS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_PRICE_BANK_ITEMS));
      return SAMPLE_PRICE_BANK_ITEMS;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load Price Bank from localStorage:', e);
    return SAMPLE_PRICE_BANK_ITEMS;
  }
}

export function savePriceBank(items: PriceBankItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save Price Bank to localStorage:', e);
  }
}

export function resetToSamplePriceBank(): PriceBankItem[] {
  savePriceBank(SAMPLE_PRICE_BANK_ITEMS);
  return SAMPLE_PRICE_BANK_ITEMS;
}

export function matchPriceBankItems(
  description: string,
  referenceBrand?: string,
  priceBankItems: PriceBankItem[] = []
): PriceQuote[] {
  if (!description || priceBankItems.length === 0) return [];

  const queryTerms = description
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['com', 'para', 'das', 'dos', 'uma', 'uns', 'que', 'tipo'].includes(w));

  const brandTerm = (referenceBrand || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const scoredMatches = priceBankItems.map((item) => {
    const targetText = `${item.productDescription} ${item.recognizedProduct} ${item.brand} ${item.model || ''}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    let score = 0;
    queryTerms.forEach((term) => {
      if (targetText.includes(term)) {
        score += term.length > 4 ? 3 : 1;
      }
    });

    if (brandTerm && targetText.includes(brandTerm)) {
      score += 5;
    }

    return { item, score };
  });

  // Filter items with good relevance match (score >= 3)
  const matches = scoredMatches
    .filter((m) => m.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((m) => m.item);

  return matches.map((item) => {
    const docLabel =
      item.documentType === 'nfe'
        ? `NF-e nº ${item.documentNumber || 'S/N'}`
        : item.documentType === 'catalogo'
        ? `Catálogo ${item.documentNumber || 'Comercial'}`
        : item.documentType === 'ata'
        ? `Ata RP ${item.documentNumber || 'Homologada'}`
        : `Contrato ${item.documentNumber || 'Público'}`;

    return {
      id: `quote_bank_${item.id}_${Date.now()}`,
      supplier: `${item.supplier} (${docLabel})`,
      brand: item.brand,
      model: item.model || 'Conforme especificação homologada',
      price: item.unitPrice,
      url: item.sourceFileName ? `Arquivo: ${item.sourceFileName}` : 'Banco de Preços Institucional',
      date: item.documentDate || new Date().toISOString().split('T')[0],
      notes: `[Banco de Preços / Lei 14.133 Art. 23] Fornecedor: ${item.supplier}${item.cnpj ? ` (CNPJ: ${item.cnpj})` : ''} - Doc: ${docLabel}`,
      siteName: 'Banco de Preços',
      isFromPriceBank: true,
      documentType: item.documentType,
      documentNumber: item.documentNumber,
      cnpj: item.cnpj,
      isExcluded: false,
    };
  });
}

export function exportPriceBankToExcel(items: PriceBankItem[], filename = 'Banco_de_Precos_Licitatorio'): void {
  const exportRows = items.map((item, index) => ({
    'Nº': index + 1,
    'Produto / Descrição': item.productDescription,
    'Nome Padronizado': item.recognizedProduct,
    'Marca': item.brand,
    'Modelo / Ref': item.model || '',
    'Unidade': item.unit,
    'Valor Unitário (R$)': item.unitPrice,
    'Qtd Registrada': item.quantity || 1,
    'Valor Total (R$)': item.totalPrice || item.unitPrice * (item.quantity || 1),
    'Fornecedor / Razão Social': item.supplier,
    'CNPJ': item.cnpj || '',
    'Tipo Documento': item.documentType.toUpperCase(),
    'Nº Documento': item.documentNumber || '',
    'Data do Documento': item.documentDate,
    'Arquivo de Origem': item.sourceFileName || '',
    'Observações': item.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Banco de Preços');

  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 35 },
    { wch: 25 },
    { wch: 18 },
    { wch: 20 },
    { wch: 10 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 30 },
    { wch: 20 },
    { wch: 15 },
    { wch: 16 },
    { wch: 16 },
    { wch: 25 },
    { wch: 35 },
  ];

  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
