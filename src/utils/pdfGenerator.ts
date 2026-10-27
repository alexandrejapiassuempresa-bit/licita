import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProcurementProject, ProcurementItem } from '../types/procurement';
import { formatCurrencyBRL } from './procurementStats';

export interface PDFGenerationOptions {
  processNumber: string;
  entityName: string;
  department: string;
  responsibleName: string;
  title: string;
}

export function generateProcurementPDF(
  project: ProcurementProject,
  options: PDFGenerationOptions
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  // Colors
  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const secondaryColor: [number, number, number] = [5, 150, 105]; // Emerald 600
  const textDark: [number, number, number] = [30, 41, 59];
  const textMuted: [number, number, number] = [100, 116, 139];

  // --- HEADER SECTION ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('REPÚBLICA FEDERATIVA DO BRASIL • ADMINISTRAÇÃO PÚBLICA', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  doc.setFontSize(13);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(options.entityName.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(options.department, pageWidth / 2, currentY, { align: 'center' });
  currentY += 6;

  // Horizontal divider
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;

  // Report Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('RELATÓRIO DE PESQUISA DE PREÇOS E MAPA COMPARATIVO', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Em cumprimento ao Art. 23 da Lei nº 14.133/2021 e IN SEGES/ME nº 65/2021', pageWidth / 2, currentY, { align: 'center' });
  currentY += 7;

  // Process Meta Table
  const methodologyLabel =
    project.methodology === 'mediana'
      ? 'Mediana dos Preços'
      : project.methodology === 'menor_preco'
      ? 'Menor Preço das Cotações Válidas'
      : 'Média Aritmética dos Preços Coletados';

  const issueDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: textDark,
      lineColor: [226, 232, 240],
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: textDark,
      fontStyle: 'bold',
    },
    body: [
      [
        { content: 'Processo / Edital:', styles: { fontStyle: 'bold', cellWidth: 40 } },
        { content: options.processNumber, styles: { cellWidth: 50 } },
        { content: 'Data de Emissão:', styles: { fontStyle: 'bold', cellWidth: 35 } },
        { content: issueDate, styles: { cellWidth: 45 } },
      ],
      [
        { content: 'Objeto Licitatório:', styles: { fontStyle: 'bold' } },
        { content: options.title, colSpan: 3 },
      ],
      [
        { content: 'Metodologia Adotada:', styles: { fontStyle: 'bold' } },
        { content: methodologyLabel, styles: { textColor: [5, 150, 105], fontStyle: 'bold' } },
        { content: 'Responsável:', styles: { fontStyle: 'bold' } },
        { content: options.responsibleName },
      ],
    ],
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // Legal declaration note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const legalNote =
    'FUNDAMENTAÇÃO METODOLÓGICA: A pesquisa de preços observou os parâmetros do art. 23 da Lei nº 14.133/2021, integrando dados de painéis de compras públicas e pesquisa ampla de mercado em fornecedores idôneos. Os links comprobatórios constam no presente documento para fins de auditoria e controle dos órgãos fiscalizadores.';
  const splitNote = doc.splitTextToSize(legalNote, pageWidth - margin * 2);
  doc.text(splitNote, margin, currentY);
  currentY += splitNote.length * 3.5 + 4;

  // --- DETAILED ITEMS & QUOTES SECTION ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('DEMONSTRATIVO DAS COTAÇÕES COLETADAS POR ITEM', margin, currentY);
  currentY += 4;

  project.items.forEach((item) => {
    const activeQuotes = item.quotes.filter((q) => !q.isExcluded);

    // Check if we need a new page for the item box
    if (currentY > pageHeight - 65) {
      doc.addPage();
      currentY = margin;
    }

    // Item header banner
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, currentY, pageWidth - margin * 2, 7, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`ITEM Nº ${item.itemNumber} - ${item.recognizedProduct || 'Produto Licitatório'}`, margin + 3, currentY + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Quantidade: ${item.quantity} ${item.unit}`, pageWidth - margin - 3, currentY + 4.8, { align: 'right' });
    currentY += 8;

    // Original description block
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    const descText = `Descritivo: ${item.originalDescription}`;
    const splitDesc = doc.splitTextToSize(descText, pageWidth - margin * 2 - 4);
    doc.text(splitDesc, margin + 2, currentY);
    currentY += splitDesc.length * 3 + 2;

    // Quotes table for this item
    const quoteRows = activeQuotes.map((q, idx) => {
      const isLowest = q.price === item.lowestPrice;
      const urlText = q.url ? (q.url.length > 45 ? `${q.url.substring(0, 42)}...` : q.url) : 'Proposta física/direta';
      const label = isLowest ? `Cot. #${idx + 1} ★` : `Cot. #${idx + 1}`;
      const brandText = isLowest
        ? `${q.brand || '-'}${q.model ? ` (${q.model})` : ''} [Marca Menor Valor]`
        : `${q.brand || '-'}${q.model ? ` (${q.model})` : ''}`;

      return [
        label,
        q.supplier || 'Fornecedor',
        brandText,
        formatCurrencyBRL(q.price),
        q.date || '-',
        urlText,
      ];
    });

    if (quoteRows.length === 0) {
      quoteRows.push(['-', 'Nenhuma cotação registrada', '-', 'R$ 0,00', '-', '-']);
    }

    autoTable(doc, {
      startY: currentY,
      theme: 'striped',
      head: [['Cotação', 'Fornecedor / Loja', 'Marca / Modelo (Menor Preço)', 'Valor Unit.', 'Data', 'Link da Fonte']],
      body: quoteRows,
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        textColor: textDark,
      },
      headStyles: {
        fillColor: [226, 232, 240],
        textColor: primaryColor,
        fontStyle: 'bold',
        fontSize: 7.2,
      },
      columnStyles: {
        0: { cellWidth: 18, fontStyle: 'bold' },
        1: { cellWidth: 38 },
        2: { cellWidth: 42 },
        3: { cellWidth: 20, halign: 'right', fontStyle: 'bold' },
        4: { cellWidth: 16, halign: 'center' },
        5: { cellWidth: 46, textColor: [37, 99, 235] },
      },
      margin: { left: margin, right: margin },
      didDrawCell: (data) => {
        // Add clickable link on the URL column
        if (data.section === 'body' && data.column.index === 5) {
          const originalQuote = activeQuotes[data.row.index];
          if (originalQuote?.url) {
            doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, {
              url: originalQuote.url,
            });
          }
        }
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 2;

    // Item stats summary line
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, currentY, pageWidth - margin * 2, 6, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);

    const lowestBrandLabel = item.lowestPriceBrand ? ` (Marca: ${item.lowestPriceBrand})` : '';
    const statsSummary = `Menor: ${formatCurrencyBRL(item.lowestPrice)}${lowestBrandLabel}  |  Média: ${formatCurrencyBRL(item.averagePrice)}  |  Mediana: ${formatCurrencyBRL(item.medianPrice)}  |  CV: ${item.coefficientOfVariation ?? 0}%`;
    doc.text(statsSummary, margin + 3, currentY + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    const totalItemText = `Total Estimado: ${formatCurrencyBRL(item.totalEstimated)}`;
    doc.text(totalItemText, pageWidth - margin - 3, currentY + 4.2, { align: 'right' });

    currentY += 10;
  });

  // --- GRAND TOTAL & BUDGET SUMMARY ---
  if (currentY > pageHeight - 55) {
    doc.addPage();
    currentY = margin;
  }

  const grandTotal = project.items.reduce((acc, curr) => {
    let unitPrice = curr.averagePrice || 0;
    if (project.methodology === 'mediana') unitPrice = curr.medianPrice || unitPrice;
    if (project.methodology === 'menor_preco') unitPrice = curr.lowestPrice || unitPrice;
    return acc + unitPrice * (curr.quantity || 1);
  }, 0);

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('VALOR TOTAL ESTIMADO DA LICITAÇÃO:', margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Critério aplicado: ${methodologyLabel} (${project.items.length} itens cotados)`, margin + 4, currentY + 10.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(formatCurrencyBRL(grandTotal), pageWidth - margin - 4, currentY + 9, { align: 'right' });

  currentY += 20;

  // --- DECLARATION & SIGNATURE BLOCKS ---
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = margin + 5;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const certText =
    'DECLARAÇÃO DE CONFORMIDADE: Certifico que a presente pesquisa de preços foi elaborada com estrita observância aos princípios da legalidade, impessoalidade, moralidade, economicidade e eficiência, refletindo os valores praticados no mercado para balizar a fase preparatória da licitação.';
  const splitCert = doc.splitTextToSize(certText, pageWidth - margin * 2);
  doc.text(splitCert, margin, currentY);
  currentY += splitCert.length * 3.5 + 14;

  const signWidth = 75;
  const col1X = margin + 10;
  const col2X = pageWidth - margin - signWidth - 10;

  // Signature line 1: Pesquisador / Agente de contratação
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(col1X, currentY, col1X + signWidth, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(options.responsibleName, col1X + signWidth / 2, currentY + 4, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Responsável pela Pesquisa de Preços', col1X + signWidth / 2, currentY + 7.5, { align: 'center' });

  // Signature line 2: Autoridade competente
  doc.line(col2X, currentY, col2X + signWidth, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Autoridade Competente / Ordenador', col2X + signWidth / 2, currentY + 4, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Aprovação do Termo de Referência', col2X + signWidth / 2, currentY + 7.5, { align: 'center' });

  // --- FOOTER & PAGE NUMBERING ON ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);

    // Bottom divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    // Left: verification note
    doc.text('CotaLicit • Documento de Pesquisa de Preços Licitatória (Lei 14.133/2021)', margin, pageHeight - 6);

    // Right: Page count
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  return doc;
}

export function downloadProcurementPDF(
  project: ProcurementProject,
  options: PDFGenerationOptions
) {
  const doc = generateProcurementPDF(project, options);
  const cleanTitle = (options.processNumber || 'Pesquisa_Precos')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 30);
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`${cleanTitle}_Relatorio_Oficial_${dateStr}.pdf`);
}
