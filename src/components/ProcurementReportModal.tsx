import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Scale, 
  FileCheck2, 
  ExternalLink, 
  Building2, 
  Calendar,
  CheckCircle2,
  Info,
  Download,
  Loader2,
  FileText
} from 'lucide-react';
import { ProcurementProject, ProcurementItem } from '../types/procurement';
import { formatCurrencyBRL } from '../utils/procurementStats';
import { downloadProcurementPDF } from '../utils/pdfGenerator';

interface ProcurementReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProcurementProject;
  onUpdateProject: (updates: Partial<ProcurementProject>) => void;
}

export const ProcurementReportModal: React.FC<ProcurementReportModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
}) => {
  if (!isOpen) return null;

  const [processNumber, setProcessNumber] = useState(project.processNumber || 'Pregão Eletrônico nº 001/2025');
  const [entityName, setEntityName] = useState(project.entityName || 'Prefeitura Municipal / Órgão Público');
  const [department, setDepartment] = useState(project.department || 'Departamento de Compras e Licitações');
  const [responsibleName, setResponsibleName] = useState(project.responsibleName || 'Agente de Contratação / Pesquisador de Preços');
  const [title, setTitle] = useState(project.title || 'Aquisição de Materiais e Equipamentos');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState(false);

  const syncState = () => {
    onUpdateProject({
      processNumber,
      entityName,
      department,
      responsibleName,
      title,
    });
  };

  const handlePrint = () => {
    syncState();
    window.print();
  };

  const handleDownloadPDF = async () => {
    syncState();
    setIsGeneratingPDF(true);
    setPdfSuccessMessage(false);

    try {
      // Small timeout to allow UI to render spinner
      await new Promise((resolve) => setTimeout(resolve, 80));
      downloadProcurementPDF(project, {
        processNumber,
        entityName,
        department,
        responsibleName,
        title,
      });
      setPdfSuccessMessage(true);
      setTimeout(() => setPdfSuccessMessage(false), 4000);
    } catch (err) {
      console.error('Failed to generate PDF document:', err);
      alert('Erro ao gerar o documento PDF. Você também pode usar a opção de impressão do navegador.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const totalEstimated = project.items.reduce((acc, curr) => {
    let unitPrice = curr.averagePrice || 0;
    if (project.methodology === 'mediana') unitPrice = curr.medianPrice || unitPrice;
    if (project.methodology === 'menor_preco') unitPrice = curr.lowestPrice || unitPrice;
    return acc + unitPrice * (curr.quantity || 1);
  }, 0);

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-5xl shadow-xl overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:bg-white print:text-black">
        {/* Top Control Bar (Hidden on print) */}
        <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Relatório Oficial de Pesquisa de Preços
                </h2>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-medium">
                  Lei 14.133/2021
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Documento formal estruturado para instrução processual e auditoria
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {pdfSuccessMessage && (
              <span className="hidden sm:inline-flex items-center text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> PDF Baixado com Sucesso!
              </span>
            )}

            {/* Direct PDF Download Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-md text-xs font-semibold transition flex items-center space-x-1.5 shadow-2xs"
              title="Baixar arquivo PDF formatado para anexar ao processo licitatório"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Documento PDF</span>
                </>
              )}
            </button>

            {/* Print / Browser PDF button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold transition flex items-center space-x-1.5 shadow-2xs"
              title="Imprimir na impressora física ou gerar PDF do navegador"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
              title="Fechar janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-6 flex-1 bg-white text-slate-900 print:p-4 print:text-black">
          {/* Document Header */}
          <div className="border-b-2 border-slate-800 pb-4 text-center space-y-1">
            <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">
              ESTADO BRASILEIRO • ADMINISTRAÇÃO PÚBLICA
            </div>
            <div className="text-lg font-bold text-slate-900">
              <input
                type="text"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                className="w-full text-center bg-transparent border-b border-dashed border-slate-300 font-bold focus:outline-none print:border-none"
              />
            </div>
            <div className="text-xs text-slate-600">
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-center bg-transparent border-b border-dashed border-slate-300 focus:outline-none print:border-none"
              />
            </div>
            <h1 className="text-base font-extrabold uppercase text-slate-900 pt-2 tracking-wide">
              RELATÓRIO DE PESQUISA DE PREÇOS E MAPA COMPARATIVO
            </h1>
            <p className="text-xs text-slate-500">
              Elaborado em estrita observância ao art. 23 da Lei nº 14.133/2021 e Instrução Normativa SEGES/ME nº 65/2021
            </p>
          </div>

          {/* Process Meta Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-white print:border-slate-300">
            <div>
              <span className="font-bold text-slate-700 block">Processo Administrativo / Edital:</span>
              <input
                type="text"
                value={processNumber}
                onChange={(e) => setProcessNumber(e.target.value)}
                className="w-full bg-transparent border-b border-slate-300 font-medium text-slate-900 focus:outline-none print:border-none"
              />
            </div>
            <div>
              <span className="font-bold text-slate-700 block">Objeto da Contratação:</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent border-b border-slate-300 font-medium text-slate-900 focus:outline-none print:border-none"
              />
            </div>
            <div>
              <span className="font-bold text-slate-700 block">Critério Metodológico Adotado:</span>
              <span className="font-semibold text-emerald-800">
                {project.methodology === 'mediana'
                  ? 'Mediana dos Preços Coletados'
                  : project.methodology === 'menor_preco'
                  ? 'Menor Preço das Cotações Válidas'
                  : 'Média Aritmética dos Preços Coletados'}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-700 block">Data de Emissão do Relatório:</span>
              <span>{currentDate}</span>
            </div>
          </div>

          {/* Legal Rationale Statement */}
          <div className="text-[11px] text-slate-600 bg-slate-50/50 p-3 rounded-lg border border-slate-200/80 leading-relaxed print:border-slate-300">
            <strong>JUSTIFICATIVA LEGAL E METODOLOGIA:</strong> A presente pesquisa de preços foi realizada em cumprimento às disposições do art. 23 da Lei nº 14.133/2021, utilizando parâmetros combinados de consulta a painéis de preços oficiais, contratações similares e pesquisa ampla em sítios eletrônicos de domínio amplo (marketplaces e e-commerces idôneos). Todas as cotações contam com registro de fornecedor, data, marca comercial e link direto comprobatório das ofertas, atendendo aos requisitos de transparência e rastreabilidade dos órgãos de controle (TCU e Tribunais de Contas Estaduais).
          </div>

          {/* Items & Comparative Quotes Table */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-1">
              DEMONSTRATIVO DAS COTAÇÕES POR ITEM (CESTA DE PREÇOS)
            </h3>

            {project.items.map((item) => {
              const activeQuotes = item.quotes.filter((q) => !q.isExcluded);

              return (
                <div key={item.id} className="border border-slate-300 rounded-lg overflow-hidden text-xs page-break-inside-avoid">
                  {/* Item header */}
                  <div className="bg-slate-100 px-3 py-2 border-b border-slate-300 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900 mr-2">
                        ITEM Nº {item.itemNumber}
                      </span>
                      <span className="font-semibold text-slate-700">
                        {item.recognizedProduct || 'Produto Licitatório'}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-700">
                      Qtd: {item.quantity} {item.unit}
                    </div>
                  </div>

                  {/* Original Spec */}
                  <div className="px-3 py-2 bg-slate-50 text-[11px] text-slate-600 border-b border-slate-200">
                    <strong>Especificação no Edital:</strong> {item.originalDescription}
                  </div>

                  {/* Quotes detail table */}
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="p-2 w-16">Cotação</th>
                        <th className="p-2 min-w-[120px]">Fornecedor / Loja</th>
                        <th className="p-2">Marca / Modelo</th>
                        <th className="p-2 text-right w-24">Valor Unit.</th>
                        <th className="p-2 min-w-[200px]">Link Comprobatório</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {activeQuotes.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-2 text-center text-slate-400 italic">
                            Sem cotações registradas
                          </td>
                        </tr>
                      ) : (
                        activeQuotes.map((q, qIdx) => {
                          const isLowest = q.price === item.lowestPrice;
                          return (
                            <tr key={q.id} className={isLowest ? 'bg-emerald-50/60 font-medium' : ''}>
                              <td className="p-2 font-mono font-semibold">
                                Cotação #{qIdx + 1}
                                {isLowest && (
                                  <span className="ml-1 text-[9px] text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded font-bold">
                                    ★ MENOR
                                  </span>
                                )}
                              </td>
                              <td className="p-2 font-medium text-slate-800">{q.supplier}</td>
                              <td className="p-2 text-slate-700">
                                <span className={isLowest ? 'font-bold text-emerald-900' : ''}>
                                  {q.brand || '-'}
                                </span>
                                {q.model ? ` - ${q.model}` : ''}
                                {isLowest && (
                                  <span className="text-[10px] text-emerald-700 block font-normal">
                                    (Marca do menor valor)
                                  </span>
                                )}
                              </td>
                              <td className="p-2 text-right font-bold text-slate-900">
                                <span className={isLowest ? 'text-emerald-700' : ''}>
                                  {formatCurrencyBRL(q.price)}
                                </span>
                              </td>
                              <td className="p-2 text-slate-500 font-mono text-[10px] break-all">
                                {q.url ? (
                                  <a
                                    href={q.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-700 hover:underline inline-flex items-center"
                                  >
                                    {q.url.substring(0, 50)}...
                                    <ExternalLink className="w-2.5 h-2.5 ml-1 inline print:hidden" />
                                  </a>
                                ) : (
                                  'Proposta direta (offline)'
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>

                  {/* Statistical Consolidation for the Item */}
                  <div className="bg-slate-100/80 p-2.5 border-t border-slate-300 flex flex-wrap items-center justify-between text-[11px] gap-2">
                    <div className="flex items-center space-x-3 text-slate-700">
                      <span>
                        <strong>Menor:</strong> {formatCurrencyBRL(item.lowestPrice)}
                        {item.lowestPriceBrand && (
                          <span className="text-emerald-800 font-bold ml-1">
                            (Marca: {item.lowestPriceBrand})
                          </span>
                        )}
                      </span>
                      <span><strong>Média:</strong> {formatCurrencyBRL(item.averagePrice)}</span>
                      <span><strong>Mediana:</strong> {formatCurrencyBRL(item.medianPrice)}</span>
                      {item.coefficientOfVariation !== undefined && (
                        <span><strong>CV:</strong> {item.coefficientOfVariation}%</span>
                      )}
                    </div>
                    <div className="font-bold text-slate-900">
                      <span>Total Estimado ({item.quantity} {item.unit}): </span>
                      <span className="text-emerald-700 text-xs">
                        {formatCurrencyBRL(item.totalEstimated)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grand Total Summary */}
          <div className="border-t-2 border-slate-800 pt-4 flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-300">
            <div>
              <span className="text-xs uppercase font-bold text-slate-700 block">
                VALOR TOTAL ESTIMADO DA LICITAÇÃO
              </span>
              <span className="text-[11px] text-slate-500">
                Soma de todos os itens com base no critério de {project.methodology}
              </span>
            </div>
            <div className="text-xl font-extrabold text-emerald-800">
              {formatCurrencyBRL(totalEstimated)}
            </div>
          </div>

          {/* Signatures & Certification */}
          <div className="pt-10 space-y-8 page-break-inside-avoid">
            <p className="text-[11px] text-slate-600 text-justify">
              Certifico que a presente pesquisa de preços foi conduzida de boa-fé, com observância aos princípios da impessoalidade, moralidade, economicidade e eficiência, refletindo fielmente os valores vigentes no mercado brasileiro para os bens especificados.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8">
              <div className="text-center">
                <div className="border-t border-slate-400 pt-2 w-4/5 mx-auto">
                  <input
                    type="text"
                    value={responsibleName}
                    onChange={(e) => setResponsibleName(e.target.value)}
                    className="w-full text-center font-bold text-xs text-slate-900 bg-transparent focus:outline-none print:border-none"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Responsável pela Pesquisa de Preços
                  </span>
                </div>
              </div>

              <div className="text-center">
                <div className="border-t border-slate-400 pt-2 w-4/5 mx-auto">
                  <span className="font-bold text-xs text-slate-900 block">
                    Autoridade Competente / Ordenador de Despesas
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Aprovação do Termo de Referência
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Footer in Document */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between print:hidden">
            <span className="text-xs text-slate-500">
              Documento pronto para anexação ao processo de contratação pública.
            </span>
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Arquivo PDF (.pdf)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
