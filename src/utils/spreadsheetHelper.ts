import * as XLSX from 'xlsx';
import { ProcurementItem, PriceQuote } from '../types/procurement';
import { calculateStats } from './procurementStats';

export interface ParsedItemRow {
  itemNumber: number;
  originalDescription: string;
  quantity: number;
  unit: string;
  referenceBrand?: string;
}

export function parseSpreadsheetBuffer(buffer: ArrayBuffer): {
  items: ParsedItemRow[];
  headers: string[];
  rawRows: Record<string, any>[];
} {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
  });

  if (!rawRows || rawRows.length === 0) {
    return { items: [], headers: [], rawRows: [] };
  }

  const headers = Object.keys(rawRows[0]);

  // Find most likely columns
  const descCol = headers.find((h) =>
    /descri|especific|produto|objeto|item_desc/i.test(h)
  ) || headers[1] || headers[0];

  const qtyCol = headers.find((h) =>
    /quant|qtd|quantidade|quant\./i.test(h)
  );

  const unitCol = headers.find((h) =>
    /unid|unidade|medida|und/i.test(h)
  );

  const brandCol = headers.find((h) =>
    /marca|refer|fabricante/i.test(h)
  );

  const numCol = headers.find((h) =>
    /^item$|^nº$|^numero$|^n°$|^lote$/i.test(h)
  );

  const items: ParsedItemRow[] = [];

  rawRows.forEach((row, idx) => {
    const desc = String(row[descCol] || '').trim();
    if (!desc) return; // skip blank rows

    const itemNum = numCol && row[numCol] ? Number(row[numCol]) || (idx + 1) : idx + 1;
    let qty = 1;
    if (qtyCol && row[qtyCol]) {
      const parsed = parseFloat(String(row[qtyCol]).replace(/\./g, '').replace(',', '.'));
      if (!isNaN(parsed) && parsed > 0) qty = parsed;
    }

    const unit = unitCol && row[unitCol] ? String(row[unitCol]).trim().toUpperCase() : 'UN';
    const referenceBrand = brandCol && row[brandCol] ? String(row[brandCol]).trim() : undefined;

    items.push({
      itemNumber: itemNum,
      originalDescription: desc,
      quantity: qty,
      unit,
      referenceBrand,
    });
  });

  return { items, headers, rawRows };
}

export function exportProcurementToExcel(
  items: ProcurementItem[],
  projectName: string = 'Pesquisa_Precos_Licitacao'
) {
  const rows = items.map((item) => {
    const activeQuotes = item.quotes.filter((q) => !q.isExcluded);
    const sortedQuotes = [...activeQuotes].sort((a, b) => a.price - b.price);
    const bestQuote = sortedQuotes[0];
    const q1 = sortedQuotes[0]; // Lowest price quote
    const q2 = sortedQuotes[1];
    const q3 = sortedQuotes[2];

    const lowestPriceVal = item.lowestPrice ?? (bestQuote ? bestQuote.price : 0);
    const totalLowest = lowestPriceVal * (item.quantity || 1);

    return {
      'Item Nº': item.itemNumber,
      'Descrição Licitatória Original': item.originalDescription,
      'Produto Reconhecido no Mercado': item.recognizedProduct || 'Em análise',
      'Qtd': item.quantity,
      'Unidade': item.unit,
      'Melhor Preço no Mercado (R$)': lowestPriceVal || '',
      'Marca Identificada no Site': item.lowestPriceBrand || (bestQuote ? bestQuote.brand : ''),
      'Loja / Fornecedor do Menor Preço': item.lowestPriceSupplier || (bestQuote ? bestQuote.supplier : ''),
      'Link da Oferta no Site (URL)': item.lowestPriceUrl || (bestQuote ? bestQuote.url : ''),
      'Valor Total (Qtd × Menor Preço) (R$)': Number(totalLowest.toFixed(2)) || '',
      'Preço Médio de Referência (R$)': item.averagePrice ?? '',
      'Preço Mediano de Referência (R$)': item.medianPrice ?? '',
      'Total Geral Estimado (R$)': item.totalEstimated ?? '',
      'Cotação 1 - Loja / Fornecedor': q1?.supplier || '-',
      'Cotação 1 - Marca no Site': q1?.brand || '-',
      'Cotação 1 - Preço Unit. (R$)': q1?.price || '',
      'Cotação 1 - Link da Oferta': q1?.url || '',
      'Cotação 2 - Loja / Fornecedor': q2?.supplier || '-',
      'Cotação 2 - Marca no Site': q2?.brand || '-',
      'Cotação 2 - Preço Unit. (R$)': q2?.price || '',
      'Cotação 2 - Link da Oferta': q2?.url || '',
      'Cotação 3 - Loja / Fornecedor': q3?.supplier || '-',
      'Cotação 3 - Marca no Site': q3?.brand || '-',
      'Cotação 3 - Preço Unit. (R$)': q3?.price || '',
      'Cotação 3 - Link da Oferta': q3?.url || '',
      'Desvio Padrão': item.standardDeviation ?? '',
      'Coeficiente Variação (%)': item.coefficientOfVariation ? `${item.coefficientOfVariation}%` : '',
      'Status da Pesquisa': item.status === 'completed' ? 'Cotação Concluída' : 'Pendente',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set explicit column widths for readability
  worksheet['!cols'] = [
    { wch: 8 },  // Item
    { wch: 45 }, // Descrição Original
    { wch: 32 }, // Produto Reconhecido
    { wch: 8 },  // Qtd
    { wch: 8 },  // Unidade
    { wch: 22 }, // Melhor Preço
    { wch: 26 }, // Marca Identificada no Site
    { wch: 28 }, // Loja do Menor Preço
    { wch: 45 }, // Link do Menor Preço
    { wch: 24 }, // Valor Total Menor Preço
    { wch: 18 }, // Média
    { wch: 18 }, // Mediana
    { wch: 18 }, // Total Geral
    { wch: 24 }, // Cot 1 Fornecedor
    { wch: 22 }, // Cot 1 Marca
    { wch: 16 }, // Cot 1 Preço
    { wch: 40 }, // Cot 1 Link
    { wch: 24 }, // Cot 2 Fornecedor
    { wch: 22 }, // Cot 2 Marca
    { wch: 16 }, // Cot 2 Preço
    { wch: 40 }, // Cot 2 Link
    { wch: 24 }, // Cot 3 Fornecedor
    { wch: 22 }, // Cot 3 Marca
    { wch: 16 }, // Cot 3 Preço
    { wch: 40 }, // Cot 3 Link
    { wch: 14 }, // Desvio Padrão
    { wch: 16 }, // CV %
    { wch: 18 }, // Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mapa_de_Precos_Licitacao');

  const fileName = `${projectName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function downloadSampleSpreadsheet(category: 'escritorio' | 'ti' | 'limpeza' = 'escritorio') {
  let sampleData: Record<string, any>[] = [];

  if (category === 'escritorio') {
    sampleData = [
      {
        'Item': 1,
        'Descrição Detalhada do Item': 'Papel sulfite A4, alcalino, 75 g/m², alvura 90%, formato 210 x 297 mm, resma com 500 folhas, embalagem impermeável',
        'Quantidade': 120,
        'Unidade': 'RESMA',
        'Marca Referência': 'Chamex / Report ou similar',
      },
      {
        'Item': 2,
        'Descrição Detalhada do Item': 'Cadeira giratória ergonômica secretária com braços reguláveis, espuma injetada D45, regulagem de altura a gás, norma NR-17',
        'Quantidade': 15,
        'Unidade': 'UN',
        'Marca Referência': 'Frisokar ou similar',
      },
      {
        'Item': 3,
        'Descrição Detalhada do Item': 'Caneta esferográfica ponta média 1.0mm, corpo sextavado transparente, tinta azul, caixa com 50 unidades',
        'Quantidade': 30,
        'Unidade': 'CX',
        'Marca Referência': 'BIC Cristal ou similar',
      },
      {
        'Item': 4,
        'Descrição Detalhada do Item': 'Grampeador de mesa metálico capacidade para até 25 folhas, base com acabamento emborrachado, compatível com grampo 26/6',
        'Quantidade': 20,
        'Unidade': 'UN',
        'Marca Referência': 'Menno / Cis ou similar',
      },
    ];
  } else if (category === 'ti') {
    sampleData = [
      {
        'Item': 1,
        'Descrição Detalhada do Item': 'Notebook corporativo tela 15.6 polegadas Full HD Antirreflexo, Processador Intel Core i5 12ª geração ou superior, memória RAM 16GB DDR4, SSD 512GB NVMe, Teclado ABNT2 com teclado numérico, Sistema Operacional Windows 11 Pro 64-bit',
        'Quantidade': 10,
        'Unidade': 'UN',
        'Marca Referência': 'Dell / Lenovo / HP',
      },
      {
        'Item': 2,
        'Descrição Detalhada do Item': 'Monitor LED 23.8 polegadas IPS, resolução Full HD 1920x1080, conexões HDMI e DisplayPort, ajuste de inclinação, padrão VESA',
        'Quantidade': 20,
        'Unidade': 'UN',
        'Marca Referência': 'Dell / LG / Philips',
      },
      {
        'Item': 3,
        'Descrição Detalhada do Item': 'Nobreak interativo senoidal 1500VA / 1050W, bivolt automático de entrada (115V/220V), saída 115V, 6 a 8 tomadas NBR 14136, conector para bateria externa',
        'Quantidade': 5,
        'Unidade': 'UN',
        'Marca Referência': 'SMS / Intelbras / APC',
      },
      {
        'Item': 4,
        'Descrição Detalhada do Item': 'Switch gerenciável 24 portas Gigabit Ethernet 10/100/1000 Mbps com 4 portas SFP Gigabit para uplink, montável em rack 19 polegadas',
        'Quantidade': 2,
        'Unidade': 'UN',
        'Marca Referência': 'TP-Link / D-Link / Cisco',
      },
    ];
  } else {
    sampleData = [
      {
        'Item': 1,
        'Descrição Detalhada do Item': 'Detergente líquido lava-louças neutro biodegradável com glicerina, frasco de 500 ml com bico dosador',
        'Quantidade': 200,
        'Unidade': 'FRASCO',
        'Marca Referência': 'Ypê / Limpol ou similar',
      },
      {
        'Item': 2,
        'Descrição Detalhada do Item': 'Água sanitária solução aquosa à base de hipoclorito de sódio com cloro ativo 2,0% a 2,5% p/p, bombona de 5 litros',
        'Quantidade': 50,
        'Unidade': 'GL',
        'Marca Referência': 'Qboa / Candura ou similar',
      },
      {
        'Item': 3,
        'Descrição Detalhada do Item': 'Papel toalha interfolhado 2 dobras, 100% celulose virgem, folha dupla, dimensões 20 x 21 cm, pacote com 1.000 folhas',
        'Quantidade': 80,
        'Unidade': 'PCT',
        'Marca Referência': 'Santher / Melitta ou similar',
      },
    ];
  }

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 55 },
    { wch: 12 },
    { wch: 10 },
    { wch: 25 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Itens_Licitacao_Modelo');
  XLSX.writeFile(workbook, `Modelo_Planilha_Licitacao_${category}.xlsx`);
}
